---
layout: post
title:  "How to make InputSelect support more types"
date:   2020-09-06 01:00:00 +0300
categories: [Blazor]
---

If you have used `InputSelect` in Blazor in ASP.NET Core 3.1 you may have
noticed `bind-Value` only works on a limited set of types. That is strings and
enum to be precise. In .NET 5 this will be improved. And it is easy to backport
this to 3.1.

## The problem

Look on this Blazor code:

{% include codeheader.html lang="Blazor sample" %}
{% highlight text %}
<EditForm Model="@this">
    <label>Select:</label>
    <div>
        <InputSelect class="form-control" @bind-Value="@Id">
            <option value="0">Zero</option>
            <option value="1">One</option>
            <option value="2">Two</option>
        </InputSelect>
        <p>Selected ID: @Id</p>
    </div>
</EditForm>

@code {
    public int Id { get; set; }
}
{% endhighlight %}

This will show the user a drop list. And when the user changes value, the value
of `Id` will be changed. Or, at least that is what we want. Instead an exception
will be thrown with this message:

{% include codeheader.html lang="Exception" %}
{% highlight text %}
InputSelect`1[System.Int32] does not support the type 'System.Int32'
{% endhighlight %}

Not pretty! The reason is that `InputSelect` only could convert the value if the
id has the type `string` or some kind of enum.

## The solution

This problem only exist in .NET Core 3.1. In the upcoming .NET 5 you could use
`int`, `byte`, `Guid` and a lot more, both nullable and not, and it just works.
Very nice! After this discovery I decided to investigate how this was solved and
tried to backport this to 3.1.

This resulted in this code:

{% include codeheader.html lang="Solution code" %}
{% highlight CSharp %}
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using System;
using System.Globalization;

namespace MyNameSpace
{
    public class InputSelectExtended<T> : InputSelect<T>
    {
        protected override bool TryParseValueFromString(string value, out T result, out string validationErrorMessage)
        {
            try
            {
                if (BindConverter.TryConvertTo<T>(value, CultureInfo.CurrentCulture, out var parsedValue))
                {
                    result = parsedValue;
                    validationErrorMessage = null;
                    return true;
                }
                else
                {
                    result = default;
                    validationErrorMessage = "The chosen value is not valid.";
                    return false;
                }
            }
            catch (InvalidOperationException ex)
            {
                throw new InvalidOperationException($"{GetType()} does not support the type '{typeof(T)}'.", ex);
            }
        }
    }
}
{% endhighlight %}

Then I just needed to replace `InputSelect` with `InputSelectExtended` in the
test application like this:

{% include codeheader.html lang="Blazor sample" %}
{% highlight text %}
<EditForm Model="@this">
    <label>Select:</label>
    <div>
        <InputSelectExtended class="form-control" @bind-Value="@Id">
            <option value="0">Zero</option>
            <option value="1">One</option>
            <option value="2">Two</option>
        </InputSelectExtended>
        <p>Selected ID: @Id</p>
    </div>
</EditForm>

@code {
    public int Id { get; set; }
}
{% endhighlight %}

That is all. Short a simple and will save you from boring conversion code.

## Summary

I cannot take much credit of this solution. This is a mix of code suggested in
[issue 11181](https://github.com/dotnet/aspnetcore/issues/11181), the code of
[InputSelect.cs](https://github.com/dotnet/aspnetcore/blob/master/src/Components/Web/src/Forms/InputSelect.cs)
and
[InputExtensions.cs](https://github.com/dotnet/aspnetcore/blob/master/src/Components/Web/src/Forms/InputExtensions.cs)
in the [aspnetcore repository](https://github.com/dotnet/aspnetcore) on GitHub.
