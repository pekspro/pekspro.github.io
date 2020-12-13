---
layout: post
title:  ".NET 5 and Azure Functions"
date:   2020-12-13 01:00:00 +0200
categories: [.NET, PowerShell] 
---

.NET 5 have been out for a few weeks when writing then. Upgrading from .NET Core
3.1 has been easy, I think. Except when it comes to Azure Functions.

## The problem

To keep it short, at the moment of writing this Azure Functions does not support
.NET 5. As I understand it, the process that is executing you functions library
is built with .NET Core 3.1. And if you are using a library, like
**Microsoft.Extensions.Logging.Abstractions**, that is also used by the main
host – but it is using a different version – you get strange errors like:

    System.Private.CoreLib: Could not load file or assembly 'Microsoft.Extensions.Logging.Abstractions,
    Version=5.0.0.0, Culture=neutral, PublicKeyToken=adb9793829ddae60'.

The problem is discussed in [Issue 6674](https://github.com/Azure/azure-functions-host/issues/6674)
in the projects GitHub repository.

## The solution

The suggestion workaround so far is to use .NET Standard libraries and use the
older version of NuGet-packages. But I find it a bit messy to use different
version NuGet-packages. Especially since the problem is detected first when you
execute your application, not in compile time. So, I decided to do something
else.

In my project file, for my Azure Functions project, I referenced to other
projects like this:

{% include codeheader.html lang="Project File" %}
{% highlight xml %}
  <ItemGroup>
    <ProjectReference Include="..\DatabaseLibrary\DatabaseLibrary.csproj" />
    <ProjectReference Include="..\LogicLibrary\LogicLibrary.csproj" />
  </ItemGroup>
{% endhighlight %}

I removed this and decided to instead to link to every file in the other projects instead. The code above was then replaced with this:

{% include codeheader.html lang="Project File" %}
{% highlight xml %}
  <ItemGroup>
    <Compile Include="..\DatabaseLibrary\DatabaseHelper.cs" Link="Dependencies\DatabaseLibrary\DatabaseHelper.cs" />
    <Compile Include="..\DatabaseLibrary\DatabaseManager.cs" Link="Dependencies\DatabaseLibrary\DatabaseManager.cs" />
    <Compile Include="..\LogicLibrary\LogicHelper.cs" Link="Dependencies\LogicLibrary\LogicHelper.cs" />
    <Compile Include="..\LogicLibrary\LogicManager.cs" Link="Dependencies\LogicLibrary\LogicManager.cs" />
  </ItemGroup>
{% endhighlight %}

This way, I have better control on which NuGet-packages to use (that I instead
references directly in my Azure Functions project).

In Visual Studio, you could right click on a project, select **Add** and then
**Existing Item**. Then you select the files you want to use and use the
drop-down menu and select **Add As Link**. But if you have a lot files this
could be a bit tedious. Instead, you could run this PowerShell-script in the
folder where you have your library:

{% include codeheader.html lang="PowerShell" %}
{% highlight powershell %}
Get-ChildItem *.cs -Recurse `
  | Where-Object { $_ -notlike "*\Debug\*" -and $_ -notlike "*\Release\*" } `
  | ForEach-Object { Write-Output "    <Compile Include=""..\$($_.FullName.SubString(62))"" Link=""Dependencies\$($_.FullName.SubString(62))"" />" } `
  | Set-Clipboard
{% endhighlight %}

This code:

* Get all .cs-files
* Ignores files in `Debug` and `Release` directories.
* Creates a string for each file that should be in the project file. You might
  need to adjust the value of the SubString call.
* Copies everything to the clipboard.

You should then be able to paste everything into your project file.

## Summary

Clearly, this solution has some limitations. For instance, you code must be able
to be compiled with .NET Core 3.1. Also, if you change the files that you have
in your libraries you may also need to change this in the Azure Functions
project.

But for me, I decided that this is good enough. Azure Functions will have a
preview with .NET 5 support quite soon, so I do not mind having it like this for
a while.
