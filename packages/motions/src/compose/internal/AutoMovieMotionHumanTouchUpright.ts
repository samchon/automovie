import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchUpright,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";

/*
 * How a held vessel is turned about its own upright axis at a region, so the
 * arm that brings it there keeps it upright, and how far it is leaned.
 *
 * Standing a vessel upright fixes one axis of the hand; its turn about that
 * axis is free, and most of those turns ask the forearm and the wrist for more
 * than their range, so the resolver gives way on the rotation and the vessel
 * tilts. Each candidate turns the region's level normal by a multiple of `STEP`
 * degrees within `SPAN` either way (`facings`); each is solved on the posture,
 * and the facing whose reached hand keeps the vessel's axis nearest the asked
 * one is taken, the nearest to head on on a tie, so the first that keeps it
 * exactly ends the search. The turn about that axis is not counted, since it is
 * free. A lean toward the face is a turn of the axis about the level line
 * across the region (`tip`); the least lean that lets the arm drink is
 * `AutoMovieMotionHumanTouchDrink`'s.
 */
export namespace AutoMovieMotionHumanTouchUpright {
  /*
   * The turn either way of head on a held vessel's facing is sought within,
   * degrees (provisional: past it the palm faces away from the region).
   */
  export const SPAN: number = 90;

  /*
   * The step between a held vessel's facing candidates, degrees (provisional).
   */
  export const STEP: number = 15;

  /*
   * The facing an upright vessel's arm reaches best, with its tilt: of the
   * candidate facings, the one whose reached hand keeps the vessel's axis
   * nearest the world's up, the nearest to head on on a tie: two tilts within
   * the joints' tolerance (`ROM_TOLERANCE`, the resolution a fit meets a
   * rotation to) are one, so a rounding-sized difference between a hand's fit
   * and its mirror's never chooses another facing. A vessel at the lips is
   * `AutoMovieMotionHumanTouchDrink.drinking`'s.
   * Parameter body: The body.
   * Parameter posture: The posture the arm is solved on.
   * Parameter side: The hand.
   * Parameter effector: The effector, whose along direction is the vessel's axis.
   * Parameter place: The region.
   * Parameter hint: The elbow's hint, world.
   * Returns: The facing, a lean of 0 and the tilt.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, SolvePlace>,
    hint: IAutoMovieVector3,
  ): IAutoMovieMotionHumanTouchUpright.IFacing {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    if (!(level > 1e-6)) return { facing: place.normal, lean: 0, tilt: 0 };
    const read: ReturnType<typeof AutoMovieMotionHumanDrinkingArm.prepareRead> =
      AutoMovieMotionHumanDrinkingArm.prepareRead(body, side);
    let best: IAutoMovieVector3 = place.normal;
    let least: number = Infinity;
    for (const facing of facings(place.normal, level, SPAN, side)) {
      const error: number = tilt(
        body,
        posture,
        side,
        effector,
        place,
        hint,
        facing,
        read,
      );
      if (error < least - ROM_TOLERANCE) {
        least = error;
        best = facing;
      }
      // A tilt is an angle, never below 0, so once the best is within the
      // tolerance of 0 no later facing can replace it.
      if (least <= ROM_TOLERANCE) break;
    }
    return { facing: best, lean: 0, tilt: least };
  }

  /*
   * The turn that leans a vessel's axis from the world's up toward a region by
   * `lean` degrees: about the level line across the region's level normal, so
   * the vessel's top tips toward the body the region lies on.
   * Parameter normal: The region's outward normal, world.
   * Parameter lean: The lean, degrees.
   * Returns: The turn, world; none when the lean is 0 or the normal has no
   * level part.
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

  /*
   * How far the arm leaves a vessel off upright at one facing, degrees.
   * Parameter body: The body.
   * Parameter posture: The posture the arm is solved on.
   * Parameter side: The hand.
   * Parameter effector: The effector, whose along direction is the vessel's axis.
   * Parameter place: The region.
   * Parameter hint: The elbow's hint, world.
   * Parameter facing: The level world direction the effector faces against.
   * Returns: The tilt of the reached hand's vessel axis from the world's up.
   */
  export function tilt(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, TiltPlace>,
    hint: IAutoMovieVector3,
    facing: IAutoMovieVector3,
    read?: ReturnType<typeof AutoMovieMotionHumanDrinkingArm.prepareRead>,
  ): number {
    const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanTouchLaid.rest(
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
    return read === undefined
      ? AutoMovieMotionHumanDrinkingArm.read(body, posture, side, goal, false)
          .tilt
      : read(posture, goal, false).tilt;
  }

  /*
   * The candidate facings of an upright vessel at a region: its level normal
   * turned by multiples of `STEP` degrees within `SPAN` either way, head on
   * first and then alternately either way, so a search that keeps the first of
   * equals keeps the one nearest head on. Of the two turns of one size the
   * hand's side decides which comes first, a left hand's the mirror image of a
   * right hand's, so a scene and its mirror image search mirrored facings in
   * one order.
   * Parameter normal: The region's outward normal, world.
   * Parameter level: The length of the normal's level part.
   * Parameter span: The turn either way of head on, degrees, a multiple of `STEP`;
   * `SPAN` when absent. A search whose vessel's side about its own axis is
   * free as well (`handToFaceVessel`) needs only the turn between two sides.
   * Parameter side: The hand the vessel is in; the right when absent.
   * Returns: The level unit directions, world.
   */
  export function facings(
    normal: IAutoMovieVector3,
    level: number,
    span: number = SPAN,
    side: AutoMovieHumanSide = "right",
  ): IAutoMovieVector3[] {
    const first: FacingsFirst = side === "left" ? -1 : 1;
    const out: IAutoMovieVector3[] = [];
    for (let k: number = 0; k <= 2 * Math.floor(span / STEP + 1e-9); k++) {
      const turn: number =
        ((k % 2 === 0 ? 1 : -1) * first * Math.ceil(k / 2) * STEP * Math.PI) /
        180;
      out.push({
        x: (normal.x * Math.cos(turn) + normal.z * Math.sin(turn)) / level,
        y: 0,
        z: (normal.z * Math.cos(turn) - normal.x * Math.sin(turn)) / level,
      });
    }
    return out;
  }
}

/*
 * The alternatives of `FacingsFirst`'s site.
 */
type FacingsFirst = 1 | -1;

/*
 * The alternatives of `TiltPlace`'s site.
 */
type TiltPlace = "point" | "normal";

/*
 * The alternatives of `SolvePlace`'s site.
 */
type SolvePlace = "point" | "normal";
