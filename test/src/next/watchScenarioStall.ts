import { Worker } from "node:worker_threads";

import type { IScenarioLimits } from "./IScenarioLimits";

/**
 * Watch the work of one scenario process from a thread of its own, so work
 * whose synchronous computation never returns still ends by name, and ends only
 * its own process: the runner gives every spec file a process of its own, so
 * the next file still runs.
 *
 * The work runs on the process's main thread, where nothing else can run while
 * it computes; a worker thread keeps the clock. Once the marked work has run
 * past `limit` seconds, the worker connects an inspector session to the main
 * thread, pauses it (V8 interrupts a busy loop at its next back edge), appends
 * a `stall` mark with the work's name and the main thread's frames to the
 * journal and writes the same record to standard error, then ends the process.
 * A main thread the pause cannot reach within `grace` seconds (blocked in
 * native code) is ended with its name and no frames.
 *
 * The journal append is synchronous file I/O from the watcher's own thread, so
 * the mark is on disk before the process is killed; the runner reads it there
 * once the process has ended.
 *
 * @param limits The limit and the grace, seconds.
 * @param journal The path of the process's journal.
 * @returns The two marks of the watched work: its start by name and its
 *   completion.
 * @evidence contracts/development/implementation.md#principled-implementation The pause is the inspector's own `Debugger.pause`, which V8 honours at the next interrupt check of the busy main thread; the frames are the paused call frames, not a value the scenario reports.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One unreferenced worker per scenario process; it reads only the marks the main thread posts, so a stall ends this process and the runner, in another process, reports it and goes on.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The worker is unreferenced, so it never keeps a finished process alive; it ends with its process.
 */
export function watchScenarioStall(
  limits: IScenarioLimits,
  journal: string,
): watchScenarioStall.IWatch {
  const worker: Worker = new Worker(WATCHER, {
    eval: true,
    workerData: {
      limit: limits.limit * 1000,
      grace: limits.grace * 1000,
      journal,
    },
  });
  worker.unref();
  return {
    start: (name: string): void =>
      worker.postMessage({ name, started: Date.now() }),
    complete: (): void => worker.postMessage(null),
  };
}

/** Companion types of {@link watchScenarioStall}. */
export namespace watchScenarioStall {
  /** The marks the watched work posts to the watcher. */
  export interface IWatch {
    /**
     * The named work starts now; its clock starts with it, replacing any
     * earlier work's.
     */
    start: (name: string) => void;

    /** The running work completed; nothing is watched until the next start. */
    complete: () => void;
  }
}

/**
 * The watcher thread's script: CommonJS, run by `eval`, so it needs no build of
 * its own.
 */
const WATCHER: string = `
const { parentPort, workerData } = require("node:worker_threads");
const { Session } = require("node:inspector");
const { appendFileSync, writeSync } = require("node:fs");
let running = null;
parentPort.on("message", (mark) => { running = mark; });
const end = (name, seconds, stack) => {
  const record = { kind: "stall", name, at: Date.now(), seconds, stack };
  appendFileSync(workerData.journal, JSON.stringify(record) + "\\n");
  writeSync(2, JSON.stringify({ stage: "scenario-stall", name, seconds, stack }) + "\\n");
  process.kill(process.pid, "SIGTERM");
  setTimeout(() => process.kill(process.pid, "SIGKILL"), 1000);
};
const timer = setInterval(() => {
  if (running === null || Date.now() - running.started <= workerData.limit) return;
  clearInterval(timer);
  const name = running.name;
  const seconds = (Date.now() - running.started) / 1000;
  const session = new Session();
  session.connectToMainThread();
  const fallback = setTimeout(() => end(name, seconds, []), workerData.grace);
  // A frame of an ES module names its script only by id; the scripts the
  // debugger reports as it is enabled give each id its URL.
  const scripts = new Map();
  session.on("Debugger.scriptParsed", ({ params }) => { scripts.set(params.scriptId, params.url); });
  session.on("Debugger.paused", ({ params }) => {
    clearTimeout(fallback);
    const stack = params.callFrames.map((f) =>
      (f.functionName || "<anonymous>") + " (" + (f.url || scripts.get(f.location.scriptId) || "") + ":" + (f.location.lineNumber + 1) + ":" + (f.location.columnNumber + 1) + ")");
    end(name, seconds, stack);
  });
  session.post("Debugger.enable", () => session.post("Debugger.pause"));
}, 1000);
`;
