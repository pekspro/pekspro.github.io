---
layout: post
title:  "Cache NuGet packages for .NET Core builds"
date:   2020-05-03 01:00:00 +0200
categories: [Azure DevOps]
---

Restoring NuGet packages often takes significant amount of time if build large
.NET application. To solve this you could use a [cache in your
build](https://docs.microsoft.com/en-us/azure/devops/pipelines/release/caching?view=azure-devops).
But if you follow the documentation you should create an `packages.lock.json`
file for every project.  I do not want to that, so I created a slightly
different solution.

This solution is designed for .NET Core applications. But it is easy to change
this to work with .NET Framework instead.

## Configuration of the cache task
The cache task has two important inputs:

First, we have the `path` input. This is simply the path to the directory that
will be cached.

The second important input is called `key`. It is a mix of strings and file
paths. The task will take all strings, and the content in all files it finds in
the paths, to create a checksum. Personally, I think it would be less confusing
if this were separated into two different inputs. Either way, it will use this
checksum as a fingerprint for the cache.

There is also have the `cacheHitVar` input. This is the name of the variable
that will have the value `true` if the cache was restored. This variable is then
used in a condition in following step to control if NuGet packages should be
restored or not.


## A naive solution
A simple solution is to add all project files to the `key` input, like this:

{% include codeheader.html lang="YML" %}
{% highlight yml %}

variables:
  NUGET_PACKAGES: $(Pipeline.Workspace)/.nuget/packages

# Try restore NuGet cache
- task: Cache@2
  inputs:
    key: 'nuget | $(Agent.OS) | **/*.csproj'
    path: '$(NUGET_PACKAGES)'
    cacheHitVar: 'NUGET_CACHE_RESTORED'

# Restore NuGet packages, unless found in cache.
- task: DotNetCoreCLI@2
  displayName: Restore
  inputs:
    command: restore
    projects: '**/*.csproj'
  condition: and(succeeded(), ne(variables['NUGET_CACHE_RESTORED'], 'true'))

{% endhighlight %}

This works, but every time you change a project file a new fingerprint will be
calculated, and a new cache needs to be created.


## A good solution
With PowerShell you can run a command like this in a folder:

{% include codeheader.html lang="PowerShell" %}
{% highlight powershell %}

Get-ChildItem -Include ("*.csproj", "*.fsproj", "*.vbproj") -Recurse `
    | Select-Xml -XPath "//PackageReference" `
    | foreach {$_.node.Include + $_.node.Update + ":" + $_.node.Version} `
    | Sort-Object `
    | Get-Unique

{% endhighlight %}

This will: 
* Find all C#, F# and VB project files.
* Parse content in all files as XML.
* Find all `PackageReference` node (this is where each NuGet package is
  specified).
* Put the name (via the `Include` or the `Update` attribute) and version of each
  package in a list.
* Sort the list.
* Print every unique line in the list.

In my modified pipeline I run this PowerShell script (that work both in Windows
and Linux) and outputs the result into a file. Then I am using this file as
input to the key parameter:

{% include codeheader.html lang="YML" %}
{% highlight yml %}
# Setup NUGET_PACKAGES variable
variables:
  NUGET_PACKAGES: $(Pipeline.Workspace)/.nuget/packages

# Create a file with all NuGet packages
- task: PowerShell@2
  displayName: 'Create NuGet Packages summary file'
  inputs:
    targetType: 'inline'
    script: |
        Get-ChildItem -Path $(Agent.BuildDirectory) -Include ("*.csproj", "*.fsproj", "*.vbproj") -Recurse `
            | Select-Xml -XPath "//PackageReference" `
            | foreach {$_.node.Include + $_.node.Update + ":" + $_.node.Version} `
            | Sort-Object `
            | Get-Unique > $(Agent.BuildDirectory)/nugetpackages.txt

# Try restore NuGet cache
- task: Cache@2
  displayName: 'Restore NuGet Packages from cache'
  inputs:
    key: 'nuget | $(Agent.OS) | $(Agent.BuildDirectory)/nugetpackages.txt'
    path: '$(NUGET_PACKAGES)'
    cacheHitVar: 'NUGET_CACHE_RESTORED'

# Restore NuGet packages, unless found in cache.
- task: DotNetCoreCLI@2
  displayName: 'Restore NuGet Packages'
  inputs:
    command: restore
    projects: '**/*.csproj'
  condition: and(succeeded(), ne(variables['NUGET_CACHE_RESTORED'], 'true'))
{% endhighlight %}


## Summary
I have used this solution for a long time, and I am happy with it. I have not
had any problems with it. A nice bonus of this is that the cache will be reused
even if you add a NuGet package to a project as long as it already exists in
another project.
