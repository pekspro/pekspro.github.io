---
layout: post
title:  "Change database SKU with Logic apps"
date:   2020-06-14 01:00:00 +0200
categories: [Logic apps]
---

If you have a database that you are using less during night time, you could
change
[SKU](https://docs.microsoft.com/en-us/partner-center/develop/product-resources#sku)
(Stock Keeping Unit) with some schedule to save some money. With Logic apps and
the connector `Azure Resource Manager` it is quite straightforward to do.

### Setup schedule

In Azure Portal, create a new Logic app. Select `Recurrence` as the trigger. Set
`Frequency` to `Week`, and on `Add new parameter` select `On these days`, `At
these hours` and `At these minutes`. Then configure the schedule you want to use.

In this sample, the app will run every workday at 07:00 in the morning:

![Schedule]({{site.baseurl}}/assets/images/0011/setup_schedule.png "Schedule")

### Add action

In your logic app, select to add a new action and search for `Azure Resource
Manager`. Then select the action `Create or update a resource`.

![Add Azure Resource Manager]({{site.baseurl}}/assets/images/0011/select_arm_create.png "Add Azure Resource Manager")

When you have done that you are being asked to enter five parameters by default. But 
to change SKU we need more settings. Select `Add new parameter` and select:

* Location
* Properties
* SKU Capacity
* SKU Family
* SKU Name
* SKU Tier

Now it should look like this:

![Parameters]({{site.baseurl}}/assets/images/0011/create_empty_properties.png "Parameters")

Some of these settings are common for every SKU, so we start with these first:

#### Subscription

Select the subscription that contains your SQL Server.

#### Resource group

Select the resource group where your SQL Server are.

#### Resource provider

The third parameters should have the value `Microsoft.Sql`.

#### Short Resource Id

This should have the value:
`servers/[short-name-of-you-sql-server]/databases/[name-of-database]`. If the
name of your SQL-server is `yoursqlserver.database.windows.net`, just use the
name `yoursqlserver`.

#### Client Api Version

This should have the value `2017-10-01-preview`.

#### Location

This is in which location you have your database. Just set this to the current
value because you cannot change this, but it is required to have this. 

#### Properties

In the `properties` parameter you could set the maximum size of your database.
If you are using the serverless SKU, you could also change some other settings,
more about this later. If you do not want to change these setting, you could
just skip this option. But if you do, you set it up like this:

{% include codeheader.html lang="JSON" %}
{% highlight json %}
{
    "maxSizeBytes": 2147483648
}
{% endhighlight %}

In this sample the maximum database size will be 2 GB
(2&nbsp;·&nbsp;1024&nbsp;·&nbsp;1024&nbsp;·&nbsp;1024 = 2147483648). If you want
500 MB, use the value 500&nbsp;·&nbsp;1024&nbsp;·&nbsp;1024 = 524288000 instead.

### First step completed

When you are done your action should look something like this:

![First settings]({{site.baseurl}}/assets/images/0011/create_first_step_properties.png "First settings")


## Setup SKU

Each SKU has its own set of settings. 

### Basic

The basic SKU is the option with the least power and is very easy to configure.
Configure these settings:

#### SKU Capacity

Capacity should have the value: 5

#### SKU Name

SKU Name should have the value: **Basic**

#### SKU Tier

SKU Tier should have the value: **Basic**

#### Sample

When you have setup these settings it should look like this:

![SKU Basic]({{site.baseurl}}/assets/images/0011/sku_basic.png "SKU Basic")


### Standard

To configure standard SKU setup these settings:

#### SKU Capacity

This is the number of DTU:s. These options are valid:

* 10
* 20
* 50
* 100
* 200
* 400
* 800
* 1600
* 3000

#### SKU Name

SKU Name should have the value: **Standard**

#### SKU Tier

SKU Tier should have the value: **Standard**


#### Sample

When you have setup these settings it should look like this:

![SKU Standard]({{site.baseurl}}/assets/images/0011/sku_standard.png "SKU Standard")


### Premium

To configure premium SKU setup these settings:

#### SKU Capacity

This is the number of DTU:s. These options are valid:

* 125
* 250
* 500
* 1000
* 1750
* 4000

#### SKU Name

SKU Name should have the value: **Premium**

#### SKU Tier

SKU Tier should have the value: **Premium**

#### Sample

When you have setup these settings it should look like this:

![SKU Premium]({{site.baseurl}}/assets/images/0011/sku_premium.png "SKU Premium")


### General Purpose - Provisioned

To configure General Purpose - Provisioned SKU setup these settings:

#### SKU Capacity

This is the number of vCore:s. These options are valid:

* 2
* 4
* 6
* 8
* 10
* 12
* 14
* 16
* 18
* 20
* 24
* 32
* 40

#### SKU Family

SKU Family should have the value: **Gen5**

#### SKU Name

SKU Name should have the value: **GP_Gen5**

#### SKU Tier

SKU Tier should have the value: **GeneralPurpose**

#### Sample

When you have setup these settings it should look like this:

![SKU Provisioned]({{site.baseurl}}/assets/images/0011/sku_general_provisioned.png "SKU Provisioned")


### General Purpose - Serverless

To configure General Purpose - Serverless SKU setup these settings:

#### SKU Capacity

This is the maximum number of vCore:s. These options are valid:

* 1
* 2
* 4
* 6
* 8
* 10
* 12
* 14
* 16
* 18
* 20
* 24
* 32
* 40

#### SKU Family

SKU Family should have the value: **Gen5**

#### SKU Name

SKU Name should have the value: **GP_S_Gen5**

#### SKU Tier

SKU Tier should have the value: **GeneralPurpose**

#### Properties

When you are using serverless, you could configure more settings in the `properties` parameter.
With `minCapacity` you configure the minimum number of vCores to use. With
`autoPauseDelay` you configure the number of minutes it takes before the database
is paused. Set this to -1 if the database never should be paused. 

If you skip these settings `autoPauseDelay` will be set to 60 minutes, and
`minCapacity` will be set to the lowest number available (this depends on SKU
Capacity). Here is a sample how this looks like:

{% include codeheader.html lang="JSON" %}
{% highlight json %}
{
    "maxSizeBytes": 2147483648,
    "autoPauseDelay": 60,
    "minCapacity": 0.5
}
{% endhighlight %}

#### Sample

When you have setup these settings it should look like this:

![SKU Serverless]({{site.baseurl}}/assets/images/0011/sku_general_serverless.png "SKU Serverless")


### Summary

The settings I have written about, are likely to change. The best way to find
out which settings to use, is to configure the database in the Azure Portal.
Then use [Azure resource explorer](https://resources.azure.com/) to see exactly
what have been set.

Also, be aware that all clients might lose the connection to the database while
the SKU is changing. So, pick the schedule with care.
