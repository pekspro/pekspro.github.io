---
layout: post
title:  "WithPartitionKey and in-memory database"
date:   2020-12-20 01:00:00 +0200
categories: [.NET] 
---

With EF Core 5, [WithPartitionKey](https://docs.microsoft.com/en-us/ef/core/what-is-new/ef-core-5.0/whatsnew#preview-3)
has been added that will make your queries executes faster on a Cosmos database.
But it does not work with in in-memory database.

## The problem

WithPartitionKey is a nice addition a think. But if you also using an in-memory
database (very convenient when doing unit tests) it will not work. If you try
you will get an exception with the error message:

    The LINQ expression 'DbSet<Blog>().WithPartitionKey("x")' could not be translated. 
    Either rewrite the query in a form that can be translated, or switch to client evaluation 
    explicitly by inserting a call to 'AsEnumerable', 'AsAsyncEnumerable', 'ToList', or 
    'ToListAsync'. See https://go.microsoft.com/fwlink/?linkid=2101038 for more information.'

## The solution

My solution is to create my own extension method, I call it `OnPartion`. When
this is used it calls `WithPartitionKey` if cosmos database provider is used.
If not, then it will be translated to a `Where` statement. For me, this is
good enough. But there are some limitations:

* The extension needs to be configured so it knows which way to go. I do this
in the `DbContext` constructor.
* You cannot use both a cosmos database and a in-memory database in the same
application. Not a major issue, I think.
* You need to create an extension for every entity you are using. I am not
happy with that. But it not a major work.

Here is the code included in an example:

{% include codeheader.html lang="CSharp" %}
{% highlight C# %}
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ConsoleAppInMemoryError
{
    public class Blog
    {
        public string ID { get; set; } = string.Empty;
        public string PartionKey { get; set; } = string.Empty;
        public string Name { get; set; } = "";
    }

    public class BlogContext : DbContext
    {
        public DbSet<Blog> Blogs { get; set; } = null!;

        public BlogContext(DbContextOptions<BlogContext> options)
            : base(options)
        {
            UglyBlogQueryExtensions.SetupUseWithPartionKeySupport(options);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Blog>()
                .ToContainer("Blogs")
                .HasNoDiscriminator()
                .HasPartitionKey(o => o.PartionKey)
                .UseETagConcurrency();
        }
    }

    public static class UglyBlogQueryExtensions
    {
        private static bool? UseWithPartionKey = null;

        public static void SetupUseWithPartionKeySupport(DbContextOptions<BlogContext> options)
        {
            if(UseWithPartionKey == null)
            {
                UseWithPartionKey = options.Extensions.Any(e => e.Info.ToString().Contains("Cosmos"));
            }
        }

        public static IQueryable<Blog> OnPartion(this IQueryable<Blog> query, string partionKey)
        {
            if(UseWithPartionKey == true)
            {
                query = query.WithPartitionKey(partionKey);
            }
            else
            {
                query = query.Where(a => a.PartionKey == partionKey);
            }

            return query;
        }
    }

    class Program
    {
        static async Task Main(string[] args)
        {
            var dbContextOptionsBuilder = 
                        new DbContextOptionsBuilder<BlogContext>()
                            .UseInMemoryDatabase(Guid.NewGuid().ToString());

            var context = new BlogContext(dbContextOptionsBuilder.Options);

            var items1 = await context.Blogs.OnPartion("x").ToListAsync();
        }
    }
}{% endhighlight %}

## Summary

This solution is a bit ugly I think but it does solve the problem. In the
future, hopefully there will be no need to use WithPartionKey. Instead, the
partition could automatically be detected in a where statement. Read more on
[issue 20350](https://github.com/dotnet/efcore/issues/20350).
