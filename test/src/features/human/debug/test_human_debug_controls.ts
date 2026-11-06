import { strict as assert } from "node:assert";
import path from "node:path";
import { createContext, runInContext, type Context } from "node:vm";
import { JSDOM } from "jsdom";

import { HumanDebugOptions } from "../../../../../packages/human/debug/contracts/HumanDebugOptions";
import type { IHumanDebugOptions } from "../../../../../packages/human/debug/contracts/IHumanDebugOptions";
import type { HumanDebugControls } from "../../../../../packages/human/debug/page/HumanDebugControls";
import { HumanDebugPageWork } from "../../../../../packages/human/debug/page/HumanDebugPageWork";

/**
 * Real sidebar events compose admitted intent while older page jobs finish.
 *
 * Scenarios:
 * 1. Two rapid visibility changes survive an older completion and a later shade change.
 * 2. The same intent survives the first operation's failure and the next operation succeeds.
 *
 * @evidence contracts/testing.md#behavioral-verification Bundles the maintained Controls with the installed Vite build API, executes it in an owned VM realm over actual JSDOM elements, and routes its real changed callbacks through the production page work owner. No source text is rewritten and no foreign method/global is replaced.
 * @evidence contracts/testing.md#independent-expectations Hiding distinct a/0 then b/0 must retain both exact ids before any draw. An older completion cannot recheck b or erase its requested hide. A third shade change during the second pending job must retain both hides; one first-job failure must not prevent that result.
 * @evidence contracts/testing.md#distinguishing-cases Covers successful and rejecting first work, two rapid real row changes, an older show, a subsequent real field change, request revision identity and recovered ordering. CPU DOM state does not prove actual camera/GPU rendering or Human generation.
 * @evidence contracts/testing.md#execution-ownership CPU DOM integration test selected by human_debug_controls. Vite build uses configFile:false/write:false with no server/watch; each VM/JSDOM realm is test-owned and its window closes in finally. No person is generated and no viewer/capture request is sent.
 */
export async function test_human_debug_controls(): Promise<void> {
  const vite: typeof import("vite", { with: { "resolution-mode": "import" } }) = await import("vite");
  const human: string = path.resolve(__dirname, "../../../../../packages/human");
  const entrySource: string = path.join(human, "debug/page/HumanDebugControls.ts");
  const bundled: Awaited<ReturnType<typeof vite.build>> = await vite.build({
    configFile: false, root: human, logLevel: "warn",
    build: { write: false, minify: false, target: "es2022", lib: { entry: entrySource, name: "HumanDebugControlsSource", formats: ["iife"] } },
  });
  const outputs: Exclude<typeof bundled, unknown[]>[] = Array.isArray(bundled) ? bundled : [bundled];
  const chunks = outputs.flatMap((output: (typeof outputs)[number]) => {
    if (!("output" in output)) throw new Error("Expected an in-memory Controls build, not a watcher");
    return output.output.filter((item: (typeof output.output)[number]): boolean => item.type === "chunk");
  });
  const entry: (typeof chunks)[number] | undefined = chunks[0];
  if (chunks.length !== 1 || entry?.type !== "chunk" || !entry.isEntry || entry.facadeModuleId === null || path.resolve(entry.facadeModuleId) !== entrySource || entry.code.trim().length === 0)
    throw new Error("Expected exactly the maintained Controls entry with executable code");
  for (const failFirst of [false, true]) await exercise(entry.code, failFirst);
}

/** Execute the actual DOM consumer without changing Node globals or JSDOM's existing globals. */
async function exercise(code: string, failFirst: boolean): Promise<void> {
  const dom: JSDOM = new JSDOM("<!doctype html><div id='controls'></div>");
  try {
    const realm: Context = createContext({
      document: dom.window.document, window: dom.window, navigator: dom.window.navigator,
      HTMLInputElement: dom.window.HTMLInputElement, HTMLSelectElement: dom.window.HTMLSelectElement,
      HTMLElement: dom.window.HTMLElement, URLSearchParams, structuredClone, console,
    });
    runInContext(code, realm, { timeout: 30_000 });
    const exported: { HumanDebugControls: typeof HumanDebugControls } = (realm as { HumanDebugControlsSource: { HumanDebugControls: typeof HumanDebugControls } }).HumanDebugControlsSource;
    assert.equal(typeof exported.HumanDebugControls, "function");
    const release: ReturnType<typeof deferred> = deferred();
    const secondEntered: ReturnType<typeof deferred> = deferred();
    const releaseSecond: ReturnType<typeof deferred> = deferred();
    const work: HumanDebugPageWork = new HumanDebugPageWork((): void => {});
    const tasks: Promise<undefined>[] = [];
    const failures: unknown[] = [];
    const observed: IHumanDebugOptions[] = [];
    const firstFailure: Error = new Error("first apply failed");
    const controls: HumanDebugControls = new exported.HumanDebugControls(dom.window.document.getElementById("controls")!, (next: IHumanDebugOptions, notices: string[]): void => {
      const revision: number = controls.request(next);
      const index: number = tasks.length;
      const task: Promise<undefined> = work.apply(next, notices, async (options: IHumanDebugOptions): Promise<undefined> => {
        if (index === 0) {
          await release.promise;
          if (failFirst) throw firstFailure;
        } else if (index === 1) {
          secondEntered.resolve();
          await releaseSecond.promise;
        }
        controls.show(options, revision);
        observed.push(structuredClone(options));
        return undefined;
      });
      tasks.push(task);
      void task.catch((error: unknown): void => { failures.push(error); });
    });
    const defaults: IHumanDebugOptions = HumanDebugOptions.defaults();
    controls.show(defaults, controls.request(defaults));
    controls.list(["human.skin.a/0", "human.skin.b/0"], []);
    const a: HTMLInputElement = dom.window.document.querySelector<HTMLInputElement>('[data-id="human.skin.a/0"] input[type="checkbox"]')!;
    const b: HTMLInputElement = dom.window.document.querySelector<HTMLInputElement>('[data-id="human.skin.b/0"] input[type="checkbox"]')!;
    a.checked = false;
    a.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    b.checked = false;
    b.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    assert.deepEqual(controls.requested().hide, ["a/0", "b/0"]);
    release.resolve();
    await secondEntered.promise;
    assert.deepEqual(controls.requested().hide, ["a/0", "b/0"]);
    assert.equal(a.checked, false);
    assert.equal(b.checked, false);
    const shade: HTMLSelectElement | undefined = [...dom.window.document.querySelectorAll<HTMLSelectElement>("select")].find((select: HTMLSelectElement): boolean => [...select.options].some((option: HTMLOptionElement): boolean => option.value === "normals"));
    assert.ok(shade);
    shade.value = "normals";
    shade.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    assert.deepEqual(controls.requested().hide, ["a/0", "b/0"]);
    releaseSecond.resolve();
    const results: PromiseSettledResult<undefined>[] = await Promise.allSettled(tasks);
    assert.equal(results.filter((result: PromiseSettledResult<undefined>): boolean => result.status === "rejected").length, failFirst ? 1 : 0);
    assert.deepEqual(failures, failFirst ? [firstFailure] : []);
    assert.deepEqual(observed[observed.length - 1]!.hide, ["a/0", "b/0"]);
    assert.equal(observed[observed.length - 1]!.shade, "normals");
    assert.deepEqual(controls.requested().hide, ["a/0", "b/0"]);
    assert.equal(controls.requested().shade, "normals");
    work.close();
  } finally {
    dom.window.close();
  }
}

/** A caller-owned explicit gate, with no clock or task-runner substitution. */
function deferred(): { promise: Promise<undefined>; resolve(): void } {
  let release!: () => void;
  const promise: Promise<undefined> = new Promise<undefined>((resolve: (value: undefined) => void): void => { release = (): void => resolve(undefined); });
  return { promise, resolve: release };
}
