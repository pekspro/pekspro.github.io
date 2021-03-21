---
layout: post
title:  "Caching configuration from Azure KeyVault"
date:   2021-03-21 01:00:00 +0200
categories: [.NET] 
---

Azure KeyVault is a great service. With this you store secrets on a share
location and could use on several services. But it is not fun to use during
development.

## The problem

[Azure
KeyVault](https://docs.microsoft.com/en-us/azure/key-vault/general/overview) is
a service where you store your secrets, like connection strings, in a service in
Azure. Then when your application starts you could connect to this service and
it to your configuration. But it has a downside. It will take a couple of
seconds to download the secrets. Not a problem in production, but during
development this is a pain.

## The solution

One solution is to not use Azure KeyVault when you do development. Instead, you
store your secrets locally. But then your application will behave quite
differently in production which may be a bad thing.

Another approach I have been using a while is to cache the configuration. And
then I refresh it every 12 hour or so. With this I get the best of both worlds.
I could use Azure KeyVault during development and still have good performance.

My solution is in the following code that is using
[Azure.Security.KeyVault.Secrets](https://www.nuget.org/packages/Azure.Security.KeyVault.Secrets)
that is replacing the deprecated
[Microsoft.Azure.KeyVault](https://www.nuget.org/packages/Microsoft.Azure.KeyVault).

{% include codeheader.html lang="Code" %}
{% highlight csharp %}
using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;

namespace ConfigurationCache
{
    public class Program
    {
        private static readonly Stopwatch Stopwatch = new Stopwatch();

        public static void Main(string[] args)
        {
            Stopwatch.Start();
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((ctx, builder) =>
                {
                    builder.AddAzureConfigurationServices();
                })
                .ConfigureServices((hostContext, services) =>
                {
                    Stopwatch.Stop();

                    Console.WriteLine($"Start time: {Stopwatch.Elapsed}");
                    Console.WriteLine($"Config: {hostContext.Configuration.GetSection("ConnectionStrings:MyContext").Value}");

                    services.AddHostedService<Worker>();
                });
    }

    public static class AzureExtensions
    {
        public static IConfigurationBuilder AddAzureConfigurationServices(this IConfigurationBuilder builder)
        {
            // Build current configuration. This is later used to get environment variables.
            IConfiguration config = builder.Build();

#if DEBUG
            if (Debugger.IsAttached)
            {
                // If the debugger is attached, we use cached configuration instead of
                // configurations from Azure.
                AddCachedConfiguration(builder, config);

                return builder;
            }
#endif

            // Add the standard configuration services
            return AddAzureConfigurationServicesInternal(builder, config);
        }

        private static IConfigurationBuilder AddAzureConfigurationServicesInternal(IConfigurationBuilder builder, IConfiguration currentConfig)
        {
            // Get keyvault endpoint. This is normally an environment variable.
            string keyVaultEndpoint = currentConfig["KEYVAULT_ENDPOINT"];

            // Setup keyvault services
            SecretClient secretClient = new SecretClient(new Uri(keyVaultEndpoint), new DefaultAzureCredential());
            builder.AddAzureKeyVault(secretClient, new AzureKeyVaultConfigurationOptions());

            return builder;
        }

        private static void AddCachedConfiguration(IConfigurationBuilder builder, IConfiguration currentConfig)
        {
            //Setup full path to cached configuration file.
            string path = System.IO.Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MyApplication");
            string filename = System.IO.Path.Combine(path, $"configcache.dat");

            // If the file does not exists, or is more than 12 hours, update the cached configuration.
            if (!System.IO.File.Exists(filename) || System.IO.File.GetLastAccessTimeUtc(filename).AddHours(12) < DateTime.UtcNow)
            {
                System.IO.Directory.CreateDirectory(path);

                UpdateCacheConfiguration(filename, currentConfig);
            }

            // Read the file
            string encryptedFile = System.IO.File.ReadAllText(filename);

            // Decrypt the content
            string jsonString = Decrypt(encryptedFile);

            // Create key-value pairs
            var keyVaultPairs = JsonSerializer.Deserialize<Dictionary<string, string>>(jsonString);

            // Use the key-value pairs as configuration
            builder.AddInMemoryCollection(keyVaultPairs);
        }

        private static void UpdateCacheConfiguration(string filename, IConfiguration currentConfig)
        {
            // Create a configuration builder. We will just use this to get the
            // configuration from Azure.
            ConfigurationBuilder configurationBuilder = new ConfigurationBuilder();

            // Add the services we want to use.
            AddAzureConfigurationServicesInternal(configurationBuilder, currentConfig);

            // Build the configuration
            IConfigurationRoot azureConfig = configurationBuilder.Build();

            // Serialize the configuration to a JSON-string.
            string jsonString = JsonSerializer.Serialize(
                azureConfig.AsEnumerable().ToDictionary(a => a.Key, a => a.Value),
                options: new JsonSerializerOptions()
                {
                    WriteIndented = true
                }
                );

            //Encrypt the string
            string encryptedString = Encrypt(jsonString);

            // Save the encrypted string.
            System.IO.File.WriteAllText(filename, encryptedString);
        }

        // Replace the following with your favorite encryption code.

        private static string Encrypt(string str)
        {
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(str));
        }

        private static string Decrypt(string str)
        {
            return System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(str));
        }
    }
}
{% endhighlight %}

The project file looks like this:

{% include codeheader.html lang="Project File" %}
{% highlight xml %}
<Project Sdk="Microsoft.NET.Sdk.Worker">

  <PropertyGroup>
    <TargetFramework>netcoreapp3.1</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Azure.Extensions.AspNetCore.Configuration.Secrets" Version="1.0.2" />
    <PackageReference Include="Azure.Identity" Version="1.3.0" />
    <PackageReference Include="Azure.Security.KeyVault.Secrets" Version="4.1.0" />
    <PackageReference Include="Microsoft.Extensions.Configuration.AzureAppConfiguration" Version="4.1.0" />
    <PackageReference Include="Microsoft.Extensions.Hosting" Version="5.0.0" />
  </ItemGroup>
</Project>
{% endhighlight %}

## Summary

This approach also works for [Azure
AppConfiguration](https://docs.microsoft.com/en-us/azure/azure-app-configuration/overview)
(I use that too), but I have ignored this in the sample above to keep the code
simple. AppConfiguration is also a lot faster than KeyVault so the problem less
noticeable.
