import { readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

/**
 * The actual HTML bootstrap preserves failures that happen before the module
 * entry can mount, without treating later runtime errors as boot failures.
 *
 * Scenarios:
 * 1. A pre-handle ErrorEvent keeps the original Error stack and notice text.
 * 2. A non-Error exception keeps the event's message and source location.
 * 3. An already published handle admits no new boot-failure marker.
 * 4. The module element's transient failure marker survives a later error.
 * 5. A second pre-handle error cannot replace the first failure's cause.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the real debug.html inline bootstrap in JSDOM and dispatches runtime ErrorEvents and the module element's error event. It catches lost original causes, object-to-string loss, overwritten first failures and post-mount errors mislabeled as boot failures.
 * @evidence contracts/testing.md#independent-expectations Literal authored stack/message/location values must reach the marker unchanged. A published handle means mounting has ended; an existing failure owns its original cause. No implementation-derived generated snapshot is used. Synthetic event delivery does not establish a browser's real module-evaluation event or a successful hardware frame.
 * @evidence contracts/testing.md#distinguishing-cases Covers Error and primitive causes, before and after handle publication, permanent versus transient failures and repeated failures. Actual synchronous mount, module fetching, ready, drawing and hardware capture remain the real viewer's integration boundary.
 * @evidence contracts/testing.md#execution-ownership One synchronous portable DOM unit reached by --include human_debug_boot_failure. It reads the maintained page and owns/closes every JSDOM window in finally; it enables only inline script execution and starts no server, module fetch, browser, renderer or person generation.
 */
export function test_human_debug_boot_failure(): void {
  const html: string = readFileSync(path.resolve(__dirname, "../../../../../packages/human/debug.html"), "utf8");
  const failures: string[] = [];
  for (const scenario of ["error", "primitive", "mounted", "transient", "repeated"] as const) {
    const dom: JSDOM = new JSDOM(html, { runScripts: "dangerously", virtualConsole: new VirtualConsole() });
    try {
      const state: { __humanDebug?: unknown; __humanDebugFailed?: unknown } = dom.window as unknown as { __humanDebug?: unknown; __humanDebugFailed?: unknown };
      const cause: Error = new dom.window.Error("dependency failed");
      cause.stack = "Error: dependency failed\n    at dependency.ts:7:3";
      if (scenario === "mounted") state.__humanDebug = {};
      if (scenario === "transient") dom.window.document.querySelector<HTMLScriptElement>('script[type="module"]')!.dispatchEvent(new dom.window.Event("error"));
      const event: ErrorEvent = new dom.window.ErrorEvent("error", {
        error: scenario === "primitive" ? "missing binding" : cause,
        message: scenario === "primitive" ? "Uncaught missing binding" : cause.message,
        filename: "https://example.org/dependency.ts",
        lineno: 7,
        colno: 3,
        cancelable: true,
      });
      dom.window.dispatchEvent(event);
      if (scenario === "repeated") dom.window.dispatchEvent(new dom.window.ErrorEvent("error", { error: new dom.window.Error("second cause"), message: "second cause" }));
      const expected: string | undefined = scenario === "mounted"
        ? undefined
        : scenario === "transient"
          ? "the page module graph failed to load"
          : "mount-failed:\n" + (scenario === "primitive" ? "Uncaught missing binding\nhttps://example.org/dependency.ts:7:3" : cause.stack);
      if (state.__humanDebugFailed !== expected) failures.push(`${scenario}: expected ${String(expected)}, got ${String(state.__humanDebugFailed)}`);
      if (event.defaultPrevented) failures.push(`${scenario}: the bootstrap suppressed the original runtime error`);
      const notice: string = dom.window.document.getElementById("notices")!.textContent ?? "";
      if (scenario === "mounted" ? notice !== "" : !notice.includes(scenario === "primitive" ? "Uncaught missing binding" : scenario === "transient" ? expected! : cause.stack!)) failures.push(`${scenario}: notice lost the failure detail`);
    } catch (error) {
      failures.push(`${scenario}: ${String(error)}`);
    } finally {
      dom.window.close();
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
