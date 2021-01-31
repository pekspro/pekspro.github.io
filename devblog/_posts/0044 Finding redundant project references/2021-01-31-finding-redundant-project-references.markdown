---
layout: post
title:  "Finding redundant project references"
date:   2021-01-31 01:00:00 +0200
categories: [.NET, PowerShell] 
---

When you are working with a nontrivial .NET solution you will eventually have a
lot of references between projects and NuGet-packages. Here is a little script
that finds references that are no longer needed in .NET Core projects.

## The problem

Having references to projects or NuGet packages that is no longer needed will
make you project slower to build, and it might also be a bit slower to run. So,
removing redundant references is a good thing. But how do you find these
references?

## The solution

My solution is to try to remove one reference at the time and then rebuild the
project. If it still works, it could probably be removed. Doing this manually is
very tedious, but with some PowerShell code it will not require much work.

The script below is doing just this, removing one reference as checks if the
project still compiles. When it has checked every reference, you will get a
summary.

Since it is modifying the project files (it will restore the file is nothing
unexpected happen) you should have a backup. Also, be aware that this will take
a while to run. Do not be surprised it takes more than one hour on a large
project.

Before you run the script, you need to change the path to directory that
contains all projects that should be checked.

{% include codeheader.html lang="PowerShell" %}
{% highlight powershell %}


function Get-PackageReferences {
    param($FileName, $IncludeReferences, $IncludeChildReferences)

    $xml = [xml] (Get-Content $FileName)

    $references = @()

    if($IncludeReferences) {
        $packageReferences = $xml | Select-Xml -XPath "Project/ItemGroup/PackageReference"

        foreach($node in $packageReferences)
        {
            if($node.Node.Include)
            {
                if($node.Node.Version)
                {
                    $references += [PSCustomObject]@{
                        File = (Split-Path $FileName -Leaf);
                        Name = $node.Node.Include;
                        Version = $node.Node.Version;
                    }
                }
            }
        }
    }

    if($IncludeChildReferences)
    {
        $projectReferences = $xml | Select-Xml -XPath "Project/ItemGroup/ProjectReference"

        foreach($node in $projectReferences)
        {
            if($node.Node.Include)
            {
                $childPath = Join-Path -Path (Split-Path $FileName -Parent) -ChildPath $node.Node.Include

                $childPackageReferences = Get-PackageReferences $childPath $true $true

                $references += $childPackageReferences
            }
        }   
    }

    return $references
}

function Get-ProjectReferences {
    param($FileName, $IncludeReferences, $IncludeChildReferences)

    $xml = [xml] (Get-Content $FileName)

    $references = @()

    if($IncludeReferences) {
        $projectReferences = $xml | Select-Xml -XPath "Project/ItemGroup/ProjectReference"

        foreach($node in $projectReferences)
        {
            if($node.Node.Include)
            {
                $references += [PSCustomObject]@{
                    File = (Split-Path $FileName -Leaf);
                    Name = $node.Node.Include;
                }
            }
        }
    }

    if($IncludeChildReferences)
    {
        $projectReferences = $xml | Select-Xml -XPath "Project/ItemGroup/ProjectReference"

        foreach($node in $projectReferences)
        {
            if($node.Node.Include)
            {
                $childPath = Join-Path -Path (Split-Path $FileName -Parent) -ChildPath $node.Node.Include

                $childProjectReferences = Get-ProjectReferences $childPath $true $true

                $references += $childProjectReferences
            }
        }   
    }

    return $references
}

$files = Get-ChildItem -Path C:\MySolutionDirectory -Filter *.csproj -Recurse

Write-Output "Number of projects: $($files.Length)"

$stopWatch = [System.Diagnostics.Stopwatch]::startNew()

$obseletes = @()

foreach($file in $files) {

    Write-Output ""
    Write-Output "Testing project: $($file.Name)"

    $rawFileContent = [System.IO.File]::ReadAllBytes($file.FullName)

    $childPackageReferences = Get-PackageReferences $file.FullName $false $true
    $childProjectReferences = Get-ProjectReferences $file.FullName $false $true

    $xml = [xml] (Get-Content $file.FullName)

    $packageReferences = $xml | Select-Xml -XPath "Project/ItemGroup/PackageReference"
    $projectReferences = $xml | Select-Xml -XPath "Project/ItemGroup/ProjectReference"

    $nodes = @($packageReferences) + @($projectReferences)

    foreach($node in $nodes)
    {
        $previousNode = $node.Node.PreviousSibling
        $parentNode = $node.Node.ParentNode
        $parentNode.RemoveChild($node.Node) > $null

        if($node.Node.Include)
        {
            $xml.Save($file.FullName)

            if($node.Node.Version)
            {
                $existingChildInclude = $childPackageReferences | Where-Object { $_.Name -eq $node.Node.Include -and $_.Version -eq $node.Node.Version } | Select-Object -First 1

                if($existingChildInclude)
                {
                    Write-Output "$($file.Name) references package $($node.Node.Include) ($($node.Node.Version)) that is also referenced in child project $($existingChildInclude.File)."
                    continue
                }
                else 
                {
                    Write-Host -NoNewline "Building $($file.Name) without package $($node.Node.Include) ($($node.Node.Version))... "
                }
            }
            else
            {
                $existingChildInclude = $childProjectReferences | Where-Object { $_.Name -eq $node.Node.Include } | Select-Object -First 1

                if($existingChildInclude)
                {
                    Write-Output "$($file.Name) references project $($node.Node.Include) that is also referenced in child project $($existingChildInclude.File)."
                    continue
                }
                else 
                {
                    Write-Host -NoNewline "Building $($file.Name) without project $($node.Node.Include)... "
                }
            }
        }
        else 
        {
            continue
        }

        dotnet build $file.FullName > $null

        if($LastExitCode -eq 0)
        {
            Write-Output "Building succeeded."

            if($node.Node.Version)
            {
                $obseletes += [PSCustomObject]@{
                    File = $file;
                    Type = 'Package';
                    Name = $node.Node.Include;
                    Version = $node.Node.Version;
                }
            }
            else
            {
                $obseletes += [PSCustomObject]@{
                    File = $file;
                    Type = 'Project';
                    Name = $node.Node.Include;
                }
            }
        }
        else 
        {
            Write-Output "Building failed."
        }


        if($null -eq $previousNode)
        {
            $parentNode.PrependChild($node.Node) > $null
        } 
        else 
        {
            $parentNode.InsertAfter($node.Node, $previousNode.Node) > $null
        }

        # $xml.OuterXml

        $xml.Save($file.FullName)
    }

    [System.IO.File]::WriteAllBytes($file.FullName, $rawFileContent)

    dotnet build $file.FullName > $null

    if($LastExitCode -ne 0)
    {
        Write-Error "Failed to build $($file.FullName) after project file restore. Was project broken before?"
        return
    }
}

Write-Output ""
Write-Output "-------------------------------------------------------------------------"
Write-Output "Analyse completed in $($stopWatch.Elapsed.TotalSeconds) seconds"
Write-Output "$($obseletes.Length) reference(s) could potentially be removed."

$previousFile = $null
foreach($obselete in $obseletes)
{
    if($previousFile -ne $obselete.File)
    {
        Write-Output ""
        Write-Output "Project: $($obselete.File.Name)"
    }

    if($obselete.Type -eq 'Package')
    {
        Write-Output "Package reference: $($obselete.Name) ($($obselete.Version))"
    }
    else
    {
        Write-Output "Project refence: $($obselete.Name)"
    }

    $previousFile = $obselete.File
}

{% endhighlight %}

## Summary

This was a fun script to do. It took me some hours to write this, but it was
worth it.
