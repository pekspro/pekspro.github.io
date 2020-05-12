---
layout: post
title:  "Use Teams as a Terminal"
date:   2020-05-09 04:52:14 +0200
categories: [Logic apps]
---

Here is a crazy idea. Teams is a popular application for communication, especially the chat
is widely used between persons on companies. What if we also could use the chat as terminal,
so people could it to start and stop virtual machines, start a synchronizing of a PowerBI
report and other things. You could do a simple little bot with Logic apps.

When we are done, we could have a chat like this:

![Chat sample]({{site.baseurl}}/assets/images/0006/chat_sample.png "Chat sample")


## Overview
We will use Logic apps to do the most work for us. A Teams trigger will be used to start
the Logic app. Then we will pass on the message to an Azure Function that will parse the message.
After this the Logic app will be used trigger different logic depending on which command
the user has requested, and it will also send responses to the users.

![Solution overview]({{site.baseurl}}/assets/images/0006/overview.png "Solution overview")

## Function to parse messages
Messages that are send in Teams could be used to trigger Logic
apps. In many cases messages are send as pure text, but it might be that we receive messages
in HTML. Messages could also contain a lot of extra white spaces that we want to ignore. Logic
apps are not good on solving this so we will create an Azure Function that will do the parsing
for us.

We will create an API that accepts JSON-objects like this:

{% include codeheader.html lang="JSON - Input" %}
{% highlight json %}
{
    "Content": "<div><div itemprop='copy-paste-block'>start-vm <span>big-test-vm</span></div></div>",
    "ContentType": "html"
}
{% endhighlight %}

And then return the result like this:

{% include codeheader.html lang="JSON - Output" %}
{% highlight json %}
{
  "Command": "start-vm",
  "Parameters": [
    "big-test-vm"
  ],
  "ParameterCount": 1
}
{% endhighlight %}


In your resource group, select to **Add** a new resource and select **Function app**. Give your 
app a name and select **Runtime stack** to be **Node js**.

![Configure Azure Functions App]({{site.baseurl}}/assets/images/0006/configure_azure_functions_app.png "Configure Azure Functions App.")

In the **Hosting** and **Monitoring** options you could use the default settings. Then
**Create** your new resource.

When the app has been created, open it and select **New function**. You will be asked to select
**Development environment**, pick **In-Portal**.

![Configure Development enviroment]({{site.baseurl}}/assets/images/0006/configure_development_enviroment.png "Configure Development enviroment.")

Then select **Webhook + API**:

![Configure Function type]({{site.baseurl}}/assets/images/0006/configure_azure_function_type.png "Configure Function type.")

Then replace the code with this:

{% include codeheader.html lang="JavaScript" %}
{% highlight javascript %}

module.exports = async function (context, req) {

    // Verify that parameters are provided
    if(!req.body.Content || !req.body.ContentType)
    {
        context.res = {
            status: 400,
            body: "Content or ContentType not provided."
        };

        return;
    }

    var content = "" + req.body.Content;
    var contentType = "" + req.body.ContentType;

    if(contentType != "text") 
    {
        // Strip HTML-tags
        content = content.replace(/<\/?[^>]+(>|$)/g, "");

        // Copied from: https://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript/39243641#39243641
        var htmlEntities = {
            nbsp: ' ',
            cent: '¢',
            pound: '£',
            yen: '¥',
            euro: '€',
            copy: '©',
            reg: '®',
            lt: '<',
            gt: '>',
            quot: '"',
            amp: '&',
            apos: '\''
        };

        content = content.replace(/\&([^;]+);/g, function (entity, entityCode) {
                var match;

                if (entityCode in htmlEntities) {
                    return htmlEntities[entityCode];
                } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
                    return String.fromCharCode(parseInt(match[1], 16));
                } else if (match = entityCode.match(/^#(\d+)$/)) {
                    return String.fromCharCode(~~match[1]);
                } else {
                    return entity;
                }
            });
    }
    

    // Remove extra white spaces
    content = content.replace(/\s\s+/g, ' ').trim();

    // Get command and parameters
    var parameters = content.split(" ");
    var command = parameters.shift();

    context.res = {
            status: 200,
            body:
            {
                Command: command,
                Parameters: parameters,
                ParameterCount: parameters.length
            }
        };
};

{% endhighlight %}

Your function will have the default name. If you do not like that, add new **HTTP Trigger Function**.
Call it `ParseTeamMessage`.

## Create a Logic app
The next step is to create a Logic app. In your resource group, **Add** a new resource
and select the type **Logic app**. Give your app a name and then **Create**.

![Configure Logic App]({{site.baseurl}}/assets/images/0006/configure_logic_app.png "Configure Logic App.")

When it is created, open the app and select the template **Blank Logic App**.

![Select Blank Template]({{site.baseurl}}/assets/images/0006/select_blank_template.png "Select Blank Template.")


Then add a new trigger and select **Microsoft Teams** as connector, and select the
trigger **When a new channel message is added**:

![Select trigger]({{site.baseurl}}/assets/images/0006/select_trigger.png "Select trigger.")

Then configure the trigger. Select the **Team** and **Channel** you want to use.

![Configure trigger]({{site.baseurl}}/assets/images/0006/configure_trigger.png "Configure trigger.")

I recommend that you create a separate channel in Teams, I am using **Commands**.
Also configure to check for messages quite often, at least during development. Unfortunately, this will not 
be real time. I have noticed that it sometimes takes several minutes before I get a response
even if it should check for messages every 20 second.

## Parse Team Message
The first action we will do in our Logic app is to call our Azure function we created earlier.
Select the connector **Azure Functions**.

 ![Select Azure Functions]({{site.baseurl}}/assets/images/0006/select_action_azure_functions.png "Azure Functions.")

Then select the server you created earlier, then select the function **ParseTeamMessage**:

 ![Select ParseTeamMessage]({{site.baseurl}}/assets/images/0006/select_parse_team_message.png "Select ParseTeamMessage.").

 Now the action needs to be configured. Add this to the **Request Body** field:


{% include codeheader.html lang="JSON" %}
{% highlight json %}

{
  "Content": "",
  "ContentType": ""
} 

{% endhighlight %}

Then add `Message body content` and `Message body contentType` as dynamic content:

![Configure Request Body]({{site.baseurl}}/assets/images/0006/configure_action_parse_team_message.png "Configure Request Body").


## Parse Command
In the second action we will parse the result from the Azure function. Add a new step and
select **Data operations**:

![Select Data Operations]({{site.baseurl}}/assets/images/0006/select_data_operations.png "Select Data Operations").

Then select the action **Parse JSON**:

![Select Parse JSON]({{site.baseurl}}/assets/images/0006/select_parse_json.png "Select Parse JSON").

Then rename the action to **Parse Command** (use the menu in the upper right corner). 
Then configure **Content** to use the `Body` from the previous action.

![Configure Parse Command]({{site.baseurl}}/assets/images/0006/configure_parse_command.png "Configure Parse Command")

And then finally add this to **Schema**:

{% include codeheader.html lang="JSON" %}
{% highlight json %}

{
    "properties": {
        "Command": {
            "type": "string"
        },
        "ParameterCount": {
            "type": "integer"
        },
        "Parameters": {
            "items": {
                "type": "string"
            },
            "type": "array"
        }
    },
    "type": "object"
}

{% endhighlight %}

This was the final step that involves parsing. The next steps will be a lot easier.

## Handle commands
Now when then message is parsed, it is time do decide what to do with the data. Add a new action
and select **Control**:

![Select Control]({{site.baseurl}}/assets/images/0006/select_action_control.png "Select Control")

And then select **Switch**:

![Select Switch]({{site.baseurl}}/assets/images/0006/select_switch.png "Select Switch")


Then configure the command by setting  **On** to `Command` from the previous action.

![Configure Switch]({{site.baseurl}}/assets/images/0006/configure_switch.png "Select Configure")

After this we will add a new **case** for every command we want to support.

## Command help

We start with a simple command - **help**. When a user sends **help** we will just respond
with a instruction of which commands that are available. 

In the first case, just enter `help`:

![Configure Case Help]({{site.baseurl}}/assets/images/0006/configure_case_help.png "Configure Case Help")

Now we will select which commands to execute. Click on **Add an action** and select **Microsoft Teams**:

![Select Microsoft Teams]({{site.baseurl}}/assets/images/0006/select_action_teams.png "Select Microsoft Teams")

And then select **Post a reply to a message**.

![Select Post a reply]({{site.baseurl}}/assets/images/0006/select_post_a_reply.png "Select Post a reply")

Then configure the action by setting the **Team** and **Channel** to the same values as before.
Then in the **Message** field, select **Message id** from the trigger values. And then write something
appropriate in the **Reply**.

![Configure reply]({{site.baseurl}}/assets/images/0006/configure_post_a_reply.png "Configure reply")

## Command start-vm

In the final command we will add support for starting a virtual machine.

![Configure Case start-vm]({{site.baseurl}}/assets/images/0006/configure_case_start_vm.png "Configure Case start-vm")

This command will require a parameter. If the parameter is missing, we will send back an error message instead.
Select **Add an action** and then select **Control**:

![Select Control]({{site.baseurl}}/assets/images/0006/select_action_control.png "Select Control")

Then select the action **Condition**:

![Select Condition]({{site.baseurl}}/assets/images/0006/select_action_condition.png "Select Condition")

Then configure the condition to check that `ParameterCount` **is greater than or equal to** `1`.

![Configure Condition]({{site.baseurl}}/assets/images/0006/configure_condition.png "Configure Condition")

If the condition is false, an error message should be sent back to the user. I will not explain how to
do that, it is in principle the same as in the help command.

If the condition is true, we should check which name the user has written and then take the appropriate actions.
You could do this by a switch command that we also have done before so I will not describe that either. Instead
we will just send back a message to the user saying that we are starting the virtual machine.

Click on **Add an action** and select **Microsoft Teams**:

![Select Microsoft Teams]({{site.baseurl}}/assets/images/0006/select_action_teams.png "Select Microsoft Teams")

And then select **Post a reply to a message**.

![Select Post a reply]({{site.baseurl}}/assets/images/0006/select_post_a_reply.png "Select Post a reply")

Then configure the action by setting the **Team** and **Channel** to the same values as before.
Then in the **Message** field, select **Message id** from the trigger values (just as in the help command).

Then in **Reply** write a text and then add the expression:

{% include codeheader.html lang="JSON" %}
{% highlight text %}
    body('Parse_Command')?['Parameters']?[0]
{% endhighlight %}

![Configure reply]({{site.baseurl}}/assets/images/0006/configure_start_vm_reply.png "Configure reply")

If you want to write the second parameter replace [0] with [1].

## Summary

What I like most of this solution is that it is easy to add support for new commands. Add since
Logic apps could interact with a lot of connectors you could interesting things with this.
