import { Quaternion, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
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

/** How far the hand's goal moves between the anchor and each later second, metres: up to the farthest a goal at a daily reach's peak speed moves between two anchors (the arm plan's waypoint spacing). */
const MOVES: readonly number[] = [0.01, 0.03, 0.06, 0.08];

/** The displayed sub-frames read inside the overlay's raised span, seconds after its `ready` event: off the anchor grid, one under a frame and the others between anchors. */
const SUBFRAMES: readonly number[] = [0.013, 0.071, 0.19, 0.33];

/** The arm bones whose displayed positions show the arm's branch and swivel: the elbow and the wrist. */
const ARM: readonly AutoMovieHumanoidBone[] = ["rightLowerArm", "rightHand"];

/** The hand placement both fits must share, metres: a tenth of a millimetre. */
const HAND: number = 1e-4;

/**
 * A fit continued from its anchor second's seed picks what a cold fit of the
 * same goal picks: the same bend branch and, within the swivel's own
 * resolution, the same swivel on the same legal arc, so a verdict read on a
 * continued sub-frame reads the pose a cold read would.
 *
 * Scenarios, on the small woman and the large man:
 * 1. A hand goal ahead of the chest is fitted cold at the anchor; the goal
 *    then moves forward and up by up to the farthest a daily reach moves
 *    between two anchors, and each moved goal is fitted twice, cold and
 *    continued from the anchor's seed. Both fits choose the same branch,
 *    swivels within twice the swivel's resolution, and hands within a tenth
 *    of a millimetre.
 * 2. A walk with a held sheet read in the right hand over it: at displayed
 *    sub-frames of the raised hand, off the anchor grid, the display
 *    continues the overlay leaf's arm fit from its anchor (the walk keeps
 *    that anchor's `leaf:0:` arm fits), and places the elbow and the wrist
 *    where the same display does with no anchor fits to continue (every fit
 *    cold): the wrist within a tenth of a millimetre, the elbow within the
 *    arc twice the swivel's resolution sweeps at the upper arm's length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the equality, the bodies, the goal motion, the displayed sub-frames and the tolerances with their sources.
 * @evidence contracts/development/testing.md#behavioral-verification Fits each moved goal through resolveHumanPosture.seeded cold and with the anchor's seed, and reads a performance's displayed bones at sub-frames once through its anchors and once with every anchor emptied, comparing branch, swivel, elbow and wrist.
 * @evidence contracts/development/testing.md#independent-expectations The cold fit is the reference: the continued fit must reproduce the sweep's own choice, never the other way.
 * @evidence contracts/development/testing.md#distinguishing-cases Two extreme bodies, four goal motions up to the anchor spacing's bound, and four sub-frames from under a frame to between anchors.
 * @evidence contracts/development/testing.md#execution-ownership Pure posture fits and in-memory performances on polygon bodies.
 */
export function test_motion_contact_anchor_continuation(): void {
  for (const name of BODIES) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    fits(name, body);
    display(name, body);
  }
}

/** Scenario 1: a continued fit against the cold fit of each moved goal. */
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
  const anchor: IAutoMovieSwivelSeed | null | undefined =
    resolveHumanPosture.seeded(body, goal(0)).seeds.rightArm;
  TestValidator.predicate(`${name} anchor fit has a seed`, !!anchor);
  for (const move of MOVES) {
    const cold: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(body, goal(move));
    const near: IAutoMovieMotionHumanResolveHumanPosture.INear = {
      rightArm: { ...anchor!, tolerance: hingedArmSwivel.RESOLUTION },
    };
    const continued: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(body, goal(move), undefined, near);
    const a: IAutoMovieSwivelSeed | null | undefined = cold.seeds.rightArm;
    const b: IAutoMovieSwivelSeed | null | undefined = continued.seeds.rightArm;
    const turn: number =
      a && b
        ? Math.abs(
            a.swivel - b.swivel - 360 * Math.round((a.swivel - b.swivel) / 360),
          )
        : Infinity;
    TestValidator.predicate(
      `${name} ${move} m: a continued fit keeps the cold fit's branch (${a?.branch} vs ${b?.branch}) and swivel (${turn.toFixed(4)} degrees apart)`,
      !!a &&
        !!b &&
        a.branch === b.branch &&
        turn <= 2 * hingedArmSwivel.RESOLUTION,
    );
    TestValidator.predicate(
      `${name} ${move} m: a continued fit places the hand where the cold fit does`,
      apart(body, cold.pose, continued.pose, "rightHand") <= HAND,
    );
  }
}

/** Scenario 2: displayed sub-frames continued from their anchors against the same display read cold. */
function display(name: string, body: IAutoMovieMotionHumanBody): void {
  const anchored: IAutoMovieMotionHumanPerformance = reading(body);
  const overlay: IAutoMovieMotionHumanSegment.IOverlay | undefined =
    anchored.overlays("a")[0];
  TestValidator.predicate(`${name}: the walk carries the read`, !!overlay);
  const ready: number =
    overlay!.start +
    (overlay!.plan.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === "ready",
    )?.share ?? 0) *
      overlay!.plan.duration;
  const seconds: number[] = SUBFRAMES.map((s: number): number => ready + s);
  const continued: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] =
    seconds.map(
      (t: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        anchored.bones("a", t),
    );

  // The walk keeps its anchors' overlay leaf arm fits: the sub-frames
  // continued them.
  const walk: readonly IAutoMovieMotionHumanSegment[] = anchored.segments("a");
  const kept: IAutoMovieMotionHumanSegment.IAnchorFits[] = walk.flatMap(
    (
      segment: IAutoMovieMotionHumanSegment,
    ): IAutoMovieMotionHumanSegment.IAnchorFits[] => [
      ...(segment.anchors?.values() ?? []),
    ],
  );
  TestValidator.predicate(
    `${name}: the sub-frames continue anchors holding the overlay leaf's arm fit`,
    kept.some((fits: IAutoMovieMotionHumanSegment.IAnchorFits): boolean =>
      [...fits].some(
        ([fit, seed]: [string, IAutoMovieSwivelSeed | null]): boolean =>
          fit === "leaf:0:rightArm" && seed !== null,
      ),
    ),
  );

  // The same display with every anchor it used emptied: nothing to continue,
  // so each fit is cold.
  const cold: IAutoMovieMotionHumanPerformance = reading(body);
  cold
    .segments("a")
    .forEach((segment: IAutoMovieMotionHumanSegment, i: number): void => {
      const used: IAutoMovieMotionHumanSegment["anchors"] = walk[i]?.anchors;
      if (used === undefined) return;
      segment.anchors = new Map();
      for (const key of used.keys()) segment.anchors.set(key, new Map());
    });
  const elbow: number =
    body.measure.upperArm * ((2 * hingedArmSwivel.RESOLUTION * Math.PI) / 180) +
    HAND;
  seconds.forEach((t: number, i: number): void => {
    const own: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = cold.bones(
      "a",
      t,
    );
    for (const bone of ARM) {
      const gap: number = distance(
        continued[i]!.get(bone)!.worldPosition,
        own.get(bone)!.worldPosition,
      );
      TestValidator.predicate(
        `${name} at ${t.toFixed(3)} s: the continued ${bone} sits where the cold read puts it (${(gap * 1000).toFixed(3)} mm apart)`,
        gap <= (bone === "rightHand" ? HAND : elbow),
      );
    }
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
