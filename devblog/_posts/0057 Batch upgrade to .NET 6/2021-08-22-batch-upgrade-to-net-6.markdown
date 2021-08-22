---
layout: post
title:  "Batch upgrade to .NET 6"
date:   2021-08-22 01:00:00 +0200
categories: [.NET. PowerShell]
---

.NET 6 preview has been out for a while, and I decided to give it a go. New
compiler warnings have been introduced and I wanted to find and fix this early.
But I also wanted to easily go back to .NET 5.

## The problem

There is [good
documentation](https://docs.microsoft.com/en-us/aspnet/core/migration/50-to-60)
how to update to .NET 6. Most of the work is in the project files. Changing
`TargetFramework` is easy. But finding and upgrading all nuget packages
references is a lot harder. And if you have a large solution with multiple
projects, you could quite some time just on this step. Visual Studio could help
you update all NuGet packages in a solution. But it is a bit slow. Also, there
is no easy way to roll back.

## The solution

My solution was to create a PowerShell script to that finds all project files
and then makes all necessary changes. And them make another script that does
this in reverse. They are available here:

[https://gist.github.com/pekspro/24fca2eb1cad8c30333a910b163a3f6a](https://gist.github.com/pekspro/24fca2eb1cad8c30333a910b163a3f6a)

## Summary

Creating scripts like this is always fun. I think it covers most scenarios, but
you might need to tweak it a bit to fit your solution.

The scripts mostly contain of find-and-replace code. Creating this code was a
bit tricky. How it was done in detail you find in the comments of the scripts.
Basically I look up all `Microsoft.*` and `System.*` packages on NuGet.org and
then filter out which are relevant.
