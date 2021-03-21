---
layout: post
title:  "Avoid connecting to resources by mistake"
date:   2021-02-07 01:00:00 +0200
categories: [Azure] 
---

Being able to connect to any resource at any time is both convenient and scary –
especially if you are a developer. Here is a little trick that reduces the risk
a bit.

## The problem

When I work with projects that are deployed to Azure, I often have one
environment for testing and another for production. Access key and passwords are
different in these environments. This makes it harder to connect to incorrect
resource by mistake, but sometimes I find this not to be good enough. I would
like to deny my developer machine to connect to production resources.

## The solution

When you are connecting an Azure resource you often, if not always, use DNS. For
instance, you are using `mysqldb.database.windows.net` for SQL databases and
`mykeyvault.vault.azure.net` for Azure Key Vault.

My solution is to map production DNS names to my own machine. This way, when I
try to connect to a production resource I will instead connect to my own machine
and an error will occur – exactly what I want.

To do this, open the file `C:\Windows\System32\drivers\etc\hosts`. Then you
could redirect the resources you want to your own machine (`127.0.0.1`) like
this:

{% include codeheader.html lang="hosts" %}
{% highlight config file %}

# Azure SQL
127.0.0.1	mysql.database.windows.net

# Cosmos database
127.0.0.1	mycosmosdb.documents.azure.com
# Azure key vault
127.0.0.1	myvault.vault.azure.net
# Azure configuration 
127.0.0.1	myconfig.azconfig.io

# Storage-Blob
127.0.0.1	mystorage.blob.core.windows.net
# Storage-Files
127.0.0.1	mystorage.file.core.windows.net
# Storage-Queue
127.0.0.1	mystorage.queue.core.windows.net
# Storage-Table
127.0.0.1	mystorage.table.core.windows.net

{% endhighlight %}

Be aware that since this is a system file you need special permissions to change
it. You could change the permission on the file or store it somewhere else and
then copy it with Explorer that then could give you temporary permission.

Also, be aware that after these changes some services may **no longer work
properly in Azure Portal**. I have noticed problems both with Azure KeyVault and
Azure AppConfiguration were I got strange error messages in the portal. Other
services might also be affected.

## Summary

Clearly, this is neither a perfect solution nor solves every case. But it does
add an extra layer of protection to my production resources from the most
unreliable system – myself.
