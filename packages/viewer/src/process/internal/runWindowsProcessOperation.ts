import { spawnSync } from "node:child_process";

import { decodeWindowsProcessResult } from "./decodeWindowsProcessResult.ts";

/**
 * Execute a fixed native host program through hidden PowerShell. JSON stdin
 * carries variable inputs; UTF-16LE EncodedCommand carries the fixed program.
 * The native process result is interpreted by the shared pure decoder. This
 * adapter's process creation and OS behavior need separate real observation.
 *
 * @evidence contracts/common.md#principled-implementation Uses PowerShell's supported encoded program transport and JSON input with explicit result interpretation.
 * @evidence contracts/common.md#clear-and-simple-design Owns the actual hidden subprocess effect without duplicating decoder or identity-admission policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never interpolates PIDs into shell code or replaces installed or native process methods.
 * @evidence contracts/common.md#meaningful-documentation States transports, window behavior and the real-OS observation boundary.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Runs the session's native process operation with explicit result and failure handling.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Implements the native Windows effect behind the controller's host port.
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
