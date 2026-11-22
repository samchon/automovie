import { Quaternion, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionEvent,
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
import {
  HumanChain,
  HumanPerformance,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** The bodies read: the smallest woman and the largest man of the test population. */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];

/** How far the hand's goal moves between two anchors, metres: the farthest a goal at a daily reach's peak speed moves between them (the arm plan's waypoint spacing). */
const SPAN: number = 0.08;

/** The shares of the span read between the two anchors. */
const SHARES: readonly number[] = [0.125, 0.375, 0.5, 0.75];

/** The displayed seconds read inside the overlay's raised span, after its `ready` event, every 1/120 s over half a second: off the anchor grid, and across several anchors. */
const FRAMES: readonly number[] = Array.from(
  { length: 61 },
  (_: unknown, i: number): number => 0.0013 + i / 120,
);

/** Every how many frames the cold display is read: each of its reads sweeps, so it is read every twentieth of a second. */
const COLD: number = 6;

/** The arm joints whose angles a reader takes from a displayed pose. */
const JOINTS: readonly AutoMovieHumanoidBone[] = [
  "rightShoulder",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
];

/** The hand placement two fits of one goal must share, metres: a tenth of a millimetre. */
const HAND: number = 1e-4;

/** The most a joint centre may move between two displayed frames 1/120 s apart, metres: the motion audit's 5 mm step. */
const STEP: number = 0.005;

/**
 * An arm placed at the anchor course picks what a cold fit picks, and every
 * reader of a displayed second reads one placement.
 *
 * Scenarios, on the small woman and the large man:
 * 1. A hand goal ahead of the chest moves forward and up by the farthest a
 *    daily reach moves between two anchors. Each end is fitted cold, as
 *    the two anchors are; each goal between them is fitted cold and placed
 *    at the shortest-turn interpolation of the ends' swivels, prescribed.
 *    The placement keeps the cold fit's branch, stands as placed (the
 *    closed form reached the goal within the range of motion, so its seed
 *    is the prescribed swivel: a legal fit), puts the hand where the cold
 *    fit does, and its swivel lies within the ends' own swivel span of the
 *    cold swivel.
 * 2. A walk with a held sheet read in the right hand over it, every 1/120 s
 *    of half a second of the raised hand, off the anchor grid:
 *    - the verdicts' bone read and playback's pose read of a frame are the
 *      same pose, though the two performances read the frames in opposite
 *      orders;
 *    - the elbow and wrist move about the shoulder by at most the audit's
 *      5 mm between neighbouring frames, across every anchor boundary;
 *    - against the same display with every anchor emptied (each fit cold),
 *      read every twentieth of a second, the wrist is on the same goal within a tenth of a millimetre and the
 *      elbow on the same side of the shoulder-wrist axis (the same branch);
 *    - the walk keeps the anchors' overlay leaf arm fits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bodies, the goal motion, the frames, each pinned property and the source of each tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Fits goals through resolveHumanPosture.seeded cold and prescribed, and reads a performance's displayed bones and poses at frames through its anchors, in two read orders and with every anchor emptied.
 * @evidence contracts/development/testing.md#independent-expectations The cold fit and the cold display are the references; the anchor course must keep their branch and goal, never the other way, and two read orders must agree exactly.
 * @evidence contracts/development/testing.md#distinguishing-cases Two extreme bodies, four shares between two anchors, and sixty-one frames spanning several anchor boundaries.
 * @evidence contracts/development/testing.md#execution-ownership Pure posture fits and in-memory performances on polygon bodies.
 */
export function test_motion_contact_anchor_continuation(): void {
  for (const name of BODIES) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    fits(name, body);
    display(name, body);
  }
}

/** Scenario 1: placements at interpolated anchor swivels against cold fits of the same goals. */
function fits(name: string, body: IAutoMovieMotionHumanBody): void {
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
        rotation: Quaternion.fromEuler(0, 0, -Math.PI / 2),
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
  TestValidator.predicate(
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
    TestValidator.predicate(
      `${name} at ${share} of the span: the placement keeps the cold fit's branch (${c?.branch} vs ${p?.branch})`,
      !!c && !!p && c.branch === p.branch,
    );
    TestValidator.predicate(
      `${name} at ${share} of the span: the placement stands at the prescribed swivel, a legal fit (${p === null || p === undefined ? "none" : turn(p.swivel, swivel).toFixed(6)} degrees off)`,
      !!p && turn(p.swivel, swivel) <= 1e-9,
    );
    TestValidator.predicate(
      `${name} at ${share} of the span: the placement puts the hand where the cold fit does`,
      apart(body, cold.pose, placed.pose, "rightHand") <= HAND,
    );
    TestValidator.predicate(
      `${name} at ${share} of the span: the swivel lies within the anchors' span of the cold swivel (${c ? turn(c.swivel, swivel).toFixed(4) : "none"} of ${span.toFixed(4)} degrees)`,
      !!c && turn(c.swivel, swivel) <= span + 2 * hingedArmSwivel.RESOLUTION,
    );
  }
}

/** Scenario 2: one placement for every reader of a displayed frame, continuous across anchors, on the cold display's branch and goal. */
function display(name: string, body: IAutoMovieMotionHumanBody): void {
  const verdicts: IAutoMovieMotionHumanPerformance = reading(body);
  const overlay: IAutoMovieMotionHumanSegment.IOverlay | undefined =
    verdicts.overlays("a")[0];
  TestValidator.predicate(`${name}: the walk carries the read`, !!overlay);
  const ready: number =
    overlay!.start +
    (overlay!.plan.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === "ready",
    )?.share ?? 0) *
      overlay!.plan.duration;
  const seconds: number[] = FRAMES.map((s: number): number => ready + s);

  // The verdicts read bones forward; playback reads poses backward.
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] =
    seconds.map(
      (t: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        verdicts.bones("a", t),
    );
  const playback: IAutoMovieMotionHumanPerformance = reading(body);
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
    TestValidator.predicate(
      `${name} at ${t.toFixed(4)} s: the verdicts' pose is playback's (${worst} degrees apart)`,
      worst <= 1e-9,
    );
  });

  // Neighbouring frames move the elbow and the wrist about the shoulder,
  // which carries them along the walk, by at most a step.
  for (let i: number = 1; i < seconds.length; ++i)
    for (const bone of ["rightLowerArm", "rightHand"] as const) {
      const moved: number = distance(
        minus(
          bones[i - 1]!.get(bone)!.worldPosition,
          bones[i - 1]!.get("rightUpperArm")!.worldPosition,
        ),
        minus(
          bones[i]!.get(bone)!.worldPosition,
          bones[i]!.get("rightUpperArm")!.worldPosition,
        ),
      );
      TestValidator.predicate(
        `${name} ${bone} from ${seconds[i - 1]!.toFixed(4)} s: moves ${(moved * 1000).toFixed(3)} mm in a frame`,
        moved <= STEP,
      );
    }

  // The walk keeps its anchors' overlay leaf arm fits.
  const walk: readonly IAutoMovieMotionHumanSegment[] = verdicts.segments("a");
  TestValidator.predicate(
    `${name}: the frames are placed from anchors holding the overlay leaf's arm fit`,
    walk.some((segment: IAutoMovieMotionHumanSegment): boolean =>
      [...(segment.anchors?.values() ?? [])].some(
        (fits: IAutoMovieMotionHumanSegment.IAnchorFits): boolean =>
          (fits.get("leaf:0:rightArm") ?? null) !== null,
      ),
    ),
  );

  // The same display with every anchor it used emptied: each fit is cold.
  const cold: IAutoMovieMotionHumanPerformance = reading(body);
  cold
    .segments("a")
    .forEach((segment: IAutoMovieMotionHumanSegment, i: number): void => {
      const used: IAutoMovieMotionHumanSegment["anchors"] = walk[i]?.anchors;
      if (used === undefined) return;
      segment.anchors = new Map();
      for (const key of used.keys()) segment.anchors.set(key, new Map());
    });
  seconds.forEach((t: number, i: number): void => {
    if (i % COLD !== 0) return;
    const own: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = cold.bones(
      "a",
      t,
    );
    const wrist: number = distance(
      bones[i]!.get("rightHand")!.worldPosition,
      own.get("rightHand")!.worldPosition,
    );
    TestValidator.predicate(
      `${name} at ${t.toFixed(4)} s: the wrist is on the cold read's goal (${(wrist * 1000).toFixed(4)} mm apart)`,
      wrist <= HAND,
    );
    TestValidator.predicate(
      `${name} at ${t.toFixed(4)} s: the elbow is on the cold read's side of the shoulder-wrist axis`,
      side(bones[i]!, own) > 0,
    );
  });
}

/** A walk of 2 m with a sheet read in the right hand over it. */
function reading(
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanPerformance {
  return new HumanPerformance({
    seed: "anchor",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .walk({ to: { x: 0, y: 0, z: 2 } })
      .over((u) => u.handToFace({ task: "read", side: "right", seconds: 0.5 }))
      .node,
  });
}

/** The shortest turn between two swivels, degrees. */
function turn(a: number, b: number): number {
  const d: number = a - b;
  return Math.abs(d - 360 * Math.round(d / 360));
}

/** The largest clinical angle difference of one joint between two poses, degrees. */
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
  return Math.max(
    Math.abs(p.flexion - q.flexion),
    Math.abs(p.abduction - q.abduction),
    Math.abs(p.twist - q.twist),
  );
}

/** The cosine-signed agreement of two reads' elbow offsets from their shoulder-wrist axes: positive where both elbows sit on the same side. */
function side(
  a: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  b: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): number {
  const offset = (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 => {
    const s: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
    const e: IAutoMovieVector3 = bones.get("rightLowerArm")!.worldPosition;
    const w: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
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
