---
layout: post
title:  "Manually creating a DbContext and enable logging"
date:   2021-01-10 01:00:00 +0200
categories: [.NET] 
---

In an application I have working with a needed to manually create a `DbContext`.
But doing so, disabled all logging from the `DbContext`.

## The problem

In most cases a `DbContext` is initialized via dependency injection. But I
needed to customize which connection string to use. I did it like this:

{% include codeheader.html lang="CSharp" %}
{% highlight C# %}
string connectionString = ... ;

var dbContextOptionsBuilder =
    new DbContextOptionsBuilder<MyDatabaseContext>();

dbContextOptionsBuilder
    .UseSqlServer(connectionString);

var options = dbContextOptionsBuilder.Options;

return new MyDatabaseContext(options);
{% endhighlight %}

This works just fine. But a subtle change is that the `DbContext` will not be
able to log anything.

## The solution

It is not hard to fix just. Just make sure that the logging factory is setup via
`DbContextOptionsBuilder` by calling `UseLoggerFactory`:

{% include codeheader.html lang="CSharp" %}
{% highlight C# %}
string connectionString = ... ;
ILoggerFactory loggerFactory = ... ;

var dbContextOptionsBuilder =
    new DbContextOptionsBuilder<MyDatabaseContext>();

dbContextOptionsBuilder
    .UseSqlServer(connectionString)
    .UseLoggerFactory(loggerFactory);

var options = dbContextOptionsBuilder.Options;

return new MyDatabaseContext(options);
{% endhighlight %}

## Summary

I found this the hard way when I wanted to see exact which SQL statements were
executed. I had enabled logging in my configuration file:

{% include codeheader.html lang="appsettings.json" %}
{% highlight json %}
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
{% endhighlight %}

But still nothing was output. It worked for other `DbContext` which made me
confused. Looking back, it was quite obvious. But it took a while for me for
figure this out.
