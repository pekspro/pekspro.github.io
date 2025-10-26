---
layout: post
title:  "Getting values from DataAnnotations with a source generator"
date:   2025-10-26 01:00:00 +0200
categories: [.NET, GitHub, Source generator]
---

I created a source generator to solve a problem that has annoyed me for several
years.

## The problem

If you have this code:

```csharp
public partial class Product
{
    [Required]
    [StringLength(100)]
    public string? Name { get; set; }

    [Required]
    [Range(0.01, 999999.99)]
    public decimal Price { get; set; }
}
```

How do you get the values from your data annotations?

## The solution

I've recently created
**[DataAnnotationValuesExtractor](https://github.com/pekspro/DataAnnotationValuesExtractor)**
to solve this specific problem. With this you just add an attribute to your
models:

```csharp
[DataAnnotationValues]
public partial class Product
{
    [Required]
    [StringLength(100)]
    public string? Name { get; set; }

    [Required]
    [Range(0.01, 999999.99)]
    public decimal Price { get; set; }
}
```

And then you can get values like this:

```csharp
// Name length constraints
int maxNameLength = Product.Annotations.Name.MaximumLength; // 100
int minNameLength = Product.Annotations.Name.MinimumLength; // 0
bool nameRequired = Product.Annotations.Name.IsRequired; // true

// Price constraints
double minPrice = Product.Annotations.Price.Minimum; // 0.01
double maxPrice = Product.Annotations.Price.Maximum; // 999999.99
bool priceRequired = Product.Annotations.Price.IsRequired;
```

It almost like magic!

There is also a solution if you scaffolding your models, read more in the
project on
**[GitHub](https://github.com/pekspro/DataAnnotationValuesExtractor)**.

## Summary

This was a fun little project that solved a real problem for me and that has
annoyed since I started to use data annotations. I've seen solutions where you
use reflection, but this solution is much better.
