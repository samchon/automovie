import chalk from "chalk";
import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import type { IScenarioFile } from "./IScenarioFile";
import type { IScenarioLimits } from "./IScenarioLimits";
import type { IScenarioMark } from "./IScenarioMark";
import type { IScenarioOutcome } from "./IScenarioOutcome";
import { readScenarioJournal } from "./readScenarioJournal";

/**
 * Run one spec file's scenarios in a process of its own and return their
 * verdicts; a stall, a crash or a failed load ends that process only, and it is
 * reported here as a failure by name before the runner goes on.
 *
 * The process runs `executeScenarioFile`, which prints each completed
 * scenario's `✓`/`✗` line itself and journals its marks. Once the process ends,
 * the journal gives every completed scenario's verdict. A scenario that started
 * and never completed failed: it stalled when its process left a `stall` mark,
 * with the paused frames as its stack; it crashed otherwise, with the exit code
 * or signal, its own error output above. A process that ended in failure before
 * any scenario started failed to load, and is named by its file. One that
 * failed after its last scenario completed is reported as a failure of its file
 * too.
 *
 * The process is the scenario's own watch's to end. The runner ends it only as
 * a backstop: when no mark has come for `limit` plus twice `grace` seconds,
 * longer than the watch's own worst case of `limit` plus `grace`, its
 * one-second poll and its one-second wait before the kill.
 *
 * @param props The file, the scenario entry, the journal and the clock.
 * @returns The verdict of every scenario of the file, or one failure named by
 *   the file.
 * @evidence contracts/development/implementation.md#principled-implementation Isolation is a process per spec file. A worker thread would also give each file a module registry of its own, but it shares the process: its working directory, signal handlers, native addons, the main heap and any native crash. A process isolates all of them, and the stall watch's inspector pause of a process's main thread works in it unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Either isolation reloads a file's whole import graph, since a worker has a registry of its own too, so the per-file cost is the same class; a process adds one bootstrap of Node per file, and the bytecode of the shared modules is reused across processes through Node's compile cache (the runner sets `NODE_COMPILE_CACHE`).
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns one process and one poll timer at a time; the timer is cleared when the process ends, and the journal stays the runner's to remove.
 */
export async function runScenarioProcess(
  props: runScenarioProcess.IProps,
): Promise<IScenarioOutcome[]> {
  fs.writeFileSync(props.journal, "");
  const spawned: number = Date.now();
  const child: ChildProcess = spawn(
    process.execPath,
    [...process.execArgv, props.entry, props.file.location, props.journal],
    { stdio: "inherit", env: props.environment },
  );

  // The backstop: the latest mark, or the spawn, older than the watch's
  // worst case ends the process.
  let backstop: boolean = false;
  const wait: number = (props.limits.limit + 2 * props.limits.grace) * 1000;
  const poll: NodeJS.Timeout = setInterval((): void => {
    const last: number =
      readScenarioJournal(props.journal).at(-1)?.at ?? spawned;
    if (Date.now() - last <= wait) return;
    backstop = true;
    child.kill("SIGKILL");
  }, 1000);
  const exit: runScenarioProcess.IExit = await new Promise(
    (resolve: (exit: runScenarioProcess.IExit) => void): void => {
      child.on("error", (error: Error): void =>
        resolve({ code: null, signal: null, error }),
      );
      child.on(
        "exit",
        (code: number | null, signal: NodeJS.Signals | null): void =>
          resolve({ code, signal, error: null }),
      );
    },
  );
  clearInterval(poll);

  const marks: IScenarioMark[] = readScenarioJournal(props.journal);
  const outcomes: IScenarioOutcome[] = marks
    .filter(
      (mark: IScenarioMark): mark is IScenarioMark.IComplete =>
        mark.kind === "complete",
    )
    .map(
      (mark: IScenarioMark.IComplete): IScenarioOutcome => ({
        name: mark.name,
        passed: mark.passed,
      }),
    );
  const stall: IScenarioMark.IStall | undefined = marks.find(
    (mark: IScenarioMark): mark is IScenarioMark.IStall =>
      mark.kind === "stall",
  );
  const last: IScenarioMark | undefined = marks
    .filter((mark: IScenarioMark): boolean => mark.kind !== "stall")
    .at(-1);
  const clean: boolean =
    exit.error === null && exit.code === 0 && exit.signal === null;

  // A scenario that started and never completed.
  if (last !== undefined && last.kind === "start") {
    fail(
      last.name,
      Date.now() - last.at,
      stall !== undefined
        ? stalled(stall, props.limits)
        : backstop
          ? ended(last.name, props.limits)
          : crashed(last.name, exit),
    );
    return [...outcomes, { name: last.name, passed: false }];
  }
  if (clean) return outcomes;

  // The file failed before any scenario started, or after its last one.
  const name: string = path.parse(props.file.name).name;
  fail(
    name,
    Date.now() - (last?.at ?? spawned),
    stall !== undefined
      ? stalled(stall, props.limits)
      : backstop
        ? ended(`${props.file.name} (import)`, props.limits)
        : last === undefined
          ? plain(
              `${props.file.name} failed to load: its process exited with ${describe(exit)} before any scenario started; its own error output above holds the cause`,
            )
          : crashed(`${props.file.name} after its last scenario`, exit),
  );
  return [...outcomes, { name, passed: false }];
}

/** Companion types of {@link runScenarioProcess}. */
export namespace runScenarioProcess {
  /** What one spec file's process is run with. */
  export interface IProps {
    /**
     * The scenario process's entry, `executeScenarioFile` with the program's
     * extension.
     */
    entry: string;

    /** The spec file. */
    file: IScenarioFile;

    /**
     * The journal's path, a file the runner owns and removes; it is emptied
     * here before the process starts.
     */
    journal: string;

    /** The clock. */
    limits: IScenarioLimits;

    /**
     * The process's environment: the runner's own, with the compile cache it
     * shares.
     */
    environment: NodeJS.ProcessEnv;
  }

  /** How a scenario process ended. */
  export interface IExit {
    /** The exit code, or null when a signal ended it or it never started. */
    code: number | null;

    /** The signal that ended it, or null. */
    signal: NodeJS.Signals | null;

    /** The error that kept it from starting, or null. */
    error: Error | null;
  }
}

/** Print a failure the scenario's own process could not print, in its format. */
function fail(name: string, elapsed: number, error: Error): void {
  console.log(`${chalk.red("  ✗")} ${name} ${chalk.gray(`(${elapsed} ms)`)}`);
  console.log({ assertion: error, timing: null });
}

/**
 * A stall's error: its message, and the paused main thread's frames as its
 * stack.
 */
function stalled(mark: IScenarioMark.IStall, limits: IScenarioLimits): Error {
  const message: string = `${mark.name} stalled: it ran ${mark.seconds} s, past the ${limits.limit} s limit, so its process was ended${mark.stack.length === 0 ? "; its main thread could not be paused (blocked in native code), so no frames were read" : ""}`;
  const error: Error = new Error(message);
  error.stack = [
    `Error: ${message}`,
    ...mark.stack.map((frame: string): string => `    at ${frame}`),
  ].join("\n");
  return error;
}

/**
 * The backstop's error: the watch did not end the work in time, so the runner
 * did, without frames.
 */
function ended(name: string, limits: IScenarioLimits): Error {
  return plain(
    `${name} stalled: no mark came for ${limits.limit + 2 * limits.grace} s and its own watch did not end it, so the runner ended its process; no frames were read`,
  );
}

/** A crash's error: how the process ended. */
function crashed(name: string, exit: runScenarioProcess.IExit): Error {
  return plain(
    `${name} crashed: its process exited with ${describe(exit)} before completing; its own error output above holds the cause`,
  );
}

/**
 * An error whose stack is its message alone: the runner's own frames say
 * nothing of the scenario.
 */
function plain(message: string): Error {
  const error: Error = new Error(message);
  error.stack = `Error: ${message}`;
  return error;
}

/** How a process ended, in words. */
function describe(exit: runScenarioProcess.IExit): string {
  if (exit.error !== null) return `a start failure (${exit.error.message})`;
  if (exit.signal !== null) return `signal ${exit.signal}`;
  return `code ${exit.code}`;
}
