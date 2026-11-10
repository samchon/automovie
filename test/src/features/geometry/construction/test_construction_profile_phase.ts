import {
  AutoMovieConstructionProfile,
  AutoMovieLoftAdmissionError,
  type IAutoMovieConstructionProfileSource,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Actual phase derivatives remain available without invented physical or frame2.
 *
 * Scenarios:
 * 1. An ellipse traversed backward uses the original clockwise clock, a moving
 *    rotated plane and a nonlinear origin. With physical2 absent, world p/t
 *    still follow the independent ellipse derivatives. Explicit phase2 null
 *    remains null; its actual provided second phase is also read separately.
 * 2. A full2-only original retains its actual phase through the compatibility
 *    path. Explicit unavailable phase refuses even if full2 exists, while
 *    zero phase derivatives supplied by a constant original remain actual zero.
 * 3. Missing/nonfinite phase, unknown/outside charts and original callback
 *    exceptions remain observable; Point0 does not imply physical2 support.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public prepared Profile phase reader with actual plane.at only, compares all available vectors and checks null/refusal separately from actual zero and Point0.
 * @evidence contracts/development/testing.md#independent-expectations The ellipse is (2cos theta,3sin theta), theta=2pi(1-v). Elementary differentiation and the explicit rotation at fixed s determine world derivatives; the moving origin contributes only to p. Absolute2e-11 covers binary64 trigonometric/product arithmetic.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers reversed original clock, nonconstant frame/origin, phase1-only, phase2, full2 compatibility, explicit null precedence, actual zero, missing frame2, malformed values, outside ownership and foreign exception identity.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous CPU construction_profile_phase entry owns its synthetic originals and starts no Human generation, host, viewer or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An ellipse traversed backward uses the original clockwise clock, a moving).
 */
export function test_construction_profile_phase(): void {
  const failures: string[] = [];
  for (const second of [false, true]) {
    const source: IAutoMovieConstructionProfileSource = made(second);
    const reader: AutoMovieConstructionProfile.IPrepared =
      AutoMovieConstructionProfile.create(source);
    for (const s of [0, 0.37, 1])
      for (const v of [0, 0.17, 0.83, 1]) {
        const theta: number = 2 * Math.PI * (1 - v);
        const c: number = Math.cos(s);
        const q: number = Math.sin(s);
        const k: number = -2 * Math.PI;
        const expectedP: number[] = [
          s * s + 2 * c * Math.cos(theta) - 3 * q * Math.sin(theta),
          s,
          -s + 2 * q * Math.cos(theta) + 3 * c * Math.sin(theta),
        ];
        const expectedT: number[] = [
          k * (-2 * c * Math.sin(theta) - 3 * q * Math.cos(theta)),
          0,
          k * (-2 * q * Math.sin(theta) + 3 * c * Math.cos(theta)),
        ];
        const actual: ReturnType<typeof reader.phase> = reader.phase(
          "ellipse",
          s,
          v,
        );
        vector(actual.p, expectedP, failures);
        vector(reader.atlas.faces[0]!.point!(s, v), expectedP, failures);
        vector(actual.t, expectedT, failures);
        if (second) {
          if (actual.tt === null) failures.push("Actual phase2 was discarded.");
          else
            vector(
              actual.tt,
              [
                -k * k * (2 * c * Math.cos(theta) - 3 * q * Math.sin(theta)),
                0,
                -k * k * (2 * q * Math.cos(theta) + 3 * c * Math.sin(theta)),
              ],
              failures,
            );
        } else if (actual.tt !== null)
          failures.push("Unavailable phase2 was invented.");
      }
    refuse(
      (): unknown => reader.atlas.faces[0]!.jet(0.5, 0.5),
      failures,
      "unavailable physical2",
    );
    refuse(
      (): unknown => reader.phase("unknown", 0.5, 0.5),
      failures,
      "unknown chart",
    );
    refuse(
      (): unknown => reader.phase("ellipse", 0.5, -0.01),
      failures,
      "outside phase",
    );
    refuse(
      (): unknown => reader.phase("ellipse", 1.01, 0.5),
      failures,
      "outside station",
    );
  }
  const original: IAutoMovieConstructionProfileSource = made(true);
  const own: IAutoMovieConstructionProfileSource.ICurve =
    original.curves.get("original")!;
  const full: IAutoMovieConstructionProfileSource.ICurve = {
    domain: own.domain,
    clock: own.clock,
    point: own.point,
    jet: (s: number, t: number): IAutoMovieConstructionProfileSource.IJet => ({
      ...own.phase!(s, t)!,
      tt: own.phase!(s, t)!.tt!,
      s: [0, 0],
      ss: [0, 0],
      st: [0, 0],
    }),
  };
  original.curves = new Map([["original", full]]);
  const retained: ReturnType<AutoMovieConstructionProfile.IPrepared["phase"]> =
    AutoMovieConstructionProfile.create(original).phase("ellipse", 0.5, 0.5);
  vector(
    retained.t,
    [-6 * Math.PI * Math.sin(0.5), 0, 6 * Math.PI * Math.cos(0.5)],
    failures,
  );
  original.curves = new Map([
    ["original", { ...full, phase: (): null => null }],
  ]);
  refuse(
    (): unknown =>
      AutoMovieConstructionProfile.create(original).phase("ellipse", 0.5, 0.5),
    failures,
    "explicit unavailable phase",
  );
  original.curves = new Map([["original", { ...full, jet: (): null => null }]]);
  refuse(
    (): unknown =>
      AutoMovieConstructionProfile.create(original).phase("ellipse", 0.5, 0.5),
    failures,
    "missing phase and physical2",
  );
  original.curves = new Map([
    [
      "original",
      {
        ...full,
        point: (): [number, number] => [1, 2],
        jet: (): null => null,
        phase: (): IAutoMovieConstructionProfileSource.IPhase => ({
          p: [1, 2],
          t: [0, 0],
          tt: [0, 0],
        }),
      },
    ],
  ]);
  const zero: ReturnType<AutoMovieConstructionProfile.IPrepared["phase"]> =
    AutoMovieConstructionProfile.create(original).phase("ellipse", 0.5, 0.5);
  vector(zero.t, [0, 0, 0], failures);
  vector(zero.tt!, [0, 0, 0], failures);
  original.curves = new Map([
    [
      "original",
      {
        ...full,
        phase: (): IAutoMovieConstructionProfileSource.IPhase => ({
          p: [NaN, 2],
          t: [0, 0],
          tt: null,
        }),
      },
    ],
  ]);
  refuse(
    (): unknown =>
      AutoMovieConstructionProfile.create(original).phase("ellipse", 0.5, 0.5),
    failures,
    "nonfinite original phase",
  );
  const marker: Error = new Error("actual original phase");
  original.curves = new Map([
    [
      "original",
      {
        ...full,
        phase: (): never => {
          throw marker;
        },
      },
    ],
  ]);
  let caught: unknown;
  try {
    AutoMovieConstructionProfile.create(original).phase("ellipse", 0.5, 0.5);
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== marker)
    failures.push("The original phase exception lost its identity.");
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Actual ellipse source whose frame2 and physical2 remain explicitly unavailable. */
function made(second: boolean): IAutoMovieConstructionProfileSource {
  const curve: IAutoMovieConstructionProfileSource.ICurve = {
    domain: [0, 1],
    clock: [0, 2 * Math.PI],
    point: (_s: number, t: number): [number, number] => [
      2 * Math.cos(t),
      3 * Math.sin(t),
    ],
    phase: (
      _s: number,
      t: number,
    ): IAutoMovieConstructionProfileSource.IPhase => ({
      p: [2 * Math.cos(t), 3 * Math.sin(t)],
      t: [-2 * Math.sin(t), 3 * Math.cos(t)],
      tt: second ? [-2 * Math.cos(t), -3 * Math.sin(t)] : null,
    }),
    jet: (): null => null,
  };
  return {
    definition: {
      name: "phase.only",
      domain: [0, 0.001],
      plane: "moving",
      loops: [
        {
          id: "outer",
          kind: "outer",
          orientation: -1,
          domain: [0, 0.001],
          pieces: [
            {
              id: "ellipse",
              source: "original",
              clock: [0, 2 * Math.PI],
              direction: -1,
              branch: "whole",
            },
          ],
        },
      ],
      guides: [],
      regions: [
        {
          id: "region",
          logicalParts: ["logical"],
          pieces: ["ellipse"],
          material: "material",
          binding: "binding",
        },
      ],
      revisions: { source: "1", constraints: "1", topology: "1" },
    },
    plane: {
      id: "moving",
      axis: {
        at: (
          s: number,
        ): {
          origin: [number, number, number];
          u: [number, number, number];
          v: [number, number, number];
        } => ({
          origin: [s * s, s, -s],
          u: [Math.cos(s), 0, Math.sin(s)],
          v: [-Math.sin(s), 0, Math.cos(s)],
        }),
      },
    },
    curves: new Map([["original", curve]]),
  };
}

/** A named admission failure cannot become successful geometry or a foreign TypeError. */
function refuse(job: () => unknown, failures: string[], label: string): void {
  try {
    job();
    failures.push(`${label} was accepted.`);
  } catch (error: unknown) {
    if (!(error instanceof AutoMovieLoftAdmissionError))
      failures.push(`${label} lost admission identity: ${String(error)}`);
  }
}

/** Fixed arithmetic allowance, independent of missing derivative support. */
function vector(
  actual: readonly number[],
  expected: readonly number[],
  failures: string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some(
      (value: number, index: number): boolean =>
        !nclose(value, expected[index]!, 2e-11),
    )
  )
    failures.push(`Phase actual ${actual}, expected ${expected}.`);
}
