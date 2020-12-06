---
layout: post
title:  "How to use JWT token from query string"
date:   2020-12-06 01:00:00 +0200
categories: [.NET, Excel]
---

Normally you authenticate via a HTTP header when you are accessing an API. But
how do you configure your server to allow authenticating via the query string
too?

## The problem

Authenticating via a HTTP header is in many cases a better option. But in some
scenarios, authentication via the query string, is preferable. For instance,
if you are creating an API that should be used via Excel and you do not want to
store the credentials in the file.

If you are having a ASP.NET Core service that supports JWT you probably have
this configured something like this:

{% include codeheader.html lang="C#" %}
{% highlight CSharp %}
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                // Configuration code
            };
        });
{% endhighlight %}

This enables JWT authentication via HTTP. But there is no built-in support for
authentication via query string.

## The solution

Luckily, it is not too hard to manually enable query string authentication.
You could use the `Events` property to hook up some code you want to execute
when request is processed. It should look something like this:

{% include codeheader.html lang="C#" %}
{% highlight CSharp %}
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                // Configuration code
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = (context) => {
                    if (!context.Request.Query.TryGetValue("access_token", out StringValues values))
                    {
                        return Task.CompletedTask;
                    }

                    if (values.Count > 1)
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                        context.Fail(
                            "Only one 'access_token' query string parameter can be defined. " +
                            $"However, {values.Count} were included in the request."
                        );

                        return Task.CompletedTask;
                    }

                    var token = values.Single();

                    if (string.IsNullOrWhiteSpace(token))
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                        context.Fail(
                            "The 'access_token' query string parameter was defined, " +
                            "but a value to represent the token was not included."
                        );

                        return Task.CompletedTask;
                    }

                    context.Token = token;

                    return Task.CompletedTask;
                }
            };
        });
{% endhighlight %}

With this you could then the authentication string in the query string with the parameter
name `access_token`. So, if you previously authenticated this URL:

    https://rsptournament/api/players

With this in the HTTP header:

    Authorization: Bearer abc123

You now could use this this URL:

    https://rsptournament/api/players?access_token=abc123

Note that `Bearer` should **not** be in the query string. I admit that I did not
figured out this myself but found the solution in this
[Stack Overflow thread](https://stackoverflow.com/questions/45763149/asp-net-core-jwt-in-uri-query-parameter).

## How to use this with Power Query

If the API service is supporting authentication via query string you could use this
in Power Query. It is a bit tricky to setup so here is a short tutorial:

In Excel, select **Data** > **Get Data** > **From Other Sources** > **Blank query**:

![Create blank query]({{site.baseurl}}/assets/images/0036/get_data_blank_query.png "Create blank query")

Next in the Power Query editor, select **Home** > **Advanced editor**:

![Select Advanced Editor]({{site.baseurl}}/assets/images/0036/home_advanced_editor.png "Select Advanced Editor")

Next, you replaced the query with this:

{% include codeheader.html lang="Advanced editor" %}
{% highlight text %}
let
    Source = Json.Document(Web.Contents("https://rsptournament/api/players", [ApiKeyName="access_token"]))
in
    Source
{% endhighlight %}

Note that the `ApiKeyName` is set to `access_token` in the query. This specifies
the name used in the query string.  Close the editor and now you will be asked
for credentials.

Select **Web API** and enter the key (without "Bearer") like this:

![Enter API Key]({{site.baseurl}}/assets/images/0036/enter_api_key.png "Enter API key")

That should be it. After this you should see the data in the Power Query editor.

Now then Power Query is accessing the API the API key will be read from a local
storage, not the Excel file, and be added automatically to the query string.

## Summary

As I explained in the previous post, it is possible to
[Using Power Query and web API with HTTP authentication]({% post_url /0035 Using Power Query and web API with HTTP authentication/2020-11-29-using-power-query-and-web-api-with-http-authentication %}). But this
requires that the authentication string is stored in the Excel file. The method
explained above let you avoid that but will make the authentication string to be
send in the query string instead.
