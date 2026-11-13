import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import type { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";

/**
 * How a held vessel is turned about its own upright axis at a region, so
 * the arm that brings it there keeps it upright.
 *
 * Standing a vessel upright fixes one axis of the hand; its turn about that
 * axis is free, and most of those turns ask the forearm and the wrist for
 * more than their range, so the resolver gives way on the rotation and the
 * vessel tilts. Each candidate turns the region's level normal by a multiple
 * of `STEP` degrees within `SPAN` either way; each is solved on the posture
 * and the one whose reached hand keeps the vessel's axis nearest the world's
 * up is kept, the nearest to head on on a tie. The turn about that axis is
 * not counted, since it is free.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the free turn, why it matters, the candidates, the choice and the tie.
 * @evidence contracts/development/design.md#principled-representation The vessel's constraint is its axis alone, so the answer is a level direction and the tilt the arm leaves at it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two bounds of the search, its answer and the search; read by the touch stroke's `upright` and by the hand-to-face law, which compares the tilts of a held prop's candidate sides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No turn is assumed for any region or hand; every candidate is solved by the resolver, which owns the ranges.
 */
export namespace AutoMovieMotionHumanTouchUpright {
  /** The turn either way of head on a held vessel's facing is sought within, degrees (provisional: past it the palm faces away from the region). */
  export const SPAN: number = 90;

  /** The step between a held vessel's facing candidates, degrees (provisional). */
  export const STEP: number = 15;

  /**
   * A vessel's facing at a region and the tilt the arm leaves there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The chosen level direction with the residual it was chosen by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the stroke reads the facing, a choice among several effectors the tilt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tilt is the reached one, never the asked one, which is always zero.
   */
  export interface IFacing {
    /** The level world direction the effector faces against; the region's normal when it has no level part. */
    facing: IAutoMovieVector3;

    /** How far the reached hand carries the vessel's axis off the world's up, degrees; 0 when the region's normal has no level part. */
    tilt: number;
  }

  /**
   * The facing the arm reaches best, with its tilt.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector, whose along direction is the vessel's axis.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @returns The facing and its tilt.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result; the namespace states the search.
   * @evidence contracts/development/implementation.md#principled-implementation The asked rotation lays the effector's along axis on the world's up, so that axis at rest is the up turned back by it; the tilt is how far the reached rotation, read off the resolver, carries it off the up.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of goal, solve and compare.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every candidate is solved; head on is tried first, so a tie keeps it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per candidate, thirteen per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanTouchLaid.rest`, the resolver and `poseBones`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function solve(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
  ): IFacing {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    if (!(level > 1e-6)) return { facing: place.normal, tilt: 0 };
    let best: IAutoMovieVector3 = place.normal;
    let least: number = Infinity;
    for (let k: number = 0; k <= 2 * (SPAN / STEP); k++) {
      // Head on first, then alternately either way, so a tie keeps the one
      // nearest head on.
      const degrees: number = (k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * STEP;
      const turn: number = (degrees * Math.PI) / 180;
      const facing: IAutoMovieVector3 = {
        x:
          (place.normal.x * Math.cos(turn) + place.normal.z * Math.sin(turn)) /
          level,
        y: 0,
        z:
          (place.normal.z * Math.cos(turn) - place.normal.x * Math.sin(turn)) /
          level,
      };
      const error: number = tilt(
        body,
        posture,
        side,
        effector,
        place,
        hint,
        facing,
      );
      if (error < least - 1e-9) {
        least = error;
        best = facing;
      }
    }
    return { facing: best, tilt: least };
  }

  /**
   * How far the arm leaves a vessel off upright at one facing, degrees.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector, whose along direction is the vessel's axis.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @param facing The level world direction the effector faces against.
   * @returns The tilt of the reached hand's vessel axis from the world's up.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what is measured.
   * @evidence contracts/development/implementation.md#principled-implementation The asked rotation lays the effector's along axis on the world's up, so that axis at rest is the up turned back by it; the tilt is how far the rotation the resolver reaches carries it off the up.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal, one solve, one angle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reached rotation is the resolver's, within the joints' ranges, never the asked one.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanTouchLaid.rest`, the resolver and `poseBones`; `solve` calls it per candidate and a held prop's choice calls it with the stroke's own elbow hint.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function tilt(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    facing: IAutoMovieVector3,
  ): number {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const goal: IHumanPosture.IGoal = AutoMovieMotionHumanTouchLaid.rest(
      body,
      posture,
      side,
      effector,
      place,
      "up",
      hint,
      "upright",
      facing,
    );
    const reached: IAutoMovieQuaternion = poseBones(
      body,
      resolveHumanPosture(body, {
        ...posture,
        limbs: { ...posture.limbs, [limb]: goal },
      }),
    ).get(`${side}Hand`)!.worldRotation;
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.normalize(reached),
      Quaternion.rotateVector(
        Quaternion.inverse(Quaternion.normalize(goal.rotation!)),
        up,
      ),
    );
    return (
      (Math.acos(
        Math.min(1, Math.max(-1, Vector3.dot(Vector3.normalize(axis), up))),
      ) *
        180) /
      Math.PI
    );
  }
}
