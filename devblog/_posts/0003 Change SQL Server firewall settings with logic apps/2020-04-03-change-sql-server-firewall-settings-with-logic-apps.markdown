---
layout: post
title:  "Change SQL Server firewall settings with Logic apps"
date:   2020-04-03 01:52:14 +0200
categories: [Logic apps]
---


Recently I needed a way to change firewall settings in SQL Server in a Logic app. I wanted to
add and remove which IP-addresses that were allowed. I was able to solve this with the connector
`Azure Resource Manager`.

### Defining rule name
In the SQL Server firewall settings, each rule has a unique name. I decided to create a variable
that holds the name. I called the variable `rulename` and the value was the current time created
by expression `formatDateTime(utcNow(), 'yyyyMMdd_HHmmss')`. Of course you could hard code
your rule name if you prefer.

![Define rule name]({{site.baseurl}}/assets/images/0003/create_rulename_variable.png "Define rule name")


## Add firewall rule

Let us first see how you could add a new firewall rule.

### Add action

In your logic app, select to add a new action and search for `Azure Resource Manager`. Then select
the action `Create or update a resource`.

![Add Azure Resource Manager]({{site.baseurl}}/assets/images/0003/select_arm_create.png "Add Azure Resource Manager")

When you have done that you are being asked to enter five parameters. But you need one more. Select
`Add new parameter` and select `Properties`. When you have done that it should look like this:

![Parameters]({{site.baseurl}}/assets/images/0003/create_empty_properties.png "Parameters")

We look on these parameters one by one.

#### Subscription

Select the subscription that contains your SQL Server.

#### Resource group

Select the resource group where your SQL Server are.

#### Resource provider

The third parameters should have the value `Microsoft.Sql`.

#### Short Resource Id

This should have the value: `servers/[short-name-of-you-sql-server]/firewallRules/[name-of-rule]`. 
If the name of your SQL-server is `yoursqlserver.database.windows.net`, just use the name 
`yoursqlserver`.

#### Client Api Version

This should have the value `2014-04-01`.

#### Properties

In the last parameter we will define the IP-addresses that are allowed, this is done in a JSON-object.
If you want to allow addresses from 127.0.0.1 to 127.0.0.123 write the value like this:

{% highlight json %}
{
    "endIpAddress": "127.0.0.1",
    "startIpAddress": "127.0.0.123"
}
{% endhighlight %}

### Complete sample

When you are done your action should look something like this:

![Final create rule example]({{site.baseurl}}/assets/images/0003/create_final.png "Final create rule example")


## Remove firewall rule

Removing a firewall rule is pretty much the same as adding a rule, but a bit easier.

### Add action

In your logic app, select to add a new action and search for `Azure Resource Manager`. Then select
the action `Delete a resource`.

![Add Azure Resource Manager]({{site.baseurl}}/assets/images/0003/select_arm_delete.png "Add Azure Resource Manager")


### Complete sample

Except that you do not need to enter the `Properties` parameter, all other parameters are identical as then
you add a firewall rule. Your action should look like this:

![Final delete rule example]({{site.baseurl}}/assets/images/0003/delete_final.png "Final delete rule example")



### Summary

As I understand it, `Azure Resource Manager` is using the Rest API in Azure. In the documentation of the API you can learn both
how to 
[add firewall rules](https://docs.microsoft.com/en-us/rest/api/sql/firewallrules/createorupdate)
and
[remove firewall rules](https://docs.microsoft.com/en-us/rest/api/sql/firewallrules/delete).
If you read more in the [API documentation](https://docs.microsoft.com/en-us/rest/api/) you find more information how to modify all kind of resources in Azure.

I am also recommending you to use the 
[Azure resource explorer](https://resources.azure.com/).
With this you can see how your Azure resource looks in JSON, and what the name of each resource is.

For instance, if you navigate to a SQL-server you will se the settings like this:

{% highlight json %}
{
  "kind": "v12.0",
  "properties": {
    "administratorLogin": "YourAdminAccount",
    "version": "12.0",
    "state": "Ready",
    "fullyQualifiedDomainName": "yoursqlserver.database.windows.net"
  },
  "location": "northeurope",
  "tags": {
    "displayName": "SqlServer"
  },
  "id": "/subscriptions/01234567-89ab-cdef-0123-456789abcdef/resourceGroups/YourResourceGroup/providers/Microsoft.Sql/servers/yoursqlserver",
  "name": "yoursqlserver",
  "type": "Microsoft.Sql/servers"
}
{% endhighlight %}

This is clearly not all, for instance you need to navigate further to see the firewall-settings that will look something like this:

{% highlight json %}
{
  "value": [
    {
      "id": "/subscriptions/01234567-89ab-cdef-0123-456789abcdef/resourceGroups/YourResourceGroup/providers/Microsoft.Sql/servers/yoursqlserver/firewallRules/AllowAllWindowsAzureIps",
      "name": "AllowAllWindowsAzureIps",
      "type": "Microsoft.Sql/servers/firewallRules",
      "location": "North Europe",
      "kind": "v12.0",
      "properties": {
        "startIpAddress": "0.0.0.0",
        "endIpAddress": "0.0.0.0"
      }
    },
    {
      "id": "/subscriptions/01234567-89ab-cdef-0123-456789abcdef/resourceGroups/YourResourceGroup/providers/Microsoft.Sql/servers/yoursqlserver/firewallRules/YourCustomerFirewallRule",
      "name": "YourCustomerFirewallRule",
      "type": "Microsoft.Sql/servers/firewallRules",
      "location": "North Europe",
      "kind": "v12.0",
      "properties": {
        "startIpAddress": "127.0.0.1",
        "endIpAddress": "127.0.0.123"
      }
    }
  ]
}
{% endhighlight %}

As you could see `Azure Resource Manager` is a powerful connector in Logic apps. It might take some reading to understand how to use it, but when you have learned how to find
what you need in the [API documentation](https://docs.microsoft.com/en-us/rest/api/),
and have got used to [Azure resource explorer](https://resources.azure.com/) you have
a powerful tool.





