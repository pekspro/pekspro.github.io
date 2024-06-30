---
layout: post
title:  "Adding build information with a source generator"
date:   2024-06-30 01:00:00 +0200
categories: [.NET, GitHub, Source generator]
---

This is the easy way to add build information, such as build time, branch,
commit ID, etc., into your application!

## The problem

In my 
[previous post]({% post_url /0058 Adding build information with Github Actions/2024-06-02-adding-build-information-with-Github-Actions %})
I showed how you can add build information to your application with Github
actions. This works just fine, but there is some work to do to get this working.

## The solution

My new solution is the source generator
[BuildInformationGenerator](https://github.com/pekspro/BuildInformationGenerator).
It is so much easier to setup! You just create a class with the
`BuildInformation` attribute, and defines which information you want.

```csharp
[BuildInformation(AddBuildTime = true, AddGitCommit = true)]
partial class MyBuildInformation
{

}
```
And then you can use it:

```csharp
Console.WriteLine($"Build time: {MyBuildInformation.BuildTime}");
Console.WriteLine($"Commit id: {MyBuildInformation.Git.CommitId}");
```

You can add more properties, like git branch, .NET SDK version and more. This
works on your local machine, Github Action, Azure DevOps and a lot more I
assume.

## Summary

Creating this was both fun and challenging. I have not created source generators
before, so I learned a lot. Generating the code is quite straightforward, but
the infrastructure is not.

I spent time optimizing performance because a source generator can be executed
on every keystroke in Visual Studio, so it needs to be fast. Depending on the
information required, my source generator might start processes to gather data.
In my testing this does not seem to big performance issue, but to be sure I fake
values by default in debug mode.
