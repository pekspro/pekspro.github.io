---
layout: post
title:  "Change encoding on your source files"
date:   2020-06-07 01:00:00 +0200
categories: [.NET]
---

How do you make sure that all your source files are using the same encoding?
With PowerShell of course!

Usually, the encoding you are using on your source files are not important. But
if you are compiling on different platforms, you could run into unexpected
problems if the source files are using "ANSI" and you have some special
characters in the code. I have had unit test that run perfectly fine on Windows,
but when they were running on Linux, they failed because of this.

## Setting UTF-8 on multiple files
The little script below finds all cs-files in a directory (except these in the
obj-folders), and checks if they are using UTF-8 by reading the [byte order
mark](https://en.wikipedia.org/wiki/Byte_order_mark) from each file. And if not,
the files are read and saved again but with UTF-8.

{% include codeheader.html lang="PowerShell" %}
{% highlight powershell %}

$files = Get-ChildItem -Filter *.cs -Recurse | ? { $_.FullName -notmatch '\\obj\\' }

foreach($file in $files) {
  $bytes = [byte[]] (Get-Content ($file.FullName) -Encoding byte -ReadCount 3 -TotalCount 3)
  if( $bytes.Length -lt 3 -or
      $bytes[0].ToString("x2") -ne "ef" -or
      $bytes[1].ToString("x2") -ne "bb" -or
      $bytes[2].ToString("x2") -ne "bf" ) {

    Write-Output "Updating: $($file.FullName)"
    $content = Get-Content "$($file.FullName)"
    Set-Content "$($file.FullName)" -Value $content -Encoding UTF8
  }
}

{% endhighlight  %}

You might consider doing this for also for `cstml`, `razor` and other files
extensions that you find suitable.

# Summary

This little script is a simple solution to change encoding on multiple files at
the same time. Maybe a bit too simple you may thin if you do not like [byte
order marks](https://en.wikipedia.org/wiki/Byte_order_mark). But in this
scenario, I do not worry about that.