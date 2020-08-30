---
layout: post
title:  "Creating Excel-files in Azure Functions"
date:   2020-08-30 01:00:00 +0200
categories: [Azure Functions, Excel]
---

Last week I looked on how you could create an Excel file in Logic Apps and then
e-mail that file to someone. This week I solved the same problem in Azure
Functions. In retrospect, I think this was a better solution.

## Strategy

Creating Azure Functions in C# is straightforward. Often you could use different
kind of bindings so you could spend less time on infrastructure code. For
instance, you could define something to be stored in a blob storage, but without
working with some blob storage API. However, in this solution I could not use
any binding.

The solution is quite simple, and there are just three major steps.

### Creating a player list

In the first step of the application a list of players is created. This is then
used to create the Excel file. First, I hard coded this. But that was to easy
:-) So I started to investigate how you could get the data from a database
instead.

Normally you use Entity Framework or something similar when you are working
against a database. And this is also an option when you work with Azure
Functions, this totally works.

But it looks to me that many are using the classic
[ADO.NET](https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/ado-net-code-examples)
instead when they are working with Azure Functions. This is very primitive, and
you will work SQL strings in your C# code. For simple solutions I find this to
be good enough. You just need to be careful when you make schema changes to your
database.

### Creating an Excel file

In the logic app it required several steps to generate an Excel file. Also, it
required access to a OneDrive account and the generating was very slow.

In this solution, I started by installing the NuGet package
[ClosedXML](https://www.nuget.org/packages/ClosedXML). Then it just took me a
few lines of code to create a file with the data.

The code runs super-fast. Also, I do not have any extra spreadsheets and I could
auto adjust auto the column widths in the created table. These were problems
that were hard to solve in the Logic App solution.

### E-mailing the file

In the last step the generated file should be send by e-mail to someone. I think
the Logic App had a simpler solution for this.

In Azure Functions, there is a
[SendGrid](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-sendgrid?tabs=csharp)
binding you could use to send e-mails. I have not tried that, but I guess it
should not be too hard to use.

But I needed to send e-mail via Office365. There is no binding for that, so I
fallback to SMTP instead. There is a couple of settings to configure, and the
code is pretty long but it is nothing complicated.

### Solution

Here is all the code for the application:

{% include codeheader.html lang="Azure Function Solution" %}
{% highlight CSharp %}
using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.IO;
using System.Net.Mail;

namespace FunctionExcelEmailTest
{
    public class Player
    {
        public Player(int playerID, string firstName, string lastName)
        {
            PlayerID = playerID;
            FirstName = firstName;
            LastName = lastName;
        }

        public int PlayerID { get; }

        public string FirstName { get; }

        public string LastName { get; }
    }

    public static class Function1
    {
        [FunctionName("Function1")]
        public static IActionResult Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = null)] HttpRequest req,
            ILogger log,
            ExecutionContext context)
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(context.FunctionAppDirectory)
                .AddJsonFile("local.settings.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .Build();

            // var players = GetPlayers();
            var players2 = GetPlayersFromDatabase(config.GetConnectionString("MainDatabaseConnectionString"));

            var report = CreateExcelReport(players2);

            SendEmail(  config["ReceiverEmail"], 
                        config["SenderEmail"], 
                        config["SenderName"],
                        config["SmtpHost"], 
                        config["SmtpUserName"], 
                        config["SmtpUserPassword"],
                        report);

            string responseMessage = "Report was sent.";

            return new OkObjectResult(responseMessage);
        }

        private static List<Player> GetPlayers() 
        {
            return new List<Player>()
            {
                new Player(1, "Alice", "Aliceson"),
                new Player(2, "Bob", "Bobsson"),
                new Player(3,"Carol", "Carlsson"),
                new Player(4, "David","Davidsson" ),
                new Player(5, "Eric", "Ericsson"),
                new Player(6, "Frank", "Franksson" )
            };
        }

        private static List<Player> GetPlayersFromDatabase(string connectionString)
        {
            List<Player> players = new List<Player>();

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                connection.Open();

                string sql = "select database_id as PlayerID, [name] as FirstName , [type_desc] as LastName from sys.master_files";

                using (SqlCommand cmd = new SqlCommand(sql, connection))
                {
                    SqlDataReader dataReader = cmd.ExecuteReader();
                    while (dataReader.Read())
                    {
                        int playerId = dataReader.GetInt32(0);
                        string firstName = dataReader.GetString(1);
                        string lastName = dataReader.GetString(2);

                        players.Add(new Player(playerId, firstName, lastName));
                    }
                }

                connection.Close();
            }

            return players;
        }

        private static byte[] CreateExcelReport(List<Player> players)
        {
            using XLWorkbook workbook = new XLWorkbook();

            IXLWorksheet ws = workbook.Worksheets.Add("Players");

            ws.Cell(1, 1).InsertTable(players, "TablePlayers");

            ws.Cell("A1").Value = "Player ID";
            ws.Cell("B1").Value = "First name";
            ws.Cell("C1").Value = "Last name";

            ws.Columns("A:C").AdjustToContents();

            using MemoryStream memoryStream = new MemoryStream();

            workbook.SaveAs(memoryStream);

            return memoryStream.ToArray();
        }

        private static void SendEmail(string receiverEmail, string senderEmail, string senderName, string smtpHost, string smtpUserName, string smtpPassword, byte[] excelReport)
        {
            var msg = new MailMessage();

            msg.To.Add(new MailAddress(receiverEmail));

            msg.From = new MailAddress(senderEmail, senderName);
            msg.Subject = "Player report";

            var plainView = AlternateView.CreateAlternateViewFromString(@"Hi
I have spend another night to create this report just for you.", null, "text/plain");

            var htmlView = AlternateView.CreateAlternateViewFromString(@"Hi
I have <strong>spend another night</strong> to create this report just for you.", null, "text/html");
            
            msg.Attachments.Add(new Attachment(new MemoryStream(excelReport), "playerreport.xlsx", "application/vnd.ms-excel"));

            msg.AlternateViews.Add(plainView);
            msg.AlternateViews.Add(htmlView);

            SmtpClient client = new SmtpClient();
            client.UseDefaultCredentials = false;
            client.Credentials = new System.Net.NetworkCredential(smtpUserName, smtpPassword);
            client.Port = 587;
            client.Host = smtpHost;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            client.EnableSsl = true;

            client.Send(msg);
        }
    }
}
{% endhighlight %}

And here is the settings file (local.settings.json)

{% include codeheader.html lang="local.settings.json" %}
{% highlight json %}

{
  "IsEncrypted": false,
  "ConnectionStrings": {
    "MainDatabaseConnectionString": "Data Source=localhost;Initial Catalog=TestDatabase;Trusted_Connection=True"
  },
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet",

    "ReceiverEmail": "receiver@company.com",
    "SenderEmail": "sender@company.com",
    "SenderName": "Company",
    "SmtpHost": "smtp.company.com",
    "SmtpUserName": "sender@company.com",
    "SmtpUserPassword": "password"
  }
}

{% endhighlight %}

## Summary

This was a fun comparison to make. Both solutions have their own strengths and
weaknesses.

I think it was easier to fetch data and generate an Excel file in the Azure
Functions solution. And it was way more efficient. But when it comes to send
e-mail, at least via an Office account, the Logic app was easier.

If I must pick one solution, I think the Azure Functions solution overall was a
better.

But it is totally possible to mix these solutions. You could use the Azure
Function to just generate a file in Azure Blobs storage, there are binding ready
to that. And then you could have a Logic App that is triggered when blobs are
created, and it could be used to e-mail the file.
