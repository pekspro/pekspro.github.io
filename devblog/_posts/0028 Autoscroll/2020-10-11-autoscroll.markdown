---
layout: post
title:  "Autoscroll"
date:   2020-10-11 01:00:00 +0200
categories: [JavaScript]
---

Very recently I developed a basic chat function in an application. Users could
enter and send message to each other. And the messages were shown in a list that
automatically scrolled down when a new message was received.

## The problem

Let says you have a list of messages that looks like this in HTML:

{% include codeheader.html lang="HTML" %}
{% highlight html %}
<div style="max-height: 200px; overflow-y: auto" id="chatwindow">
    <p>
        <strong>10:01:11 Alice</strong><br>
        Thr first message.
    </p>
    <p>
        <strong>11:11:11 Bob</strong><br>
        The second message.
    </p>
    <p>
        <strong>12:21:21 Carol</strong><br>
        The third message.
    </p>
</div>
{% endhighlight %}

This is simple list were the height is limited. If there are many messages,
there will be a scrollbar. When new messages are added you want to scroll the
list to the bottom. Unless the scrollbar is not on the bottom - then we do not
want to move it because the user have scrolled up to read earlier messages.

## The solution

There are some interesting problems here. But the most important for me was to
make the code reusable. It should work on any page, even if it has several
message lists.

My solution was to run JavaScript code when every page is loaded, and let it
monitor changes to the DOM. When it detects elements that has the class
attribute `auto-scroll-to-bottom`, it will add an event listener that then is
submitting the form. It will also remove the event listeners if the attribute is
removed.

So, my sample code just needs to change to this:

{% include codeheader.html lang="HTML" %}
{% highlight html %}
<div style="max-height: 200px; overflow-y: auto" id="chatwindow" class="auto-scroll-to-bottom">
<!-- Nothing else is changed -->
{% endhighlight %}

No JavaScript is mixed in the HTML which make is nice and simple.

Anyway, the code that do this is this TypeScript code:

{% include codeheader.html lang="TypeScript" %}
{% highlight typescript %}

window.addEventListener("load", function () {

    const noScrollObjects = new Array<HTMLElement>(0);
    
    const callback = function (e: Event) {

        const target = e.target as HTMLElement;

        if (target.scrollHeight - target.scrollTop - target.clientHeight < 1) {

            // Scrolled to bottom
            const index = noScrollObjects.indexOf(target);
            if (index > -1) {
                noScrollObjects.splice(index);
            }

        } else {

            // Scroll somewhere else. Prevent scrolling.
            noScrollObjects.push(target);

        }
    }
        
    // Create an observer instance linked to the callback function
    // Read more: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    const observer = new MutationObserver(
        function (mutations: MutationRecord[]) {
            const objectsToScroll = new Array<HTMLElement>(0);

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const target = mutation.target as HTMLElement;

                    if (noScrollObjects.indexOf(target) >= 0) {
                        // Scrolling prevented
                        continue;
                    }

                    if (target && target.classList.contains("auto-scroll-to-bottom")) {
                        // Also add event listener
                        target.onscroll = callback;

                        if (objectsToScroll.indexOf(target) < 0) {
                            objectsToScroll.push(target);
                        }
                    }   
                }
            }

            // Scroll all potential objects.
            for (const objectToScroll of objectsToScroll) {
                objectToScroll.scrollTop = objectToScroll.scrollHeight;
            }
        }
    );

    // Only observe changes in nodes in the whole tree, but do not observe attributes.
    const observerConfig = { subtree: true, childList: true, attributes: false };

    // Start observing the target node for configured mutations
    observer.observe(document, observerConfig);
});

{% endhighlight %}

And this is how it looks in JavaScript:

{% include codeheader.html lang="JavaScript" %}
{% highlight javascript %}

window.addEventListener("load", function () {
    var noScrollObjects = new Array(0);
    var callback = function (e) {
        var target = e.target;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 1) {
            // Scrolled to bottom
            var index = noScrollObjects.indexOf(target);
            if (index > -1) {
                noScrollObjects.splice(index);
            }
        }
        else {
            // Scroll somewhere else. Prevent scrolling.
            noScrollObjects.push(target);
        }
    };
    // Create an observer instance linked to the callback function
    // Read more: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    var observer = new MutationObserver(function (mutations) {
        var objectsToScroll = new Array(0);
        for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
            var mutation = mutations_1[_i];
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                var target = mutation.target;
                if (noScrollObjects.indexOf(target) >= 0) {
                    // Scrolling prevented
                    continue;
                }
                if (target && target.classList.contains("auto-scroll-to-bottom")) {
                    // Also add event listener
                    target.onscroll = callback;
                    if (objectsToScroll.indexOf(target) < 0) {
                        objectsToScroll.push(target);
                    }
                }
            }
        }
        // Scroll all potential objects.
        for (var _a = 0, objectsToScroll_1 = objectsToScroll; _a < objectsToScroll_1.length; _a++) {
            var objectToScroll = objectsToScroll_1[_a];
            objectToScroll.scrollTop = objectToScroll.scrollHeight;
        }
    });
    // Only observe changes in nodes in the whole tree, but do not observe attributes.
    var observerConfig = { subtree: true, childList: true, attributes: false };
    // Start observing the target node for configured mutations
    observer.observe(document, observerConfig);
});

{% endhighlight %}

I think this should work in all modern browsers.

## Summary

I like this pattern a lot. You only need to make sure it has run once after the
page has been loaded, and then it will take care of everything after that. The
code plays nicely with Blazor. In fact, I used this code in the project I created
for me previous post
[Detect and warn multiple editors]({% post_url /0027 Detect and warn multiple editors/2020-10-04-detect-and-warn-multiple-editors %}).
