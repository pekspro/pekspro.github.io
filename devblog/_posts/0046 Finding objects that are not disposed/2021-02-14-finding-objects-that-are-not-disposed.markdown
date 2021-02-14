---
layout: post
title:  "Finding objects that are not disposed"
date:   2021-02-14 01:00:00 +0200
categories: [.NET] 
---

Making sure objects are properly disposed could be tricky. Here are some ways I
deal with this.

## The problem

When you are creating an object that implements
[`IDisposable`](https://docs.microsoft.com/en-us/dotnet/api/system.idisposable?view=net-5.0),
you are supposed to dispose this object when you are done with it. This way the
object has a chance to close files, close network connections. If you do not do
this these resources will be in use for an unknown amount of time and this could
cause unexpected errors.

Normally you do this with the `using` keyword:

{% include codeheader.html lang="Using sample" %}
{% highlight csharp %}
using(var myMemoryStream = new MemoryStream())
{
    // more code
}
{% endhighlight %}

Doing like this `myMemoryStream` will be disposed when it is no longer in use.
In principle this is easy. But it is easy to simply forget about this. And there are more complicated scenarios were this is not possible.

## The solution

One solution I have been using for a long time only works for classes you
implement yourself and are using `IDisposable`. But it is neat anyway.

Look on this sample code:

{% include codeheader.html lang="Using sample" %}
{% highlight csharp %}
using System;
using System.Threading;

namespace MissingDisposeCatcher
{
    class MyDisposable : IDisposable
    {
        private bool disposedValue;

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    // TODO: dispose managed state (managed objects)
                }

                // TODO: free unmanaged resources (unmanaged objects) and override finalizer
                // TODO: set large fields to null
                disposedValue = true;
            }
        }

        ~MyDisposable()
        {
            // This object was not disposed properly! Break execution in debugger.
            if (System.Diagnostics.Debugger.IsAttached)
            {
                System.Diagnostics.Debugger.Break();
            }

            // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
            Dispose(disposing: false);
        }

        public void Dispose()
        {
            // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
            Dispose(disposing: true);
            GC.SuppressFinalize(this);
        }
    }

    class Program
    {
        static void Main()
        {
            while(true)
            {
                _ = new MyDisposable();

                GC.Collect();

                Thread.Sleep(10);
            }
        }
    }
}
{% endhighlight %}

Here `MyDisposable` implements the [normal dispose
pattern](https://docs.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-dispose).
But I have done a minor tweak, I have added this destructor code:

{% include codeheader.html lang="Using sample" %}
{% highlight csharp %}
~MyDisposable()
{
    // This object was not disposed properly! Break execution in debugger.
    if (System.Diagnostics.Debugger.IsAttached)
    {
        System.Diagnostics.Debugger.Break();
    }

    // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
    Dispose(disposing: false);
}
{% endhighlight %}

This is the
[destructor/finalizer](https://docs.microsoft.com/en-us/dotnet/api/system.object.finalize?view=net-5.0)
of `MyDisposable`.  When the object is properly disposed,
`GC.SuppressFinalize(this)` is called and this will make sure that the finalizer
is never executed. If the object is not disposed, then the destructor is
executed. This will first check if the debugger is attached, and if it is it
will call
[`System.Diagnostics.Debugger.Break();`](https://docs.microsoft.com/en-us/dotnet/api/system.diagnostics.debugger.break)
which will behave exactly like a breakpoint. Then debugger will stop and now you
know something has went wrong.

### Detecting the issue during compiling

Another solution I have started to use recently is to use the code quality
analyzers that are [enabled by default in .NET
5](https://docs.microsoft.com/en-us/visualstudio/code-quality/roslyn-analyzers-overview?view=vs-2019).
But the specific analyzer [CA2000: Dispose objects before losing
scope](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2000)
is disabled by default. To change it, do this:

* Go a project in Visual Studio.
* Select **Dependencies**.
* Select **Analyzers**.
* Select **Microsoft.CodeAnalysis.NetAnalyzers**.
* Right click on the rule **CA2000** and then set the **Severity** to
  **Warning**.
* The setting is now saved in **.editorconfig**.
  * If you do not have an **.editorconfig** before, this file is now created on
    the project level. You are then being suggested to move it to the solution
    level, which is probably a good choice.

An
[editorconfig](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/configuration-files#editorconfig)
file with this rule enabled looks like this:

{% include codeheader.html lang=".editorconfig" %}
{% highlight config file %}
[*.cs]

# CA2000: Dispose objects before losing scope
dotnet_diagnostic.CA2000.severity = warning
{% endhighlight %}

It is worth mention that CA2000 only covers one scenario, in my experience the most common one. There are more analyzers that covers more scenarios with dispose:

* [CA1001: Types that own disposable fields should be disposable](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca1001)
* [CA1063: Implement IDisposable correctly](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca1063)
* [CA1816: Call GC.SuppressFinalize correctly](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca1816)
* [CA2000: Dispose objects before losing scope](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2000)
* [CA2213: Disposable fields should be disposed](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2213)
* [CA2215: Dispose methods should call base class dispose](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2215)
* [CA2216: Disposable types should declare finalizer](https://docs.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2216)

Be aware that analyzers will make it slower to compile your code. It is a not a
major issue but something to be aware about. Also notice that the analyzers do
not work on .NET Standard libraries, at least not by default.

## Summary

Disposing objects properly are important so I use both solutions mentioned
above.
