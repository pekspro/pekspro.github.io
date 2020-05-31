---
layout: post
title:  "Build time"
date:   2020-05-31 01:00:00 +0200
categories: [.NET]
---

Waiting on the compiler could be a large part of the developer's life. What can
you do to make this process faster? I have tried different way to organize code
and projects and measure the build time. 

## Tooling
I have not find any tool that could auto generate a large solutions with many
files and project, so I created [.NET Project Mockup
Creator](https://github.com/pekspro/NetProjectMockupCreator). This tool makes it
easy to create projects with a custom number of files with a custom number of
source code. You could also define how many projects it should be. See the image
as an example. In this case there are two libraries on the first level (main is
on level zero), and each of these project have three sub libraries.

![Structure 2-3]({{site.baseurl}}/assets/images/0009/structure-2-3.svg "Structure 2-3")

The tool also generates a PowerShell script that measure how long time it takes
to build and rebuild a solutions. I used this to measure:

* The time it took rebuild the whole project.
* The time it took too build after no change.
* The time it took too build after a change in the main project.
* The time it took too build after a change in a library.

The changes were made by adding a comment in a source file.


## Source files
Let say you have 100 000 lines of code in a single project. In how many files
should these be organized to makes compiling as fast as possible? I created four
projects to test this. The first one had just one file with 100 000 lines of
code. The last one had 1 000 files with 100 lines of code each.

{% include codeheader.html lang="Test setup" %}
{% highlight text %}
./NetProjectMockupCreator --name Single   --level-sizes 1 --file-count 1    --line-count 100000
./NetProjectMockupCreator --name Ten      --level-sizes 1 --file-count 10   --line-count 10000
./NetProjectMockupCreator --name Hundred  --level-sizes 1 --file-count 100  --line-count 1000
./NetProjectMockupCreator --name Thousand --level-sizes 1 --file-count 1000 --line-count 100
{% endhighlight  %}

This is the result:

| Files     | Lines   | Rebuild | Lib change | Main change | No change |
|----------:|--------:| -------:|-----------:|------------:|----------:|
|         1 | 100 000 |    21.9 |       21.1 |         1.8 |       0.4 |
|        10 |  10 000 |    10.0 |        9.8 |         1.8 |       0.4 |
|       100 |   1 000 |     9.8 |        9.5 |         1.8 |       0.4 |
|     1 000 |     100 |     7.5 |        7.2 |         1.8 |       0.4 |

I thought that when I created this setup it would not be any large difference
when it comes to rebuild time. After all, on each rebuild the same amount of
lines needs to be processed. But the difference between the first and last on is
huge. I have watched how the CPU is utilized and I have noticed that when just a
large file is building the CPU is used less. My guess is that each file is
compiled in it is on thread.

Even the difference between the last and second last one is large, and I have
not been able to figure out why.

In real life you most likely have many large small files instead few extremely
large one so I guess this result would not change anything.


## Libraries files
In this scenario I organized 1 000 sources files with 200 lines in a different
number of libraries. I tried with 1, 5, 10, 20, 50, 100 and 1 000 libraries.
Every library where directly referenced by main.

{% include codeheader.html lang="Test setup" %}
{% highlight text %}
./NetProjectMockupCreator --name Single   --level-sizes 1    --file-count 1000 --line-count 200
./NetProjectMockupCreator --name Five     --level-sizes 5    --file-count 200  --line-count 200
./NetProjectMockupCreator --name Ten      --level-sizes 10   --file-count 100  --line-count 200
./NetProjectMockupCreator --name Twenty   --level-sizes 20   --file-count 50   --line-count 200
./NetProjectMockupCreator --name Fifty    --level-sizes 50   --file-count 20   --line-count 200
./NetProjectMockupCreator --name Hundred  --level-sizes 100  --file-count 10   --line-count 200
./NetProjectMockupCreator --name Thousand --level-sizes 1000 --file-count 1    --line-count 200
{% endhighlight  %}

And this is the result:

| Libraries | Rebuild | Lib change  | Main change | No change |
|----------:| -------:|------------:|------------:|----------:|
|         1 |    12.9 |        12.5 |         1.9 |       0.4 |
|         5 |    17.0 |         5.2 |         2.0 |       0.4 |
|        10 |    18.2 |         3.7 |         2.3 |       0.4 |
|        20 |    18.2 |         3.7 |         2.9 |       0.4 |
|        50 |    20.2 |         4.8 |         4.1 |       0.4 |
|       100 |    26.0 |         6.7 |         6.8 |       0.4 |
|     1 000 |   122.1 |        51.2 |        53.6 |       0.4 |

I am not surprised that having all files in a single library in the fastest in
most scenarios. But as a developer the most important time for me is the time it
takes to make a change and having the application running again. And this is the
fastest when we have 10 - 20 libraries and adding a couple of more libraries
will not make any major difference. But having many libraries will slow things
down.

## Tree structure

Having all libraries referenced by your main project and no reference between
libraries is not realistic in a large solution. In this test I organized 50
projects in different ways.

In the first solution all 50 libraries where referenced by main directly. In the
second solution there were just 5 libraries below main, and each of these
projects had 9 sub-libraries. And the third solution had 2 libraries below main,
each of these had 4 sub-libraries and each of these had 5 sub-libraries.

{% include codeheader.html lang="Test setup" %}
{% highlight text %}
./NetProjectMockupCreator --name L50    --level-sizes 50    --file-count 20 --line-count 200
./NetProjectMockupCreator --name L5_9   --level-sizes 5 9   --file-count 20 --line-count 200
./NetProjectMockupCreator --name L2_4_5 --level-sizes 2 4 5 --file-count 20 --line-count 200
{% endhighlight %}

And this is the result for rebuilding and building with no change:

| Level sizes | Rebuild | No change |
|:------------| -------:|----------:|
|          50 |    20.0 |       0.4 |
|        5, 9 |    18.5 |       0.4 |
|     2, 4, 5 |    19.6 |       0.4 |

The numbers are pretty much the same no matter which solutions. The next table
show how long it took the build the project after a change. The changes were
done on each level in the structure: 

| Level sizes |  Main | Level 1 | Level 2 | Level 3 |
|:------------| -----:|--------:|--------:|--------:|
|          50 |   4.2 |     4.8 |         |         |
|        5, 9 |   4.7 |     4.7 |     5.1 |       - |
|     2, 4, 5 |   4.7 |     5.0 |     5.0 |     5.8 |

In this test the numbers are pretty much the same. But you could see that the
longer down you make the change, more time is spent on building. And this makes
sense. When you make a change in a library all other libraries that a
referencing that library needs to be compiled again. And these triggers other
libraries to be compiled.

## NuGet packages
Having all projects in one large solution is nice, but another option is
to change some libraries to NuGet packages. In this last test I will reuse
that last solution in the previous test with two libraries, each of them has
four sub-libraries and each of these has five sub-libraries.

In the first test I build everything as I have done before. In the second I
compile the libraries in the bottom to NuGet packages. That is 40 of the total
50 projects. Since the NuGet packages are built separately I will not show
any build times to for a total rebuild.

{% include codeheader.html lang="Test setup" %}
{% highlight text %}
./NetProjectMockupCreator --name L2_4_5  --level-sizes 2 4 5 --file-count 20 --line-count 200
./NetProjectMockupCreator --name L2_4_5n --level-sizes 2 4 5 --file-count 20 --line-count 200 --nuget-level 3
{% endhighlight %}

This is the times when a build is done of a change on each level:

| NuGet |  Main | Level 1 | Level 2 | Level 3 |
|:------| -----:|--------:|--------:|--------:|
| No    |   4.3 |     4.9 |     5.1 |     5.3 |
| Yes   |   2.3 |     2.7 |     2.9 |       - |

Here we clearly see that using NuGet packages could reduce the build time
significantly.


## Summary
Even if the tests are not realistic, I think the results could be useful. It
clearly shows that having many small libraries will make the build time
significantly slower. Also, when you many small libraries you most likely have a
lot of references between libraries that could trigger several more compiles
after a change.

The tests also show that changing some libraries to NuGet packages could have a
large impact on build time. The downside with this is that is makes your
solution more complicated, both in architecture on how to build them. But if you
have libraries that you rarely change this is worth to try.

When I did these tests, I also did some quick tests to see if the project type
matter. I compared .NET Standard library with .NET Core library but did not see
any clear difference.
