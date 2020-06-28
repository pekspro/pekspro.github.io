---
layout: post
title:  "Change language version on multiple projects"
date:   2020-06-21 01:00:00 +0200
categories: [.NET]
---

If you have several .NET Core projects where you want to change the C# language
version to 8.0, how you do this the fastest way?


## The solution

This little script checks all csproj-files, and if the target framework supports
C# 8.0, this make sure it will be used.

{% include codeheader.html lang="PowerShell" %}
{% highlight PowerShell %}
$files = Get-ChildItem -Recurse *.csproj

foreach($file in $files)
{
    $targetframework = Select-Xml -Path $file -XPath "/Project/PropertyGroup/TargetFramework" | `
        Select-Object -ExpandProperty Node | `
        Select-Object -ExpandProperty "#text"

    Write-Output $file.FullName

    # C# 8.0 is supported only on .NET Core 3.x and .NET Standard 2.1    
    if($targetframework -like "netcoreapp3*" -or $targetframework -eq "netstandard2.1")
    {
        $currentversion = Select-Xml -Path $file -XPath "/Project/PropertyGroup/LangVersion" | `
            Select-Object -ExpandProperty Node | `
            Select-Object -ExpandProperty "#text"

        if($currentversion -eq "8.0")
        {
            Write-Output "Already using version 8.0."
            continue
        }

        $content = Get-Content $file.FullName

        # Check if the LangVersion node exists.
        if((Select-Xml -Path $file -XPath "/Project/PropertyGroup/LangVersion").Count -eq 0)
        {
            Write-Output "    Adding language 8.0"
            $newcontent = $content.Replace("</TargetFramework>", "</TargetFramework>`r`n    <LangVersion>8.0</LangVersion>")
        }
        else 
        {
            Write-Output "    Updating language to 8.0"
            $newcontent = $content -replace "<LangVersion>.*</LangVersion>", "<LangVersion>8.0</LangVersion>"
        }

        $newcontent | Out-File -FilePath $file.FullName -Encoding ASCII
    }
    else 
    {
        Write-Output "    Does not support C# 8.0 ($targetframework)"
    }
}
{% endhighlight %}


## Summary

OK, it might be faster to just do this manually instead of writing a script :-).
But this was fun to do.