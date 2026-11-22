import { Worker } from "node:worker_threads";

/**
 * Watch the running scenario from a thread of its own, so a scenario whose
 * synchronous work never returns still ends the run by name. The scenario
 * runs on the main thread, where nothing else can run while it computes; a
 * worker thread keeps the clock. When the scenario has run past `limit`
 * seconds, the worker connects an inspector session to the main thread,
 * pauses it (V8 interrupts a busy loop at its next back edge) and writes the
 * scenario's name with the main thread's JavaScript stack to standard error,
 * then ends the process with exit code 1, so the run completes and its log
 * shows the stalled read. A main thread the pause cannot reach within
 * `GRACE` seconds (blocked in native code) is ended with its name alone.
 *
 * @param limit Seconds a scenario may run before it is a stall.
 * @returns The runner's two marks: a scenario's start by name and its completion.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A scenario past the limit ends the run with a `scenario-stall` record naming it and its main-thread stack; one that completes in time clears the watch and the run continues unchanged.
 * @evidence contracts/development/testing.md#independent-expectations The stack is the inspector's own paused call frames of the main thread, not a value the scenario reports; the limit is the runner's, read from the environment.
 * @evidence contracts/development/testing.md#distinguishing-cases A busy synchronous loop is paused and named with its stack; a main thread blocked in native code is named without one after the grace period.
 * @evidence contracts/development/testing.md#execution-ownership The runner's one worker thread, unreferenced so it never keeps a finished run alive; it reads only the marks the main thread posts and the inspector's frames.
 */
export function watchScenarioStall(limit: number): {
  start: (name: string) => void;
  complete: () => void;
} {
  const worker: Worker = new Worker(WATCHER, {
    eval: true,
    workerData: { limit: limit * 1000, grace: GRACE * 1000 },
  });
  worker.unref();
  return {
    start: (name: string): void =>
      worker.postMessage({ name, started: Date.now() }),
    complete: (): void => worker.postMessage(null),
  };
}

/** Seconds the watcher waits for the paused main thread's frames before it ends the run without them (provisional). */
const GRACE: number = 10;

/** The watcher thread's script: CommonJS, run by `eval`, so it needs no build of its own. */
const WATCHER: string = `
const { parentPort, workerData } = require("node:worker_threads");
const { Session } = require("node:inspector");
const { writeSync } = require("node:fs");
let running = null;
parentPort.on("message", (mark) => { running = mark; });
const end = (record) => {
  writeSync(2, JSON.stringify(record) + "\\n");
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
  const fallback = setTimeout(() => end({ stage: "scenario-stall", name, seconds, stack: null }), workerData.grace);
  session.on("Debugger.paused", ({ params }) => {
    clearTimeout(fallback);
    const stack = params.callFrames.map((f) =>
      (f.functionName || "<anonymous>") + " (" + f.url + ":" + (f.location.lineNumber + 1) + ":" + (f.location.columnNumber + 1) + ")");
    end({ stage: "scenario-stall", name, seconds, stack });
  });
  session.post("Debugger.enable", () => session.post("Debugger.pause"));
}, 1000);
`;
