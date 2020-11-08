---
layout: post
title:  "Trimming whitespace in objects"
date:   2020-11-08 01:00:00 +0200
categories: [.NET]
---

How to trim strings in all properties in objects with C#.

## The problem

I often work with data objects in C# like this:

{% include codeheader.html lang="C#" %}
{% highlight csharp %}
class Person
{
    public string ID { get; }

    public string FirstName { get; set; }

    public string LastName { get; set; }

    public int Age { get; set; }

    public List<Person> Children { get; set; } = new List<Person>();
}
{% endhighlight %}

In some situations, like if the object was created from some user input, I want
to trim all strings in the properties. Could I create a simple function that takes any kind
of object and does the work for me? Could it also take care of all child objects?

## The solution

With a little help of reflection, a recursive function could do the job. The code
is not trivial, but also not too complicated:

{% include codeheader.html lang="C#" %}
{% highlight csharp %}

public void TrimProperties(object obj, bool recursive = true)
{
    TrimProperties(obj, recursive, recursive ? new List<object>() : null);
}

private void TrimProperties(object obj, bool recursive, List<object> visitedObjects)
{
    if (obj == null)
    {
        return;
    }

    if (visitedObjects != null)
    {
        if (visitedObjects.Contains(obj))
        {
            return;
        }
    }

    Type t = obj.GetType();

    if (recursive && t.IsClass)
    {
        visitedObjects.Add(obj);
    }

    foreach (var prop in t.GetProperties(BindingFlags.Instance | BindingFlags.Public))
    {
        if (!prop.CanWrite)
        {
            continue;
        }

        if (prop.PropertyType == typeof(string))
        {
            string val = (string)prop.GetValue(obj);
            if (val != null)
            {
                prop.SetValue(obj, val.Trim());
            }
        }
        else if (recursive)
        {
            if (typeof(System.Collections.IEnumerable).IsAssignableFrom(prop.PropertyType))
            {
                System.Collections.IEnumerable en = (System.Collections.IEnumerable)prop.GetValue(obj);

                foreach (var e in en)
                {
                    TrimProperties(e, true, visitedObjects);
                }
            }
            else if (prop.PropertyType.IsClass)
            {
                var subobj = prop.GetValue(obj);

                TrimProperties(subobj, true, visitedObjects);
            }
            else if (!prop.PropertyType.IsPrimitive)
            {
                var subobj = prop.GetValue(obj);

                TrimProperties(subobj, true, visitedObjects);

                prop.SetValue(obj, subobj);
            }
        }
    }
}

{% endhighlight %}

And here is some unit test too:

{% include codeheader.html lang="C#" %}
{% highlight csharp %}
    public class UnitTestStringHelper
    {
        struct TestPersonDetails
        {
            public string LastName { get; set; }

            public int Age { get; set; }
        }

        class BaseTestPerson
        {
            public string FirstName { get; set; }
        }

        class TestPerson : BaseTestPerson
        {
            public static string MagicName { get; set; }

            public TestPerson(string id)
            {
                ID = id;
            }
            public string ID { get; }

            public TestPersonDetails Details { get; set; }

            public TestPerson Parent { get; set; }

            public List<TestPerson> Children { get; set; } = new List<TestPerson>();

            protected string SecretWithSpaces { get; set; } = " spaces! ";

            public bool SecretContainsSpaces => SecretWithSpaces.Contains(" ");
        }

        [Fact]
        public void TrimProperties_Null()
        {
            TestPerson p = null;

            new StringHelper().TrimProperties(p);
        }

        [Fact]
        public void TrimProperties_NotRecursive()
        {
            TestPerson parent = new TestPerson(" 1 ")
            {
                FirstName = null,
                Details = new TestPersonDetails()
                {
                    LastName = " last-parent ",
                    Age = 50
                }
            };

            TestPerson child = new TestPerson(" 2 ")
            {
                FirstName = " first-child ",
                Details = new TestPersonDetails()
                {
                    LastName = " last-child ",
                    Age = 25
                }
            };

            TestPerson grandchild = new TestPerson(" 3 ")
            {
                FirstName = " first-grandchild ",
                Details = new TestPersonDetails()
                {
                    LastName = " last-grandchild ",
                    Age = 0
                }
            };

            TestPerson.MagicName = " Santa ";

            parent.Children.Add(child);
            child.Children.Add(grandchild);
            grandchild.Parent = child;
            child.Parent = parent;

            new StringHelper().TrimProperties(child, false);

            Assert.Equal(" 1 ", parent.ID);
            Assert.Null(parent.FirstName);
            Assert.Equal(" last-parent ", parent.Details.LastName);
            Assert.Equal(50, parent.Details.Age);
            Assert.True(parent.SecretContainsSpaces);

            Assert.Equal(" 2 ", child.ID);
            Assert.Equal("first-child", child.FirstName);
            Assert.Equal(" last-child ", child.Details.LastName);
            Assert.Equal(25, child.Details.Age);
            Assert.True(child.SecretContainsSpaces);

            Assert.Equal(" 3 ", grandchild.ID);
            Assert.Equal(" first-grandchild ", grandchild.FirstName);
            Assert.Equal(" last-grandchild ", grandchild.Details.LastName);
            Assert.Equal(0, grandchild.Details.Age);
            Assert.True(grandchild.SecretContainsSpaces);

            Assert.Equal(" Santa ", TestPerson.MagicName);

        }

        [Theory]
        [InlineData(0)]
        [InlineData(1)]
        [InlineData(2)]
        public void TrimProperties_Recursive(int level)
        {
            TestPerson parent = new TestPerson(" 1 ")
            {
                FirstName = null,
                Details = new TestPersonDetails()
                {
                    LastName = " last-parent ",
                    Age = 50
                }
            };

            TestPerson child = new TestPerson(" 2 ")
            {
                FirstName = " first-child ",
                Details = new TestPersonDetails()
                {
                    LastName = " last-child ",
                    Age = 25
                }
            };

            TestPerson grandchild = new TestPerson(" 3 ")
            {
                FirstName = " first-grandchild ",
                Details = new TestPersonDetails()
                {
                    LastName = " last-grandchild ",
                    Age = 0
                }
            };

            TestPerson.MagicName = " Santa ";

            parent.Children.Add(child);
            child.Children.Add(grandchild);
            grandchild.Parent = child;
            child.Parent = parent;

            if(level == 1)
            {
                new StringHelper().TrimProperties(child, true);
            }
            else if(level == 2)
            {
                new StringHelper().TrimProperties(grandchild, true);
            }
            else
            {
                new StringHelper().TrimProperties(parent, true);
            }

            Assert.Equal(" 1 ", parent.ID);
            Assert.Null(parent.FirstName);
            Assert.Equal("last-parent", parent.Details.LastName);
            Assert.Equal(50, parent.Details.Age);
            Assert.True(parent.SecretContainsSpaces);

            Assert.Equal(" 2 ", child.ID);
            Assert.Equal("first-child", child.FirstName);
            Assert.Equal("last-child", child.Details.LastName);
            Assert.Equal(25, child.Details.Age);
            Assert.True(child.SecretContainsSpaces);

            Assert.Equal(" 3 ", grandchild.ID);
            Assert.Equal("first-grandchild", grandchild.FirstName);
            Assert.Equal("last-grandchild", grandchild.Details.LastName);
            Assert.Equal(0, grandchild.Details.Age);
            Assert.True(grandchild.SecretContainsSpaces);

            Assert.Equal(" Santa ", TestPerson.MagicName);
        }
    }
{% endhighlight %}

## Summary

I rarely use reflection, so this was a fun little experiment for me. In C# 9,
that will be released very soon, there is support for source generators. With
this, it might be possible to automatically generate code that does the
trimming. Someday I might give this a try.
