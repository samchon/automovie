import { spawnSync } from "node:child_process";

import { decodeWindowsProcessResult } from "./decodeWindowsProcessResult.ts";

/**
 * Execute a fixed native host program through hidden PowerShell. JSON stdin
 * carries variable inputs; UTF-16LE EncodedCommand carries the fixed program.
 * The native process result is interpreted by the shared pure decoder. This
 * adapter's process creation and OS behavior need separate real observation.
 */
export function runWindowsProcessOperation(program: string, input: unknown): unknown {
  const script = "$ErrorActionPreference = 'Stop'\n" +
    "$request = [Console]::In.ReadToEnd() | ConvertFrom-Json\n" + program;
  return decodeWindowsProcessResult(spawnSync("powershell.exe", [
    "-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64"),
  ], {
    windowsHide: true,
    encoding: "utf8",
    input: JSON.stringify(input),
    maxBuffer: 4 * 1024 * 1024,
  }));
}
