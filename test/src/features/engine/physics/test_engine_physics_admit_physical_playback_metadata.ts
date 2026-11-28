import { AutoMovieEnginePhysics, AutoMovieEnginePhysicalPlayback } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSupportWrench,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";
import { throwsError } from "../../internal/throwsError";

/**
 * Replayed virtual support predictions keep requested minus allocated equal to
 * their residual. Archived and live contact readers share causal time checks.
 *
 * Scenarios:
 *
 * 1. An unsupported prediction, full residual and zero allocation, is admitted.
 * 2. A partial allocation whose residual is the exact difference is admitted, also
 *    at the 64-ulp rounding bound.
 * 3. A residual one newton off, or past the rounding bound, is refused as
 *    inconsistent.
 * 4. A negative witness count, and two predictions at one instant, are refused as
 *    malformed.
 * 5. A valid episode is admitted in the bounded archive and its completed steps
 *    appear by inspection time, with the default live read including all
 *    steps.
 * 6. Both readers refuse a nonfinite episode start or a nonfinite completed step
 *    followed by an event dated before its episode.
 *
 * The allocation law itself belongs to `test_physical_support_wrench`, and
 * binary transport to `test_physical_playback_archive`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the replay invariant for requested, allocated and residual support, and the causal clock shared by live and archived receipts.
 * @evidence contracts/development/testing.md#behavioral-verification Admits typed unsupported and partial wrench predictions, reads a bounded contact episode into and out of an archive, and submits malformed records to both readers.
 * @evidence contracts/development/testing.md#independent-expectations The requested-minus-allocated identity, the 64-ulp bound and samples dated before their episode distinguish valid support, rounding and noncausal replay.
 */
export function test_engine_physics_admit_physical_playback_metadata(): void {
  const unsupported: IAutoMoviePhysicalSupportWrench = wrench(
    0,
    0,
    [100, 0],
    [0, 0],
  );
  const partial: IAutoMoviePhysicalSupportWrench = wrench(
    1 / 120,
    4,
    [100, 2],
    [60, 0.5],
  );
  const verdicts: [string, IAutoMoviePhysicalSupportWrench[], string | null][] =
    [
      ["unsupported prediction", [unsupported], null],
      ["partial allocation", [unsupported, partial], null],
      [
        "rounding at the bound",
        [nudge(partial, 32 * Number.EPSILON * 100)],
        null,
      ],
      [
        "false residual",
        [nudge(partial, 1)],
        "Inconsistent physical playback allocation residual",
      ],
      [
        "residual past rounding",
        [nudge(partial, 128 * Number.EPSILON * 100)],
        "Inconsistent physical playback allocation residual",
      ],
      [
        "negative witness count",
        [{ ...partial, pointCount: -1 }],
        "Malformed physical playback support-wrench prediction",
      ],

      [
        "repeated instant",
        [partial, partial],
        "Malformed physical playback support-wrench prediction",
      ],
    ];
  const failures: string[] = [];
  for (const [label, supportWrenches, expected] of verdicts) {
    let refusal: string | null = null;
    try {
      AutoMovieEnginePhysicalPlayback.admitMetadata({ ...header(), supportWrenches });
    } catch (error: unknown) {
      refusal = error instanceof Error ? error.message : String(error);
    }
    if (refusal !== expected)
      failures.push(`${label}: ${refusal ?? "admitted"}`);
  }
  TestValidator.equals("support-wrench replay admission", failures, []);

  const contact: IAutoMovieContactReceipt = {
    id: "floor-contact",
    source: "solver",
    seconds: 0.25,
    endSeconds: 1,
    a: { body: "body", bone: "root", shape: "sole", material: "rubber" },
    b: { body: "floor", bone: "floor", shape: "floor", material: "wood" },
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: -1, z: 0 },
    impulse: 2,
    separation: 0,
    compression: 0,
  };
  const completed: NonNullable<IAutoMovieContactReceipt["samples"]>[number] = {
    seconds: 0.25,
    duration: 1 / 120,
    impulse: 1,
    point: contact.point,
    normal: contact.normal,
    separation: 0,
    compression: 0,
  };
  const valid: IAutoMovieContactReceipt = {
    ...contact,
    samples: [completed, { ...completed, seconds: 1 }],
  };
  AutoMovieEnginePhysicalPlayback.admitMetadata({ ...header(), contacts: [valid] });
  const earlier: IAutoMovieContactReceipt[] = AutoMovieEnginePhysics.samplePhysicalContactEvents(
    valid,
    0.5,
  );
  const all: IAutoMovieContactReceipt[] = AutoMovieEnginePhysics.samplePhysicalContactEvents(valid);
  TestValidator.predicate(
    "live contact events never read a later completed step",
    earlier.length === 1 &&
      nclose(earlier[0]!.seconds, 0.25) &&
      all.length === 2 &&
      nclose(all[1]!.seconds, 1),
  );

  const nonfiniteEpisode: IAutoMovieContactReceipt = {
    ...contact,
    seconds: NaN,
  };
  const noncausalSamples: IAutoMovieContactReceipt = {
    ...contact,
    samples: [
      { ...completed, seconds: NaN },
      { ...completed, seconds: -1 },
    ],
  };
  const contactFailures: string[] = [];
  for (const [label, receipt, archiveError, liveError] of [
    ["episode clock", nonfiniteEpisode, "episode", "causal contact event"],
    ["completed clock", noncausalSamples, "sample", "completed contact sample"],
  ] as const) {
    if (
      !throwsError(
        () =>
          AutoMovieEnginePhysicalPlayback.admitMetadata({ ...header(), contacts: [receipt] }),
        `Malformed physical playback contact ${archiveError}`,
      )
    )
      contactFailures.push(`archive ${label}`);
    if (!throwsError(() => AutoMovieEnginePhysics.samplePhysicalContactEvents(receipt), liveError))
      contactFailures.push(`live ${label}`);
  }
  TestValidator.equals(
    "contact readers refuse noncausal clocks",
    contactFailures,
    [],
  );
}

/**
 * A one-body, one-segment archive header with no contacts and initial dynamic
 * ownership.
 */
function header(): IAutoMoviePhysicalPlayback.IHeader {
  return {
    format: 1,
    protocol: "unit",
    identity: "unit",
    duration: 1,
    rate: 120,
    segments: [["body", "root"]],
    contacts: [],
    recovery: {},
    ownership: [{ body: "body", bone: "root", seconds: 0, kind: "dynamic" }],
    supportWrenches: [],
  };
}

/** A vertical force and yaw-moment prediction with its exact residual. */
function wrench(
  seconds: number,
  pointCount: number,
  requested: [number, number],
  allocated: [number, number],
): IAutoMoviePhysicalSupportWrench {
  const of: (
    value: [number, number],
  ) => IAutoMoviePhysicalSupportWrench["requested"] = (
    value: [number, number],
  ): IAutoMoviePhysicalSupportWrench["requested"] => ({
    force: { x: 0, y: value[0], z: 0 },
    torque: { x: 0, y: value[1], z: 0 },
  });
  return {
    body: "body",
    seconds,
    origin: { x: 0, y: 1, z: 0 },
    requested: of(requested),
    allocated: of(allocated),
    residual: of([requested[0] - allocated[0], requested[1] - allocated[1]]),
    pointCount,
  };
}

/**
 * The same prediction with its vertical force residual moved by `delta`
 * newtons.
 */
function nudge(
  entry: IAutoMoviePhysicalSupportWrench,
  delta: number,
): IAutoMoviePhysicalSupportWrench {
  const copy: IAutoMoviePhysicalSupportWrench = structuredClone(entry);
  copy.residual.force.y += delta;
  return copy;
}
