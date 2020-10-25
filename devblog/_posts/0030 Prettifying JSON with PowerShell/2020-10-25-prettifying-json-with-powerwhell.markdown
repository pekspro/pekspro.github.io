---
layout: post
title:  "Prettifying JSON with PowerShell"
date:   2020-10-25 01:00:00 +0200
categories: [PowerShell]
---

A quick and dirty way to quickly prettifying JSON-files with PowerShell.

## The problem

I had several files with compressed JSON, like this:

{% include codeheader.html lang="Sample file" %}
{% highlight json %}
{"Name":"Alice","Age":42,"Messages":[{"Text":"My homepage: 'http://pekspro.com'"},{"Text":"<blink>Bad idea</blink>"}]}
{% endhighlight %}

Not very readable. With Visual Studio, and other tools, you could easily to this
more human friendly. But I had several files I wanted to do this with, so I went
to PowerShell.

## Solution

This little script gets the work done:

{% include codeheader.html lang="PowerShell" %}
{% highlight powershell %}
Get-ChildItem .\*.json `
   | ForEach-Object { `
       $newcontent = Get-Content $_ | ConvertFrom-Json | ConvertTo-Json
       $newcontent = $newcontent -replace '\\u003c', '<'
       $newcontent = $newcontent -replace '\\u003e', '>'
       $newcontent = $newcontent -replace '\\u0027', "'"

       Set-Content $_ $newcontent
  }
{% endhighlight %}

As you see there is some special treatments for the characters **<**, **>** and
**'**. PowerShell want to do some special encoding for these characters. In most
cases this is not necessary so I simple replace them.

Executing this on the sample file above changes it to this:

{% include codeheader.html lang="Sample file" %}
{% highlight json %}
{
    "Name":  "Alice",
    "Age":  42,
    "Messages":  [
                     {
                         "Text":  "My homepage: 'http://pekspro.com'"
                     },
                     {
                         "Text":  "<blink>Bad idea</blink>"
                     }
                 ]
}
{% endhighlight %}

Much better!

## Summary

I do think other tools to a better job, PowerShell intend the lines with many
spaces. But I needed this just to make it easier to compare JSON-files, and then
I thought that this was good enough.
