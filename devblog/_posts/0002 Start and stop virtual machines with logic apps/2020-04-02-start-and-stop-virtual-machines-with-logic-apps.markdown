---
layout: post
title:  "Start and stop virtual machines with Logic apps"
date:   2020-04-02 01:52:14 +0200
categories: [Logic apps]
---


A [highly voted feature request](https://feedback.azure.com/forums/287593-logic-apps/suggestions/17405671-start-stop-virtual-machines-with-logic-apps) 
is to start and stop virtual machines with Logic apps. This is quite easy and possible already
today if you just know the right steps.

> **Update**: I have just discovered a new connector that is designed to operate virtual machines. Look on
> [Azure VM](https://docs.microsoft.com/en-us/connectors/azurevm/). That said, I think this post is
> still relevant if you want to learn to how use the `Azure Resource Manager` connector.

### Add action

In your logic app, select to add a new action and search for `Azure Resource Manager`. Then select
the action `Invoke resource operation`.

![Add Azure Resource Manager]({{site.baseurl}}/assets/images/0002/select_arm_invoke.png "Add Azure Resource Manager")


When you have done that you are being asked to enter six fields.

![Fields to enter]({{site.baseurl}}/assets/images/0002/start_empty.png "Fields to enter")

Do not worry, it is not too hard. We take this step by step.

#### Subscription

Select the subscription that contains your VM.

#### Resource group

Select the resource group where your VM are.

#### Resource provider

In the third field you want to select the value `Microsoft.Compute/virtualMachines`. But when I am
writing this that option is not available. Instead, select `Enter custom value` in the end of the list.
Select **Expression** in the new window and enter `'Microsoft.Compute/virtualMachines'`.

![Enter Microsoft.Compute/virtualMachines]({{site.baseurl}}/assets/images/0002/enter_resource_manager.png "Enter Microsoft.Compute/virtualMachines")


#### Short Resource Id

This should just be the name of your virtual machine.

![Find computer name]({{site.baseurl}}/assets/images/0002/find_computer_name.png "Find computer name")

#### Client Api Version

Just enter `2019-07-01`.

#### Action name

In the `Action name` field you should enter what you want to do with your VM. You probably want to
use one of these:

* start
* restart
* powerOff

You can read more about [start](https://docs.microsoft.com/en-us/rest/api/compute/virtualmachines/start),
[restart](https://docs.microsoft.com/en-us/rest/api/compute/virtualmachines/restart),
[powerOff](https://docs.microsoft.com/en-us/rest/api/compute/virtualmachines/poweroff)
and other types of actions in the [documentation](https://docs.microsoft.com/en-us/rest/api/compute/virtualmachines).
 

### Summary

When you are done your action should look like this:

![Complete action]({{site.baseurl}}/assets/images/0002/final.png "Complete action")

As you saw, this is not too hard to do. Actions in the connector `Azure Resource Manager` are 
powerful, it is just tricky to get the parameters right.

