---
layout: post
title:  "What characters are whitespace?"
date:   2020-11-15 01:00:00 +0200
categories: [.NET, JavaScript] 
---

What characters are considered to be whitespace? Space obviously, also tab and
line break characters are easy. But what about U+00A0, the **no-break space**
character? Or U+180E, the **Mongolian vowel separator**? It turns out that
the computer languages we are using are not agreeing on this.

## Overview

I created some code just to figure out which characters that are considered to
be whitespace in different languages/frameworks. I will not claim that this is
correct in any way.

[Wikipedia has a nice page](https://en.wikipedia.org/wiki/Whitespace_character)
listing characters that are whitespaces according to the Unicode standard. Both
**C#** and **Go** follow this strictly.

With **C++** the result varied depending on which platform I was using. With
VS2019 the result was close to **C#**/**Go**, the only exception is
`180E` - the **Mongolian vowel separator**. But this character was a whitespace
is earlier Unicode standard, but are no more. In theory, this could affect how
[your C#-code is compiled](https://codeblog.jonskeet.uk/2014/12/01/when-is-an-identifier-not-an-identifier-attack-of-the-Mongolian-vowel-separator).
When I run the **C++** in Linux with gpp the difference where larger.

There was also a difference with **JavaScript**. Modern browser seems to agree,
but IE11 have two extra white space characters.

You find the code for each language later in this post. Either way, this is what
I found out:

| **Hex** | **Name**                    | **Java** | **Python** | **C#** | **Go** | **C++** | **JS** |
| ------: | --------------------------- | -------- | ---------- | ------ | ------ | ------- | ------ |
|    0009 | character tabulation        |        Y |          Y |      Y |      Y |       Y |      Y |
|    000A | line feed                   |        Y |          Y |      Y |      Y |       Y |      Y |
|    000B | line tabulation             |        Y |          Y |      Y |      Y |       Y |      Y |
|    000C | form feed                   |        Y |          Y |      Y |      Y |       Y |      Y |
|    000D | carriage return             |        Y |          Y |      Y |      Y |       Y |      Y |
|    001C | information separator four  |        Y |            |        |        |         |        |
|    001D | information separator three |        Y |            |        |        |         |        |
|    001E | information separator two   |        Y |            |        |        |         |        |
|    001F | information separator one   |        Y |            |        |        |         |        |
|    0020 | space                       |        Y |          Y |      Y |      Y |       Y |      Y |
|    0085 | next line                   |          |            |      Y |      Y |     Win |  IE 11 |
|    00A0 | no-break space              |          |            |      Y |      Y |     Win |      Y |
|    1680 | ogham space mark            |        Y |            |      Y |      Y |       Y |      Y |
|    180E | en quad                     |        Y |            |        |        |     Win |  IE 11 |
|    2000 | em quad                     |        Y |            |      Y |      Y |       Y |      Y |
|    2001 | en space                    |        Y |            |      Y |      Y |       Y |      Y |
|    2002 | em space                    |        Y |            |      Y |      Y |       Y |      Y |
|    2003 | three-per-em space          |        Y |            |      Y |      Y |       Y |      Y |
|    2004 | four-per-em space           |        Y |            |      Y |      Y |       Y |      Y |
|    2005 | six-per-em space            |        Y |            |      Y |      Y |       Y |      Y |
|    2006 | figure space                |        Y |            |      Y |      Y |       Y |      Y |
|    2007 | punctuation space           |          |            |      Y |      Y |       Y |      Y |
|    2008 | thin space                  |        Y |            |      Y |      Y |       Y |      Y |
|    2009 | hair space                  |        Y |            |      Y |      Y |       Y |      Y |
|    200A | line separator              |        Y |            |      Y |      Y |       Y |      Y |
|    2028 | paragraph separator         |        Y |            |      Y |      Y |       Y |      Y |
|    2029 | narrow no-break space       |        Y |            |      Y |      Y |       Y |      Y |
|    202F | medium mathematical space   |          |            |      Y |      Y |     Win |      Y |
|    205F | ideographic space           |        Y |            |      Y |      Y |       Y |      Y |
|    3000 | ideographic space           |        Y |            |      Y |      Y |       Y |      Y |
|    FEFF | zero width no-break space   |          |            |        |        |         |      Y |

`FEFF` is **zero width no-break space** in the block **Arabic Presentation Forms-B**. This
is most often used as a **Byte order mark**.

## Test code

This is the code I have used to generate the table.

### JavaScript

{% include codeheader.html lang="JavaScript" %}
{% highlight JavaScript %}
for (var i = 0; i <= 0xffff; i++) {
    var s = String.fromCharCode(i);
    if (!s.trim().length) {
        console.log(i.toString(16));
    }
}
{% endhighlight %}

### CSharp

{% include codeheader.html lang="C#" %}
{% highlight CSharp %}
public class Program
{
  public static void Main()
  {
    for (int i = 0; i <= 0xffff; i++)
    {
      if (char.IsWhiteSpace((char)i))
      {
          System.Console.WriteLine(i.ToString("x4"));
      }
    }
  }
}
{% endhighlight %}

Try this with [try.dot.net](https://try.dot.net/).

### C++

{% include codeheader.html lang="C++" %}
{% highlight C++ %}
#include <iostream>
#include <clocale>
#include <cwctype>

int main()
{
    for (int i = 0; i <= 0xffff; i++)
    {
        wchar_t c = (wchar_t)i;

        if (std::iswspace(c))
        {
            std::cout << std::hex << i << std::endl;
        }
    }
}
{% endhighlight %}

### Java

{% include codeheader.html lang="Java" %}
{% highlight Java %}
public class Main
{
    public static void main(String[] args) {
        for (int i = 0; i <= 0xffff; i++)
        {
            if(Character.isWhitespace((char) i))
            {
                System.out.println(Integer.toHexString(i));
            }
        }
    }
}
{% endhighlight %}

Try this on [JDoodle](https://www.jdoodle.com/online-java-compiler).

### Python

{% include codeheader.html lang="Python" %}
{% highlight python %}
import string

for x in string.whitespace:
    print(hex(ord(x)))
{% endhighlight %}

Try this on [learnpython.org](https://www.learnpython.org/en/Loops).

### Go

{% include codeheader.html lang="Python" %}
{% highlight python %}
package main

import "fmt"
import "unicode"

func main() {
    for i := 0; i<=0xffff; i++ {
        if(unicode.IsSpace(rune(i))) {
            fmt.Printf("%x\n", i);
        }
    }
}
{% endhighlight %}

Try this on [golang](https://play.golang.org/).

## Summary

Is it a problem that different languages have different opinion about what is
and what is not a whitespace?

Let say you have a web application with a user that has a username that ends with
the **Mongolian vowel separator**. Now the user tries to login running IE11.
Before the data is send to the server, the data is trimmed by JavaScript code, so
the **Mongolian vowel separator** is now removed. Then, when data is processed
in the backend written in C#, it will never be able to find the user.

Sure, this is a bit extreme example :-). But it shows that unexpected things could
happen, and it might be worth to at least we aware of that.
