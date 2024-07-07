---
layout: post
title:  "Testing Blazor with Playwright"
date:   2024-07-07 01:00:00 +0200
categories: [.NET, GitHub, Blazor, Playwright]
---

How do you test Blazor applications with Playwright, both locally and in GitHub
actions?

## The problem

There is a lot of minor problems you might run into if you want to test Blazor
applications with Playwright:

* How do you public and then run your Blazor WebAssembly application and in the
  background with GitHub Actions?
* How do you emulate mobile devices?
* How do you get a trace if a test fails?
* How do you debug a test?
* How do you test with different browser?

## The solution

None of the mentioned problems might not be practically hard, but it takes time
to get every detail right. So, I created this demo project:
[BlazorPlaywright](https://github.com/pekspro/BlazorPlaywright).


## Summary

I’m using this approach to run some test on a game that I created last year. It
is running in Blazor Webassembly, and it took some time for me to get everything
setup correctly. I hope someone finds this useful.
