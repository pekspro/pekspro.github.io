---
layout: post
title:  "Escape sequences in Logic apps"
date:   2020-04-01 02:52:14 +0200
categories: [Logic apps]
---

If you are working with Logic apps in Azure you might have run into problems if you want to use an **escape sequence** - they 
are simply not supported. I had problems with this when I wanted to replace all line breaks in a string with spaces.
This is annoying, but there is a workaround.

[decodeUriComponent](https://docs.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference#decodeUriComponent) 
is used to decode [percent encoded strings](https://en.wikipedia.org/wiki/Percent-encoding) which is commonly used in query strings. It is less convenient, but it could be used as a replacement for escape sequences. In fact, you could use it to produce any string you want.

In my case I wanted to replace Windows line breaks in a string and I had this function:

    replace('variables('myvariable')', '\r\n', ' ')

Clearly this does not since escape sequences are not supported. So instead I wrote this:

    replace('variables('myvariable')', decodeUriComponent('%0A%0D'), ' ')

It worked just fine! Here is a small table of some common escape sequences:

| Characters          | Escape sequence  | Percent-encoded  |
| --------------------|------------------| :----------------|
| Tab                 | \\t              | %09              |
| Linux line break    | \\n              | %0D              |
| Windows line break  | \\r\\n           | %0A%0D           |
| Quote               | \\"              | %22              |
| None-breaking space | N/A              | %C2%A0           |


Strings that are used in query string are normally converted first to UTF-8 before they get percent-encoded,
that is why characters above 127 are converted to two or more bytes.

If you are looking for other characters [urlencoder.org](https://www.urlencoder.org/) might be useful.
