---
layout: post
title:  "Creating accruals with Power Query"
date:   2021-02-21 01:00:00 +0200
categories: [Excel, Power BI] 
---

Let say you have expenses that you want to split into several dates. How do you
solve this with Power Query?

## The problem

Let say you have this table in Excel:

Cost|Date      |Number of days|Description
---:|----------|-------------:|-----------
1400|2021-02-01|             7|Rent
 250|2021-02-03|             5|Electricity
  45|2021-02-05|             3|Water

For each cost you want to split them into multiple rows. First row should be
split into 7 days, next into 3 days and so on. In other words, you want to get
this result:

Cost|Date      |Description
---:|----------|-----------
 200|2021-02-01|Rent
 200|2021-02-02|Rent
 200|2021-02-03|Rent
 200|2021-02-04|Rent
 200|2021-02-05|Rent
 200|2021-02-06|Rent
 200|2021-02-07|Rent
  50|2021-02-03|Electricity
  50|2021-02-04|Electricity
  50|2021-02-05|Electricity
  50|2021-02-06|Electricity
  50|2021-02-07|Electricity
  15|2021-02-05|Water
  15|2021-02-06|Water
  15|2021-02-07|Water

Adding the first table into Power Query is easy. But how do you convert this
into the second table?

## The solution

This problem cannot be easily be solved in the GUI in the Power Query Editor as
far as I know. But all Power Queries are in the in written in the [M
language](https://docs.microsoft.com/en-us/powerquery-m/). And with some coding
this problem could be solved.

If you have the first table in Excel and then use it in Power Query you have
this in the Advanced Editor:

{% include codeheader.html lang="Advanced editor" %}
{% highlight text %}
{%raw%}let
    Source = Excel.CurrentWorkbook(){[Name="Table1"]}[Content],
    #"Changed Type" = Table.TransformColumnTypes(Source,{{"Cost", Int64.Type}, {"Date", type date}, {"Number of days", Int64.Type}, {"Description", type text}})
in
    #"Changed Type"
{%endraw%}
{% endhighlight %}

Now change this into this code:

{% include codeheader.html lang="Advanced editor" %}
{% highlight text %}
{%raw%}let
    CreateRow = (dayid, daycount, old) =>
        let oldrow = old as record
        in [Date = Date.AddDays(oldrow[Date], dayid -1), Cost = oldrow[Cost] / daycount, Description = oldrow[Description] ],

    GetRows = (R) =>
        let Row = R as record,
            DayCount  = Row[#"Number of days"],
            DayIndices = { 1 .. DayCount },
            NewRows       = List.Transform(DayIndices, each CreateRow(_, DayCount, Row))

        in  NewRows,

    Source = Excel.CurrentWorkbook(){[Name="Table1"]}[Content],
    #"Changed Type" = Table.TransformColumnTypes(Source,{{"Cost", Int64.Type}, {"Date", type date}, {"Number of days", Int64.Type}, {"Description", type text}}),
    #"Split" = Table.TransformRows(#"Changed Type", each GetRows(_)),

    // The following steps are done in the Power Query editor:
    #"Converted to Table" = Table.FromList(Split, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column1" = Table.ExpandListColumn(#"Converted to Table", "Column1"),
    #"Expanded Column2" = Table.ExpandRecordColumn(#"Expanded Column1", "Column1", {"Date", "Cost", "Description"}, {"Date", "Cost", "Description"}),
    #"Changed Type1" = Table.TransformColumnTypes(#"Expanded Column2",{{"Date", type date}, {"Cost", type number}})
in
    #"Changed Type1"{%endraw%}
{% endhighlight %}

In this query two functions are added:

* `CreateRow` takes a row from the first table above and a day number and
  converts these into a row for the second table.
* `GetRows` take a row from the first table and converts it into a list of rows,
  with the help of CreateRow above.

In line that starts with `#"Split"` a call to `Table.TransformRows` is made. In
this call, and `GetRows` is executed for each row in the table. This will result
in a table with the same number of rows as it has from the beginning. But each
row contains of a list with new rows. With a few clicks in the Power Query
editor this could be converted into a proper table.

## Summary

This was an interesting problem. I cannot say I have any deeper understanding of
the M-language. But after solving this I learned quite a bit :-)
