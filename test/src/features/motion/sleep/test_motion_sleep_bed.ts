import { createBed } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanLieOnSurface,
  IAutoMovieMotionHumanLogRoll,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTurnOver,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFloor,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The bed's fixed lying surface height and its frame, metres and degrees. */
const HEIGHT: number = 0.46;
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * How far a lying body may sink into the surface, metres: the campaign's
 * contact bound.
 */
const SINK: number = 0.01;

/**
 * How close a rolling advance keeps to half the chest's perimeter per half
 * turn, as a share (provisional: the cross-section is not an exact ellipse).
 */
const ROLLING: number = 0.15;

/** The bones whose collision shapes a lying body rests on. */
const BEARING: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "chest",
  "head",
  "leftFoot",
  "rightFoot",
];

/**
 * Going to bed, turning over, waking and getting up, and a log roll on the
 * floor (#3987).
 *
 * Scenarios, on the average man and the small woman, each take clean:
 *
 * 1. Sitting on the double bed's left edge, the body lies down onto its side and
 *    back on the mattress: from the side posture on no bearing bone sinks under
 *    the surface and no foot is lower than it.
 * 2. It turns over as many times as the take authors (`TURNS`: onto the left side,
 *    face down, then back onto the back to sit up), and the chest faces
 *    sideways after the first turn, then down after the second.
 * 3. It sits up onto the edge and stands.
 * 4. Lying on the floor it log-rolls four half turns toward its left: the pelvis
 *    advances half the chest's perimeter per half turn, and it ends on its
 *    back.
 * 5. A bed too short for the body is refused with its length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, the cases and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed bones against the surface plane, the chest's normal at each end position and the pelvis's travel; a body in the mattress, a foot on the floor, a wrong end position, a short or long roll, or an admitted short bed fails.
 * @evidence contracts/development/testing.md#independent-expectations The surface height is the bed's fixed one; the roll's advance is the chest's elliptic perimeter from the body's own measures.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, the bed and the floor, a short bed.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_sleep_bed(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const film: HumanPerformance = bedtime(
        body,
        createBed({ kind: "double", height: HEIGHT }),
      );
      verdict(checks, `${name} goes to bed`, film);
      const segments: readonly IAutoMovieMotionHumanSegment[] =
        film.segments("a");
      const lie: IAutoMovieMotionHumanSegment = named(
        segments,
        "lieOnSurface",
      )[0]!;
      const up: IAutoMovieMotionHumanSegment = named(
        segments,
        "lieOnSurface",
      )[1]!;
      const from: number = mark(lie, "lateral");
      const to: number = up.start + 0.5 * (mark(up, "lateral") - up.start);
      const worst: number = Array.from(
        { length: 25 },
        (_v: unknown, k: number): number => from + ((to - from) * k) / 24,
      )
        .map((t: number): number => {
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            film.bones("a", t);
          return Math.min(
            ...BEARING.map(
              (b: AutoMovieHumanoidBone): number =>
                bones.get(b)!.worldPosition.y - HEIGHT,
            ),
          );
        })
        .reduce((a: number, b: number): number => Math.min(a, b));
      checks.check(
        `${name}: lying on the bed, no bearing bone sinks under the mattress and no foot is below it (${(worst * 1000).toFixed(0)} mm)`,
        worst >= -SINK,
      );
      const turns: readonly IAutoMovieMotionHumanSegment[] = named(
        segments,
        "turnOver",
      );
      checks.equals(
        `${name}: turns over as authored`,
        turns.length,
        TURNS.length,
      );
      const facing: readonly number[] = turns.map(
        (s: IAutoMovieMotionHumanSegment): number =>
          chest(film, s.end - 1e-3).y,
      );
      const sideways: boolean = Math.abs(facing[0]!) < 0.35;
      const faceDown: boolean = facing[1]! < -0.8;
      checks.check(
        `${name}: on the side the chest faces sideways, face down it faces down (${facing.map((y: number): string => y.toFixed(2)).join(", ")})`,
        sideways && faceDown,
      );
      checks.check(
        `${name}: stands at the end`,
        segments.at(-1)!.name === "rise" &&
          film.bones("a", film.duration).get("hips")!.worldPosition.y >
            0.7 * body.rest.get("hips")!.y,
      );

      const floor: HumanPerformance = rolled(body, 4);
      verdict(checks, `${name} log-rolls`, floor);
      const roll: IAutoMovieMotionHumanSegment = named(
        floor.segments("a"),
        "logRoll",
      )[0]!;
      const a: IAutoMovieVector3 = floor
        .bones("a", roll.start)
        .get("hips")!.worldPosition;
      const b: IAutoMovieVector3 = floor
        .bones("a", roll.end)
        .get("hips")!.worldPosition;
      const expected: number = 4 * (perimeter(body) / 2);
      const advance: number = Math.hypot(b.x - a.x, b.z - a.z);
      checks.check(
        `${name}: the pelvis rolls ${(advance * 1000).toFixed(0)} mm for ${(expected * 1000).toFixed(0)} mm`,
        Math.abs(advance - expected) <= ROLLING * expected,
      );
      checks.check(
        `${name}: the roll ends on the back`,
        chest(floor, roll.end).y > 0.8,
      );
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.check(
    "a bed too short for the body is refused with its length",
    (() => {
      try {
        bedtime(
          motionHumanBody("m-tall"),
          createBed({ kind: "single", length: 1.6, height: HEIGHT }),
        ).bones("a", 6);
        return false;
      } catch (error: unknown) {
        return error instanceof HumanRefusal && error.axis === "length";
      }
    })(),
  );
  checks.assert("sleep bed");
}

/**
 * The turns the bed take authors, in order: onto the left side, face down, then
 * back onto the back to sit up from. The turns read are counted against this
 * list, so the count is the authored one.
 */
const TURNS: readonly IAutoMovieMotionHumanTurnOver[] = [
  { to: "lateralLeft", on: { prop: "bed" }, hold: 0.5 },
  { to: "prone", on: { prop: "bed" }, hold: 0.5 },
  { to: "supine", on: { prop: "bed" }, via: "right" },
];

/** A bed model. */
type Bed = ReturnType<typeof createBed>;

/**
 * `a` stands by the bed's left edge, sits, lies down, turns onto the left side,
 * face down and back (`TURNS`), sits up and stands.
 */
function bedtime(body: IAutoMovieMotionHumanBody, bed: Bed): HumanPerformance {
  const half: number = (bed.affordance("surface").width ?? 1.35) / 2;
  const lie: IAutoMovieMotionHumanLieOnSurface = {
    prop: "bed",
    edge: "leftSide",
    hold: 0.5,
  };
  const lying: IAutoMovieMotionHumanChain = HumanChain.subject("a")
    .sit({
      seat: HumanObject.seat(bed, { at: ORIGIN, yaw: 0 }, "leftSide"),
      hold: 0.5,
    })
    .registered(AutoMovieMotionHumanFloor.lieOnSurface.name, lie);
  const chain: IAutoMovieMotionHumanChain = TURNS.reduce(
    (
      turned: IAutoMovieMotionHumanChain,
      turn: IAutoMovieMotionHumanTurnOver,
    ): IAutoMovieMotionHumanChain =>
      turned.registered(AutoMovieMotionHumanFloor.turnOver.name, turn),
    lying,
  )
    .registered(AutoMovieMotionHumanFloor.lieOnSurface.name, {
      ...lie,
      rise: true,
    })
    .rise();
  return new HumanPerformance({
    seed: "bed",
    laws: [
      AutoMovieMotionHumanFloor.lieOnSurface,
      AutoMovieMotionHumanFloor.turnOver,
    ],
    props: [HumanObject.prop("bed", bed, { at: ORIGIN, yaw: 0, fixed: true })],
    performers: [
      {
        subject: "a",
        body,
        at: { x: half + 0.2, y: 0, z: 0 },
        yaw: 90,
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
  });
}

/** `a` lies down on the floor and log-rolls toward its left. */
function rolled(
  body: IAutoMovieMotionHumanBody,
  halfTurns: number,
): HumanPerformance {
  const roll: IAutoMovieMotionHumanLogRoll = { toward: "left", halfTurns };
  return new HumanPerformance({
    seed: "log-roll",
    laws: [AutoMovieMotionHumanFloor.logRoll],
    performers: [
      {
        subject: "a",
        body,
        at: ORIGIN,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .lieDown({ kind: "supine" })
      .registered(AutoMovieMotionHumanFloor.logRoll.name, roll).node,
  });
}

/** A segment list's segments of one action. */
function named(
  segments: readonly IAutoMovieMotionHumanSegment[],
  name: string,
): IAutoMovieMotionHumanSegment[] {
  return segments.filter(
    (s: IAutoMovieMotionHumanSegment): boolean => s.name === name,
  );
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
      )!.share
  );
}

/** The displayed chest's forward normal. */
function chest(film: HumanPerformance, t: number): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    film.bones("a", t).get("chest")!.worldRotation,
    { x: 0, y: 0, z: 1 },
  );
}

/**
 * The chest's cross-section perimeter: Ramanujan's ellipse approximation of its
 * breadth and depth.
 */
function perimeter(body: IAutoMovieMotionHumanBody): number {
  const a: number = body.measure.chestBreadth / 2;
  const b: number = body.measure.chestDepth / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
