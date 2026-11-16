// Capture native V8 CPU samples from one unchanged, already bundled take tool.
// Bundle this tracked entry, then run: node profile.cjs <diagnose.cjs> <new-output-directory> [scene-id] [exact-take-label]
// Defaults select fall-and-rise / The scene. A captured profile never certifies an SDK take or a test pass.
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { type Interface, createInterface } from "node:readline";

import { SceneTakeProfileData } from "./SceneTakeProfileData";
import { SceneTakeProfileInspector } from "./SceneTakeProfileInspector";

/** Parent-observed sampling window in milliseconds; V8's actual microsecond interval is also recorded. */
const WINDOW: number = 30000;
/** Separate bounds for startup, each protocol request, and each cleanup wait. */
const STARTUP: number = 30000;
/** Each socket or child shutdown stage has a five-second bound. */
const CLEANUP: number = 5000;

/** The manifest owner supplies the verified identity used by stdout admission. */
type ISelected = SceneTakeProfileData.ISelected;
/** Observation shape belongs to the profiling data owner. */
type IResult = SceneTakeProfileData.IResult;

/**
 * Spawn an owned Node child with an 8 GiB old-space allowance, paused before its unchanged diagnostic bundle,
 * attach over its loopback Inspector WebSocket, and start native profiling when
 * its actual selected scene-take-start line arrives. Stop after 30 parent seconds from the start acknowledgement,
 * or an earlier SDK outcome, save the native profile, then close the socket and
 * terminate only this child. Full stdout, stderr and authored input JSON survive.
 *
 * Inspector requests, startup, polling and cleanup have independent deadlines.
 * Profiling begins after the parent observes stdout, so transport/admission delay
 * is explicit in the timestamps; the V8 interval can differ from the requested
 * window. The 30-second timer begins at its native start acknowledgement;
 * an early SDK outcome can shorten it. No runtime evaluation is used.
 * Node documents this native protocol at https://nodejs.org/api/inspector.html.
 * The overall deadline is 120 seconds plus at most 15 seconds for cleanup.
 *
 * @param bundle Existing esbuild diagnostic .cjs; its bytes are hashed, never rewritten.
 * @param output A new directory under an existing parent; existing output is refused.
 * @param scene The unchanged scene id supplied to the diagnostic.
 * @param take The exact authored take label; all original inputs are still logged.
 * @returns After the result and available evidence are saved and owned resources are released.
 * @throws {Error} When input/output admission or evidence persistence fails.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the CLI inputs, parent observation boundary, separate SDK outcome, evidence files and bounded owned-resource lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Uses only native Profiler enable/start/stop and runIfWaitingForDebugger over the owned child's loopback WebSocket; actual stdout triggers sampling without editing the measured program.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps child and evidence ownership in this host, native transport and bounded waits in SceneTakeProfileInspector, and JSON/hash admission plus independent observation records in SceneTakeProfileData.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the requested heap and sampling duration as named parameters, with no tuned SDK constant or replacement; an actual early SDK outcome shortens the sampling window. It neither measures a complete browser workload nor treats an incomplete SDK call as a refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms Copies output and one original bundle/map snapshot to disk, checks input and bundle hashes, and stores one V8 profile; parsing and evidence memory scale with emitted lines and the returned profile.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Runs only the existing diagnostic bundle and its public SDK path, with a fresh process and Inspector session per measurement.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Finally closes request timers, the socket, readline, output descriptors and the owned child; cleanup failures remain explicit errors instead of a successful measurement claim.
 */
export async function profileSceneTakes(
  bundle: string,
  output: string,
  scene: string = "fall-and-rise",
  take: string = "The scene",
): Promise<void> {
  const source: string = path.resolve(bundle);
  const directory: string = path.resolve(output);
  if (!fs.statSync(source).isFile() || !source.endsWith(".cjs"))
    throw new Error("Expected an existing bundled diagnostic .cjs");
  if (scene.length === 0 || take.length === 0)
    throw new Error("Scene and exact take label must be nonempty");
  fs.mkdirSync(directory);
  const descriptors: number[] = [];
  const result: IResult = SceneTakeProfileData.initial();
  let child: ChildProcessWithoutNullStreams | undefined;
  let inspector: ReturnType<typeof SceneTakeProfileInspector> | undefined;
  let lines: Interface | undefined;
  let endpoint: string | undefined;
  let failure: Error | undefined;
  let selected: ISelected | undefined;
  let executionSelected: boolean = false;
  let profiling: Promise<void> | undefined;
  let samplingStarted: number = 0;
  let cleaning: boolean = false;
  let stderrPrefix: string = "";
  let interrupted: string | null = null;

  /** Fail outstanding protocol requests as well as polling, including on parent interruption. */
  const fail: (error: unknown) => void = (error: unknown): void => {
    failure ??= new Error(message(error));
    inspector?.abort(failure);
  };
  /** Parent signals unwind this host's ownership boundary instead of abandoning its paused child. */
  const interrupt: (signal: NodeJS.Signals) => void = (
    signal: NodeJS.Signals,
  ): void => {
    interrupted = signal;
    fail(new Error("Profile host interrupted by " + signal));
  };
  const onInterrupt: () => void = (): void => interrupt("SIGINT");
  const onTerminate: () => void = (): void => interrupt("SIGTERM");
  const deadline: ReturnType<typeof setTimeout> = setTimeout(
    (): void =>
      fail(new Error("Profile host exceeded its 120-second overall deadline")),
    120000,
  );
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onTerminate);

  try {
    const stdout: number = fs.openSync(
      path.join(directory, "runner.log"),
      "wx",
    );
    descriptors.push(stdout);
    const stderr: number = fs.openSync(
      path.join(directory, "runner.err"),
      "wx",
    );
    descriptors.push(stderr);
    const archivedBundle: string = path.join(directory, path.basename(source));
    fs.copyFileSync(source, archivedBundle, fs.constants.COPYFILE_EXCL);
    const bundleSha256: string = createHash("sha256")
      .update(fs.readFileSync(archivedBundle))
      .digest("hex");
    if (
      createHash("sha256").update(fs.readFileSync(source)).digest("hex") !==
      bundleSha256
    )
      throw new Error(
        "Diagnostic bundle changed while its snapshot was captured",
      );
    const sourceMap: string | null = fs.existsSync(source + ".map")
      ? source + ".map"
      : null;
    if (sourceMap !== null)
      fs.copyFileSync(
        sourceMap,
        path.join(directory, path.basename(sourceMap)),
        fs.constants.COPYFILE_EXCL,
      );
    const args: string[] = [
      "--max-old-space-size=8192",
      "--inspect-brk=127.0.0.1:0",
      source,
      scene,
      "--take",
      take,
    ];
    fs.writeFileSync(
      path.join(directory, "selection.json"),
      JSON.stringify(
        {
          node: process.execPath,
          nodeVersion: process.version,
          args,
          bundle: source,
          bundleSha256,
          archivedBundle,
          archivedSourceMap:
            sourceMap === null ? null : path.basename(sourceMap),
          overallLimitMs: 120000,
          cleanupBudgetMs: CLEANUP * 3,
          oldSpaceLimitMiB: 8192,
          requestedWindowMs: WINDOW,
          scene,
          take,
          cwd: process.cwd(),
          startedAt: new Date().toISOString(),
          parentPid: process.pid,
        },
        null,
        2,
      ),
      { flag: "wx" },
    );
    child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      shell: false,
      windowsHide: true,
      stdio: "pipe",
    });
    result.childPid = child.pid ?? null;
    child.once("spawn", (): void => {
      try {
        fs.writeFileSync(
          path.join(directory, "spawned.json"),
          JSON.stringify(
            {
              childPid: child?.pid ?? null,
              parentPid: process.pid,
              executable: process.execPath,
              args,
              bundleSha256,
              spawnObservedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
          { flag: "wx" },
        );
      } catch (error) {
        fail(error);
      }
    });
    child.on("error", fail);
    child.on(
      "close",
      (code: number | null, signal: NodeJS.Signals | null): void => {
        result.childClosed = true;
        result.childExitCode = code;
        result.childSignal = signal;
        if (!cleaning)
          fail(new Error("Diagnostic child closed before profile capture"));
      },
    );
    child.stdout.on("data", (chunk: Buffer): void => {
      try {
        fs.writeFileSync(stdout, chunk);
      } catch (error) {
        fail(error);
      }
    });
    child.stderr.on("data", (chunk: Buffer): void => {
      try {
        fs.writeFileSync(stderr, chunk);
        if (endpoint === undefined) {
          stderrPrefix = (stderrPrefix + chunk.toString("utf8")).slice(-8192);
          endpoint =
            /Debugger listening on (ws:\/\/127\.0\.0\.1:\d+\/[^\s]+)/.exec(
              stderrPrefix,
            )?.[1];
        }
      } catch (error) {
        fail(error);
      }
    });
    lines = createInterface({ input: child.stdout });
    lines.on("line", (line: string): void => {
      try {
        const event: Record<string, unknown> | null =
          SceneTakeProfileData.event(line);
        if (event === null || event.scene !== scene) return;
        if (event.event === "scene-takes-selection") {
          if (selected !== undefined)
            throw new Error("Repeated input manifest");
          selected = SceneTakeProfileData(event, take);
          fs.writeFileSync(path.join(directory, "inputs.json"), line + "\n", {
            flag: "wx",
          });
        } else if (event.event === "scene-takes-execution-selection") {
          const chosen: unknown = event.selected;
          if (
            selected === undefined ||
            event.mode !== "exact-label" ||
            !Array.isArray(chosen) ||
            chosen.length !== 1 ||
            JSON.stringify(chosen[0]) !== JSON.stringify(selected)
          )
            throw new Error(
              "Diagnostic execution selection differs from the admitted literal input",
            );
          executionSelected = true;
          fs.writeFileSync(
            path.join(directory, "execution.json"),
            line + "\n",
            { flag: "wx" },
          );
        } else if (event.event === "scene-take-start") {
          if (
            !executionSelected ||
            selected === undefined ||
            event.index !== selected.index ||
            event.sha256 !== selected.sha256 ||
            event.label !== take ||
            profiling !== undefined
          )
            throw new Error("Unexpected or repeated diagnostic take start");
          result.sdkOutcome = "incomplete";
          result.takeStartObservedAt = new Date().toISOString();
          result.profilerStartRequestedAt = new Date().toISOString();
          if (inspector === undefined)
            throw new Error("Inspector is unavailable at the take start");
          profiling = inspector.request("Profiler.start").then((): void => {
            samplingStarted = performance.now();
            result.profilerStartAcknowledgedAt = new Date().toISOString();
          });
          void profiling.catch(fail);
        } else if (event.event === "scene-take-end") {
          if (
            selected === undefined ||
            event.index !== selected.index ||
            profiling === undefined ||
            result.sdkOutcome !== "incomplete" ||
            !["track", "refusal", "error", "thrown"].includes(
              String(event.outcome),
            )
          )
            throw new Error("Unexpected diagnostic take outcome");
          result.sdkOutcome = event.outcome as IResult["sdkOutcome"];
        } else if (event.event === "scene-takes-complete") {
          if (
            event.selected !== 1 ||
            event.completed !== 1 ||
            result.sdkComplete ||
            !["track", "refusal", "error", "thrown"].includes(result.sdkOutcome)
          )
            throw new Error(
              "Diagnostic completion does not complete the selected take",
            );
          result.sdkComplete = true;
        }
      } catch (error) {
        fail(error);
      }
    });

    await SceneTakeProfileInspector.waitFor(
      (): boolean => endpoint !== undefined,
      STARTUP,
      "Inspector endpoint",
      (): Error | undefined => failure,
    );
    if (endpoint === undefined)
      throw new Error("Inspector endpoint unavailable");
    const connected: ReturnType<typeof SceneTakeProfileInspector> =
      SceneTakeProfileInspector(endpoint, fail);
    inspector = connected;
    await connected.ready(STARTUP);
    await connected.request("Profiler.enable");
    await connected.request("Runtime.runIfWaitingForDebugger");
    await SceneTakeProfileInspector.waitFor(
      (): boolean => profiling !== undefined,
      STARTUP,
      "selected take start",
      (): Error | undefined => failure,
    );
    await profiling;
    await SceneTakeProfileInspector.waitFor(
      (): boolean =>
        performance.now() - samplingStarted >= WINDOW ||
        result.sdkOutcome !== "incomplete",
      WINDOW + SceneTakeProfileInspector.REQUEST_LIMIT,
      "sampling window",
      (): Error | undefined => failure,
    );
    result.stopReason =
      result.sdkOutcome === "incomplete" ? "window" : "sdk-ended";
    result.profilerStopRequestedAt = new Date().toISOString();
    const stopped: Record<string, unknown> =
      await connected.request("Profiler.stop");
    const profile: Record<string, unknown> | null = SceneTakeProfileData.record(
      stopped.profile,
    );
    if (
      profile === null ||
      !Array.isArray(profile.nodes) ||
      typeof profile.startTime !== "number" ||
      typeof profile.endTime !== "number" ||
      profile.endTime < profile.startTime
    )
      throw new Error("Inspector did not return a native CPU profile");
    fs.writeFileSync(
      path.join(directory, "profile.cpuprofile"),
      JSON.stringify(profile),
      { flag: "wx" },
    );
    result.profileDurationMicroseconds = profile.endTime - profile.startTime;
    result.profileCaptured = true;
    result.sourceUnchangedAfterCapture =
      createHash("sha256").update(fs.readFileSync(source)).digest("hex") ===
      bundleSha256;
    if (!result.sourceUnchangedAfterCapture)
      throw new Error(
        "Diagnostic bundle changed during the captured measurement",
      );
  } catch (error) {
    result.error = message(error);
  } finally {
    cleaning = true;
    clearTimeout(deadline);
    fail(new Error("Profile host is closing"));
    try {
      inspector?.close();
    } catch (error) {
      result.cleanupErrors.push(message(error));
    }
    if (child !== undefined && !result.childClosed) {
      result.terminationRequested = true;
      try {
        child.kill("SIGTERM");
        await SceneTakeProfileInspector.waitFor(
          (): boolean => result.childClosed,
          CLEANUP,
          "child termination",
        );
      } catch {
        try {
          child.kill("SIGKILL");
          await SceneTakeProfileInspector.waitFor(
            (): boolean => result.childClosed,
            CLEANUP,
            "child forced termination",
          );
        } catch (error) {
          result.cleanupErrors.push(message(error));
        }
      }
    }
    if (inspector !== undefined) {
      try {
        await inspector.closed(CLEANUP);
      } catch (error) {
        result.cleanupErrors.push(message(error));
      }
    }
    lines?.close();
    child?.stdout.destroy();
    child?.stderr.destroy();
    child?.stdin.destroy();
    child?.unref();
    for (const descriptor of descriptors) {
      try {
        fs.closeSync(descriptor);
      } catch (error) {
        result.cleanupErrors.push(message(error));
      }
    }
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
    if (interrupted !== null)
      result.error ??= "Profile host interrupted by " + interrupted;
    fs.writeFileSync(
      path.join(directory, "result.json"),
      JSON.stringify(
        {
          ...result,
          interrupted,
          finishedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      { flag: "wx" },
    );
  }
  console.log(
    JSON.stringify({
      event: "scene-profile-result",
      output: directory,
      ...result,
    }),
  );
  if (
    !result.profileCaptured ||
    result.error !== null ||
    result.cleanupErrors.length !== 0 ||
    result.sdkOutcome === "error" ||
    result.sdkOutcome === "thrown"
  )
    process.exitCode = 1;
}

/** Keep a failure's message without asking the measured child to evaluate anything. */
function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** CLI arguments remain separate spawn arguments, so paths and labels never enter a shell command. */
const args: string[] = process.argv.slice(2);
if (args.length < 2 || args.length > 4) {
  console.error(
    "Usage: profileSceneTakes <diagnose.cjs> <new-output-directory> [scene-id] [exact-take-label]",
  );
  process.exitCode = 1;
} else {
  void profileSceneTakes(args[0]!, args[1]!, args[2], args[3]).catch(
    (error: unknown): void => {
      console.error(message(error));
      process.exitCode = 1;
    },
  );
}
