import type { IAutoMovieMaterial, IAutoMovieMaterialOverlay, IAutoMovieModelPart } from "@automovie/interface";
import fs from "node:fs";
import inspector from "node:inspector";
import path from "node:path";

import { AutoMovieHumanAppearance } from "../../../../../packages/human/src/appearance/AutoMovieHumanAppearance";
import { AutoMovieHumanSkin } from "../../../../../packages/human/src/appearance/AutoMovieHumanSkin";
import { AutoMovieHumanVermilion } from "../../../../../packages/human/src/appearance/AutoMovieHumanVermilion";
import type { IAutoMovieHumanAppearanceBody } from "../../../../../packages/human/src/appearance/IAutoMovieHumanAppearanceBody";
import { AutoMovieHumanModelParts } from "../../../../../packages/human/src/AutoMovieHumanModelParts";
import { AutoMovieHumanShapeStages } from "../../../../../packages/human/src/AutoMovieHumanShapeStages";
import { AutoMovieHumanBodyAnatomy } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyConstruction } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyConstruction";
import { AutoMovieHumanBodyLaw } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanOralCavity } from "../../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import { AutoMovieHumanOralCavityAttempt } from "../../../../../packages/human/src/generation/AutoMovieHumanOralCavityAttempt";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { AutoMovieLoftContract, AutoMovieSolidBody, IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanLoftMesh } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftAperture } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanRig } from "../../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "../../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";

import { TestValidator } from "@nestia/e2e";
import { HumanDebugEnvironment } from "../../../../../packages/human/debug/server/HumanDebugEnvironment";
import { HumanDebugGenerationSlot } from "../../../../../packages/human/debug/server/HumanDebugGenerationSlot";
import { HumanDebugSourceHash } from "../../../../../packages/human/debug/server/HumanDebugSourceHash";
import { HumanPrepareProfileReport as Report } from "../../internal/HumanPrepareProfileReport";

/**
 * Read one cold staged Human generation or only its normal calibration.
 *
 * The stages use normal APIs without replacing foreign exports. State/cache key
 * assembly and admission performed by public prepare are outside this reading.
 * Sampling uses 1 ms intervals; precise call counting is optional and distorts
 * timing. Stage CPU/wall and memory values include failed work; heap readings
 * are boundaries, not peaks. Mesh strings, sets, hashes and report/source-map
 * processing occur after sampling stops and are timed separately.
 * AUTOMOVIE_HUMAN_PROFILE_STAGE=calibrate ends after the normal body law;
 * leaving it unset keeps the complete staged pipeline. Neither mode measures
 * public prepare's admission/cache wrapper or certifies a valid finished skin.
 *
 * Scenarios:
 * 1. Portable synthetic work/cleanup failures preserve the original error and
 *    release/disconnect despite secondary failures; no person is generated.
 * 2. The explicitly selected HumanPeople names each run once in the shared
 *    generation slot, through calibration only when explicitly selected.
 *    This campaign selects only f1; no saved shape is used.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples normal generation APIs and records actual stage boundaries, diagnostics, errors and available calibration or bound mesh payloads. Explicit calibration selection stops before surface, appearance and binding; the default retains the complete staged run. Synthetic failures assert original-error identity, failed-stage recording, cleanup continuation and scope validation; generation measurements have no pass threshold.
 * @evidence contracts/testing.md#independent-expectations Synthetic sentinel errors and owned probe/release callbacks independently expose masking or leaked cleanup. CPU, clocks and memory come from Node; the mesh digest describes emitted payloads without being a geometry oracle. Sampling, boundary-memory and partial loaded-script hash limitations are recorded.
 * @evidence contracts/testing.md#distinguishing-cases Exercises primary work failure plus failing stop/release/disconnect, cleanup-only failure, successful and throwing timed stages, absent/explicit/invalid observation scope, and one selected cold generation including partial failure output. Calibration-only output has one timed calibration and no later mesh/appearance/binding stage. Does not prove public prepare wrapper equivalence, peak heap, visual correctness or speedup versus another shape.
 * @evidence contracts/testing.md#execution-ownership One discoverable async CPU reading owns portable failure cases and the requested generation. It uses the existing absolute Environment/GenerationSlot acquire/finally release and inspector Session, with no browser, GPU, foreign-export replacement or new runner.
 */
export async function test_human_prepare_profile(): Promise<void> {
  const scope: Scope = scopeOf(process.env[STAGE_VARIABLE]);
  await failureCases();
  const listed: string | undefined = process.env[HumanPeople.SET_VARIABLE];
  const names: string[] = listed !== undefined && listed !== "" ? HumanPeople.names() : [HumanPeople.names()[0]!];
  const folder: string = path.join(ROOT, "packages", "human", ".shots", "profile", Report.stamp(new Date()));
  fs.mkdirSync(folder, { recursive: true });
  for (const name of names) await profileOne(name, folder, scope);
}

/** Repository root. */
const ROOT: string = path.resolve(__dirname, "..", "..", "..", "..", "..");
/** Optional exact function counting; it changes timings and defaults off. */
const CALLS_VARIABLE: string = "AUTOMOVIE_HUMAN_PROFILE_CALLS";
/** Optional observation boundary; only the explicit calibrate value is supported. */
const STAGE_VARIABLE: string = "AUTOMOVIE_HUMAN_PROFILE_STAGE";
/** Sampling interval in microseconds. */
const SAMPLING: number = 1000;
/** The observer's stopping point, without a production mode or geometry change. */
type Scope = "pipeline" | "calibrate";

/** Empty configuration preserves the pipeline; an unknown explicit boundary is an error. */
function scopeOf(value: string | undefined): Scope {
  if (value === undefined || value === "") return "pipeline";
  if (value === "calibrate") return "calibrate";
  throw new Error(`${STAGE_VARIABLE} accepts only calibrate or an unset value`);
}

/** Partial output retained only through this reading and its report. */
interface IRun {
  /** Completed and failed stage boundaries. */ stages: Report.IStage[];
  /** Measurement failures that must not mask a stage's own throw. */ observerErrors: unknown[];
  /** Available only after calibration returned. */ diagnostics?: AutoMovieLoftContract.IDiagnostic[];
  /** Bound parts, available only after binding returned. */ parts?: IAutoMovieModelPart[];
  /** Dressing materials, available after the staged run returned. */ materials?: IAutoMovieMaterial[];
  /** Calibration-only output retained until post-sampling counts are written. */ calibration?: IAutoMovieHumanBodyCalibration;
}
/** The narrow normal inspector seam, also exercised by owned synthetic callbacks. */
interface IProbe {
  /** Invoke one inspector method. */ post<T>(method: string, args?: object): Promise<T>;
  /** Disconnect the session. */ disconnect(): void;
}
/** One sampling attempt, including its primary and secondary failures. */
interface IObserved {
  /** Whether work or observation failed. */ failed: boolean;
  /** Original error, including a thrown undefined. */ error?: unknown;
  /** Cleanup errors, kept apart from the primary error. */ cleanup: unknown[];
  /** Sampling data, absent when stop itself failed. */ profile?: Report.IProfile;
  /** Optional function call counts. */ coverage: Report.IScriptCoverage[];
  /** Source maps and hashes of actual script text read from inspector. */ scripts: Map<string, Report.IScript>;
  /** Scripts unavailable after sampling, without inventing their contents. */ scriptErrors: string[];
  /** Milliseconds spent reading/mapping scripts after sampling stopped. */ scriptObservationMs: number;
}
/** A synchronous stage timer; no stage in this pipeline returns a promise. */
type ITimer = <T>(label: string, work: () => T) => T;

/** Preserve the first failure while retaining subsequent observation failures. */
function failure(state: IObserved, error: unknown, cleanup: boolean): void {
  if (cleanup) state.cleanup.push(error);
  if (!state.failed) { state.failed = true; state.error = error; }
}

/** Sample work, then stop/release/read maps/disconnect on every path. */
async function observe(connect: () => IProbe, work: () => void, release: () => void, counting: boolean): Promise<IObserved> {
  const out: IObserved = { failed: false, cleanup: [], coverage: [], scripts: new Map(), scriptErrors: [], scriptObservationMs: 0 };
  let probe: IProbe | undefined;
  let started: boolean = false;
  let covered: boolean = false;
  /** A secondary error never replaces a primary operation error. */
  const clean: (job: () => Promise<void>) => Promise<void> = async (job: () => Promise<void>): Promise<void> => {
    try { await job(); } catch (error) { failure(out, error, true); }
  };
  try {
    probe = connect();
    await probe.post("Profiler.enable");
    await probe.post("Profiler.setSamplingInterval", { interval: SAMPLING });
    if (counting) { await probe.post("Profiler.startPreciseCoverage", { callCount: true, detailed: false }); covered = true; }
    await probe.post("Profiler.start");
    started = true;
    work();
  } catch (error) {
    failure(out, error, false);
  } finally {
    if (probe !== undefined && started) await clean(async (): Promise<void> => {
      out.profile = (await probe!.post<{ profile: Report.IProfile }>("Profiler.stop")).profile;
    });
    if (probe !== undefined && covered) {
      await clean(async (): Promise<void> => { out.coverage = (await probe!.post<{ result: Report.IScriptCoverage[] }>("Profiler.takePreciseCoverage")).result; });
      await clean(async (): Promise<void> => { await probe!.post("Profiler.stopPreciseCoverage"); });
    }
    await clean(async (): Promise<void> => { release(); });

    const scriptObservationStarted: number = performance.now();

    // Script observation runs after sampling and after releasing the person slot.
    if (probe !== undefined && out.profile !== undefined) {
      await clean(async (): Promise<void> => { await probe!.post("Debugger.enable"); });
      const ids: Set<string> = new Set([
        ...out.profile.nodes.map((n: Report.INode): string => n.callFrame.scriptId),
        ...out.coverage.map((c: Report.IScriptCoverage): string => c.scriptId),
      ]);
      for (const id of ids) {
        if (id === "0") continue;
        try {
          const text: { scriptSource: string } = await probe.post("Debugger.getScriptSource", { scriptId: id });
          out.scripts.set(id, Report.script(text.scriptSource));
        } catch (error) { out.scriptErrors.push(id + ": " + errorText(error)); }
      }
      await clean(async (): Promise<void> => { await probe!.post("Debugger.disable"); });
    }
    if (probe !== undefined) await clean(async (): Promise<void> => { probe!.disconnect(); });
    out.scriptObservationMs = performance.now() - scriptObservationStarted;
  }
  return out;
}

/** A fresh inspector session using its normal API, with no patched namespace. */
function connect(): IProbe {
  const session: inspector.Session = new inspector.Session();
  session.connect();
  return {
    post: <T>(method: string, args?: object): Promise<T> => new Promise<T>((resolve: (value: T) => void, reject: (error: unknown) => void): void => {
      session.post(method, args ?? {}, (error: Error | null, result: unknown): void => error === null ? resolve(result as T) : reject(error));
    }),
    disconnect: (): void => session.disconnect(),
  };
}

/** Profile one selected person and save partial data before rethrowing its original error. */
async function profileOne(name: string, folder: string, scope: Scope): Promise<void> {
  const environment: ReturnType<typeof HumanDebugEnvironment> = HumanDebugEnvironment(path.join(ROOT, "packages", "human"));
  if (!path.isAbsolute(environment.slotRoot)) throw new Error("The shared generation slot root must be absolute");
  const params: IAutoMovieHumanParameters = HumanPeople.params(name);
  const result: IRun = { stages: [], observerErrors: [] };
  const waiting: number = performance.now();
  let slot: HumanDebugGenerationSlot | undefined;
  let slotWaitMs: number = 0;
  let sourceBefore: string | null = null;
  let sourceAfter: string | null = null;
  let observed: IObserved = { failed: false, cleanup: [], coverage: [], scripts: new Map(), scriptErrors: [], scriptObservationMs: 0 };
  const counting: boolean = process.env[CALLS_VARIABLE] === "1";
  console.log(JSON.stringify({ person: name, pid: process.pid, phase: "waiting-for-generation-slot", atUtc: new Date().toISOString(), slotRoot: environment.slotRoot, slots: environment.slots }));
  try {
    slot = await HumanDebugGenerationSlot.acquire(environment.slotRoot, environment.slots, "prepare profile " + name);
    slotWaitMs = performance.now() - waiting;
    try { sourceBefore = await HumanDebugSourceHash(environment); } catch (error) { result.observerErrors.push(error); }
    console.log(JSON.stringify({ person: name, pid: process.pid, phase: "before-generation", atUtc: new Date().toISOString(), slotWaitMs, sourceBefore, scope, counting, samplingMicroseconds: SAMPLING, memory: process.memoryUsage() }));
    observed = await observe(connect, (): void => run(params, result, scope), (): void => slot!.release(), counting);
  } catch (error) { failure(observed, error, false); }
  finally {
    // Covers an error before observe acquired its cleanup responsibility.
    if (slot !== undefined) try { slot.release(); } catch (error) { failure(observed, error, true); }
  }

  for (const error of result.observerErrors) failure(observed, error, true);
  try { sourceAfter = await HumanDebugSourceHash(environment); } catch (error) { failure(observed, error, true); }
  if (observed.profile !== undefined) try {
    fs.writeFileSync(path.join(folder, name + ".cpuprofile"), JSON.stringify(observed.profile));
  } catch (error) { failure(observed, error, true); }
  const observerStarted: number = performance.now();
  try {
    const geometry: ReturnType<typeof Report.geometry> | null = result.parts === undefined ? null : Report.geometry(result.parts);
    const lines: string[] = Report.format(name, result.stages, observed.profile, observed.coverage, observed.scripts, scope === "calibrate" ? "calibration stage only" : "cold staged pipeline");
    if (result.parts !== undefined) lines.push("", ...Report.meshes(result.parts));
    lines.push("", "=== skin overlays ===", ...(result.materials ?? []).flatMap((m: IAutoMovieMaterial): string[] =>
      (m.overlays ?? []).map((o: IAutoMovieMaterialOverlay): string => `${m.id} overlay ${o.blend} ${typeof o.baseColorTexture === "string" ? o.baseColorTexture : o.baseColorTexture.asset}`)));
    const metadata: object = {
      person: name, pid: process.pid, observedUtc: new Date().toISOString(), scope: scope === "calibrate" ? "normal API cold BodyLaw.calibrate only; no Human surface, appearance or binding" : "normal API cold staged pipeline; not the entire public prepare wrapper",
      slotWaitMs, sourceBefore, sourceAfter, sourceStable: sourceBefore !== null && sourceAfter !== null && sourceBefore === sourceAfter, counting, samplingMicroseconds: SAMPLING,
      stages: result.stages, failed: observed.failed, error: observed.failed ? errorText(observed.error) : null,
      cleanupErrors: observed.cleanup.map(errorText), observerErrors: result.observerErrors.map(errorText), diagnostics: result.diagnostics ?? null,
      calibration: result.calibration === undefined ? null : {
        chains: result.calibration.chains.length,
        layers: result.calibration.chains.reduce((sum: number, chain: IAutoMovieLoftChain): number => sum + chain.layers.length, 0),
        coefficientScalars: result.calibration.chains.reduce((sum: number, chain: IAutoMovieLoftChain): number => sum + chain.layers.reduce((total: number, layer: IAutoMovieLoftChain.ILayer): number => total + layer.coefficients.length, 0), 0),
        publishedBodies: result.calibration.bodies?.length ?? 0,
        publishedFaces: (result.calibration.bodies ?? []).reduce((sum: number, body: AutoMovieSolidBody.IPublished): number => sum + body.faces.length, 0),
      },
      geometry, memoryAfterPostSamplingObservers: process.memoryUsage(), reportPreparationMs: performance.now() - observerStarted,
      sampledScripts: [...observed.scripts].map(([id, script]: [string, Report.IScript]): object => ({ id, sha256: script.sha256 })),
      scriptErrors: observed.scriptErrors, scriptObservationMs: observed.scriptObservationMs,
      limits: "Boundary heap is not peak heap. Sampling includes timing/memory/logging overhead; precise coverage, when enabled, changes optimized execution. Disk hashes do not prove loaded transforms; script hashes cover only inspector scripts read from sampled/counting IDs. Calibration/mesh tally/hash/report and script mapping are outside sampling; reportPreparationMs excludes script mapping and file writes. Calibration return or a small payload does not prove complete/valid anatomy. No visual or historical speed comparison.",
    };
    lines.push("", "=== observation metadata ===", JSON.stringify(metadata, null, 2));
    console.log(lines.join("\n"));
    fs.writeFileSync(path.join(folder, name + ".json"), JSON.stringify(metadata, null, 2));
    fs.writeFileSync(path.join(folder, name + ".txt"), lines.join("\n") + "\n");
    console.log("profile saved to " + folder);
  } catch (error) { failure(observed, error, true); }
  if (observed.failed) {
    console.error("Profile primary error:", observed.error, "Observation/cleanup errors:", observed.cleanup);
    throw observed.error;
  }
}

/** Timed stages retain their partial boundary readings even when work throws. */
function timer(stages: Report.IStage[], observerErrors: unknown[]): ITimer {
  return function timed<T>(label: string, work: () => T): T {
    const before: NodeJS.MemoryUsage = process.memoryUsage();
    const cpu0: number = cpu();
    const wall0: number = performance.now();
    const row: Report.IStage = { label, wall: 0, cpu: 0, status: "failed", before };
    try {
      const out: T = work();
      row.status = "completed";
      return out;
    } catch (error) {
      row.error = errorText(error);
      throw error;
    } finally {
      row.wall = performance.now() - wall0;
      row.cpu = cpu() - cpu0;
      stages.push(row);
      try {
        row.after = process.memoryUsage();
        console.log(JSON.stringify({ phase: "stage-finished", ...row, atUtc: new Date().toISOString() }));
      } catch (error) { observerErrors.push(error); }
    }
  };
}

/** Work failure plus secondary cleanup failures must not mask it or skip another release. */
async function failureCases(): Promise<void> {
  TestValidator.equals("unset observation keeps the pipeline", scopeOf(undefined), "pipeline");
  TestValidator.equals("empty observation keeps the pipeline", scopeOf(""), "pipeline");
  TestValidator.equals("explicit calibration boundary", scopeOf("calibrate"), "calibrate");
  let refused: boolean = false;
  try { scopeOf("surface"); } catch { refused = true; }
  TestValidator.predicate("unknown observation boundary is refused", refused);
  const primary: Error = new Error("synthetic stage");
  const stop: Error = new Error("synthetic stop");
  const release: Error = new Error("synthetic release");
  const disconnect: Error = new Error("synthetic disconnect");
  const stages: Report.IStage[] = [];
  const observerErrors: unknown[] = [];
  let released: boolean = false;
  let disconnected: boolean = false;
  let coverageStopped: boolean = false;
  const fake: IProbe = {
    post: async <T>(method: string): Promise<T> => {
      if (method === "Profiler.stop") throw stop;
      if (method === "Profiler.stopPreciseCoverage") coverageStopped = true;
      return (method === "Profiler.takePreciseCoverage" ? { result: [] } : {}) as T;
    },
    disconnect: (): void => { disconnected = true; throw disconnect; },
  };
  const failed: IObserved = await observe((): IProbe => fake, (): void => timer(stages, observerErrors)("synthetic", (): never => { throw primary; }),
    (): void => { released = true; throw release; }, true);
  TestValidator.predicate("primary error survives all cleanup errors", failed.failed && failed.error === primary && failed.cleanup.includes(stop) && failed.cleanup.includes(release) && failed.cleanup.includes(disconnect));
  TestValidator.predicate("failed stage and every cleanup remain observable", stages.length === 1 && stages[0]!.status === "failed" && stages[0]!.error === primary.stack && released && disconnected && coverageStopped);
  const onlyCleanup: IObserved = await observe((): IProbe => fake, (): void => {}, (): void => {}, false);
  TestValidator.predicate("cleanup-only failure is surfaced", onlyCleanup.failed && onlyCleanup.error === stop);
  const positive: number = timer(stages, observerErrors)("synthetic completed", (): number => 17);
  TestValidator.predicate("successful timed work returns its own result", positive === 17 && stages[1]!.status === "completed");
  const initialization: Error = new Error("synthetic connect");
  let initializedWork: boolean = false;
  let initializationReleased: boolean = false;
  const init: IObserved = await observe((): IProbe => { throw initialization; }, (): void => { initializedWork = true; },
    (): void => { initializationReleased = true; }, false);
  TestValidator.predicate("initialization failure releases without running work", init.error === initialization && !initializedWork && initializationReleased);
}

/** This thread's CPU time in ms, with the process clock as the platform fallback. */
function cpu(): number {
  const usage: NodeJS.CpuUsage = typeof process.threadCpuUsage === "function" ? process.threadCpuUsage() : process.cpuUsage();
  return (usage.user + usage.system) / 1000;
}

/** Original stack where available, otherwise the thrown value's ordinary text. */
function errorText(error: unknown): string {
  try { return error instanceof Error ? error.stack ?? error.message : String(error); }
  catch { return "Thrown value could not be formatted"; }
}

/** Run the stages of `AutoMovieHuman.prepare` in its order, timing each. */
function run(params: IAutoMovieHumanParameters, result: IRun, scope: Scope): void {
  const timed: ITimer = timer(result.stages, result.observerErrors);
  const height: number = AutoMovieHumanBodyAnatomy.resolve(params).stature;

  // AutoMovieHumanShapeStages.shape
  const law: AutoMovieHumanBodyLaw.IOutput = timed("body law (calibrate)", (): AutoMovieHumanBodyLaw.IOutput => AutoMovieHumanBodyLaw.calibrate(params));
  const calibration: IAutoMovieHumanBodyCalibration = law.body;
  result.diagnostics = [...(calibration.diagnostics ?? [])];
  if (scope === "calibrate") {
    result.calibration = calibration;
    return;
  }
  const scale: number = height / calibration.stature / 1000;
  const ends: [number, number, number][] = law.vermilion.spans.flatMap((s: { start: [number, number, number]; end: [number, number, number] }): [number, number, number][] => [s.start, s.end]);
  const box: [[number, number, number], [number, number, number]] = [
    [0, 1, 2].map((k: number): number => Math.min(...ends.map((p: [number, number, number]): number => p[k]!)) - 3) as [number, number, number],
    [0, 1, 2].map((k: number): number => Math.max(...ends.map((p: [number, number, number]): number => p[k]!)) + 3) as [number, number, number],
  ];
  const surface: AutoMovieHumanBodySurface.IOutput = timed("surface (loft, seams, apertures)", (): AutoMovieHumanBodySurface.IOutput => AutoMovieHumanBodySurface.generate(calibration, [box]));
  const skin: AutoMovieHumanLoftMesh.IPiece[] = timed("skin split", (): AutoMovieHumanLoftMesh.IPiece[] => AutoMovieHumanLoftMesh.split(surface.mesh, surface.normals, surface.coordinates));
  const vermilion: AutoMovieHumanVermilion.IBoundary = AutoMovieHumanVermilion.prepare(law.vermilion);
  const curves: AutoMovieHumanBodyConstruction.ICurve[] = timed("construction curves", (): AutoMovieHumanBodyConstruction.ICurve[] => [
    ...AutoMovieHumanBodyConstruction.generate(calibration, surface.construction),
    ...AutoMovieHumanBodyConstruction.paths([{ id: law.vermilion.chain + "/" + law.vermilion.name.replaceAll(".", "_"), points: vermilion.points, closed: true }]),
  ]);
  const diagnostics: AutoMovieLoftContract.IDiagnostic[] = result.diagnostics!;
  const opening: IAutoMovieHumanLoftAperture | undefined = calibration.apertures.find((a: IAutoMovieHumanLoftAperture): boolean => a.name === "mouth");
  const interior: AutoMovieHumanOralCavity.IOutput | null = timed("mouth interior", (): AutoMovieHumanOralCavity.IOutput | null =>
    calibration.mouth === undefined || opening === undefined ? null : AutoMovieHumanOralCavityAttempt.attempt(surface.rims.get(opening.name), calibration.mouth, scale, diagnostics),
  );
  const construction: IAutoMovieModelPart[] = timed("construction parts", (): IAutoMovieModelPart[] =>
    curves.map((curve: AutoMovieHumanBodyConstruction.ICurve): IAutoMovieModelPart =>
      AutoMovieHumanModelParts.part(
        "human.construction." + curve.id,
        curve.kind === "axis" ? "construction.axes" : curve.kind === "guide" ? "construction.guides" : "construction.sections",
        curve.mesh,
        AutoMovieHumanLoftMesh.normals(curve.mesh),
        scale,
      ),
    ),
  );
  const rig: AutoMovieHumanRig.IRig = timed("rig", (): AutoMovieHumanRig.IRig => AutoMovieHumanRig.prepare(calibration, scale));
  const shape: AutoMovieHumanShapeStages.IShape = { calibration, scale, skin, vermilion, interior, construction, coordinates: new Map(curves.map((curve: AutoMovieHumanBodyConstruction.ICurve): [string, number[]] => ["human.construction." + curve.id, curve.coordinates])), rig, diagnostics, dressings: [], bound: new WeakMap() };

  // AutoMovieHuman construct
  const dressed: AutoMovieHumanSkin.IOutput = timed("skin dressing", (): AutoMovieHumanSkin.IOutput =>
    AutoMovieHumanSkin.generate({ vermilion, params, pieces: skin, eyes: calibration.eyes, apertures: calibration.apertures, stature: calibration.stature, scale, chains: calibration.chains, nails: calibration.nails ?? [] }),
  );
  const body: IAutoMovieModelPart[] = [...dressed.parts, ...(interior?.parts ?? []), ...construction];
  const eye: (side: "left" | "right") => IAutoMovieHumanAppearanceBody.IEye = (side: "left" | "right"): IAutoMovieHumanAppearanceBody.IEye => {
    const found: IAutoMovieHumanBodyCalibration.IEye = calibration.eyes.find((e: IAutoMovieHumanBodyCalibration.IEye): boolean => e.side === side)!;
    return { centre: [found.centre[0] * scale, found.centre[1] * scale, found.centre[2] * scale], forward: [1, 0, 0], up: [0, 1, 0], radius: found.radius * scale };
  };
  const appearance: AutoMovieHumanAppearance.IOutput = timed("appearance", (): AutoMovieHumanAppearance.IOutput =>
    AutoMovieHumanAppearance.generate(params, { eyePair: { left: eye("left"), right: eye("right") }, parts: body, calibration }),
  );
  const parts: IAutoMovieModelPart[] = [...body, ...appearance.parts];
  result.parts = timed("binding (rig dress)", (): IAutoMovieModelPart[] => AutoMovieHumanShapeStages.bind(parts, shape, dressed.coordinates));
  timed("pose evaluator", (): AutoMovieHumanSkeleton.PoseEvaluator => AutoMovieHumanSkeleton.prepare(params, { calibration }));
  result.materials = dressed.materials;
}
