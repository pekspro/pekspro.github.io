---
layout: post
title:  "Trimming whitespace in input controls"
date:   2020-11-01 01:00:00 +0200
categories: [JavaScript]
---

A simple solution to automatically remove whitespaces on input textboxes and
text area controls in HTML.

## The problem

If you have a web form with input controls where users could enter text
they will sooner or later enter data with leading or trailing whitespaces.
This is especially common if users copy-and-paste data.

I have often seen tab characters after the actual text. This may be OK in some
situations and could problems in other cases. For instance, user could bypass
required fields by entering a space. Or if you concatenate text from input
controls extra whitespaces could cause you getting unexpected results.

## The solution

It is not too hard to remove whitespaces in JavaScript. The simple way is:

{% include codeheader.html lang="HTML" %}
{% highlight html %}
<form onsubmit="alert('Form OK');">

    <label>First name:</label>
    <br />
    <input type="text" required onfocusout="this.value = this.value.trim()">
    <br />

    <label>Last name:</label>
    <br />
    <input type="text" required onfocusout="this.value = this.value.trim()">
    <br />

    <button type="submit">Submit</button>

</form>
{% endhighlight %}

(By the way, is it just me that found the name of the event `blur` is a bit
strange. It is a bit unclear what it is doing.)

I am not a bit fan of adding JavaScript code on each element like that. Another
solution is to use the `onfocusout` event instead that bubbles up. Then you just
need JavaScript code in one place:

{% include codeheader.html lang="HTML" %}
{% highlight html %}
<form onsubmit="alert('Form OK');"
      onfocusout="event.target.value = event.target.value.trim();">

    <label>First name:</label>
    <br />
    <input type="text" required>
    <br />

    <label>Last name:</label>
    <br />
    <input type="text" required>
    <br />

    <button type="submit">Submit</button>

</form>
{% endhighlight %}

Fairly good, I think. But still you need to do this on every form, and it is a
bit tricky if you want to allow whitespace on some controls.

So, instead I reused and modified some old code to fix this problem. When the
page is loaded, it starts monitor changes to the DOM. This gives you better
control. With this solution you could add the CSS class `no-auto-trim` if you do
not want automatically trimming.

Anyway, the code that do this is this TypeScript code:

{% include codeheader.html lang="TypeScript" %}
{% highlight typescript %}

window.addEventListener("load", function () {

    //This will be called when an element lost focus
    const callback = function (e: Event) {

        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            const el = e.target as HTMLInputElement | HTMLTextAreaElement;

            if (!el.classList.contains("no-auto-trim")) {
                el.value = el.value.trim(); 
            }
        }
    }
    
    //This will add blur event listener on all input and text area elements.
    function setupEvent(node: HTMLInputElement | HTMLTextAreaElement) {

        console.log("Adding event listener: " + node.id);
        node.addEventListener('blur', callback, false);
    }

    //This will add key event listener on all input and text area elements.
    function setupEventsOnElements(nodelist: NodeList | HTMLCollectionOf<Element>) {
        for (let i = 0; i < nodelist.length; i++) {
            const node = nodelist[i];

            if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
                const el = node as HTMLInputElement | HTMLTextAreaElement;

                setupEvent(el);
            }
            else if (node instanceof HTMLElement) {
                const el = node as HTMLElement;

                const inputElements = el.getElementsByTagName("input");
                for (let i = 0; i < inputElements.length; i++) {
                    if (inputElements[i].type !== "button" &&
                        inputElements[i].type !== "password" &&
                        inputElements[i].type !== "checkbox" &&
                        inputElements[i].type !== "radio" &&
                        inputElements[i].type !== "hidden" &&
                        inputElements[i].type !== "reset") {
                        setupEvent(inputElements[i]);
                    }
                }
                const textareaElements = el.getElementsByTagName("textarea");
                for (let i = 0; i < textareaElements.length; i++) {
                    setupEvent(textareaElements[i]);
                }
            }
        }
    }

    // Create an observer instance linked to the callback function
    // Read more: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    const observer = new MutationObserver(
        function (mutations: MutationRecord[]) {
            console.log("Something happen.");

            for (const mutation of mutations) {
                console.log("Something happen: " + mutation.type);

                if (mutation.type === 'childList') {
                    setupEventsOnElements(mutation.addedNodes);
                }
            }
        }
    );

    // Configure observer
    const observerConfig = { subtree: true, childList: true, attributes: false };

    // Start observing the target node for configured mutations
    observer.observe(document, observerConfig);

    //Also check all elements when loaded.
    setupEventsOnElements(document.getElementsByTagName("input"));
    setupEventsOnElements(document.getElementsByTagName("textarea"));
});

{% endhighlight %}

And this is how it looks in JavaScript:

{% include codeheader.html lang="JavaScript" %}
{% highlight javascript %}

window.addEventListener("load", function () {
    //This will be called when an element lost focus
    var callback = function (e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            var el = e.target;
            if (!el.classList.contains("no-auto-trim")) {
                el.value = el.value.trim();
            }
        }
    };
    //This will add blur event listener on all input and text area elements.
    function setupEvent(node) {
        console.log("Adding event listener: " + node.id);
        node.addEventListener('blur', callback, false);
    }
    //This will add key event listener on all input and text area elements.
    function setupEventsOnElements(nodelist) {
        for (var i_1 = 0; i_1 < nodelist.length; i_1++) {
            var node = nodelist[i_1];
            if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
                var el = node;
                setupEvent(el);
            }
            else if (node instanceof HTMLElement) {
                var el = node;
                var inputElements = el.getElementsByTagName("input");
                for (var i_2 = 0; i_2 < inputElements.length; i_2++) {
                    if (inputElements[i_2].type !== "button" &&
                        inputElements[i_2].type !== "password" &&
                        inputElements[i_2].type !== "checkbox" &&
                        inputElements[i_2].type !== "radio" &&
                        inputElements[i_2].type !== "hidden" &&
                        inputElements[i_2].type !== "reset") {
                        setupEvent(inputElements[i_2]);
                    }
                }
                var textareaElements = el.getElementsByTagName("textarea");
                for (var i_3 = 0; i_3 < textareaElements.length; i_3++) {
                    setupEvent(textareaElements[i_3]);
                }
            }
        }
    }
    // Create an observer instance linked to the callback function
    // Read more: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    var observer = new MutationObserver(function (mutations) {
        console.log("Something happen.");
        for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
            var mutation = mutations_1[_i];
            console.log("Something happen: " + mutation.type);
            if (mutation.type === 'childList') {
                setupEventsOnElements(mutation.addedNodes);
            }
        }
    });
    // Configure observer
    var observerConfig = { subtree: true, childList: true, attributes: false };
    // Start observing the target node for configured mutations
    observer.observe(document, observerConfig);
    //Also check all elements when loaded.
    setupEventsOnElements(document.getElementsByTagName("input"));
    setupEventsOnElements(document.getElementsByTagName("textarea"));
});

{% endhighlight %}

And here is some sample code:

{% include codeheader.html lang="HTML" %}
{% highlight html %}
<form onsubmit="alert('Form OK');">

    <label>Autotrim:</label>
    <br />
    <input type="text" required>
    <br />

    <label>No autotrim:</label>
    <br />
    <input required class="no-auto-trim">
    <br />

    <label>Autotrim area:</label>
    <br />
    <textarea required></textarea>
    <br />

    <label>No autotrim area:</label>
    <br />
    <textarea required class="no-auto-trim"></textarea>
    <br />

    <button type="submit">Submit</button>
</form>
{% endhighlight %}

## Summary

This solution works fine most of the time. But be careful if you mix this with
Blazor. It looks to me that Blazor also is executing code when controls are
losing focus and could potentially modify the content. So, there is a risk for
conflict on those cases.
