---
layout: post
title:  "Power Query and Web API with HTTP authentication"
date:   2020-11-29 01:00:00 +0200
categories: [Excel] 
---

With Power Query you could easily get data from different data sources, like
Excel-files, CSV-files, and Web API. But if you need to connect to a Web API
that requires authentication things are not that easy.

## The problem

Let say you want to get data from this URL:

    https://rsptournament/api/players

With this JWT token:

    Bearer abc123

You start by going into Excel, select **Data** > **From web**.

![Select From Web]({{site.baseurl}}/assets/images/0035/problem-1.png "Select From Web")

Next you enter the URL:

![Enter URL]({{site.baseurl}}/assets/images/0035/problem-2-enter-url.png "Enter URL")

Now you are being asked for authentication settings. If you select **Web API**
and enter the token as the **Key** this should just work, right? But when you
press **Connect** you get a very confusing error message saying: **A web API key
can only be specified when a web API key name is provided**.

![Error message]({{site.baseurl}}/assets/images/0035/problem-3.png "Error message")

The first time I run into this I got several question in my head:

* What does this mean?
* How do I enter a key name?
* Will entering a key name make it work?
* Or how should I do this instead?
* How could this be so badly designed?

## The explanation

First, just a quick explanation why you get this error message. When you are
using **Web API** as authentication Power Query will try to authenticate by
sending the authentication key in the **query string**, **not** the
**HTTP-header**. In the case above, it will try to get data from this URL:

    https://rsptournament/api/players?[ApiKeyName]=abc123

The UI is telling you that you need to provide the name that should be used in
the query string. The funny thing is that you cannot enter this in any UI. To do
this, you need to create the query from scratch in the advanced editor. It could
for instance look like this:

{% include codeheader.html lang="Advanced editor" %}
{% highlight text %}
let
    Source = Json.Document(Web.Contents("https://rsptournament/api/players", [ApiKeyName="access_token"]))
in
    Source
{% endhighlight %}

After you have entered the Web API key in the UI, this URL will be used for
fetching the data:

    https://rsptournament/api/players?Token=abc123

Note that **Token** is now used as the name for the key. This is described in
the [documentation](https://docs.microsoft.com/en-us/powerquery-m/web-contents).

This was the explanation what the Web API setting is doing. But this does not
help us, we want to send the authorization in the HTTP header, not the query
string. How do we do that?

## The solution

After you have selected **Data** > **From web** you should now select the
**Advanced mode**. You enter the URL and then in the bottom of the window you
enter the HTTP header manually. In the sample below I have selected that the
HTTP header **Authorization** should be used with the value **Bearer abc123**.

![Enter URL and HTTP header authorization]({{site.baseurl}}/assets/images/0035/solution-2.png "Enter URL and HTTP header authorization")

Next, when you are being asked for authentication you should select
**Anonymous**:

![Select anonymous]({{site.baseurl}}/assets/images/0035/solution-3.png "Select anonymous")

Since you already manually have provided the authentication this is the option
you should use. Select **Connect** and then you will see the data in the Power
Query editor as expected.

## Summary

There is a huge downside with this solution, the credentials will be stored
inside your Excel file. This is bad when it comes to security, I think. If you
instead should have used the built-in "real" Web API solution, every user that
wanted to access the API would be forced to enter the key. Then these
credentials are stored on the device, not in the individual files. If you
accidently enter some credentials that you no longer want, you could edit this
in **Data** > **Get Data** > **Data source settings**.

![Data source settings]({{site.baseurl}}/assets/images/0035/summary-data-source-settings.png "Data source settings")

Is fair as I know this is unfortunately not possible when doing authentication
via the HTTP header. And I have spent way much more time researching this than I
wanted.
