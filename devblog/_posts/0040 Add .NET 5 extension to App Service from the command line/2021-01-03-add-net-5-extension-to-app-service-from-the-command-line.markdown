---
layout: post
title:  "Add .NET 5 extension to App Service from the command line"
date:   2021-01-03 01:00:00 +0200
categories: [Azure App Service] 
---

I have started to migrate some of my .NET Core 3.1 applications to .NET 5. But
to be able to run these in Azure App Service an extension needs to be installed.

## The problem

If you have an Azure App Service, it is not hard to enable .NET 5 in that
service. In the Azure portal, open the service, select **Extensions**, and then
select the appropriate version.

This is quite straightforward. But if you have several services, or several
deployment slots (each slot require its own extension), this will be a tedious
task.

## The solution

This is how you install an extension to an App Service in PowerShell:

{% include codeheader.html lang="PowerShell" %}
{% highlight powershell %}
New-AzureRmResource -ResourceType "Microsoft.Web/sites/siteextensions" `
    -ResourceGroupName MyResourceGroup `
    -Name "MyApService/AspNetCoreRuntime.5.0.x64" `
    -ApiVersion "2018-02-01" `
    -Force
{% endhighlight %}

If you want to install it to a deployment slot, this is the way:

{% include codeheader.html lang="PowerShell" %}
{% highlight powershell %}
New-AzureRmResource -ResourceType "Microsoft.Web/sites/slots/siteextensions" `
    -ResourceGroupName MyResourceGroup `
    -Name "MyApService/Staging/AspNetCoreRuntime.5.0.x64" `
    -ApiVersion "2018-02-01" `
    -Force
{% endhighlight %}

## Summary

I often prefer making changes via a UI, but in scenarios like this the command
line is the way to go. It was tricky to figure out how to do this. It was also
tricky to find out the proper name for the extension. I find the name by first
manually install the extension, and then generate an ARM-template for the
resource group.
