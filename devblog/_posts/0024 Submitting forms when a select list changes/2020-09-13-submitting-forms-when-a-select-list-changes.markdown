---
layout: post
title:  "Submitting forms when a select list changes"
date:   2020-09-13 01:00:00 +0200
categories: [JavaScript]
---

On a page I created recently, there as a simple select list. When the select
value was changed it was supposed to submit a form.

## The problem

Look on this code:

{% include codeheader.html lang="HTML" %}
{% highlight html %}
<form method="get">
    <select >
        <option value=" ">(Select value)</option>
        <option value="red">Red</option>
        <option value="green">Green</option>
        <option value="blue">Blue</option>
    </select>
</form>
{% endhighlight %}

When the selected item is changed, the form should be submitted. The classic way
to solve this is just to add some basic JavaScript code:

{% include codeheader.html lang="HTML" %}
{% highlight html %}
<select onchange="this.form.submit()">
{% endhighlight %}

It totally works. But if you are using [Content Security
Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) it gets more
complicated. In some situations, it might be tricky to get this to work with
Blazor. And if you like me and want to see as little JavaScript as possible you
may want something else.

## The solution

My solution was to run JavaScript code when every page is loaded, and let it
monitor changes to the DOM. When it detects elements that has the class
attribute `submit-on-change`, it will add an event listener that then is
submitting the form. It will also remove the event listeners if the attribute is
removed.

So, my sample code just needs to change to this:

{% include codeheader.html lang="HTML" %}
{% highlight html %}
<form method="get" class="submit-on-change">
    <select >
        <option value=" ">(Select value)</option>
        <option value="red">Red</option>
        <option value="green">Green</option>
        <option value="blue">Blue</option>
    </select>
</form>
{% endhighlight %}

Very simple! And as a bonus nothing is submitted if the first element is
selected where the value is just a space. It cannot be empty, because then the
value will be the text instead. HTML and JavaScript is weird sometimes…

Anyway, the code that do this magic is this TypeScript code:

{% include codeheader.html lang="TypeScript" %}
{% highlight typescript %}

window.addEventListener("load", function () {

    //This will be called when a select list has changed value
    const callback = function (e: Event) {

        if (e.target instanceof HTMLSelectElement) {
            const el = e.target as HTMLSelectElement;

            if (el.value.trim() && el.form) {
                el.form.submit();
            }
        }
    }

    //This will add key event listener on all nodes with the class preventEnter.
    function setupEvent(node: Node, add: boolean) {
        if (node instanceof HTMLSelectElement) {
            const el = node as HTMLSelectElement;

            //Check if main element contains class
            if (el.classList.contains("submit-on-change") && add) {
                console.log("Adding event listener: " + el.id);
                el.addEventListener('change', callback, false);
            } else {
                console.log("Removing event listener: " + el.id);
                el.removeEventListener('change', callback, false);
            }
        }
    }

    //This will add key event listener on all nodes with the class preventEnter.
    function setupEventsOnElements(nodelist: NodeList | HTMLCollectionOf<Element>, add: boolean) {
        for (let i = 0; i < nodelist.length; i++) {
            const node = nodelist[i];

            if (node instanceof HTMLSelectElement) {

                const el = node as HTMLSelectElement;

                //Check if main element contains class
                setupEvent(node, add);

                //Check if any child nodes contains class
                const elements = el.getElementsByClassName("submit-on-change");
                for (let i = 0; i < elements.length; i++) {
                    setupEvent(elements[i], add);
                }
            }
        }
    }

    // Create an observer instance linked to the callback function
    // Read more: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    const observer = new MutationObserver(
        function (mutations: MutationRecord[]) {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {

                    // A child node has been added or removed.
                    setupEventsOnElements(mutation.addedNodes, true);
                }
                else if (mutation.type === 'attributes') {

                    if (mutation.attributeName === "class" && mutation.target instanceof HTMLSelectElement) {
                        // console.log('The ' + mutation.attributeName + ' attribute was modified on' + (mutation.target as HTMLElement).id);

                        //class was modified on this node. Remove previous event handler (if any).
                        setupEvent(mutation.target, false);
                        //And add event handler if class i specified.
                        setupEvent(mutation.target, true);
                    }
                }
            }
        }
    );

    // Configure observer
    const observerConfig = { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] };

    // Start observing the target node for configured mutations
    observer.observe(document, observerConfig);

    //Also check all elements when loaded.
    setupEventsOnElements(document.getElementsByClassName("submit-on-change"), true);
});

{% endhighlight %}

Or, if you prefer pure JavaScript instead:

{% include codeheader.html lang="JavaScript" %}
{% highlight javascript %}

window.addEventListener("load", function () {
    //This will be called when a select list has changed value
    var callback = function (e) {
        if (e.target instanceof HTMLSelectElement) {
            var el = e.target;
            if (el.value.trim() && el.form) {
                el.form.submit();
            }
        }
    };
    //This will add key event listener on all nodes with the class preventEnter.
    function setupEvent(node, add) {
        if (node instanceof HTMLSelectElement) {
            var el = node;
            //Check if main element contains class
            if (el.classList.contains("submit-on-change") && add) {
                console.log("Adding event listener: " + el.id);
                el.addEventListener('change', callback, false);
            }
            else {
                console.log("Removing event listener: " + el.id);
                el.removeEventListener('change', callback, false);
            }
        }
    }
    //This will add key event listener on all nodes with the class preventEnter.
    function setupEventsOnElements(nodelist, add) {
        for (var i = 0; i < nodelist.length; i++) {
            var node = nodelist[i];
            if (node instanceof HTMLSelectElement) {
                var el = node;
                //Check if main element contains class
                setupEvent(node, add);
                //Check if any child nodes contains class
                var elements = el.getElementsByClassName("submit-on-change");
                for (var i_2 = 0; i_2 < elements.length; i_2++) {
                    setupEvent(elements[i_2], add);
                }
            }
        }
    }
    // Create an observer instance linked to the callback function
    // Read more: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    var observer = new MutationObserver(function (mutations) {
        for (var _i = 0, mutations_2 = mutations; _i < mutations_2.length; _i++) {
            var mutation = mutations_2[_i];
            if (mutation.type === 'childList') {
                // A child node has been added or removed.
                setupEventsOnElements(mutation.addedNodes, true);
            }
            else if (mutation.type === 'attributes') {
                if (mutation.attributeName === "class" && mutation.target instanceof HTMLSelectElement) {
                    // console.log('The ' + mutation.attributeName + ' attribute was modified on' + (mutation.target as HTMLElement).id);
                    //class was modified on this node. Remove previous event handler (if any).
                    setupEvent(mutation.target, false);
                    //And add event handler if class i specified.
                    setupEvent(mutation.target, true);
                }
            }
        }
    });
    // Configure observer
    var observerConfig = { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] };
    // Start observing the target node for configured mutations
    observer.observe(document, observerConfig);
    //Also check all elements when loaded.
    setupEventsOnElements(document.getElementsByClassName("submit-on-change"), true);
});

{% endhighlight %}

I think this should work in all modern browsers.

## Summary

This solution is like the one I developed in my earlier post
[Prevent enter to submit forms]({% post_url /0007 Prevent enter to submit forms/2020-05-17-prevent-enter-to-submit-forms %}). 
I am sure I will make more like this in the future :-)
