---
layout: post
title:  "Compiling with a RAM-drive"
date:   2020-05-24 01:00:00 +0200
categories: [Visual Studio]
---

When you are compiling your latest application that will take over the world, it
will make a lot a reading and writing against your hard drive. Wouldn't it be a
lot faster if you instead compile against a RAM-drive, and just having your
source code on your physical storage devices? To be honest, not much. Despite
this disappointment, let us geek out and try it.


## Overview
When I am writing this, I assumes that you are using Windows and compiling a
.NET or C++ applications. But this solution is very general and should be easy
to modify for other conditions.

## Symbolic linking 
Before we do anything else, it is worth mention *symbol linking* that has been
around in Windows for a long time but is in rarely used. You could use *symbolic
linking* if you want to map a folder into another folder without moving it. 

For instance, I have all my repositories in C:\Source\Repos. Recently, when I
was working on a large open source project, I run out of disk space. Luckily, I
had another hard drive where I could move this project. But I still wanted to
navigate to my original path. To solve this, I bring up a command prompt (*not*
PowerShell) and executed:

{% include codeheader.html lang="Command prompt" %}
{% highlight text %}
C:\Source\Repos>mklink /d TheProject E:\Source\Repos\TheProject
symbolic link created for TheProject <<===>> E:\Source\Repos\TheProject
{% endhighlight  %}

Now I could find all files in `C:\Source\Repos\TheProject` even if they
were stored on a different drive.

## The strategy
When you are working with .NET or C++ applications you could change the
directory to be used as output for your compilation. Normally this is `bin` and
`obj` for .NET, and `Debug`, `Release` and `x64` for C++. And nothing is
stopping you to change these directories in you project file to a RAM-drive. The
only problem with this is when you have checked in these changes all your team
members will be mad at you because they will get problems with these paths.

So, we will not do this. Instead we will replace all these folders with symbolic
links to folders on a RAM drive. This way, no changes are needed to your project
and no application will notice any difference. The only exception I have found
to this is git that might want to add these new files to the repository. But you
could easily avoid this by adding these lines into `.gitignore`.

{% include codeheader.html lang="Add to .gitignore" %}
{% highlight text %}
# Symbolic links for .NET applications
[Bb]in
[Oo]bj

# Symbolic links for C++ applications
[Dd]ebug
[Rr]elease
x64
{% endhighlight  %}

## The solution
So, now we just need to find all relevant folders and replace them with symbolic
links. Not to fun to manually, so we use PowerShell to solve it. Put this script
into a PowerShell file named `link-ramdrive.ps1`.

{% include codeheader.html lang="PowerShell - link-ramdrive.ps1" %}
{% highlight PowerShell %}
$ramDiskDrive = "R:"

# Find all project files for CSharp, FSharp and Basic
$projectFiles = Get-ChildItem -Include ("*.csproj", "*.fsproj", "*.vbproj") -Recurse 

# Setup directories if any projects found.
if($projectFiles.Length -gt 0)
{
    # Get project directories
    $projectDirectories = $projectFiles | ForEach-Object { $_.DirectoryName } | Get-Unique


    # Create a bin-directory on the RAM-drive
    $projectDirectories | ForEach-Object { New-Item -ItemType Directory -Force -Path "$ramDiskDrive$($_.Substring(2))\bin" } 

    # Remove existing bin-directories
    $projectDirectories | ForEach-Object { Remove-Item "$($_)\bin" -Force -Recurse }

    # Link bin-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c mklink /D "$($_)\bin" "$ramDiskDrive$($_.Substring(2))\bin" }


    # Create a obj-directory on the RAM-drive
    $projectDirectories | ForEach-Object { New-Item -ItemType Directory -Force -Path "$ramDiskDrive$($_.Substring(2))\obj" } 

    # Remove existing obj-directories
    $projectDirectories | ForEach-Object { Remove-Item "$($_)\obj" -Force -Recurse }

    # Link obj-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c mklink /D "$($_)\obj" "$ramDiskDrive$($_.Substring(2))\obj" }
}


# Find all projects files for C++.
$projectFiles = Get-ChildItem -Include ("*.vcxproj") -Recurse 

# Setup C++-directories is any found.
if($projectFiles.Length -gt 0)
{
    # Get project directories
    $projectDirectories = $projectFiles | ForEach-Object { $_.DirectoryName } | Get-Unique


    $projectDirectories | ForEach-Object { New-Item -ItemType Directory -Force -Path "$ramDiskDrive$($_.Substring(2))\x64" } 

    # Remove existing x64-directories
    $projectDirectories | ForEach-Object { Remove-Item "$($_)\x64" -Force -Recurse }

    # Link x64-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c mklink /D "$($_)\x64" "$ramDiskDrive$($_.Substring(2))\x64" }


    $projectDirectories | ForEach-Object { New-Item -ItemType Directory -Force -Path "$ramDiskDrive$($_.Substring(2))\Debug" } 

    # Remove existing Debug-directories
    $projectDirectories | ForEach-Object { Remove-Item "$($_)\Debug" -Force -Recurse }

    # Link Debug-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c mklink /D "$($_)\Debug" "$ramDiskDrive$($_.Substring(2))\Debug" }


    $projectDirectories | ForEach-Object { New-Item -ItemType Directory -Force -Path "$ramDiskDrive$($_.Substring(2))\Release" } 

    # Remove existing Release-directories
    $projectDirectories | ForEach-Object { Remove-Item "$($_)\Release" -Force -Recurse }

    # Link Release-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c mklink /D "$($_)\Release" "$ramDiskDrive$($_.Substring(2))\Release" }



    # For C++-project, directories in the same folder as the solution file are used for outputs.
    # Find all solution files.
    $projectFiles = Get-ChildItem -Include ("*.sln") -Recurse 

    # Setup C++-directories is any solution file found.
    if($projectFiles.Length -gt 0)
    {
        # Get project directories
        $projectDirectories = $projectFiles | ForEach-Object { $_.DirectoryName } | Get-Unique


        $projectDirectories | ForEach-Object { New-Item -ItemType Directory -Force -Path "$ramDiskDrive$($_.Substring(2))\x64" } 

        # Remove existing x64-directories
        $projectDirectories | ForEach-Object { Remove-Item "$($_)\x64" -Force -Recurse }

        # Link x64-directories to ramdisk
        $projectDirectories | ForEach-Object { cmd /c mklink /D "$($_)\x64" "$ramDiskDrive$($_.Substring(2))\x64" }


        $projectDirectories | ForEach-Object { New-Item -ItemType Directory -Force -Path "$ramDiskDrive$($_.Substring(2))\Debug" }

        # Remove existing Debug-directories
        $projectDirectories | ForEach-Object { Remove-Item "$($_)\Debug" -Force -Recurse }

        # Link Debug-directories to ramdisk
        $projectDirectories | ForEach-Object { cmd /c mklink /D "$($_)\Debug" "$ramDiskDrive$($_.Substring(2))\Debug" }


        $projectDirectories | ForEach-Object { New-Item -ItemType Directory -Force -Path "$ramDiskDrive$($_.Substring(2))\Release" } 

        # Remove existing Release-directories
        $projectDirectories | ForEach-Object { Remove-Item "$($_)\Release" -Force -Recurse }

        # Link Release-directories to ramdisk
        $projectDirectories | ForEach-Object { cmd /c mklink /D "$($_)\Release" "$ramDiskDrive$($_.Substring(2))\Release" }
    }
}
{% endhighlight  %}

Note that this script assumes you have your RAM-drive named `R:`.

Also note that this script will *remove everything* in the folders that will be
linked. If that will make you lose something important, you probably are doing
something wrong ;-)

We also want to easily undo this. The following script will do that, named that
`unlink-ramdrive.ps1`:

{% include codeheader.html lang="PowerShell - unlink-ramdrive.ps1" %}
{% highlight PowerShell %}
# Find all project files
$projectFiles = Get-ChildItem -Include ("*.csproj", "*.fsproj", "*.vbproj") -Recurse 

# Get project directories
$projectDirectories = $projectFiles | ForEach-Object { $_.DirectoryName } | Get-Unique

# Clear directories if any projects found.
if($projectFiles.Length -gt 0)
{
    # Unlink bin-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c rmdir "$($_)\bin"   }

    # Unlink obj-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c rmdir "$($_)\obj"   }
}

# Find all projects files for C++.
$projectFiles = Get-ChildItem -Include ("*.vcxproj") -Recurse 

# Setup C++-directories is any found.
if($projectFiles.Length -gt 0)
{
    # Get project directories
    $projectDirectories = $projectFiles | ForEach-Object { $_.DirectoryName } | Get-Unique


    # Unlink x64-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c rmdir "$($_)\x64"   }

    # Unlink Debug-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c rmdir "$($_)\Debug"   }

    # Unlink Release-directories to ramdisk
    $projectDirectories | ForEach-Object { cmd /c rmdir "$($_)\Release"   }


    # For C++-project, directories in the same folder as the solution file are used for outputs.
    # Find all solution files.
    $projectFiles = Get-ChildItem -Include ("*.sln") -Recurse 

    # Setup C++-directories is any solution file found.
    if($projectFiles.Length -gt 0)
    {
        # Get project directories
        $projectDirectories = $projectFiles | ForEach-Object { $_.DirectoryName } | Get-Unique


        # Unlink x64-directories to ramdisk
        $projectDirectories | ForEach-Object { cmd /c rmdir "$($_)\x64"   }

        # Unlink Debug-directories to ramdisk
        $projectDirectories | ForEach-Object { cmd /c rmdir "$($_)\Debug"   }

        # Unlink Release-directories to ramdisk
        $projectDirectories | ForEach-Object { cmd /c rmdir "$($_)\Release"   }
    }
}
{% endhighlight  %}

Then all you need to do is to run these scripts to setup your solution in the
way you want. Also be aware that when you are restarting your computer, all the
symbolic links will be broken because you RAM-drive is empty. To solve this,
just run `link-ramdrive.ps1` again.

When you are running the scripts you will likely get some warning or errors, but
these could safely be ignored.

## Performance
So how much time will you save on this? I have been working on a solution where
a complete rebuild took 198 seconds with an SSD-drive. When a RAM-drive it went
down to 167 seconds. So about 15 % faster if you are lucky. On smaller builds
the difference will be less.


## Summary
I cannot say that using a RAM-drive will make you save a lot of time. But if you
have a lot of RAM it might be worth to try. This solution is easy to both setup
and to remove. You will also put a lot less stress on your physical drive.

