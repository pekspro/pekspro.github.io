---
layout: post
title:  "Creating unique Excel sheet names"
date:   2021-03-07 01:00:00 +0200
categories: [.NET, Excel] 
---

Here is a solution that gives you unique and valid sheet names in Excel files
that you are generating.

## The problem

Generating Excel files in code could be fun. But when you do you need to make
sure that the sheet names follow these rules:

* The name cannot be more than 31 characters.
* The name must be unique.
* The name cannot be *history*.
* The following characters cannot be used:
  * :
  * \
  * /
  * ?
  * \*
  * [
  * ]

## The solution

I am using [ClosedXML](https://github.com/closedxml/closedxml) that is a great
library when you are generating Excel files in code. This is used in this code
that solves the problem:

{% include codeheader.html lang="CSharp" %}
{% highlight C# %}
using ClosedXML.Excel;
using System;
using System.Linq;
using System.Text.RegularExpressions;

class Program
{
    static void Main()
    {
        string[] sheetNames = new string[]
            {
                // This is fine.
                "Sheet A",
                // Duplicate of above. Will be renamed to Sheet A-1.
                "Sheet A",
                // Too long. Will be truncated.
                "Sheet with a name that is longer than allowed",
                // ? is not allowed, will be removed.
                "Sheet B?",
                // Tab will be replaced with space. After this, this is a duplicate of above.
                "Sheet\tB",
                // : is not allowed.
                "Sheet:B",
                // The word "history" is not allowed. A dot will be added to the name.
                "History"
            };

        XLWorkbook workbook = new XLWorkbook();
        foreach(string sheetName in sheetNames)
        {
            workbook.AddWorksheet(CreateUniqueSheetName(workbook, sheetName));
        }

        foreach(var sheet in workbook.Worksheets)
        {
            Console.WriteLine(sheet.Name);
        }
    }

    const int MaxSheetNameLength = 31;

    public static string CreateUniqueSheetName(IXLWorkbook workbook, string sheetName)
    {
        // :\/?*[] are invalid characters
        sheetName = Regex.Replace(sheetName, @"[:\\/?\*\[\]]", "");
            
        // Change all white space to regular space
        sheetName = Regex.Replace(sheetName, @"\s", " ");

        if(sheetName.Equals("history", StringComparison.CurrentCultureIgnoreCase))
        {
            sheetName += ".";
        }

        string newSheetName = sheetName.Substring(0, Math.Min(sheetName.Length, MaxSheetNameLength));

        int nameVariant = 0;

        while (workbook.Worksheets.Any(s => s.Name.Equals(newSheetName, StringComparison.CurrentCultureIgnoreCase)))
        {
            nameVariant++;

            string nameVariantExtension = "-" + nameVariant.ToString();

            newSheetName = sheetName.Substring(0, Math.Min(sheetName.Length, MaxSheetNameLength)) + nameVariantExtension;
        }

        return newSheetName;
    }
}
{% endhighlight %}

The output from this code is:

    Sheet A
    Sheet A-1
    Sheet with a name that is longe
    Sheet B
    Sheet B-1
    SheetB
    History.

## Summary

This is not a complicated problem, but I hope someone find this useful anyway.
The largest problem I think is that there is no official documentation on the
limitations of Excel sheet names. There is a page listing some [specifications
and limitations of
Excel](https://support.microsoft.com/en-us/office/excel-specifications-and-limits-1672b34d-7043-467e-8e27-269d656771c3),
but this is not mentioned.
