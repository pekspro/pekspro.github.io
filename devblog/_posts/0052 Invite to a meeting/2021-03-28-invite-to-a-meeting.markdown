---
layout: post
title:  "Invite to a meeting"
date:   2021-03-28 01:00:00 +0200
categories: [.NET] 
---

How to invite someone to a Teams meeting with the Microsoft Graph in .NET.

## The problem

There are some good samples out there that lets you get started with Microsoft
Graph. This is the one I have used:
[WebApp-OpenIDConnect-DotNet](https://github.com/Azure-Samples/active-directory-aspnetcore-webapp-openidconnect-v2/tree/master/1-WebApp-OIDC/1-1-MyOrg).

Once you got this running (there is some stuff to configure), how do you invite
someone to a Teams meeting with the SDK?

## The solution

It took a while for me to get this right. First you need to add the permission
`Calendars.ReadWrite OnlineMeetings.ReadWrite` both appsettings.json and the API
permission in your application settings in [Azure App
Registrations](https://aka.ms/appregistrations). And then you could use this
code:

{% include codeheader.html lang="Code" %}
{% highlight csharp %}
var myevent = new Event
{
    Subject = "Let us celebrate!",
    Start = new DateTimeTimeZone
    {
        DateTime = "2021-03-28T02:00:00",
        TimeZone = "W. Europe Standard Time"
    },
    End = new DateTimeTimeZone
    {
        DateTime = "2021-03-28T03:00:00",
        TimeZone = "W. Europe Standard Time"
    },
    IsOnlineMeeting = true,
    OnlineMeetingProvider = OnlineMeetingProviderType.TeamsForBusiness,
    Attendees = new List<Attendee>()
    {
        new Attendee()
        {
            EmailAddress = new EmailAddress()
            {
                Address = "my.friend@example.com"
            }
        }
    },
    Body = new ItemBody
    {
        ContentType = BodyType.Html,
        Content = "We have <b>created a meeting</b>!"
    },
};

await _graphServiceClient.Me.Events
    .Request()
    .AddAsync(myevent);
{% endhighlight %}

Check out [this page for which time
zones](https://docs.microsoft.com/en-us/graph/api/resources/datetimetimezone?view=graph-rest-1.0)
you could use. In my
[next post]({% post_url /0053 Get time zone for a user in
Graph/2021-04-04-get-time-zone-for-a-user-in-graph %}) I show how you could get
the timezone  from the user's settings instead.

## Summary

I have played Microsoft Graph a couple of times but always find it a bit
complicated to work with. But with the new [Microsoft Identity
Web](https://github.com/AzureAD/microsoft-identity-web) and the Microsoft
Identity Platform it has become quite easy.

The [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
is a great place to use if you want to play with the API.
