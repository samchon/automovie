import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * The turn of the bend hint about the shoulder-to-wrist line between two
 * displayed seconds, degrees.
 */
const STEP: number = 5;

/**
 * An elbow a law placed (`elbow: "placed"`) follows its pole around the whole
 * turn, continued from second to second: where the pole lies where the
 * shoulder's range refuses the elbow, the elbow holds the legal edge it reached
 * instead of leaving for the other side.
 *
 * Scenarios:
 *
 * 1. On the small woman and the large man, a hand goal ahead of the chest is held
 *    still while its bend hint turns about the shoulder-to-wrist line in
 *    five-degree steps through a whole turn; each second continues the fit
 *    before it. The elbow lies toward its pole, or moves no farther than the
 *    pole's own step on its circle, and the hand stays on its goal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the placed-elbow contract, the turn and the bound.
 * @evidence contracts/development/testing.md#behavioral-verification Fits each second through resolveHumanPosture.seeded with the previous second's seed, as a display does, and reads the elbow and the hand off the posed bones.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the pole's own chord on the elbow's circle; the goal point is the hand's reference.
 * @evidence contracts/development/testing.md#distinguishing-cases A whole turn passes through the arcs the shoulder's range refuses on both extreme bodies.
 * @evidence contracts/development/testing.md#execution-ownership Pure posture fits on in-memory polygon bodies.
 */
export function test_motion_strike_placed_elbow(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-large"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
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
      const shoulder: IAutoMovieVector3 =
        rest.get("rightUpperArm")!.worldPosition;
      const reach: number = body.measure.upperArm + body.measure.forearm;
      const point: IAutoMovieVector3 = {
        x: shoulder.x - 0.15 * reach,
        y: shoulder.y - 0.2 * reach,
        z: shoulder.z + 0.6 * reach,
      };
      // Two unit axes across the shoulder-to-wrist line, which the hint
      // turns in.
      const axis: IAutoMovieVector3 = unit(minus(point, shoulder));
      const across: IAutoMovieVector3 = unit(cross(axis, { x: 0, y: 1, z: 0 }));
      const up: IAutoMovieVector3 = cross(across, axis);
      const middle: IAutoMovieVector3 = {
        x: (shoulder.x + point.x) / 2,
        y: (shoulder.y + point.y) / 2,
        z: (shoulder.z + point.z) / 2,
      };
      const hint = (degrees: number): IAutoMovieVector3 => {
        const a: number = (degrees * Math.PI) / 180;
        return {
          x: middle.x + reach * (Math.cos(a) * across.x + Math.sin(a) * up.x),
          y: middle.y + reach * (Math.cos(a) * across.y + Math.sin(a) * up.y),
          z: middle.z + reach * (Math.cos(a) * across.z + Math.sin(a) * up.z),
        };
      };
      const posture = (degrees: number): IAutoMovieMotionHumanPosture => ({
        ...raw,
        limbs: { rightArm: { point, bend: hint(degrees), elbow: "placed" } },
      });
      let seed: IAutoMovieSwivelSeed | null | undefined;
      let elbow: IAutoMovieVector3 | undefined;
      for (let degrees: number = 0; degrees <= 360; degrees += STEP) {
        const near: IAutoMovieMotionHumanResolveHumanPosture.INear =
          seed === undefined || seed === null
            ? {}
            : { rightArm: { ...seed, tolerance: hingedArmSwivel.RESOLUTION } };
        const fitted: ReturnType<typeof resolveHumanPosture.seeded> =
          resolveHumanPosture.seeded(body, posture(degrees), undefined, near);
        const bones: ReadonlyMap<
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone
        > = poseBones(body, fitted.pose);
        const now: IAutoMovieVector3 =
          bones.get("rightLowerArm")!.worldPosition;
        const hand: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
        checks.check(
          `${name} at ${degrees} degrees the hand stays on its goal`,
          length(minus(hand, point)) <= 1e-3,
        );
        // The elbow's and the hint's offsets across the shoulder-to-wrist line.
        const radial = (p: IAutoMovieVector3): IAutoMovieVector3 =>
          minus(p, plus(shoulder, scale(axis, dot(minus(p, shoulder), axis))));
        const toward: number =
          (Math.acos(
            Math.max(
              -1,
              Math.min(1, dot(unit(radial(now)), unit(radial(hint(degrees))))),
            ),
          ) *
            180) /
          Math.PI;
        if (elbow !== undefined) {
          // The pole's own chord on the elbow's circle about the line.
          const chord: number =
            2 * length(radial(now)) * Math.sin((STEP * Math.PI) / 360);
          const moved: number = length(minus(now, elbow));
          checks.check(
            `${name} at ${degrees} degrees the placed elbow lies toward its pole (${toward.toFixed(2)} degrees off) or holds within the pole's step (${moved.toFixed(4)} m of ${chord.toFixed(4)} m)`,
            toward <= 1 || moved <= chord + 1e-3,
          );
        }
        seed = fitted.seeds.rightArm;
        elbow = now;
      }
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("strike placed elbow");
}

/** A - b. */
function minus(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** A + b. */
function plus(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** A scaled by s. */
function scale(a: IAutoMovieVector3, s: number): IAutoMovieVector3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

/** A · b. */
function dot(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** A × b. */
function cross(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/** |a|. */
function length(a: IAutoMovieVector3): number {
  return Math.sqrt(dot(a, a));
}

/** A / |a|. */
function unit(a: IAutoMovieVector3): IAutoMovieVector3 {
  return scale(a, 1 / length(a));
}
