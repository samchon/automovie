import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import type { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import type { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";

/**
 * How a held vessel is turned about its own upright axis at a region, so
 * the arm that brings it there keeps it upright, and how far it is leaned.
 *
 * Standing a vessel upright fixes one axis of the hand; its turn about that
 * axis is free, and most of those turns ask the forearm and the wrist for
 * more than their range, so the resolver gives way on the rotation and the
 * vessel tilts. Each candidate turns the region's level normal by a multiple
 * of `STEP` degrees within `SPAN` either way (`facings`); each is solved on
 * the posture, and the facing whose reached hand keeps the vessel's axis
 * nearest the asked one is taken, the nearest to head on on a tie. The turn
 * about that axis is not counted, since it is free. A lean toward the face
 * is a turn of the axis about the level line across the region (`tip`);
 * the least lean that lets the arm drink is `AutoMovieMotionHumanTouchDrink`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the free turn, why it matters, the candidates, the choice, the tie, the lean's turn and who seeks the lean.
 * @evidence contracts/development/design.md#principled-representation The vessel's constraint is its axis alone, so the answer is a level direction and the tilt the arm leaves at it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The candidates' bounds, the answer, the search, its candidates, the tilt and the lean's turn; read by the touch stroke's `lie` and held rotation, by the high five, by the drinking search and by the hand-to-face law, which compares the tilts of a held prop's candidate sides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No turn is assumed for any region or hand; every candidate is solved by the resolver, which owns the ranges.
 */ export namespace AutoMovieMotionHumanTouchUpright {
  /** The turn either way of head on a held vessel's facing is sought within, degrees (provisional: past it the palm faces away from the region). */
  export const SPAN: number = 90;

  /** The step between a held vessel's facing candidates, degrees (provisional). */
  export const STEP: number = 15;

  /**
   * A vessel's facing and lean at a region and the tilt the arm leaves there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The chosen level direction and lean with the residual it was chosen by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members: the stroke reads the facing and the lean, a choice among several effectors the tilt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tilt is the reached one, never the asked one.
   */
  export interface IFacing {
    /** The level world direction the effector faces against; the region's normal when it has no level part. */
    facing: IAutoMovieVector3;

    /** How far the vessel's axis is asked to lean from the world's up toward the region, degrees (`AutoMovieMotionHumanTouchDrink`); 0 from `solve`. */
    lean: number;

    /** How far the reached hand carries the vessel's axis off the asked one, degrees; 0 when the region's normal has no level part. */
    tilt: number;
  }

  /**
   * The facing an upright vessel's arm reaches best, with its tilt: of the
   * candidate facings, the one whose reached hand keeps the vessel's axis
   * nearest the world's up, the nearest to head on on a tie. A vessel at
   * the lips is `AutoMovieMotionHumanTouchDrink.drinking`'s.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector, whose along direction is the vessel's axis.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @returns The facing, a lean of 0 and the tilt.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the choice and the tie; the namespace states the candidates.
   * @evidence contracts/development/implementation.md#principled-implementation Every candidate is solved by the resolver and the reached hand's tilt decides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of goal, solve and compare.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every candidate is solved; head on is tried first, so a tie keeps it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per candidate, thirteen per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `tilt`.
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
    if (!(level > 1e-6)) return { facing: place.normal, lean: 0, tilt: 0 };
    let best: IAutoMovieVector3 = place.normal;
    let least: number = Infinity;
    for (const facing of facings(place.normal, level)) {
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
    return { facing: best, lean: 0, tilt: least };
  }

  /**
   * The turn that leans a vessel's axis from the world's up toward a region
   * by `lean` degrees: about the level line across the region's level
   * normal, so the vessel's top tips toward the body the region lies on.
   *
   * @param normal The region's outward normal, world.
   * @param lean The lean, degrees.
   * @returns The turn, world; none when the lean is 0 or the normal has no level part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis, the sense and the case of no turn.
   * @evidence contracts/development/implementation.md#principled-implementation A lean toward the face is a turn about the horizontal line across the way the region faces, which keeps the vessel's turn about its own axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One level direction, one cross product and one turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A normal with no level part gives no turn instead of normalizing a zero vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `AutoMovieMotionHumanTouchLaid.lie`, the touch stroke's held rotation and `AutoMovieMotionHumanTouchDrink.held`, so a laid and a held vessel lean alike.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function tip(
    normal: IAutoMovieVector3,
    lean: number,
  ): IAutoMovieQuaternion {
    const level: number = Math.hypot(normal.x, normal.z);
    if (lean === 0 || !(level > 1e-6)) return Quaternion.identity();
    return Quaternion.fromAxisAngle(
      Vector3.normalize(
        Vector3.cross(
          { x: normal.x / level, y: 0, z: normal.z / level },
          { x: 0, y: 1, z: 0 },
        ),
      ),
      lean,
    );
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal and one read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reached rotation is the resolver's, within the joints' ranges, never the asked one.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanTouchLaid.rest` and `AutoMovieMotionHumanDrinkingArm.read`; `solve` calls it per candidate and a held prop's choice calls it with the stroke's own elbow hint.
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
    return AutoMovieMotionHumanDrinkingArm.read(
      body,
      posture,
      side,
      AutoMovieMotionHumanTouchLaid.rest(
        body,
        posture,
        side,
        effector,
        place,
        "up",
        hint,
        "upright",
        facing,
      ),
      false,
    ).tilt;
  }

  /**
   * The candidate facings of an upright vessel at a region: its level
   * normal turned by multiples of `STEP` degrees within `SPAN` either way,
   * head on first and then alternately either way, so a search that keeps
   * the first of equals keeps the one nearest head on.
   *
   * @param normal The region's outward normal, world.
   * @param level The length of the normal's level part.
   * @returns The level unit directions, world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the candidates and their order.
   * @evidence contracts/development/implementation.md#principled-implementation A turn about the world's up of the level normal, by the step either way.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The caller passes a level part it has checked is not zero.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `solve` and by the drinking search (`AutoMovieMotionHumanTouchDrink`).
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function facings(
    normal: IAutoMovieVector3,
    level: number,
  ): IAutoMovieVector3[] {
    const out: IAutoMovieVector3[] = [];
    for (let k: number = 0; k <= 2 * (SPAN / STEP); k++) {
      const turn: number =
        ((k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * STEP * Math.PI) / 180;
      out.push({
        x: (normal.x * Math.cos(turn) + normal.z * Math.sin(turn)) / level,
        y: 0,
        z: (normal.z * Math.cos(turn) - normal.x * Math.sin(turn)) / level,
      });
    }
    return out;
  }
}
