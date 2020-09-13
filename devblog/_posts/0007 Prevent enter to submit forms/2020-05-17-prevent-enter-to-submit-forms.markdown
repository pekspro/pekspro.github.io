---
layout: post
title:  "Prevent enter to submit forms"
date:   2020-05-17 01:00:00 +0200
categories: [JavaScript]
---

Recently I was working with a web form for submitting some data. But one of the
input fields was used for searching instead, so I wanted to prevent the form
from being submitted when the user pressed enter in that field. If you have a
few forms this is possible to solve with JavaScript on every page. But I wanted
something else so I created a solution where you only need to add a CSS-class on
the fields what should have this behavior. I think this turned out to be an
elegant and reusable solution.

## Overview

After my solution was ready, I could just add the class
`prevent-default-on-enter` on input fields and buttons like this:

{% include codeheader.html lang="HTML" %}
{% highlight typescript %}
<input type="text" class="prevent-default-on-enter" />

<button type="submit" class="prevent-default-on-enter">Submit</button>
{% endhighlight %}

And then all enter presses would be blocked from submitting the form.

## The solution

I rarely work with JavaScript, so I thought this was an interesting problem. I
wanted my solution to configure itself when the page was loaded. But I also wanted
it to react to changes, both when nodes were added and when classes were changes
on nodes.
[MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
is the modern solution for this, and to my knowledge this is quite efficient.

After some hours playing around with this, I had this TypeScript code:

{% include codeheader.html lang="TypeScript" %}
{% highlight typescript %}

window.addEventListener("load", function () {

    //This will be called when a key is pressed
    const callback = function (e: KeyboardEvent) {
        if (e.keyCode === 13 || e.key === "Enter") {
            // console.log("Prevented default.")
            e.preventDefault()
            return false
        }
    }

    //This will add key event listener on all nodes with the class preventEnter.
    function setupEvent(node: Node, add: boolean) {
        if (node instanceof HTMLElement) {
            const el = node as HTMLElement;

            //Check if main element contains class
            if (el.classList.contains("prevent-default-on-enter") && add) {
                // console.log("Adding preventer: " + el.id);
                el.addEventListener('keydown', callback, false);
            } else {
                // console.log("Removing preventer: " + el.id);
                el.removeEventListener('keydown', callback, false);
            }
        }
    }

    //This will add key event listener on all nodes with the class preventEnter.
    function setupEventsOnElements(nodelist: NodeList | HTMLCollectionOf<Element>, add: boolean) {
        for (let i = 0; i < nodelist.length; i++) {
            const node = nodelist[i];

            if (node instanceof HTMLElement) {

                const el = node as HTMLElement;

                //Check if main element contains class
                setupEvent(node, add);

                //Check if any child nodes contains class
                const elements = el.getElementsByClassName("prevent-default-on-enter");
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

                    if (mutation.attributeName === "class") {
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
    setupEventsOnElements(document.getElementsByClassName("prevent-default-on-enter"), true);
});

{% endhighlight %}

Or, if you prefer pure JavaScript instead:

{% include codeheader.html lang="JavaScript" %}
{% highlight javascript %}

window.addEventListener("load", function () {
    //This will be called when a key is pressed
    var callback = function (e) {
        if (e.keyCode === 13 || e.key === "Enter") {
            // console.log("Prevented default.")
            e.preventDefault();
            return false;
        }
    };
    //This will add key event listener on all nodes with the class preventEnter.
    function setupEvent(node, add) {
        if (node instanceof HTMLElement) {
            var el = node;
            //Check if main element contains class
            if (el.classList.contains("prevent-default-on-enter") && add) {
                // console.log("Adding preventer: " + el.id);
                el.addEventListener('keydown', callback, false);
            }
            else {
                // console.log("Removing preventer: " + el.id);
                el.removeEventListener('keydown', callback, false);
            }
        }
    }
    //This will add key event listener on all nodes with the class preventEnter.
    function setupEventsOnElements(nodelist, add) {
        for (var i = 0; i < nodelist.length; i++) {
            var node = nodelist[i];
            if (node instanceof HTMLElement) {
                var el = node;
                //Check if main element contains class
                setupEvent(node, add);
                //Check if any child nodes contains class
                var elements = el.getElementsByClassName("prevent-default-on-enter");
                for (var i_1 = 0; i_1 < elements.length; i_1++) {
                    setupEvent(elements[i_1], add);
                }
            }
        }
    }
    // Create an observer instance linked to the callback function
    // Read more: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
    var observer = new MutationObserver(function (mutations) {
        for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
            var mutation = mutations_1[_i];
            if (mutation.type === 'childList') {
                // A child node has been added or removed.
                setupEventsOnElements(mutation.addedNodes, true);
            }
            else if (mutation.type === 'attributes') {
                if (mutation.attributeName === "class") {
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
    setupEventsOnElements(document.getElementsByClassName("prevent-default-on-enter"), true);
});

{% endhighlight %}

I think this should work in all modern browsers. I have done some testing in IE11 that worked well.

## Example

Below is a simple page I used for testing build in a Blazor application. You
need to add the JavaScript code either on the page or reference via a
JavaScript-file. The example page both adds nodes and changes attributes on
fields:

{% include codeheader.html lang="Blazor" %}
{% highlight HTML %}

<form @onsubmit="@( () => { FormSubmitted = true; } )">

    @if (FormSubmitted)
    {
        <p>Form submitted</p>
    }
    else
    {
        <div class="form-group">
            <label class="control-label">Name:</label>
            <input type="text" class="@(DisableEnterOnName ? "prevent-default-on-enter form-control" : "form-control")" id="name" placeholder="@(DisableEnterOnName ? "Enter will be ignored" : "Press enter to submit")" />
        </div>
        <div class="form-group">
            <input type="checkbox" @bind="DisableEnterOnName" class="form-check" style="display: inline" id="checkBoxName" />
            <label class="control-label" for="checkBoxName">Ignore enter on name</label>
        </div>
        <div class="form-group">
            <label class="control-label">Search:</label>
            <input type="text" id="search" class="prevent-default-on-enter form-control" placeholder="Enter will be ignored" />
        </div>
        <div class="form-group">
            <input type="checkbox" @bind="ShowAdvanced" class="form-check" style="display: inline" id="checkBoxAdvanced" />
            <label class="control-label" for="checkBoxAdvanced">Show advanced</label>
        </div>
        @if (ShowAdvanced)
        {
            <div class="form-group">
                <label class="control-label">Advanced search:</label>
                <input type="text" id="advancedsearch" class="form-control prevent-default-on-enter" placeholder="Enter will be ignored" />
            </div>
        }
        <button class="btn btn-primary" type="submit">Submit</button>
    }
</form>

@code {
    private bool FormSubmitted = false;

    private bool DisableEnterOnName = false;

    private bool ShowAdvanced = false;
}

{% endhighlight %}

## Summary

I am happy with this solution and I learned a lot while a was developing it.

Originally, I run into this problem working with a Razor component in an ASP.NET
Core application. First I thought it would be enough to use
`@onkeypress:preventDefault` on my tags. First, I discovered that nothing was
changed after I added that [due a bug in the
framework](https://github.com/dotnet/aspnetcore/issues/18449). Then, after also
adding a `onkeypress` handler, I could get it to work but I also needed to
handle *every* keystroke in the input field and manually update the user
interface. I did not like that. I also found a solution on
[StackOverflow](https://stackoverflow.com/questions/61373674/how-to-conditionally-preventdefault-inside-the-input-component-in-blazor)
that involved triggering JavaScript code from C#, which works but it is a bit
clumsy and nothing you want to do if you have a lot of forms. Sometimes I get
surprised how much time you spend on something that should be a trivial problem.
