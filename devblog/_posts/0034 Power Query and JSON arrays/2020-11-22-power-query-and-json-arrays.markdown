---
layout: post
title:  "Power Query and JSON arrays"
date:   2020-11-22 01:00:00 +0200
categories: [Excel, Power BI] 
---

When you are working with JSON arrays in Power Query it is not always obvious
how to convert the data into a table.

## The problem

Let say you try to fetch data from a web service, and it returns the result like
this:

{% include codeheader.html lang="JSON" %}
{% highlight json %}
[
  {
    "PlayerID": 1,
    "Name": "Ada"
  },
  {
    "PlayerID": 2,
    "Name": "Bob"
  },
  {
    "PlayerID": 3,
    "Name": "Carol"
  }
]
{% endhighlight %}

In the Power Query editor, it will look like this:

![Convert To Table]({{site.baseurl}}/assets/images/0034/problem-convert-to-table.png "Convert To Table")

Since you want to create a table the natural thing to select is **Transform** >
**To table**.

![Select delimiter]({{site.baseurl}}/assets/images/0034/problem-select-delimiter.png "Select delimiter")

This is the settings you get when you want to split a string into smaller parts.
So clearly, we are on the wrong track.

## The solution

Actually, this it the way to do it. Just keep **None** as delimiter and
**just click OK**! I do not remember how many times this had confused me.

Next, you could just expand the column:

![Expand column]({{site.baseurl}}/assets/images/0034/solution-expand-column.png "Expand column")

And then you have your table:

![Table created]({{site.baseurl}}/assets/images/0034/solution-table.png "Table created")

## Summary

If the array is in a property instead:

{% include codeheader.html lang="JSON" %}
{% highlight json %}
{
    "Data":
    [
        {
            "PlayerID": 1,
            "Name": "Ada"
        },
        {
            "PlayerID": 2,
            "Name": "Bob"
        },
        {
            "PlayerID": 3,
            "Name": "Carol"
        }
    ]
}
{% endhighlight %}

Then, when you convert it into a table the columns are expanded automatically.
Way more natural, I think. In fact, the first time I had a pure array to convert
I got stuck. So, I used the advanced editor to convert the JSON. First it looked
like this:

{% include codeheader.html lang="Advanced editor" %}
{% highlight text %}
let
    Source = Json.Document(Web.Contents("https://rsptournament/api/players"))
in
    Source
{% endhighlight %}

And after my modification:

{% include codeheader.html lang="Advanced editor" %}
{% highlight text %}
let
    Source = Json.Document("{ ""Data"": " & Text.FromBinary(Web.Contents("https://rsptournament/api/players")) & "}")
in
    Source
{% endhighlight %}

But as you already know this is not necessary. I just wish I had discovered this
earlier.
