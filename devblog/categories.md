---
title: Categories
layout: page
---

<div id="archives">
{% assign sortedCategories = site.categories | sort  %}
{% for category in sortedCategories %}
  <div class="archive-group">
    {% capture category_name %}{{ category | first }}{% endcapture %}
    <div id="#{{ category_name | slugify }}"></div>
    <p></p>

    <a name="{{ category_name | slugify }}"></a>
    <h4 class="category-head">{{ category_name }}</h4>

    {% for post in site.categories[category_name] %}
    <article class="archive-item">
      <a href="{{ site.baseurl }}{{ post.url }}">{{post.title}}</a>
    </article>
    {% endfor %}
  </div>
{% endfor %}
</div>
