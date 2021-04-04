---
layout: post
title:  "Get time zone for a user in Graph"
date:   2021-04-04 01:00:00 +0200
categories: [.NET] 
---

With the current SDK for .NET you cannot directly get the time zone for a user.
But you could work around this.

## The problem

[Last week]({% post_url /0052-Invite to a meeting/2021-03-28-invite-to-a-meeting
%}) I showed how to create an event in Microsoft Graph. That example used a hard
coded time zone. Of course, it would be better if we could get this directly
from Graph.

## The solution

To my understanding, there is no time zone setting in the user's profile.
Instead, the time zone for the mailbox settings are used to solve this. The URL
for this setting is
`https://graph.microsoft.com/v1.0/me/mailboxsettings/timeZone`. Try this
yourself in the [Graph
Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer). I get
this response:

{% include codeheader.html lang="Response" %}
{% highlight json %}
{
    "@odata.context":"https://graph.microsoft.com/v1.0/....",
    "value":"W. Europe Standard Time"
}
{% endhighlight %}

Read more about this in the
[documentation](https://docs.microsoft.com/en-us/graph/api/user-get-mailboxsettings?view=graph-rest-1.0&tabs=http).

Unfortunately, this value cannot be directly downloaded from the current SDK.
But it is not that hard to work around this. In the [SDK
documentation](https://github.com/microsoftgraph/msgraph-sdk-dotnet/blob/dev/docs/overview.md)
there is some information how to create custom request. I am using this in the
code below.

Note that the permission `MailboxSettings.Read` needs to be set both
appsettings.json and the API permission in your application settings in [Azure
App Registrations](https://aka.ms/appregistrations).

{% include codeheader.html lang="Code" %}
{% highlight csharp %}
// Create the request message and add the content.
HttpRequestMessage hrm =
    new HttpRequestMessage(HttpMethod.Get, "https://graph.microsoft.com/v1.0/me/mailboxsettings/timeZone");

// Authenticate (add access token) our HttpRequestMessage
await _graphServiceClient.AuthenticationProvider.AuthenticateRequestAsync(hrm);

// Send the request and get the response.
HttpResponseMessage response = await _graphServiceClient.HttpProvider.SendAsync(hrm);

// Verify that the status code us OK.
if (!response.IsSuccessStatusCode)
{
    throw new ServiceException(
        new Error
        {
            Code = response.StatusCode.ToString(),
            Message = await response.Content.ReadAsStringAsync()
        });
}

// Read the response content.
var content = await response.Content.ReadAsStringAsync();

// Create a JsonDocument and get the value.
JsonDocument jsonDocument = JsonDocument.Parse(content);
string timezone = jsonDocument.RootElement.GetProperty("value").GetString();
{% endhighlight %}

## Summary

This was a bit more complicated than I was hope for. But being able to work
around limitations in the SDK, with a relatively small amounts of code, is a
useful skill.
