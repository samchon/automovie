import {
  AutoMovieLoftSectionNative,
  type AutoMovieLoftViewRead,
  AutoMovieViewConic,
  AutoMovieViewSectionField,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { Profiler } from "node:inspector";
import { Session } from "node:inspector/promises";

import { nclose } from "../../internal/nclose";

/** Actual local Cartesian total2 returned by the native station reader. */
type Jet = ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.jet>>;

/** Required value and derivative vectors, each with fresh caller ownership. */
const FIELDS: readonly (keyof Jet)[] = ["p", "s", "t", "ss", "st", "tt"];

/**
 * A private copied station reuses successful validation without weakening public reads.
 *
 * Scenarios:
 * 1. Homothetic circles at three scales retain all six independent Cartesian
 *    derivatives across positive, negative, cardinal and periodic phases.
 * 2. Input rewrites after factory return and returned-vector rewrites cannot
 *    mutate the private preparation; every output remains fresh.
 * 3. Public cold copies work and changed snapshots still fail before bad phases.
 * 4. A getter that becomes nonfinite during copying retains deferred phase
 *    failure and repeat failure behavior; original getter exceptions survive.
 * 5. Owned precise coverage counts the actual validator. One public control
 *    plus one private successful preparation allows at most two entries for
 *    either one or 129 phases; missing identity is an observer failure.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises Native.jet factories/readings and public Field cold/copy/failure paths, detects stale aliases, premature admission, swallowed original errors and repeated private metadata scans.
 * @evidence contracts/development/testing.md#independent-expectations The circle rho(s)=scale*(2+3s+4s*s) at s=0 gives exact p/s/ss and their sine/cosine phase derivatives independently of the kernel. Copy/refusal and exception order follow existing ownership contracts. The work ceiling is one public control plus at most one successful private validation, not a wall/heap oracle or an exact layout.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three scales, cardinal/negative/wrapped phases, input/output mutations, cold copies, stale geometry, bad phase ordering, a finite-to-NaN getter, repeated failures and original Error/undefined. Existing conic_field/source_conic/source_jets own asymmetric G2, moving boundaries and general world geometry.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable async CPU question owns its synthetic values and current-process Inspector Session, stopped/disabled/disconnected in finally while primary failures retain identity. No person, process, browser, target attachment, CPU profile, foreign method replacement or time/heap threshold is used.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Homothetic circles at three scales retain all six independent Cartesian).
 */
export async function test_construction_owned_section_reader(): Promise<void> {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000])
    ask(`circle ${scale}`, (): void => circle(scale), failures);
  ask("public copies", copies, failures);
  ask("deferred failure", malformed, failures);
  ask("original errors", originals, failures);
  try {
    const readings: { phases: number; validations: number }[] = await work();
    console.log({
      ownedSectionValidationWork: readings,
      ceiling: 2,
      scope: "one public control plus private station; no f1 time/heap claim",
    });
    if (
      readings.some(
        (reading: { phases: number; validations: number }): boolean =>
          reading.validations > 2,
      )
    )
      failures.push(
        "Private phase traversal repeated completed metadata validation",
      );
  } catch (error: unknown) {
    failures.push("coverage: " + detail(error));
  }
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Gather all owned cases before returning the complete result. */
function ask(name: string, job: () => void, failures: string[]): void {
  try {
    job();
  } catch (error: unknown) {
    failures.push(name + ": " + detail(error));
  }
}

/** Keep useful original error detail, including non-Error callback values. */
function detail(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}

/** Independent circle station jets, with a constant exact ellipse shoulder. */
function inputs(scale: number = 1): AutoMovieLoftViewRead.IJets {
  return {
    extents: Array.from(
      { length: 4 },
      (): AutoMovieViewSectionField.IStationJet => [
        2 * scale,
        3 * scale,
        8 * scale,
      ],
    ),
    shoulders: Array.from(
      { length: 4 },
      (): AutoMovieViewSectionField.IStationJet => [Math.SQRT2 - 1, 0, 0],
    ),
  };
}

/** Closed circle product-rule values, not another kernel evaluation. */
function expected(scale: number, phi: number): Jet {
  const c: number = Math.cos(phi);
  const s: number = Math.sin(phi);
  return {
    p: [2 * scale * c, 2 * scale * s],
    s: [3 * scale * c, 3 * scale * s],
    t: [-2 * scale * s, 2 * scale * c],
    ss: [8 * scale * c, 8 * scale * s],
    st: [-3 * scale * s, 3 * scale * c],
    tt: [-2 * scale * c, -2 * scale * s],
  };
}

/** Compare every required finite vector with the same independent length-scale budget. */
function close(actual: Jet, target: Jet, scale: number): void {
  for (const field of FIELDS)
    if (
      !actual[field].every((value: number, index: number): boolean =>
        nclose(value, target[field][index]!, 1e-8 * scale),
      )
    )
      throw new Error(`Independent circle ${field} differs`);
}

/** Neither original tuple storage nor earlier returned vectors are aliases of the retained preparation. */
function circle(scale: number): void {
  const data: AutoMovieLoftViewRead.IJets = inputs(scale);
  const read: ReturnType<typeof AutoMovieLoftSectionNative.jet> =
    AutoMovieLoftSectionNative.jet(data);
  data.extents[0] = [99, 99, 99];
  data.shoulders[0] = [0.2, 0.1, 0.2];
  for (const phi of [0, 0.3, Math.PI / 2, Math.PI, -0.2, 2 * Math.PI + 0.7])
    close(read(phi), expected(scale, phi), scale);
  const old: Jet = read(0.3);
  const next: Jet = read(0.3);
  for (const field of FIELDS) {
    if (old[field] === next[field])
      throw new Error("A returned derivative vector was retained");
    old[field][0] = 999;
  }
  close(read(0.3), expected(scale, 0.3), scale);
}

/** Obtain a successful public record without replacing a numeric refusal. */
function prepared(
  data: AutoMovieLoftViewRead.IJets,
): AutoMovieViewSectionField.IPrepared {
  const value: ReturnType<typeof AutoMovieViewSectionField.prepare> =
    AutoMovieViewSectionField.prepare(data.extents, data.shoulders);
  if (value.kind === "failure") throw new Error(value.detail);
  return value;
}

/** Public records remain value-copyable and are rechecked on every call, including error order. */
function copies(): void {
  const at: AutoMovieViewSectionField.IPrepared = prepared(inputs());
  const copy: AutoMovieViewSectionField.IPrepared = structuredClone(at);
  const ray: AutoMovieViewConic.IRay | null = AutoMovieViewConic.read(
    copy.geometry,
    0.3,
  );
  if (ray === null) throw new Error("The circle has no numeric descriptor");
  const good: ReturnType<typeof AutoMovieViewSectionField.readRay> =
    AutoMovieViewSectionField.readRay(copy, ray);
  if ("kind" in good || !nclose(good[0], 2, 1e-10))
    throw new Error("The cold numeric/source copy changed");
  copy.geometry.quarters[0]!.extents = [9, 9];
  for (const bad of [
    AutoMovieViewSectionField.readRay(copy, ray),
    AutoMovieViewSectionField.read(copy, Infinity),
  ])
    if (!("kind" in bad) || !bad.detail.includes("malformed or differ"))
      throw new Error("Public stale data lost its validation or precedence");
  const original: ReturnType<typeof AutoMovieViewSectionField.read> =
    AutoMovieViewSectionField.read(at, 0.3);
  if ("kind" in original || !nclose(original[0], 2, 1e-10))
    throw new Error("A copied rewrite changed the original record");
}

/** Capture even an undefined original failure without treating it as success. */
function thrown(job: () => unknown): unknown {
  let failed: boolean = false;
  let value: unknown;
  try {
    job();
  } catch (error: unknown) {
    failed = true;
    value = error;
  }
  if (!failed) throw new Error("Expected the existing failure path");
  return value;
}

/** A copying-time NaN is not promoted into valid geometry or a cached exception. */
function malformed(): void {
  const data: AutoMovieLoftViewRead.IJets = inputs();
  const tuple: [number, number, number] = [2, 3, 8];
  let reads: number = 0;
  Object.defineProperty(tuple, "1", {
    enumerable: true,
    configurable: true,
    get: (): number => {
      reads++;
      return reads === 1 ? 3 : NaN;
    },
  });
  data.extents[0] = tuple;
  const read: ReturnType<typeof AutoMovieLoftSectionNative.jet> =
    AutoMovieLoftSectionNative.jet(data);
  const phase: unknown = thrown((): Jet => read(Infinity));
  if (
    !(phase instanceof Error) ||
    !phase.message.includes("finite phase reading")
  )
    throw new Error(
      "The first numeric ray no longer precedes private validation",
    );
  const first: unknown = thrown((): Jet => read(0.3));
  const second: unknown = thrown((): Jet => read(0.4));
  if (
    !(first instanceof Error) ||
    !(second instanceof Error) ||
    first === second ||
    !first.message.includes("malformed or differ") ||
    second.message !== first.message
  )
    throw new Error(
      "Deferred private failure or its repeated original behavior changed",
    );
}

/** Getter failures retain identity during the existing input-copy/admission stage. */
function originals(): void {
  const values: readonly unknown[] = [
    new Error("owned input failure"),
    undefined,
  ];
  for (const value of values) {
    const data: AutoMovieLoftViewRead.IJets = inputs();
    const tuple: [number, number, number] = [2, 3, 8];
    Object.defineProperty(tuple, "0", {
      get: (): number => {
        throw value;
      },
    });
    data.extents[0] = tuple;
    if (
      thrown(
        (): ReturnType<typeof AutoMovieLoftSectionNative.jet> =>
          AutoMovieLoftSectionNative.jet(data),
      ) !== value
    )
      throw new Error("The original getter failure was replaced");
  }
}

/** Observe this process's real metadata checks with a public positive control and owned observer cleanup. */
async function work(): Promise<{ phases: number; validations: number }[]> {
  const session: Session = new Session();
  const readings: { phases: number; validations: number }[] = [];
  const cleanup: unknown[] = [];
  let connected: boolean = false;
  let started: boolean = false;
  let failed: boolean = false;
  let primary: unknown;
  const control: AutoMovieViewSectionField.IPrepared = prepared(inputs());
  const ray: AutoMovieViewConic.IRay | null = AutoMovieViewConic.read(
    control.geometry,
    0.3,
  );
  if (ray === null)
    throw new Error("The public validation control has no descriptor");
  try {
    session.connect();
    connected = true;
    await session.post("Profiler.enable");
    await session.post("Profiler.startPreciseCoverage", {
      callCount: true,
      detailed: false,
    });
    started = true;
    for (const phases of [1, 129]) {
      const good: ReturnType<typeof AutoMovieViewSectionField.readRay> =
        AutoMovieViewSectionField.readRay(control, ray);
      if ("kind" in good)
        throw new Error("The public validation control failed");
      const read: ReturnType<typeof AutoMovieLoftSectionNative.jet> =
        AutoMovieLoftSectionNative.jet(inputs());
      for (let i: number = 0; i < phases; i++)
        close(read(i / 17), expected(1, i / 17), 1);
      const coverage: Profiler.TakePreciseCoverageReturnType =
        await session.post("Profiler.takePreciseCoverage");
      const functions: Profiler.FunctionCoverage[] = coverage.result
        .filter((script: Profiler.ScriptCoverage): boolean =>
          /[/\\]AutoMovieViewSection(?:Field|Reading)\.ts$/.test(script.url),
        )
        .flatMap(
          (script: Profiler.ScriptCoverage): Profiler.FunctionCoverage[] =>
            script.functions.filter(
              (fn: Profiler.FunctionCoverage): boolean =>
                fn.functionName === "validate",
            ),
        );
      if (functions.length !== 1)
        throw new Error(
          "The actual metadata-validator identity is missing or ambiguous",
        );
      const validations: number | undefined = functions[0]!.ranges[0]?.count;
      if (
        validations === undefined ||
        !Number.isSafeInteger(validations) ||
        validations <= 0
      )
        throw new Error(
          "The positive public validation control was not observed",
        );
      readings.push({ phases, validations });
    }
  } catch (error: unknown) {
    failed = true;
    primary = error;
  } finally {
    if (started)
      try {
        await session.post("Profiler.stopPreciseCoverage");
      } catch (error: unknown) {
        cleanup.push(error);
      }
    if (connected) {
      try {
        await session.post("Profiler.disable");
      } catch (error: unknown) {
        cleanup.push(error);
      }
      try {
        session.disconnect();
      } catch (error: unknown) {
        cleanup.push(error);
      }
    }
  }
  if (failed) throw primary;
  if (cleanup.length !== 0)
    throw new AggregateError(
      cleanup,
      "Owned validation coverage cleanup failed",
    );
  return readings;
}
