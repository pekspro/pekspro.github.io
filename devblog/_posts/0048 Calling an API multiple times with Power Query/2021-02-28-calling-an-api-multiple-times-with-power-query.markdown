---
layout: post
title:  "Calling an API multiple times with Power Query"
date:   2021-02-28 01:00:00 +0200
categories: [Excel] 
---

Making a single call to a web API is quite straightforward. But sometimes you
need to make multiple calls to get the data you want.

## The problem

Let say you calling an API on the address `https://api.example.com/customers`
and it returns:

{% include codeheader.html lang="API response" %}
{% highlight json %}
{
    "metadata": {
        "total": 25,
        "limit": 10,
        "offset": 0
    },
    "data": [
        {
            "customerId": 1
            "name": "First customer"
        }
    ]
}
{% endhighlight %}

There are 25 customers in the API, but you will get no more than 10 customs per
call. To get the rest of the customers you need to call
`https://api.example.com/customers?offset=10` and
`https://api.example.com/customers?offset=20`. How do you do this in Power
Query?

## The solution

My solution is in these steps:

* First, just make a call to the API to get the number of customers.
* Calculate the numbers of calls you need to make and then call the API several
  times with different offset each time.
* Merge all the fetched data.

The principle is quite simple. And here is some code that do this:

{% include codeheader.html lang="Advanced editor" %}
{% highlight text %}
{%raw%}let
    BaseUrl = "https://api.example.com",
    GetApiResultAsTable = (offset) =>
        let
            // Do not do this:
            // CurrentJson = Json.Document(Web.Contents(BaseUrl & "/customers?offset=" & Number.ToText(offset)),
            // Instead do this:
            CurrentJson = Json.Document(Web.Contents(BaseUrl, [RelativePath="/customers", Query=[offset = Number.ToText(offset)]])),
            Data = CurrentJson[data],
            DataAsTable = Table.FromList(Data, Splitter.SplitByNothing(), null, null, ExtraValues.Error)
        in
            DataAsTable,

    // Do not do this:
    // CountJson = Json.Document(Web.Contents(BaseUrl & "/customers)),
    // Instead do this:
    CountJson = Json.Document(Web.Contents(BaseUrl, [RelativePath="/customers"])),
    Metadata = CountJson[metadata],
    ItemsCount = Metadata[total],
    ItemsPerPage = Metadata[limit],
    
    AllTables = List.Generate(()=>0, each _ < ItemsCount, each _ + ItemsPerPage, each GetApiResultAsTable(_) ),
    #"Converted to table" = Table.FromList(AllTables, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column" = Table.ExpandTableColumn(#"Converted to table", "Column1", {"Column1"}, {"Column1.Column1"})
in
    #"Expanded Column"
{%endraw%}
{% endhighlight %}

Just like [last week]({% post_url
/0047 Creating accruals with Power Query/2021-02-21-creating-accruals-with-power-query%}) I use a function that I call multiple times. This is done
via `List.Generate`.

Note that each `Web.Contents` call uses the same address. The path and query
string are added via the `RelativePath` and `Query`. It may be tempting to just
concatenate a string and use that as the first parameter to `Web.Contents`. In
many times this works fine – except in the Power BI service. If you are using a
dynamic address you will get strange error messages (I guess it is because it
does not understand how to configure the credentials). I learned this from [this
blog
post](https://blog.crossjoin.co.uk/2016/08/23/web-contents-m-functions-and-dataset-refresh-errors-in-power-bi/).

## Summary

It is awesome that it is possible to do things like this in Power Query. It took
me a while to understand how to do this, but now it is saving me a lot of time
when I am making reports in Power BI. When you set up the credentials in the
Power BI service, you may need to use the option **Skip Test Connection**. It
all depends on if the Power BI service is able verify the connection from the
URL that is passed to `Web.Contents` without any relative path and query string.
