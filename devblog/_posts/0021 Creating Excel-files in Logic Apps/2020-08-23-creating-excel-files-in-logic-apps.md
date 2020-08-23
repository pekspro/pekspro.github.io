---
layout: post
title:  "Creating Excel-files in Logic Apps"
date:   2020-08-23 01:00:00 +0200
categories: [Logic apps, Excel]
---

Imagine that you day week has to get data from some databases, add this in an
Excel file that is then e-mailed to someone. How could you automate this in
Logic Apps? Also, is it worth it? Maybe.

## Strategy

In short, the logic app will go thru these steps:

* Create an empty Excel file. Believe it or not, this is was the hardest problem
  for me to solve.
* Prepare the Excel-file by creating a new sheet and a new table.
* Populate the table with some data.
* Send the file via e-mail.

In real life, there are some more steps involved. If you follow this tutorial
you will end up with these steps:

![Logic app overview]({{site.baseurl}}/assets/images/0021/logic_app_overview.png "Logic app overview")

Start by creating an empty Logic app. Normally I use the **When a HTTP request
is received** trigger when I do experiment like this, but feel free to use
whatever you like.

### Create an empty Excel file

There are ready to use connectors for working with Excel files. All these
assumes that the files exist on OneDrive, so we will use that. The files will
just be temporary.

But unfortunately, the are no functions that let us use easily create an empty
Excel file. Not sure why, I find this to be a bit weird to be honest.

One way to solve this is to have a template file ready and then use the OneDrive
connector to copy to new file. Easy to do and totally works. But I find it a bit
annoying that need a file on my OneDrive just for that. If I accidentally remove
that file, the app will stop working.

But the approach we will use is to have the content inside the app and then
write it to a real file. Since Excel files are binary files, we will work with
the file content as a base64 string. If you have a file ready that you want to
use, you could run this PowerShell command to get the content in the right
format:

{% include codeheader.html lang="PowerShell" %}
{% highlight text %}
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\MyFile.xlsx"))
{% endhighlight %}

Otherwise, just use the sample I have below.

In your Logic app, select to add a new step.

Search for **Variables**.

![Select Variables]({{site.baseurl}}/assets/images/0021/select_controller_variables.png "Select Variables")

Then select **Initialize variable**.

![Select Initialize Variable]({{site.baseurl}}/assets/images/0021/select_action_initialize_variable.png "Select Initialize Variable")

Let **Name** be `EmptyFileContent`, and the **Type** should be an `Object`. The
**Value** should be this massive string:

{% include codeheader.html lang="EmptyFileContent" %}
{% highlight text %}

{
  "$content": "UEsDBBQAAAgIAPw7F1H5Vy4RAgEAALoBAAAPAAAAeGwvd29ya2Jvb2sueG1sjZDBbgIhEIZfhcy9sm5i22xEL714aZrUtGeEwSUusGFQ99166CP1FQq7Gk1PPfHPDN8/P/x8fS/Xg+vYCSPZ4AXMZxUw9Cpo6/cCjsk8PMN6tRyac4iHXQgHlu97aqKANqW+4ZxUi07SLPTo88yE6GTKZdzzYIxV+BLU0aFPvK6qRx6xkynvotb2BBe34T9u1EeUmlrE5LrJzEnr4T7dW2Q5O75KhwK2raXPywAYL/eK/LB4pnuoNJixkdJ7MReQ/0CqZE+4lbuxyiz/A485bor5ceVoMAc29jZaQA0sNjaLuNFZT0Y3VqOxHnXJS1NCJTtVXpGPws/rxVO9uILXxKtfUEsDBBQAAAgAAPw7F1HLvzWcnAIAAJwCAAALAAAAX3JlbHMvLnJlbHPvu788P3htbCB2ZXJzaW9uPSIxLjAiIGVuY29kaW5nPSJ1dGYtOCI/PjxSZWxhdGlvbnNoaXBzIHhtbG5zPSJodHRwOi8vc2NoZW1hcy5vcGVueG1sZm9ybWF0cy5vcmcvcGFja2FnZS8yMDA2L3JlbGF0aW9uc2hpcHMiPjxSZWxhdGlvbnNoaXAgVHlwZT0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL29mZmljZURvY3VtZW50LzIwMDYvcmVsYXRpb25zaGlwcy9vZmZpY2VEb2N1bWVudCIgVGFyZ2V0PSIveGwvd29ya2Jvb2sueG1sIiBJZD0iUjEyMTdmODJhMzU2YTQwNWUiIC8+PFJlbGF0aW9uc2hpcCBUeXBlPSJodHRwOi8vc2NoZW1hcy5vcGVueG1sZm9ybWF0cy5vcmcvb2ZmaWNlRG9jdW1lbnQvMjAwNi9yZWxhdGlvbnNoaXBzL2V4dGVuZGVkLXByb3BlcnRpZXMiIFRhcmdldD0iL2RvY1Byb3BzL2FwcC54bWwiIElkPSJySWQxIiAvPjxSZWxhdGlvbnNoaXAgVHlwZT0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL3BhY2thZ2UvMjAwNi9yZWxhdGlvbnNoaXBzL21ldGFkYXRhL2NvcmUtcHJvcGVydGllcyIgVGFyZ2V0PSIvcGFja2FnZS9zZXJ2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",
  "$content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

{% endhighlight %}

![Initialize Variable configuration]({{site.baseurl}}/assets/images/0021/step_initialize_variable_configuration.png "Initialize Variable configuration")

Now add a new step. I will use **OneDrive for Business**, but I think ordinary
**OneDrive** will work too.

![OneDrive for Business]({{site.baseurl}}/assets/images/0021/select_controller_onedrive.png "OneDrive for Business")

Select the **Create file** action.

![Create file]({{site.baseurl}}/assets/images/0021/select_action_create_file.png "Create file")

Pick any folder you think is appropriate. I will use a temp folder.

The file name could be whatever you like. I prefer to use a file name that will
be unique, so I have added the date with the expression:

{% include codeheader.html lang="Date expression" %}
{% highlight text %}
substring(utcNow(), 0, 10)
{% endhighlight %}

And the time with the expression:

{% include codeheader.html lang="Time expression" %}
{% highlight text %}
replace(substring(utcNow(), 11, 8), ':', '')
{% endhighlight %}

The file content should be the variable the created in the previous step. If you
cannot see the variable in the dynamic content list, just use this expression
instead:

{% include codeheader.html lang="File content expression" %}
{% highlight text %}
variables('EmptyFileContent')
{% endhighlight %}

The configuration should look like this:

![Create file configuration]({{site.baseurl}}/assets/images/0021/step_create_file_configuration.png "Create file configuration")

### Prepare the Excel file

Now when we have an Excel file to play with, we could start to modify it.

We start by creating a new worksheet. Add a new step and select **Excel Online
(Business)**.

![Excel Online (Business)]({{site.baseurl}}/assets/images/0021/select_controller_excel_online.png "Excel Online (Business)")

Select the action **Create worksheet**.

![Create worksheet]({{site.baseurl}}/assets/images/0021/select_action_create_worksheet.png "Create worksheet")

The **Location** should be `OneDrive for Business`, and the **Document Library** should have the value `OneDrive`.

The file parameter should be the file we previously created. Add this as a dynamic expression. Select the `File locator` value.

Lastly, let the **Name** be `Players`.

![Create worksheet configuration]({{site.baseurl}}/assets/images/0021/step_create_worksheet_configuration.png "Create worksheet configuration")

Now we will create a table on the worksheet we just created. Add a new step again. Select **OneDrive for Business**, and select the action **Create table**.

![Create table]({{site.baseurl}}/assets/images/0021/select_action_create_table.png "Create table")

Setup up **Location**, **Document Library** and **File** just like you did in the previous step.

In the **Table range** parameter enter:

{% include codeheader.html lang="Table range expression" %}
{% highlight text %}
Players!A1:C1
{% endhighlight %}

Also add the **Table name** and **Column names** parameters.

Let **Table name** have the value `TablePlayers`.

Let **Columns names** have the value:

{% include codeheader.html lang="Column names" %}
{% highlight text %}
PlayerID; First name; Last name
{% endhighlight %}

The configuration should look like this:

![Create table configuration]({{site.baseurl}}/assets/images/0021/step_create_table_configuration.png "Create configuration")

### Adding some data

Now it is time to add some data. Normally you will get the data from a SQL database or something similar. There are connectors for this that is easy to use. But to keep this tutorial simple we will hard code some values instead.

Add a new step and search for **Data Operations**.

![Data operations]({{site.baseurl}}/assets/images/0021/select_controller_data_operations.png "Data operations")

Select the action **Parse JSON**.

![Parse JSON]({{site.baseurl}}/assets/images/0021/select_action_parse_json.png "Parse JSON")

Add this as **Content**:

{% include codeheader.html lang="JSON Data" %}
{% highlight json %}
{
  "Players": [
    {
      "PlayerID": 1,
      "FirstName": "Alice",
      "LastName": "Aliceson"
    },
    {
      "PlayerID": 2,
      "FirstName": "Bob",
      "LastName": "Bobsson"
    },
    {
      "PlayerID": 3,
      "FirstName": "Carol",
      "LastName": "Carlsson"
    },
    {
      "PlayerID": 4,
      "FirstName": "David",
      "LastName": "Davidsson"
    },
    {
      "PlayerID": 5,
      "FirstName": "Eric",
      "LastName": "Ericsson"
    },
    {
      "PlayerID": 6,
      "FirstName": "Frank",
      "LastName": "Franksson"
    }
  ]
}
{% endhighlight %}

Also click on **Use sample payload to generate schema** and paste the data and press **OK**.

![Parse JSON configuration]({{site.baseurl}}/assets/images/0021/step_parse_json_configuration.png "Parse JSON configuration")

Now we will iterate thru all this data. Add a new step and select the **Control** connector.

![Control]({{site.baseurl}}/assets/images/0021/select_controller_control.png "Control")

Select the **For each** action.

![For each]({{site.baseurl}}/assets/images/0021/select_action_for_each.png "For each")

In **Select an output from previous step** select `Players` from **Dynamic content**.

![For each configuration]({{site.baseurl}}/assets/images/0021/step_for_each_configuration.png "For each configuration")

Now select add an action inside the **For each** controller. Select **Excel
Online (Business)** and then select the action **Add a row into a table**.

![Add a row into a table]({{site.baseurl}}/assets/images/0021/select_action_add_a_row_into_a_table.png "Add a row into a table")

Setup up **Location**, **Document Library** and **File** just like you did in the previous step. 

In **Table** enter `TablePlayers`.

The **Body** parameter should be an JSON object. Configure it like this:

![Add row configuration]({{site.baseurl}}/assets/images/0021/step_add_row_configuration.png "Add row configuration")

You find the variables in the **Dynamic content**.

In the documentation of the [**Excel Online (Business)**
connector](https://docs.microsoft.com/en-us/connectors/excelonlinebusiness/#limits)
you find that there is a limit of 100 calls per minute. If you do more than this
your app will stop working. So, in the **For each loop** it might be a good idea
to add a short delay after each row has been written. With the sample data we
are using this is not an issue so we will skip that.

Also, when all the rows have been written it might be a good idea to add a delay
for a minute or so. I have noticed that sometimes some data has been missing in
the e-mail that we soon will be send.

### Sending file as an E-mail attachment

Now when the file is created, we will send the file via e-mail. Before we do that, we need to read the file content.

Add a new step and select the connector **OneDrive for Business**.

![OneDrive for Business]({{site.baseurl}}/assets/images/0021/select_controller_onedrive.png "OneDrive for Business")

Select the action **Get file content**.

![Get file content]({{site.baseurl}}/assets/images/0021/select_action_get_file_content.png "Get file content")

Let the **File** parameter be the **File locator** variable that you have use many times before.

![Get file content configuration]({{site.baseurl}}/assets/images/0021/step_get_file_content_configuration.png "Get file content configuration")

Now, add a step. This time use the connector **Office 365 Outlook**.

![Office 365 Outlook]({{site.baseurl}}/assets/images/0021/select_action_outlook.png "Office 365 Outlook")

Use the action **Send an email**.

![Send an e-mail]({{site.baseurl}}/assets/images/0021/select_action_send_an_email.png "Send an e-mail")

The parameters **To**, **Subject** and **Body** is obvious so enter whatever you like in the.

Then add **Attachments** parameter. 

In the **Attachments Name** enter `playerreport.xlsx`.

In the **Attachments Content** use the value from the previous **Get file content** step. You might need to click on **See more**.

![Send an email configuration]({{site.baseurl}}/assets/images/0021/step_action_send_an_email_configuration.png "Send an email configuration")

That is all! You Logic app is now completed. Run the app to see if it works.

## Summary

I think this was a fun little experiment and it works OK once all pieces are in place. I struggled a long time on how to create the Excel file, but once that was solve things were pretty much straightforward.

All this said, there are a couple of downsides with this solution:

* The temporary file that is created is never removed. I did this intentionally to keep the app as simple as possible. It is easy to add a new step that remove the file via the OneDrive for Business connector. Note that you may need to add a delay for several minutes before you remove the file.
* The first worksheet in the Excel file is empty. Unfortunately, there is no support to delete existing sheets when I write this. You could workaround this by using another template and not adding a worksheet in the logic app.
* All columns in the table is just 64 pixels wide or so. I have not an elegant solution for this. Again, you could workaround this with a different template were all tables and sheets are premade.
* Writing rows is due the limit of 100 actions per minute a bit slow. So large reports could take a couple of hours to generate. Might not be a problem be is something to be aware of.

I am not totally satisfied with the solution. Generating Excel is nothing new to me, there are some good NuGet packages out there that make this pretty easy. If you do this you have better control of everything, and it will be way faster. But I could see where a solution with a logic app would be good enough, so it is good have this this in the toolbox.
