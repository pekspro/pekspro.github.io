---
layout: post
title:  "Multiple find and replace with PowerShell"
date:   2020-10-18 01:00:00 +0200
categories: [PowerShell]
---

If you need to find and replace a string in multiple files there are several
tools that could do this. But recently I was in a situation where multiple URL:s
needed to be updated in multiple files. So, I decided to do this in PowerShell
instead.

## The problem

Let says you have a file like this:

{% include codeheader.html lang="Sample file" %}
{% highlight text %}
         First link with http: http://server.com/old1
        First link with https: https://server.com/old1
       First link with quotes: "http://server.com/old1"
       First link with quotes: 'http://server.com/old1'
                   First link: http://server.com/old1. A new sentence.
  First link with extra slash: http://server.com/old1/
 First link with query string: http://server.com/old1?search=no

        Second link with http: http://server.com/old2
       Second link with https: https://server.com/old2
 Second link with extra slash: http://server.com/old2/
Second link with query string: http://server.com/old2?search=no

Not first link: http://server.com/old10
Not second link: http://server.com/old20
{% endhighlight %}

Also imagine you have several files like this. Now you need to change all URL:s
that end with **old1** and **old2**. How do you do this efficiently?

## A naive solution

My first attempt to solve this was a PowerShell script like this:

{% include codeheader.html lang="PowerShell - naive solution" %}
{% highlight powershell %}

$files = Get-ChildItem -Include ("*.txt") -Recurse
$data = @(
    [PSCustomObject]@{
        Old = 'http://server.com/old1';
        New = 'https://server.com/new1';
    },
    [PSCustomObject]@{
        Old = 'http://server.com/old2';
        New = 'https://server.com/new2';
    }
)

$files | ForEach-Object {
    $filecontent = Get-Content $_
    $data | ForEach-Object {
        $filecontent = $filecontent -replace $_.Old, $_.New
    }
    Set-Content -Path $_.FullName -Value $filecontent
}

{% endhighlight %}

This mostly works, and in some situations, this might be good enough. But there
are some limitations:

* It only replaces URL:s that begins with http. You could work around this by
  making the array twice as large.
* It will also partly replace URL:s that end with **old10** - these should not
  be updated at all.
* If the URL ends with a slash, it will not be removed. Not a big problem, but
  we want to fix this too.

## The solution

This code is a bit more complex, but it solves all problems mention earlier:

{% include codeheader.html lang="PowerShell - naive solution" %}
{% highlight powershell %}

$files = Get-ChildItem -Include ("*.txt") -Recurse
$data = @(
    [pscustomobject]@{
        Old = 'server.com/old1';
        New = 'server.com/new1';
    },
    [pscustomobject]@{
        Old = 'server.com/old2';
        New = 'server.com/new2';
    }
)

$files | ForEach-Object {
    $filecontent = Get-Content $_
    $data | ForEach-Object {
        $filecontent = $filecontent -replace "http(s)?://$($_.Old)(\/)?([^a-zA-Z0-9]|`$)", "https://$($_.New)`$3"
    }
    Set-Content -Path $_.FullName -Value $filecontent
}

{% endhighlight %}

The replacement expression might need some clarification. First, this is what we
are looking for:

* **http(s)?://** - It should start with http:// or https://
* **$($_.Old)** - This is the server and path previously defined.
* **(\/)?** - This is the slash at the end of the URL - if there is any.
* **([^a-zA-Z0-9]\|`$)** - This is a character after the URL. It should not be a
  number or a letter - but it might be end of string.

This is then replaced with:

* **https://** - It is what it looks like
* **$($_.New)** - The new server and path previously defined.
* **`$3** - The extra character after the URL that we might have catch.

By the way, the accent before the dollar sign (like in **`$3**) is just an
escape sequence, telling PowerShell that the dollar sign should be as it is and
not be treated like a variable.

## Summary

This was a fun little exercise for me. PowerShell and regular expressions are
something that I always need to practice on.
