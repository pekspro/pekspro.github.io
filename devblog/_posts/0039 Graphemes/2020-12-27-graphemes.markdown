---
layout: post
title:  "Graphemes"
date:   2020-12-27 01:00:00 +0200
categories: [.NET] 
---

Since 1998 I have been developing an application to make it easier
and fun to learn languages, [Vokabel](https://pekspro.com/products/vokabel/).
For about a year ago I got some complains that the application in some scenarios
did not work properly with some languages.

## The problem

In Vokabel there are some games. One game is Anagram where the word is separated
into its individual characters and then the user should be putting the back
together.

It is easy to split a string into characters in C#. This is one way to do it:

{% include codeheader.html lang="CSharp" %}
{% highlight C# %}
List<char> CreateList(string input)
{
    return input.ToList();
}
{% endhighlight %}

If you call this method with the string "Hello" you will get back:

    1: H
    2: e
    3: l
    4: l
    5: o

This is just as expected. But if you this for the string "כִּי־טֽוֹב" instead you
will get:

     1: כ
     2:  ּ
     3:  ִ 
     4: י
     5: ־
     6: ט
     7:  ֽ
     8: ו
     9:  ֹ
    10: ב

The first surprise might be that the characters are in the incorrect order. But that
is because "כִּי־טֽוֹב" is Hebrew and that is written from right to left so that is fine.

But you also see that there are too many characters. The original string had 6, and
now it is 10.

## The solution

Actually, the original string also had 10 characters. But when it is printed on
the screen it has just 6 *graphemes*. A grapheme is
"[the smallest functional unit of a writing system](https://en.wikipedia.org/wiki/Grapheme)".
An accent for instance (`) has no meaning on its own in a human language, it is
only useful when it is combined with another character, like é. That character
has its own Unicode representation so that is not a problem.

To my understanding, Hebrew only consist of consonants in writing. But it is
possible to indicate which vowels to use with diacritic marks. For instance,
this grapheme:

    כִּ

Is the constant כ written with two diacritic marks. These combinations
are not individual characters in Unicode.

So, how should you do if you want to split a string into its individual
graphemes? In .NET this is luckily built-in in the framework. This code will do
it:

{% include codeheader.html lang="CSharp" %}
{% highlight C# %}
public List<string> SplitToGraphemes(string text)
{
    List<string> list = new List<string>();

    TextElementEnumerator graphemeEnumerator = StringInfo.GetTextElementEnumerator(text);
    while (graphemeEnumerator.MoveNext())
    {
        string grapheme = graphemeEnumerator.GetTextElement();
        list.Add(grapheme);
    }

    return list;
}
{% endhighlight %}

Or, if you are using Java this code solves it:

{% include codeheader.html lang="Java" %}
{% highlight Java %}
public static ArrayList<String> SplitToGraphemes(String text)
{
    ArrayList<String> list = new ArrayList<String>();

    BreakIterator boundary = BreakIterator.getCharacterInstance();

    boundary.setText(text);

    int start = boundary.first();
    for (int end = boundary.next(); end != BreakIterator.DONE; end = boundary.next()) {
        String t = text.substring(start, end);
        list.add(t);
        start = end;
    }

    return list;
}
{% endhighlight %}

This sample string above will be separated into this:

    1: כִּ  
    2: י
    3: ־
    4: טֽ
    5: וֹ
    6: ב

This is exactly what we were looking for.

## Summary

Human languages are messy :-) I am sure that things I have written above are not fully
correct, but I hope it is understandable at least.

Multi-character graphemes are also used for some emojis. These have not been
handled correctly in .NET Framework and .NET Core 3.1 or below. But in
[.NET 5 this has been fixed.](https://docs.microsoft.com/en-us/dotnet/core/compatibility/globalization/5.0/uax29-compliant-grapheme-enumeration)
