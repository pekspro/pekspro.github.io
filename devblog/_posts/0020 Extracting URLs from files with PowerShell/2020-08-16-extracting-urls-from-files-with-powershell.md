---
layout: post
title:  "Extracting URL:s from files with PowerShell"
date:   2020-08-16 01:00:00 +0200
categories: [PowerShell]
---

Recently I needed to extract all URL:s from several files. I thought this was a
fun little challenge where I could improve my limited skills in PowerShell and
regular expressions.

## Solution

After having been working on the problem for a while, I ended up having this
little code.

{% include codeheader.html lang="Console" %}
{% highlight PowerShell %}

Get-ChildItem *.txt -Recurse `
  | Get-Content `
  | Select-String -Pattern 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)' -AllMatches `
  | % { $_.Matches } `
  | % { $_.Value } `
  | Sort-Object `
  | Get-Unique

{% endhighlight %}

In short, the script does this:

* Find all files with the file extensions, including subdirectories.
* Reads the content in each file.
* Get all strings matching the regular expression pattern that I found [in this StackOverflow thread](https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url).
* Loops thru all `Matches` expression.
* Select the `Value` property.
* Sorts the output.
* Get all unique values.

If you want to know how many instances there is of every URL, you could use
`Group-Object` instead.

{% include codeheader.html lang="Console" %}
{% highlight PowerShell %}

Get-ChildItem *.txt -Recurse `
  | Get-Content `
  | Select-String -Pattern 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)' -AllMatches `
  | % { $_.Matches } `
  | % { $_.Value } `
  | Group-Object -Property $_ `
  | Sort-Object -Property Count -Descending `
  | Select-Object Count, Name

{% endhighlight %}

## Summary

I am really not an expert on PowerShell, so I learned a bit while doing this.
Solving these little tiny problems is always fun. I found the solutions to be
especially pleasing when it is just a single line of code.
