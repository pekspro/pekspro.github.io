---
layout: post
title:  "Detect and warn multiple editors"
date:   2020-10-04 01:00:00 +0200
categories: [Blazor]
---

How to show a warning when two, or more, users are editing the same object at
the same time.

## The problem

I work often with line of business applications. In these applications it is
often the case the several users could edit the same data at the same time. In
those scenarios, it is often the latest change that will be in the database. This
could lead to users overwriting each other changes unintendedly.

## The solution

One strategy to minimize this is warn the users if some other is editing the
same object. With Blazor and SignalR this is quite easy to do. I have published
a sample application on
[GitHub](https://github.com/pekspro/MultipleEditorsWarnerSample).

With this the users get a warning and can chat with each other:

![Warning sample]({{site.baseurl}}/assets/images/0027/multiple_editors_warning_sample.png "Warning sample")

### How to use it

When then core part of the code is added to your application, you only need to
add one Blazor component on the pages. On a Razor page it could look like this:

{% include codeheader.html lang="Edit code" %}
{% highlight html %}
<component type="typeof(Components.MultipleEditorsWarnerComponent)"
           render-mode="Server"
           param-GroupName='@("Color_" + Model.Color.ColorID)'
           />
{% endhighlight %}

Or, if you are using Blazor:

{% include codeheader.html lang="Edit code" %}
{% highlight html %}
<MultipleEditorsWarnerComponent GroupName='@("Color_" + Model.Color.ColorID)' />
{% endhighlight %}

`GroupName` is just a string that uniquely defines the object they are using
edited.

### About the code

The essential part of this code is found in the **Hubs** folder. First, there is
`MultipleEditorsWarnerHub` that is the SignalR hub for this component. This is
taking care of all messages that are sent. This object is also using a
`UserGroupManager`. That object known which users that are working with which
object. It also keeps track of all chat messages that has been sent.

Note that `UserGroupManager` is just a static object so all data is stored in
memory. This is fine if only one server is used. If the service needs to run on
multiple servers a shared storage, like a database, needs to be used.

Lastly, in the **Components** folder there is the Blazor component
`MultipleEditorsWarnerComponent`. This component is responsible for the UI and
is connecting to the `MultipleEditorsWarnerHub`.

You will notice that the application will warn if the same user is editing the
same object with a delay. The reason for this is that when a user is navigating
from an edit page, it could take a while before all the connections have been
closed. At least in production environment. When debugging it seems to be a
slightly different behavior. If there was no delay, and the user navigated back
to the edit page it will get a confusing warning. If this is the right approach
is discussable. Note that there is no delay for other users.

## Summary

This works amazingly well. It is easy to add this to the edit pages, and there is
just about 300 lines of code necessary to get this running.

You find more information about SignalR in the [official
documentation](https://docs.microsoft.com/en-us/aspnet/core/tutorials/signalr-blazor-webassembly).
