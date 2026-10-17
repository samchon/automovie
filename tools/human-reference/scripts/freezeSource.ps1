# Local-only source provenance. Request explicitly lists entry sources, configurations, assets and private input hashes.
# Static TypeScript imports and workspace package exports are followed. Governing package.json files are retained.
# Dynamic assets, compiler configuration and third-party dependency identities remain explicit request responsibilities.
param([Parameter(Mandatory=$true)][string]$ProjectRoot, [Parameter(Mandatory=$true)][string]$Request, [Parameter(Mandatory=$true)][string]$SnapshotRoot)
$ErrorActionPreference = 'Stop'
if (-not [IO.Path]::IsPathFullyQualified($ProjectRoot) -or -not [IO.Path]::IsPathFullyQualified($SnapshotRoot)) { throw 'Project and snapshot roots must be absolute' }
$repoRoot = [IO.Path]::GetFullPath($ProjectRoot)
$snapshotRoot = [IO.Path]::GetFullPath($SnapshotRoot)
New-Item -ItemType Directory -Path $snapshotRoot -Force | Out-Null
$lockPath = Join-Path $snapshotRoot '.snapshot.lock'
$token = [guid]::NewGuid().ToString()
$record = @{ owner = 'inventory-private-snapshot'; token = $token; pid = $PID; script = $PSCommandPath; startedAt = [datetime]::UtcNow.ToString('o') } | ConvertTo-Json -Compress
$stream = [IO.File]::Open($lockPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
try {
    $lockBytes = [Text.Encoding]::UTF8.GetBytes($record)
    $stream.Write($lockBytes,0,$lockBytes.Length)
    $stream.Close()
    $spec = Get-Content -Raw -LiteralPath $Request | ConvertFrom-Json
    $round = [datetime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
    $roundRoot = Join-Path $snapshotRoot "rounds/$round"
    New-Item -ItemType Directory -Path $roundRoot -Force | Out-Null
    $allSources = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $pending = [Collections.Generic.Queue[string]]::new()
    @($spec.sources) + @([IO.Path]::GetRelativePath($repoRoot,$PSCommandPath)) | ForEach-Object { $pending.Enqueue($_) }
    $workspacePackages = @{}
    foreach ($packageFile in Get-ChildItem -LiteralPath (Join-Path $repoRoot 'packages') -Filter package.json -Recurse -Depth 1 -File) {
        $package = [IO.File]::ReadAllText($packageFile.FullName) | ConvertFrom-Json
        if ($package.name) { $workspacePackages[$package.name] = @{ root = $packageFile.DirectoryName; data = $package } }
    }
    $workspaceImports = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    while ($pending.Count -gt 0) {
        $relative = $pending.Dequeue().Replace('\','/')
        $absolute = [IO.Path]::GetFullPath((Join-Path $repoRoot $relative))
        if (-not $absolute.StartsWith(([IO.Path]::GetFullPath($repoRoot) + [IO.Path]::DirectorySeparatorChar),[StringComparison]::OrdinalIgnoreCase)) { throw "Source leaves workspace: $relative" }
        if (-not $allSources.Add($relative)) { continue }
        if (-not (Test-Path -LiteralPath $absolute -PathType Leaf)) { throw "Missing snapshot source: $relative" }
        # A NodeNext source file's package scope is part of its compilation identity.
        $scope = Split-Path $absolute
        while ($scope -and $scope.StartsWith($repoRoot,[StringComparison]::OrdinalIgnoreCase)) {
            $packagePath = Join-Path $scope 'package.json'
            if (Test-Path -LiteralPath $packagePath -PathType Leaf) { $pending.Enqueue([IO.Path]::GetRelativePath($repoRoot,$packagePath)) }
            if ($scope -eq $repoRoot) { break }
            $scope = Split-Path $scope
        }
        if ([IO.Path]::GetExtension($absolute) -eq '.ts') {
            $content = [IO.File]::ReadAllText($absolute)
            $matches = [regex]::Matches($content, '(?:from\s*|import\s*)["'']([^"'']+)["'']')
            foreach ($match in $matches) {
                $specifier = $match.Groups[1].Value
                if ($specifier.StartsWith('@automovie/')) {
                    $parts = $specifier.Split('/')
                    $packageName = "$($parts[0])/$($parts[1])"
                    if (-not $workspacePackages.ContainsKey($packageName)) { throw "Unknown workspace import: $specifier" }
                    $workspace = $workspacePackages[$packageName]
                    $exportName = $(if ($parts.Length -eq 2) { '.' } else { './' + ($parts[2..($parts.Length - 1)] -join '/') })
                    $target = $null
                    foreach ($property in $workspace.data.exports.PSObject.Properties) {
                        if ($property.Name -eq $exportName) { $target = $property.Value; break }
                        if ($property.Name.Contains('*')) {
                            $pattern = '^' + [regex]::Escape($property.Name).Replace('\*','(.+)') + '$'
                            $wildcard = [regex]::Match($exportName,$pattern)
                            if ($wildcard.Success -and $property.Value -is [string]) { $target = $property.Value.Replace('*',$wildcard.Groups[1].Value); break }
                        }
                    }
                    if ($target -and $target -isnot [string]) {
                        $conditionalTarget = $target
                        $target = $null
                        foreach ($condition in @($spec.workspaceConditions)) {
                            $candidate = $conditionalTarget.PSObject.Properties[$condition]
                            if ($candidate -and $candidate.Value -is [string]) { $target = $candidate.Value; break }
                        }
                    }
                    if ($target -isnot [string]) { throw "Workspace export requires an explicit supported source target or declared condition: $specifier" }
                    $dependency = [IO.Path]::GetFullPath((Join-Path $workspace.root $target))
                    $null = $workspaceImports.Add($specifier)
                } elseif ($specifier.StartsWith('.')) {
                    $dependency = [IO.Path]::GetFullPath((Join-Path (Split-Path $absolute) $specifier))
                } else { continue }
                if (-not (Test-Path -LiteralPath $dependency -PathType Leaf) -and (Test-Path -LiteralPath "$dependency.ts" -PathType Leaf)) { $dependency = "$dependency.ts" }
                if (-not (Test-Path -LiteralPath $dependency -PathType Leaf) -and $dependency.EndsWith('.js')) {
                    $typescriptSource = [IO.Path]::ChangeExtension($dependency,'.ts')
                    if (Test-Path -LiteralPath $typescriptSource -PathType Leaf) { $dependency = $typescriptSource }
                    else { throw "Relative JavaScript specifier has no source file or TypeScript source counterpart: $dependency" }
                }
                if (Test-Path -LiteralPath $dependency -PathType Container) {
                    $indexFile = Join-Path $dependency 'index.ts'
                    if (-not (Test-Path -LiteralPath $indexFile -PathType Leaf)) { throw "Relative directory import has no declared index.ts: $dependency" }
                    $dependency = $indexFile
                }
                if ((Test-Path -LiteralPath $dependency -PathType Leaf) -and $dependency.EndsWith('.ts')) {
                    $pending.Enqueue([IO.Path]::GetRelativePath($repoRoot,$dependency))
                } elseif ($dependency.EndsWith('.ts')) {
                    throw "Declared relative TypeScript dependency is missing: $dependency"
                }
            }
        }
    }
    $files = @()
    foreach ($relative in @($allSources) + @($spec.inputs)) {
        $absolute = [IO.Path]::GetFullPath((Join-Path $repoRoot $relative))
        if (-not $absolute.StartsWith(([IO.Path]::GetFullPath($repoRoot) + [IO.Path]::DirectorySeparatorChar),[StringComparison]::OrdinalIgnoreCase)) { throw "Input leaves workspace: $relative" }
        $file = Get-Item -LiteralPath $absolute
        $sha = (Get-FileHash -Algorithm SHA256 -LiteralPath $absolute).Hash.ToLowerInvariant()
        $isSource = $allSources.Contains($relative)
        $files += @{ file = $relative.Replace('\','/'); sha256 = $sha; bytes = $file.Length; kind = $(if ($isSource) { 'source' } else { 'input' }) }
        if ($isSource) {
            $destination = Join-Path $roundRoot "source/$relative"
            New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null
            Copy-Item -LiteralPath $absolute -Destination $destination
            $copiedSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $destination).Hash.ToLowerInvariant()
            if ($copiedSha -ne $sha) { throw "Copied source bytes differ from the observed source: $relative" }
        }
    }
    $manifest = @{ schema = 'private-committed-reference-snapshot-v1'; createdAt = [datetime]::UtcNow.ToString('o'); purpose = $spec.purpose; workspaceImports = @($workspaceImports); workspaceConditions = @($spec.workspaceConditions); files = $files; limits = @('Local private source snapshot only; no remote is configured.', 'Input bytes remain private and are identified by hash, not copied into the source repository.', 'Runtime and capture owners must compare loaded byte hashes with this manifest before claiming comparison identity.', 'A committed snapshot establishes identity, not anatomical, geometric or visual quality.') }
    $manifest | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $roundRoot 'manifest.json') -Encoding utf8NoBOM
    foreach ($entry in $files) {
        $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $repoRoot $entry.file)).Hash.ToLowerInvariant()
        if ($actual -ne $entry.sha256) { throw "Source or input changed during private freeze: $($entry.file)" }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $snapshotRoot '.git'))) { & git -C $snapshotRoot init --quiet; if ($LASTEXITCODE -ne 0) { throw 'Private git initialization failed' } }
    $remotes = & git -C $snapshotRoot remote
    if ($remotes) { throw 'Private snapshot repository unexpectedly has a remote' }
    & git -C $snapshotRoot -c core.autocrlf=false add -- "rounds/$round"
    if ($LASTEXITCODE -ne 0) { throw 'Private source staging failed' }
    & git -C $snapshotRoot -c core.autocrlf=false commit --quiet -m "Record private reference comparison source $round" -- "rounds/$round"
    if ($LASTEXITCODE -ne 0) { throw 'Private source commit failed' }
    $commit = (& git -C $snapshotRoot rev-parse HEAD).Trim()
    $sourceRows = @($allSources)
    for ($offset = 0; $offset -lt $sourceRows.Count; $offset += 32) {
        $last = [Math]::Min($sourceRows.Count - 1,$offset + 31)
        $batch = @($sourceRows[$offset..$last])
        $objectNames = @($batch | ForEach-Object { "$($commit):rounds/$round/source/$($_.Replace('\','/'))" })
        $copyPaths = @($batch | ForEach-Object { Join-Path $roundRoot "source/$_" })
        $committedBlobs = @(& git -C $snapshotRoot rev-parse @objectNames)
        if ($LASTEXITCODE -ne 0 -or $committedBlobs.Count -ne $batch.Count) { throw 'Committed source batch is incomplete' }
        $copiedBlobs = @(& git -C $snapshotRoot hash-object --no-filters -- @copyPaths)
        if ($LASTEXITCODE -ne 0 -or $copiedBlobs.Count -ne $batch.Count) { throw 'Copied source batch cannot be hashed' }
        for ($i = 0; $i -lt $batch.Count; $i++) {
            if ($committedBlobs[$i].Trim() -ne $copiedBlobs[$i].Trim()) { throw "Git attributes changed committed source bytes: $($batch[$i])" }
        }
    }
    $pointer = @{ commit = $commit; manifest = (Join-Path $roundRoot 'manifest.json'); createdAt = [datetime]::UtcNow.ToString('o') }
    $pointer | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $snapshotRoot 'CURRENT.json') -Encoding utf8NoBOM
    $pointer | ConvertTo-Json -Compress
} finally {
    $stream.Dispose()
    if (Test-Path -LiteralPath $lockPath) {
        $current = Get-Content -Raw -LiteralPath $lockPath | ConvertFrom-Json
        if ($current.token -eq $token) { Remove-Item -LiteralPath $lockPath }
    }
}
