import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { AutoMovieMotionHumanPerformance } from "@automovie/motions";
import assert from "node:assert/strict";

import { fixture } from "./source";

/**
 * Source seconds before, at and after the saved cut, then through custody and
 * suffix.
 */
export const sampleTimes: readonly number[] = [
  0.499, 0.5, 0.501, 0.85, 1, 1.999, 2, 2.5, 2.75,
];

/** Scrub the same observations out of order and revisit a saved boundary. */
export const playbackOrder: readonly number[] = [3, 1, 0, 8, 2, 7, 4, 6, 5, 1];

/** Sampled pose, prop placement and the two independent contact frames. */
interface IObservation {
  catcher: IAutoMoviePose;
  emitter: IAutoMoviePose;
  ball: IAutoMovieRigidTransform;
  door: IAutoMovieRigidTransform;
  hinge: number;
  doorPull: IAutoMovieVector3;
  parcel: IAutoMovieVector3;
  parcelInHand: IAutoMovieVector3;
  feet: readonly number[];
  grip: boolean;
}

/** Order the sparse override map by bone while retaining every joint value. */
function canonicalPose(pose: IAutoMoviePose): IAutoMoviePose {
  const joints: IAutoMovieJointPose[] = [...pose.joints].sort(
    (left: IAutoMovieJointPose, right: IAutoMovieJointPose): number =>
      left.bone < right.bone ? -1 : Number(left.bone > right.bone),
  );
  assert.equal(
    new Set(joints.map((joint: IAutoMovieJointPose): string => joint.bone))
      .size,
    joints.length,
    "each bone has a single joint override",
  );
  return { ...pose, joints };
}

/**
 * Observe the actual Human owner at the supplied clock without accessing its
 * caches.
 */
export function observe(
  performance: AutoMovieMotionHumanPerformance,
  seconds: number,
): IObservation {
  const catcher: IAutoMovieMotionHumanPerformer = performance.performers.find(
    (performer: IAutoMovieMotionHumanPerformer): boolean =>
      performer.subject === "catcher",
  )!;
  const hand: IAutoMovieResolvedBone = performance
    .bones("emitter", seconds)
    .get("rightHand")!;
  const parcel: IAutoMovieVector3 = performance.prop(
    "parcel",
    seconds,
  ).position;
  const stance: IAutoMovieMotionHumanSegment =
    performance.segments("emitter")[0]!;
  const localShare: number = (seconds - stance.start) / stance.plan.duration;
  const feet: number[] = stance.plan.contacts
    .filter(
      (window): boolean =>
        (window.part === "leftFoot" || window.part === "rightFoot") &&
        window.kind === "plant" &&
        window.support.kind === "prop" &&
        window.support.subject === "carrier" &&
        window.from <= localShare &&
        localShare <= window.to,
    )
    .map((window): number => (window.part === "leftFoot" ? 0 : 1))
    .sort((left: number, right: number): number => left - right);
  return {
    catcher: canonicalPose(performance.pose("catcher", seconds)),
    emitter: canonicalPose(performance.pose("emitter", seconds)),
    ball: performance.prop("foam-ball", seconds),
    door: performance.prop("door", seconds),
    hinge: performance.state("door", seconds).hinge!,
    doorPull: performance.aim(
      { kind: "prop", subject: "door", point: "pull" },
      seconds,
      {
        root: { x: 0, y: 0, z: 0 },
        yaw: 0,
        heights: { low: 0.5, middle: 1, high: 1.5 },
        range: 1,
        body: catcher.body,
        bones: () => performance.bones("catcher", seconds),
      },
    ).point,
    parcel,
    parcelInHand: AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(hand.worldRotation),
      AutoMovieEngineVector3.subtract(parcel, hand.worldPosition),
    ),
    feet,
    grip:
      stance.plan.holds?.some(
        (hold): boolean =>
          hold.prop === "parcel" &&
          hold.side === "right" &&
          hold.from <= localShare,
      ) ?? false,
  };
}

/** Read ordered source cues and validate chronology against the staged flight. */
export function cues(performance: AutoMovieMotionHumanPerformance): IAutoMovieScheduleCue[] {
  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    performance.flights("foam-ball");
  assert.equal(flights.length, 1, "one staged launch");
  const flight: IAutoMovieMotionHumanPropFlight.IFlight = flights[0]!;
  assert.ok(Math.abs(flight.launch - 0.25) <= 1e-6);
  assert.ok(
    Math.abs((flight.capturedAt ?? Infinity) - fixture.catchSeconds) <= 1e-6,
  );
  assert.equal(flight.contact, undefined);
  assert.equal(
    performance.hits("foam-ball").length,
    0,
    "capture creates no ghost impact",
  );
  const events: IAutoMovieScheduleCue[] = performance.schedule.entries
    .flatMap(
      (entry: IAutoMovieScheduleEntry): readonly IAutoMovieScheduleCue[] =>
        entry.events ?? [],
    )
    .sort(
      (left: IAutoMovieScheduleCue, right: IAutoMovieScheduleCue): number =>
        left.seconds - right.seconds,
    );
  assert.equal(
    events.filter(
      (event: IAutoMovieScheduleCue): boolean => event.name === "release",
    ).length,
    1,
  );
  assertObserved(
    events.filter(
      (event: IAutoMovieScheduleCue): boolean => event.name === "retime",
    ),
    [{ name: "retime", seconds: fixture.sourceSeconds }],
    "one cue at the retimed cut",
  );
  return events;
}

/**
 * Check deterministic replay records with exact discrete facts and bounded
 * numerical error.
 */
export function assertObserved(
  actual: unknown,
  expected: unknown,
  label: string,
): void {
  if (typeof actual === "number" && typeof expected === "number") {
    assert.ok(
      Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-6,
      label,
    );
    return;
  }
  if (
    actual !== null &&
    expected !== null &&
    typeof actual === "object" &&
    typeof expected === "object"
  ) {
    const left: Record<string, unknown> = actual as Record<string, unknown>;
    const right: Record<string, unknown> = expected as Record<string, unknown>;
    assert.deepEqual(Object.keys(left), Object.keys(right), label);
    for (const key of Object.keys(left))
      assertObserved(left[key], right[key], `${label}.${key}`);
    return;
  }
  assert.equal(actual, expected, label);
}
