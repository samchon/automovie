/**
 * Fixed native Windows operations used by the Node effect host. Variable PIDs
 * and stamps arrive as JSON stdin, never interpolated PowerShell source. The
 * stop operation opens every selected process and retains its handle, compares
 * all creation identities, then terminates that exact parent-first set. Kernel
 * handle behavior and failures require real OS observation; merely importing
 * these strings or testing their JSON decoder does not prove native lifecycle.
 * The fixed programs contain no interpolated variable shell source, executable
 * name selection, recursive taskkill expansion or age-based termination path.
 */
export const WindowsProcessOwnershipPrograms: Readonly<{
  identity: string;
  snapshot: string;
  stop: string;
}> = {
  identity: `
try { $owned = [System.Diagnostics.Process]::GetProcessById([int]$request.pid) }
catch [System.ArgumentException] { 'null'; exit 0 }
try {
  $null = $owned.Handle
  $stamp = $owned.StartTime.ToUniversalTime().Ticks.ToString()
  $stamp.Substring(0, $stamp.Length - 1) | ConvertTo-Json -Compress
} finally { $owned.Dispose() }
`,
  snapshot: `
$rows = @(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -gt 0 -and $null -ne $_.CreationDate } | ForEach-Object {
  $stamp = $_.CreationDate.ToUniversalTime().Ticks.ToString()
  [pscustomobject]@{ pid = [int]$_.ProcessId; parentPid = [int]$_.ParentProcessId; createdAt = $stamp.Substring(0, $stamp.Length - 1) }
})
ConvertTo-Json -InputObject $rows -Compress
`,
  stop: `
$handles = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()
try {
  foreach ($target in $request.targets) {
    $owned = [System.Diagnostics.Process]::GetProcessById([int]$target.pid)
    $handles.Add($owned)
    $null = $owned.Handle
    $stamp = $owned.StartTime.ToUniversalTime().Ticks.ToString()
    if ($stamp.Substring(0, $stamp.Length - 1) -cne [string]$target.createdAt) {
      throw 'The admitted process has exited or its PID was reused'
    }
  }
  foreach ($owned in $handles) {
    if (-not $owned.HasExited) { $owned.Kill(); $owned.WaitForExit() }
  }
  'null'
} finally {
  foreach ($owned in $handles) { $owned.Dispose() }
}
`,
} as const;
