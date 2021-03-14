---
layout: post
title:  "Be careful with references in Power Query"
date:   2021-03-14 01:00:00 +0200
categories: [Excel, Power BI] 
---

References in Power Query are incredibly useful. I often use it to organize my
queries. But when you are using them you could trigger extra calls against your
data sources.

## The problem

Let say you created two Power Queries:

* `DatabaseData` – This fetch data from a database
* `FileData` – This fetch data from a file

Now you want to merge all this data into a single large table. You are creating
a new query named `AllData` that is defined like this:

{% include codeheader.html lang="AllData definition" %}
{% highlight text %}
let
    Source = Table.Combine({FileData, DatabaseData})
in
    Source
{% endhighlight %}

Now when you update the data in all your queries this happens:

* `DatabaseData` is updated by fetching data from the database.
* `FileData` is updated by fetching data from the file.
* `AllData` is updated by using the already fetched data from the two previous
  queries.

**Wrong!** This I what I *thought* would happen. Instead, what happens is that
when `AllData` is updated a new call is made to the database and the file is
read a second time.

The reason for this, as I understand it, is that Power Query is designed to push
as much work against the data sources as possible. So, if `AllData` instead did
some grouping on the database data this work would be pushed to the database.
This could be a good thing.

But, in the situation above this is not what we want.

## The solution

There are two potential solutions for this.

### Block updating data in the queries

If we do not intend to use the data in `DatabaseData` and `FileData` we could
block the update for these queries.

In Excel you right click on the queries, select properties, and then uncheck the
option **Refresh this connection on Refresh All**.

![Refresh this connection on Refresh All]({{site.baseurl}}/assets/images/0050/excel-query-block.png "Refresh this connection on Refresh All")

If you are using PowerBI, you instead in the Power Query editor right click on
the query and uncheck **Include in report refresh**.

![Include in report refresh]({{site.baseurl}}/assets/images/0050/powerbi-query-block.png "Refresh Include in report refresh")

Note when you do this `AllData` will still be using the latest data that is in
the data sources. The difference is that `DatabaseData` and `FileData` will not
be updated when you refresh all data in your document.

### Use a calculated table

Another solution is to create a calculated table instead of having merging data
in Power Query, this is only possible in PowerBI. In the Power BI editor select
**Table tools** > **New Table**.

![Add calculated table]({{site.baseurl}}/assets/images/0050/powerbi-add-calculated-table.png "Add calculated table")

Then you are entering this DAX command:

{% include codeheader.html lang="DAX" %}
{% highlight text %}
AllData = UNION(DatabaseData, FileData)
{% endhighlight %}

When all data is being updated, `DatabaseData` and `FileData` are updated first.
Then the calculated table is created from the result from these queries. No
additional calls are done against your database.

You could do a lot more than just union tables. You could do joins with
different tables, add more columns and much more. There is more information
about this in the
[documentation](https://docs.microsoft.com/en-us/power-bi/transform-model/desktop-calculated-tables)

## Summary

I learned all this when I had a Power BI solution that was updating surprisingly
slow. After some trouble shooting, I started to suspect that it made more
request against my data sources than expected and this made the update process
very slow. I wished I had learned this earlier.