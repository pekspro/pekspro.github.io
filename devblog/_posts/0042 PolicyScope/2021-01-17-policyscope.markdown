---
layout: post
title:  "PolicyScope"
date:   2021-01-17 01:00:00 +0200
categories: [.NET] 
---

I recently decided to use [Polly](https://github.com/App-vNext/Polly) in a
project. Polly is a solution to make it ease to implement retry logic in an
application. It is a really nice framework. But when using in with dependency
injection I thought that something was missing. This ended up me creating my
first public NuGet packet.

## The problem

When you are using Polly you often should make sure that the services you are
using are recreated for each attempt. If not, you are reusing your objects for
each time your logic is executed. This could make your logic behave differently
the second time it is executed. For instance, if you have a `DbContext` it is
not good if you have things in the `ChangeTracker`.

You could solve this by creating objects with an `IServiceScopeFactory`
instance. It is not that hard to too. The problem comes when you want to create
a unit test for this logic. There is a lot of things you may need to mock.

## The solution

My solution was to create PolicyScope. With PolicyScope you will define which
policy and which services you want to use in a fluent framework. It makes the
code compact and easy to read. There is also a NuGet packet designed for mocking
this service. This makes it easy to create unit tests.

If you want to try it, have a look on the [GitHub
repository](https://github.com/pekspro/PolicyScope).

## Summary

I learned a lot of doing this. Since I decided to have this on GitHub, just like
most other projects like this, I dig into GitHub actions to make it compile,
test and even publish to NuGet when wanted. I also learned some about NuGet,
since this is my [first public NuGet
package](https://www.nuget.org/packages/Pekspro.PolicyScope/). Maybe I create
some more someday :-)
