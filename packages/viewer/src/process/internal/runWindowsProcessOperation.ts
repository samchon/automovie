import { spawnSync } from "node:child_process";

import { decodeWindowsProcessResult } from "./decodeWindowsProcessResult.ts";

/**
 * Execute a fixed native host program through hidden PowerShell. JSON stdin carries variable inputs; UTF-16LE EncodedCommand carries the fixed program. The native process result is interpreted by the shared pure decoder. This adapter's process creation and OS behavior need separate real observation.
 *
 * @evidence contracts/common.md#principled-implementation Builds one fixed PowerShell program with error-stop policy and JSON stdin parsing, sends caller input through stdin and executes hidden UTF16LE EncodedCommand before shared decoding.
 * @evidence contracts/common.md#clear-and-simple-design Program text and variable request data have separate transport channels; pure result interpretation remains in decodeWindowsProcessResult and native handle ownership remains inside each program.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shell-built variable request is executed, Windows windowsHide remains true and no test-mode native implementation is installed; this synchronous composition alone does not prove actual OS behavior.
 * @evidence contracts/common.md#meaningful-documentation Documents fixed script encoding, JSON request transport, hidden execution and the separate real-native observation obligation.
 * @evidence contracts/performance.md#efficient-algorithms Encoding/JSON work scales with fixed program and request bytes plus native command cost; stdout/stderr buffering is capped at four MiB and overflow surfaces through the original spawn error.
 * @evidence contracts/performance.md#reuse-equivalent-work Fixed program strings are supplied by one immutable owner, while each actual identity/snapshot/stop still requires a fresh process operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources spawnSync completes its child/pipe scope before return, while the selected native script owns process-handle disposal; returned parsed values retain no command process.
 */
export function runWindowsProcessOperation(
  program: string,
  input: unknown,
): unknown {
  const script: string =
    "$ErrorActionPreference = 'Stop'\n" +
    "$request = [Console]::In.ReadToEnd() | ConvertFrom-Json\n" +
    program;
  return decodeWindowsProcessResult(
    spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64"),
      ],
      {
        windowsHide: true,
        encoding: "utf8",
        input: JSON.stringify(input),
        maxBuffer: 4 * 1024 * 1024,
      },
    ),
  );
}
