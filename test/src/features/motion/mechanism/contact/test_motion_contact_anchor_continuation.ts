import { createBall } from "@automovie/archetypes";
import { Quaternion, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";

import { everydayTake } from "../../../internal/everydayTake";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * The bodies read: the smallest woman and the largest man of the test
 * population.
 */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];

/**
 * How far the hand's goal moves between two anchors, metres: the farthest a
 * goal at a daily reach's peak speed moves between them (the arm plan's
 * waypoint spacing).
 */
const SPAN: number = 0.08;

/** The shares of the span read between the two anchors. */
const SHARES: readonly number[] = [0.125, 0.375, 0.5, 0.75];

/**
 * How long after the walk's entry its frames are read, seconds: past the cut's
 * half-second decay, so the carry is the walk's own.
 */
const SETTLED: number = 0.5;

/**
 * The displayed seconds read after `SETTLED`, every 1/120 s over half a second:
 * off the anchor grid, and across several anchors.
 */
const FRAMES: readonly number[] = Array.from(
  { length: 61 },
  (_: unknown, i: number): number => 0.0013 + i / 120,
);

/**
 * Every how many frames the cold display is read: each of its reads sweeps, so
 * it is read every twentieth of a second.
 */
const COLD: number = 6;

/** The arms read. */
const SIDES: readonly ("left" | "right")[] = ["left", "right"];

/** The arm joints whose angles a reader takes from a displayed pose. */
const JOINTS: readonly AutoMovieHumanoidBone[] = SIDES.flatMap(
  (side: "left" | "right"): AutoMovieHumanoidBone[] => [
    `${side}Shoulder`,
    `${side}UpperArm`,
    `${side}LowerArm`,
    `${side}Hand`,
  ],
);

/**
 * The hand placement two fits of one goal must share, metres: a tenth of a
 * millimetre.
 */
const HAND: number = 1e-4;

/**
 * The most a joint centre may move between two displayed frames 1/120 s apart,
 * metres: the motion audit's 5 mm step.
 */
const STEP: number = 0.005;

/**
 * An arm placed at the anchor course picks what a cold fit picks, and every
 * reader of a displayed second reads one placement.
 *
 * Scenarios, on the small woman and the large man:
 *
 * 1. A hand goal ahead of the chest moves forward and up by the farthest a daily
 *    reach moves between two anchors. Each end is fitted cold, as two anchors
 *    on one branch; each goal between them is fitted cold and placed at the
 *    shortest-turn interpolation of the ends' swivels, prescribed. The
 *    placement keeps the cold fit's branch, stands as placed (the closed form
 *    reached the goal within the range of motion and clear of the trunk, so its
 *    seed is the prescribed swivel: a legal fit), puts the hand where the cold
 *    fit does, and its swivel, lying between the ends' swivels, is no farther
 *    from the cold swivel than the farther end's is.
 * 2. A basketball picked up from the floor and carried on a 2 m walk, every 1/120
 *    s of half a second of the walk, off the anchor grid:
 *
 *    - The verdicts' bone read and playback's pose read of a frame are the same
 *         pose, though the two performances read the frames in opposite
 *         orders;
 *    - The walk keeps anchors holding a carried arm's fit;
 *    - Each carried elbow and wrist moves about its shoulder by at most the audit's
 *         5 mm between neighbouring frames, across every anchor boundary;
 *    - Against the same display with every anchor emptied (each fit cold), read
 *         every twentieth of a second, each carried wrist is on the same goal
 *         within a tenth of a millimetre and each carried elbow on the same
 *         side of its shoulder-wrist axis (the same branch).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bodies, the goal motion, the take, the frames, each pinned property and the source of each tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Fits goals through resolveHumanPosture.seeded cold and prescribed, and reads a performance's displayed bones and poses at frames through its anchors, in two read orders and with every anchor emptied.
 * @evidence contracts/development/testing.md#independent-expectations The cold fit and the cold display are the references; the anchor course must keep their branch and goal, never the other way, and two read orders must agree exactly.
 * @evidence contracts/development/testing.md#distinguishing-cases Two extreme bodies, four shares between two anchors, both arms, and sixty-one frames spanning several anchor boundaries.
 * @evidence contracts/development/testing.md#execution-ownership Pure posture fits and in-memory performances of a polygon body and a ball.
 */ export function test_motion_contact_anchor_continuation(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of BODIES) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      try {
        fits(checks, name, body);
      } catch (error: unknown) {
        checks.check(
          `${String(name)} fits: ${everydayTake.describe(error)}`,
          false,
        );
      }
      try {
        display(checks, name, body);
      } catch (error: unknown) {
        checks.check(
          `${String(name)} display: ${everydayTake.describe(error)}`,
          false,
        );
      }
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("contact anchor continuation");
}

/**
 * Scenario 1: placements at interpolated anchor swivels against cold fits of
 * the same goals.
 */
function fits(
  checks: motionComplaints.IGatherer,
  name: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const raw: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture(body, raw));
  const chest: IAutoMovieVector3 = rest.get("chest")!.worldPosition;
  const reach: number = body.measure.upperArm + body.measure.forearm;
  const goal = (move: number): IAutoMovieMotionHumanPosture => ({
    ...raw,
    limbs: {
      rightArm: {
        point: {
          x: chest.x - 0.1 * reach,
          y: chest.y - 0.25 * reach + move / 2,
          z: chest.z + 0.55 * reach + move,
        },
        rotation: Quaternion.fromEuler({
          x: 0,
          y: 0,
          z: -Math.PI / 2,
          order: "XYZ",
        }),
        bend: {
          x: chest.x - 0.6 * reach,
          y: chest.y - 0.5 * reach,
          z: chest.z,
        },
      },
    },
  });
  const a: IAutoMovieSwivelSeed | null | undefined = resolveHumanPosture.seeded(
    body,
    goal(0),
  ).seeds.rightArm;
  const b: IAutoMovieSwivelSeed | null | undefined = resolveHumanPosture.seeded(
    body,
    goal(SPAN),
  ).seeds.rightArm;
  checks.check(
    `${name}: both anchors fit on one branch`,
    !!a && !!b && a.branch === b.branch,
  );
  const span: number = turn(a!.swivel, b!.swivel);
  for (const share of SHARES) {
    const move: number = share * SPAN;
    const cold: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(body, goal(move));
    const swivel: number =
      a!.swivel +
      (b!.swivel -
        a!.swivel -
        360 * Math.round((b!.swivel - a!.swivel) / 360)) *
        share;
    const placed: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(body, goal(move), undefined, {
        rightArm: {
          swivel,
          branch: a!.branch,
          tolerance: hingedArmSwivel.RESOLUTION,
          prescribed: true,
        },
      });
    const c: IAutoMovieSwivelSeed | null | undefined = cold.seeds.rightArm;
    const p: IAutoMovieSwivelSeed | null | undefined = placed.seeds.rightArm;
    checks.check(
      `${name} at ${share} of the span: the placement keeps the cold fit's branch (${c?.branch} vs ${p?.branch})`,
      !!c && !!p && c.branch === p.branch,
    );
    checks.check(
      `${name} at ${share} of the span: the placement stands at the prescribed swivel, a legal fit (${p === null || p === undefined ? "none" : turn(p.swivel, swivel).toFixed(6)} degrees off)`,
      !!p && turn(p.swivel, swivel) <= 1e-9,
    );
    checks.check(
      `${name} at ${share} of the span: the placement puts the hand where the cold fit does`,
      apart(body, cold.pose, placed.pose, "rightHand") <= HAND,
    );
    checks.check(
      `${name} at ${share} of the span: the swivel is no farther from the cold swivel than the farther anchor (${c ? turn(c.swivel, swivel).toFixed(4) : "none"} of ${c ? Math.max(turn(c.swivel, a!.swivel), turn(c.swivel, b!.swivel)).toFixed(4) : "none"} degrees, anchors ${span.toFixed(4)} apart)`,
      !!c &&
        turn(c.swivel, swivel) <=
          Math.max(turn(c.swivel, a!.swivel), turn(c.swivel, b!.swivel)) + 1e-9,
    );
  }
}

/**
 * Scenario 2: one placement for every reader of a displayed frame, continuous
 * across anchors, on the cold display's branch and goal.
 */
function display(
  checks: motionComplaints.IGatherer,
  name: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const verdicts: IAutoMovieMotionHumanPerformance = carrying(body);
  const walk: IAutoMovieMotionHumanSegment | undefined =
    verdicts.segments("a")[1];
  checks.check(`${name}: the pickup is followed by the walk`, !!walk);
  const seconds: number[] = FRAMES.map(
    (s: number): number => walk!.entryTime + SETTLED + s,
  );

  // The verdicts read bones forward; playback reads poses backward.
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] =
    seconds.map(
      (t: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        verdicts.bones("a", t),
    );
  const playback: IAutoMovieMotionHumanPerformance = carrying(body);
  const poses: IAutoMoviePose[] = [...seconds]
    .reverse()
    .map((t: number): IAutoMoviePose => playback.pose("a", t))
    .reverse();
  const shown: IAutoMoviePose[] = seconds.map(
    (t: number): IAutoMoviePose => verdicts.pose("a", t),
  );
  seconds.forEach((t: number, i: number): void => {
    const worst: number = Math.max(
      ...JOINTS.map((bone: AutoMovieHumanoidBone): number =>
        angles(shown[i]!, poses[i]!, bone),
      ),
    );
    checks.check(
      `${name} at ${t.toFixed(4)} s: the verdicts' pose is playback's (${worst} degrees apart)`,
      worst <= 1e-9,
    );
  });

  // The carried arms: those the walk's anchors hold a carry fit of, which
  // the frames were placed from.
  const carried: ("left" | "right")[] = SIDES.filter(
    (side: "left" | "right"): boolean =>
      [...(walk!.anchors?.values() ?? [])].some(
        (fits: IAutoMovieMotionHumanSegment.IAnchorFits): boolean =>
          [...fits].some(
            ([fit, seed]: [string, IAutoMovieSwivelSeed | null]): boolean =>
              fit.startsWith("carry:") &&
              fit.endsWith(`:${side}Arm`) &&
              seed !== null,
          ),
      ),
  );
  checks.check(
    `${name}: the frames are placed from anchors holding a carried arm's fit`,
    carried.length !== 0,
  );

  // Neighbouring frames move a carried elbow and wrist about its shoulder,
  // which carries them along the walk with the chest, by at most a step.
  for (let i: number = 1; i < seconds.length; ++i)
    for (const side of carried)
      for (const bone of [`${side}LowerArm`, `${side}Hand`] as const) {
        const moved: number = distance(
          minus(
            bones[i - 1]!.get(bone)!.worldPosition,
            bones[i - 1]!.get(`${side}UpperArm`)!.worldPosition,
          ),
          minus(
            bones[i]!.get(bone)!.worldPosition,
            bones[i]!.get(`${side}UpperArm`)!.worldPosition,
          ),
        );
        checks.check(
          `${name} ${bone} from ${seconds[i - 1]!.toFixed(4)} s: moves ${(moved * 1000).toFixed(3)} mm in a frame`,
          moved <= STEP,
        );
      }
  // The same display with every anchor it used emptied: each fit is cold.
  const cold: IAutoMovieMotionHumanPerformance = carrying(body);
  const used: readonly IAutoMovieMotionHumanSegment[] = verdicts.segments("a");
  cold
    .segments("a")
    .forEach((segment: IAutoMovieMotionHumanSegment, i: number): void => {
      const kept: IAutoMovieMotionHumanSegment["anchors"] = used[i]?.anchors;
      if (kept === undefined) return;
      segment.anchors = new Map();
      for (const key of kept.keys()) segment.anchors.set(key, new Map());
    });
  seconds.forEach((t: number, i: number): void => {
    if (i % COLD !== 0) return;
    const own: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = cold.bones(
      "a",
      t,
    );
    for (const side of carried) {
      const wrist: number = distance(
        bones[i]!.get(`${side}Hand`)!.worldPosition,
        own.get(`${side}Hand`)!.worldPosition,
      );
      checks.check(
        `${name} ${side} at ${t.toFixed(4)} s: the wrist is on the cold read's goal (${(wrist * 1000).toFixed(4)} mm apart)`,
        wrist <= HAND,
      );
      checks.check(
        `${name} ${side} at ${t.toFixed(4)} s: the elbow is on the cold read's side of the shoulder-wrist axis`,
        elbows(bones[i]!, own, side) > 0,
      );
    }
  });
}

/** A basketball picked up from the floor and carried on a 2 m walk. */
function carrying(
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanPerformance {
  return new HumanPerformance({
    seed: "anchor",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 1.2 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("ball", createBall({ kind: "basketball" }), {
        position: { x: 0, y: 0, z: 1.69 },
        rotation: Quaternion.identity(),
      }),
    ],
    composition: HumanChain.subject("a")
      .pickUp({ prop: "ball", handle: "grip", lift: 0.15 })
      .walk({ to: { x: 0, y: 0, z: 3.2 } }).node,
  });
}

/** The shortest turn between two swivels, degrees. */
function turn(a: number, b: number): number {
  const d: number = a - b;
  return Math.abs(d - 360 * Math.round(d / 360));
}

/**
 * The largest clinical angle difference of one joint between two poses,
 * degrees.
 */
function angles(
  a: IAutoMoviePose,
  b: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
): number {
  const p: IAutoMovieJointPose | undefined = a.joints.find(
    (joint: IAutoMovieJointPose): boolean => joint.bone === bone,
  );
  const q: IAutoMovieJointPose | undefined = b.joints.find(
    (joint: IAutoMovieJointPose): boolean => joint.bone === bone,
  );
  if (p === undefined || q === undefined) return p === q ? 0 : Infinity;
  // A null angle is an unset one, zero.
  return Math.max(
    Math.abs((p.flexion ?? 0) - (q.flexion ?? 0)),
    Math.abs((p.abduction ?? 0) - (q.abduction ?? 0)),
    Math.abs((p.twist ?? 0) - (q.twist ?? 0)),
  );
}

/**
 * The cosine-signed agreement of two reads' elbow offsets from one arm's
 * shoulder-wrist axis: positive where both elbows sit on the same side.
 */
function elbows(
  a: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  b: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: "left" | "right",
): number {
  const offset = (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 => {
    const s: IAutoMovieVector3 = bones.get(`${side}UpperArm`)!.worldPosition;
    const e: IAutoMovieVector3 = bones.get(`${side}LowerArm`)!.worldPosition;
    const w: IAutoMovieVector3 = bones.get(`${side}Hand`)!.worldPosition;
    const axis: IAutoMovieVector3 = minus(w, s);
    const along: number = dot(minus(e, s), axis) / dot(axis, axis);
    return minus(minus(e, s), scale(axis, along));
  };
  return dot(offset(a), offset(b));
}

/** The distance between one bone of two poses, metres. */
function apart(
  body: IAutoMovieMotionHumanBody,
  a: IAutoMoviePose,
  b: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
): number {
  return distance(
    poseBones(body, a).get(bone)!.worldPosition,
    poseBones(body, b).get(bone)!.worldPosition,
  );
}

/** The distance between two points, metres. */
function distance(p: IAutoMovieVector3, q: IAutoMovieVector3): number {
  return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
}

/** The difference of two vectors. */
function minus(p: IAutoMovieVector3, q: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: p.x - q.x, y: p.y - q.y, z: p.z - q.z };
}

/** The dot product of two vectors. */
function dot(p: IAutoMovieVector3, q: IAutoMovieVector3): number {
  return p.x * q.x + p.y * q.y + p.z * q.z;
}

/** A vector scaled. */
function scale(p: IAutoMovieVector3, k: number): IAutoMovieVector3 {
  return { x: p.x * k, y: p.y * k, z: p.z * k };
}
