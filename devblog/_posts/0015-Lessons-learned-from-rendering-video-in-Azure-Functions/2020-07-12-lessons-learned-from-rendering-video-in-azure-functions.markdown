---
layout: post 
title:  "Lessons learned from rendering video in Azure Functions"
date:   2020-07-12 01:00:00 +0200 
categories: [Azure Functions]
---

Recently I have been working with creating time lapse videos in Azure Functions.
It was challenging and fun, and I share what I learned from this here.

This is a follow-up to my previous post [Create a time lapse video]({% post_url
/0014-Create-a-time-lapse-video/2020-07-05-create-a-time-lapse-video %}) and it
is based on the code from that project. I do not have much code in this article,
just some notes from the things I learned running this in Azure Functions.

## Installing ffmpeg

If you are using **ffmpeg** you could add the executable to your deployment to
make sure it is available. But it is fairly large (almost 70 MB) so instead I
decided to add this file to a blob storage, and then copy the file to a
temporary directory. I had other assets, like fonts and background audio, that I
also copied in a similar way. This works just fine.

## Timeout

Rendering videos could take some time. If you are using the **Consumption plan**
it will by default **time out after 5 minutes**. However, you could change this
to 10 minutes. See the
[documentation](https://docs.microsoft.com/en-us/azure/azure-functions/functions-scale#timeout)
about time outs for different plans.

Do some thinking when you are writing your code. If possible, try to create your
video in several steps that could be executed in different functions. For
instance, one step for fetching and preparing the images. And then another step
for the video rendering.

## Storage

If you are using **ffmpeg** for rending your video, all the images needs to be
stored on a drive. You could get the path to a temporary directory to use like
this:

{% include codeheader.html lang="C#" %} 
{% highlight csharp %}
string localTempDirectory = Path.Combine(
        Path.GetTempPath(),
        "render",
        Path.GetRandomFileName()
  );
{% endhighlight %}

This works, but it has a couple of downsides. The first one is that on the
Consumption plan you only has 500 MB available. Another downside is that the
files will be deleted if the function app is restarted. After all, this is
temporary files :-)

Another option is to store files on a network disk. You will get the path to
this like:

{% include codeheader.html lang="C#" %} 
{% highlight csharp %}
string remoteTempDirectory = Path.Combine(
      Environment.ExpandEnvironmentVariables("%HOME%"),
      "render",
      $"{DateTime.UtcNow:yyyy-MM-dd-HH-mm-ss}--{Guid.NewGuid()}"
    );
{% endhighlight %}

The size of the network disk is something you could control, even in the
consumption plan. A downside with using a network disk is that it is slower than
a local temporary folder. About 5-10 times slower when I have done some basic
testing.

## Summary

In my real life application, I have been downloading 1530 JPEG-images, with the
size 1280x720, from a blob storage, some text have been added and then it has
been saved on a network drive, still as JPEG. This took about five minutes.

Then the movie has been rendered, and this has taken about 8 minutes. Since I
have using the consumption plan, with a timeout of 10 minutes, I needed to do
this in two steps. Quite easy to do with durable functions.

Instead of using JPEG, I have also tried to use BMP instead. This took a lot
more space than JPEG, but since the images are just temporary, I did not bother.
Creating the frames took longer, almost 9 minutes instead of 5 when it was JPEG.
I guess this was all due it took longer to transfer the files via the network.
But rendering the video failed due time out.

So, to summarize, it is possible to render short videos on the Consumption plan
with some good planning. If you want to render longer videos, Azue Functions
could still solve this but with a different SKU.
