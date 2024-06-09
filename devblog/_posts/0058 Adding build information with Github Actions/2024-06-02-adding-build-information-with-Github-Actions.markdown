---
layout: post
title:  "Adding build information with GitHub Actions"
date:   2024-06-09 01:00:00 +0200
categories: [.NET, GitHub]
---

How can you add build information, such as build time, branch, commit ID, etc.,
into your application?

## The problem

When you publish an application, it is beneficial to show exactly which source
code was used for that build and when it was compiled.

## The solution

There are various ways to solve this. Since I make my release build my
applications in a CI/CD pipeline, I use this method. Although this solution is
for GitHub Actions, it should be easy to port to other pipelines.

First, I have this class (a bit simplified):

```csharp
public static partial class BuildInformation
{
    static BuildInformation()
    {
        Initialize();
    }

    static partial void Initialize();

    public static string? Branch { get; private set; }

    public static string? BuildTimeString { get; private set; }

    public static string? CommitId { get; private set; }

    public static string? DotNetVersionString { get; private set; }
```

This is a static class you can use to get your build information. This is a
partial class. The other part of the class is in a separate file that will have
the actual values:

```csharp
public static partial class BuildInformation
{
    static partial void Initialize()
    {
        Branch = "mybranch";
        BuildTimeString = "2038-01-18T03:14:40Z";
        CommitId = "0123456789abcdef01234567890abcdef0123456";
        DotNetVersionString = "Fake 8.0.205";
    }
}
```

The above is used in debug mode. The trick is to replace this file in your CI/CD
pipeline. Here is how it's done in GitHub Actions:

```yaml
env:
  BUILD_INFO_FILE: ./Source/BuildInfoSample/BuildInformation-Build.cs

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Get build information
      shell: pwsh
      run: |
        echo "CURRENT_TIME_UTC_STRING=$((Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"))" >> $env:GITHUB_ENV
        echo "NET_VERSION_STRING=$(dotnet --version)" >> $env:GITHUB_ENV

    - name: Create build time file
      shell: pwsh
      run: |
        echo "namespace BuildInfoSample;" > $env:BUILD_INFO_FILE
        echo "public static partial class BuildInformation" >> $env:BUILD_INFO_FILE
        echo "{" >> $env:BUILD_INFO_FILE
        echo "    static partial void Initialize()" >> $env:BUILD_INFO_FILE
        echo "    {" >> $env:BUILD_INFO_FILE
        echo "        Branch = ""${{ github.ref_name }}"";" >> $env:BUILD_INFO_FILE
        echo "        BuildTimeString = ""${{ env.CURRENT_TIME_UTC_STRING }}"";" >> $env:BUILD_INFO_FILE
        echo "        CommitId = ""${{ github.sha }}"";" >> $env:BUILD_INFO_FILE
        echo "        DotNetVersionString = ""${{ env.NET_VERSION_STRING }}"";" >> $env:BUILD_INFO_FILE
        echo "    }" >> $env:BUILD_INFO_FILE
        echo "}" >> $env:BUILD_INFO_FILE
```

Again, this is a bit simplified. In my full sample, that you find
[here](https://github.com/pekspro/Build-Information-Sample), also has
information about MAUI workloads.

## Summary

I have used this method for several years. It is a simple solution that
accomplishes its purpose.
