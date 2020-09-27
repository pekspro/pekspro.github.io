---
layout: post
title:  "Modifying query strings"
date:   2020-09-27 01:00:00 +0200
categories: [.NET]
---

Recently I needed modify a query string that was somewhere in a URI string. It
seems to be a trivial problem, but it took me some hours to get this right.

## The problem

In my scenario I could have URI that looked like this:

* /help
* /help?search=cats
* /pages/help?search=cats#anchor
* http://server.com/help?search=cats#anchor
* http://user:password@server.com/help?search=cats#anchor

I wanted a simple function to modify the query string no matter how the URI
looked. If I understand it correctly, the first three samples are not
technically a
[URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier#Generic_syntax).
A schema, like http or ftp, is required.

If you try to make a
[`Uri`](https://docs.microsoft.com/en-us/dotnet/api/system.uri) object from any of
these first three samples you will get an exception, unless you specify that it
could be a relative path. But if it is a relative path, only a few properties
work.

## The solution

The first thing I do in my function is the check if the path is relative or not,
and it is temporary convert it to an absolute path.

In the second step I created an
[`UriBuilder`](https://docs.microsoft.com/en-us/dotnet/api/system.uribuilder) from
the current URI, and from that is was easy to create a
[`NameValueCollection`](https://docs.microsoft.com/en-us/dotnet/api/system.collections.specialized.namevaluecollection)
that then could be used to modify the query. Once the query string is in a
NameValueCollection it is easy to work with.

In the third step, the new query is created from the `UriBuilder`. And if it is
a relative URI, the relative URI is extracted with the method
[`MakeRelativeUri`](https://docs.microsoft.com/en-us/dotnet/api/system.uri.makerelativeuri).

This is the function I created:

{% include codeheader.html lang="ModifyUri code" %}
{% highlight csharp %}
static string ModifyUri(string uristring, Action<NameValueCollection> queryStringChangerCallback)
{
    Uri uri = new Uri(uristring, UriKind.RelativeOrAbsolute);

    if (uri.IsAbsoluteUri)
    {
        UriBuilder uriBuilder = new UriBuilder(uri);
        NameValueCollection nameValueCollection = HttpUtility.ParseQueryString(uri.Query);

        queryStringChangerCallback.Invoke(nameValueCollection);

        uriBuilder.Query = nameValueCollection.ToString();

        return uriBuilder.Uri.AbsoluteUri;
    }
    else
    {
        //Change to an absolute uri
        Uri relativeToUri = new Uri("http://f.oo");
        uri = new Uri("http://f.oo/" + uristring);

        UriBuilder uriBuilder = new UriBuilder(uri);
        NameValueCollection nameValueCollection = HttpUtility.ParseQueryString(uri.Query);

        queryStringChangerCallback.Invoke(nameValueCollection);

        uriBuilder.Query = nameValueCollection.ToString();

        //Get the relative uri
        Uri relative = relativeToUri.MakeRelativeUri(uriBuilder.Uri);

        return relative.OriginalString;
    }
}
{% endhighlight %}

The function accepts a callback that then is used to modify the
`NameValueCollection`. It could be used like this:

{% include codeheader.html lang="Usage" %}
{% highlight csharp %}
string output = ModifyUri("/path/search?q=dogs&age=puppy#fragment", qs =>
{
    // Replace value of q.
    qs["q"] = "cats";
    // New URI: /path/search?q=cats&age=puppy#fragment

    // Remove age.
    qs.Remove("age");
    // New URI: /path/search?q=cats#fragment

    // Add color.
    qs["color"] = "black";
    // New URI: /path/search?q=cats&color=black#fragment

    // Add second color.
    qs.Add("color", "white");
    // New URI: /path/search?q=cats&color=black&color=white#fragment

    // Add value without key
    qs.Add(null, "cute");
    // New URI: /path/search?q=cats&color=black&color=white&cute#fragment
});

// output now has the value:
// /path/search?q=cats&color=black&color=white&cute#fragment
{% endhighlight %}

## Testing

Just to make sure the function works properly I created a large number of tests:

{% include codeheader.html lang="Usage" %}
{% highlight csharp %}
public class UnitTestModifyUri
{
    static string ModifyUri(string uristring, Action<NameValueCollection> queryStringChangerCallback)
    {
        Uri uri = new Uri(uristring, UriKind.RelativeOrAbsolute);

        if (uri.IsAbsoluteUri)
        {
            UriBuilder uriBuilder = new UriBuilder(uri);
            NameValueCollection nameValueCollection = HttpUtility.ParseQueryString(uri.Query);

            queryStringChangerCallback.Invoke(nameValueCollection);

            uriBuilder.Query = nameValueCollection.ToString();

            return uriBuilder.Uri.AbsoluteUri;
        }
        else
        {
            //Change to an absolute uri
            Uri relativeToUri = new Uri("http://f.oo");
            uri = new Uri("http://f.oo/" + uristring);

            UriBuilder uriBuilder = new UriBuilder(uri);
            NameValueCollection nameValueCollection = HttpUtility.ParseQueryString(uri.Query);

            queryStringChangerCallback.Invoke(nameValueCollection);

            uriBuilder.Query = nameValueCollection.ToString();

            //Get the relative uri
            Uri relative = relativeToUri.MakeRelativeUri(uriBuilder.Uri);

            return relative.OriginalString;
        }
    }

    [Theory]
    [MemberData(nameof(GetData))]
    public void TestClear(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "?alpha=1&beta=2");
        string expectedOutput = string.Format(urlFormat,
                        "");

        string output = ModifyUri(input, qs =>
        {
            qs.Clear();
        });

        Assert.Equal(expectedOutput, output);
    }

    [Theory]
    [MemberData(nameof(GetData))]
    public void TestAddFromEmpty(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "");
        string expectedOutput = string.Format(urlFormat,
                        "?alpha=1");

        string output = ModifyUri(input, qs =>
        {
            qs.Add("alpha", "1");
        });

        Assert.Equal(expectedOutput, output);
    }

    [Theory]
    [MemberData(nameof(GetData))]
    public void TestAddViaAssignFromEmpty(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "");
        string expectedOutput = string.Format(urlFormat,
                        "?alpha=1");

        string output = ModifyUri(input, qs =>
        {
            qs["alpha"] = "1";
        });

        Assert.Equal(expectedOutput, output);
    }

    [Theory]
    [MemberData(nameof(GetData))]
    public void TestAddFromExisting(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "?alpha=1");
        string expectedOutput = string.Format(urlFormat,
                        "?alpha=1&beta=2");

        string output = ModifyUri(input, qs =>
        {
            qs.Add("beta", "2");
        });

        Assert.Equal(expectedOutput, output);
    }

    [Theory]
    [MemberData(nameof(GetData))]
    public void TestModify(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "?alpha=1&beta");
        string expectedOutput = string.Format(urlFormat,
                        "?alpha=2&beta");

        string output = ModifyUri(input, qs =>
        {
            qs["alpha"] = "2";
        });

        Assert.Equal(expectedOutput, output);
    }
    
    [Theory]
    [MemberData(nameof(GetData))]
    public void TestAddSecondValue(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "?alpha=1&beta");
        string expectedOutput = string.Format(urlFormat,
                        "?alpha=1&alpha=2&beta");

        string output = ModifyUri(input, qs =>
        {
            qs.Add("alpha", "2");
        });

        Assert.Equal(expectedOutput, output);
    }
            
    [Theory]
    [MemberData(nameof(GetData))]
    public void TestRemoveMultipleValues(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "?alpha=1&alpha=2&beta");
        string expectedOutput = string.Format(urlFormat,
                        "?beta");

        string output = ModifyUri(input, qs =>
        {
            qs.Remove("alpha");
            qs.Remove("doesnotexists");
        });

        Assert.Equal(expectedOutput, output);
    }
    
    [Theory]
    [MemberData(nameof(GetData))]
    public void TestAddEmptyValue(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "?alpha=1&beta");
        string expectedOutput = string.Format(urlFormat,
                        "?alpha=1&beta&gamma");

        string output = ModifyUri(input, qs =>
        {
            qs.Add(null, "gamma");
        });

        Assert.Equal(expectedOutput, output);
    }

    [Theory]
    [MemberData(nameof(GetData))]
    public void TestEncoding(string urlFormat)
    {
        string input = string.Format(urlFormat,
                        "");
        string expectedOutput = string.Format(urlFormat,
                        "?%C3%85%C3%84%C3%96=%C3%A5%C3%A4%C3%B6&foodquery=%F0%9F%8D%95+%26+%F0%9F%8D%B0+%3d+%F0%9F%A4%AE%3f");

        string output = ModifyUri(input, qs =>
        {
            qs.Add("ÅÄÖ", "åäö");
            qs.Add("foodquery", "🍕 & 🍰 = 🤮?");
        });

        Assert.Equal(expectedOutput, output);
    }

    public static IEnumerable<object[]> GetData() =>
        new List<object[]>
        {
            new object[] {"{0}"},
            new object[] {"hello{0}"},
            new object[] {"/hello{0}"},
            new object[] {"http://a.bc/hello{0}"},
            new object[] {"http://a.bc:1234/hello{0}"},
            new object[] {"http://user:pass@a.bc:1234/hello{0}"},
            new object[] {"{0}#fragment"},
            new object[] {"hello{0}#fragment"},
            new object[] {"/hello{0}#fragment"},
            new object[] {"http://a.bc/hello{0}#fragment"},
            new object[] {"http://a.bc:1234/hello{0}#fragment"},
            new object[] {"http://user:pass@a.bc:1234/hello{0}#fragment"}
        };
    }
{% endhighlight %}

## Summary

I do not know why, but it took me a lot of time to get everything right. Creating URI is
nothing new to me, but I usually do it by concatenating strings. The thing that
took longest time to crack was to support relative path.

The code uses
[HttpUtility.ParseQueryString](https://docs.microsoft.com/en-us/dotnet/api/system.web.httputility.parsequerystring)
to parse the query string. In .NET core you could use
[QueryHelpers.ParseNullableQuery](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.webutilities.queryhelpers.parsenullablequery)
instead, and then create the query string with
[QueryString.Create](https://docs.microsoft.com/de-de/dotnet/api/microsoft.aspnetcore.http.querystring.create).

I think the new API are slightly better, they make it a bit easier to work with
keys that have multiple values. But they require the assemblies
[**Microsoft.AspNetCore.WebUtilities**](https://www.nuget.org/packages/Microsoft.AspNetCore.WebUtilities/)
respective
[**Microsoft.AspNetCore.Http.Abstractions**](https://www.nuget.org/packages/Microsoft.AspNetCore.Http.Abstractions/),
and I do not think it is worth it. I stick to the old API; it is good enough. 
