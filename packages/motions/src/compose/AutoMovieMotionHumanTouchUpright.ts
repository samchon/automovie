import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import type { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import type { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";

/**
 * How a held vessel is turned about its own upright axis at a region, and
 * how far it is leaned toward the face, so the arm that brings it there
 * holds it as a person does.
 *
 * Standing a vessel upright fixes one axis of the hand; its turn about that
 * axis is free, and most of those turns ask the forearm and the wrist for
 * more than their range, so the resolver gives way on the rotation and the
 * vessel tilts. Each candidate turns the region's level normal by a multiple
 * of `STEP` degrees within `SPAN` either way, at leans of the vessel's axis
 * toward the face from upright in `LEAN_STEP` degrees up to `LEAN`; each is
 * solved on the posture, its arm is admitted only as a person drinks with
 * it, and the least lean that admits one is taken, at it the facing whose
 * reached hand keeps the vessel's axis nearest the asked one, the nearest to
 * head on on a tie. The turn about that axis is not counted, since it is
 * free. A vessel held by the grasp it was taken up by has its turn in the
 * hand fixed, so only its lean is sought (`held`); on the way it keeps the
 * attitude both ends hold (`AutoMovieMotionHumanDrinkingArm.carried`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the free turn, why it matters, the candidates, the choice, the tie and the held case.
 * @evidence contracts/development/design.md#principled-representation The vessel's constraint is its axis alone, so the answer is a level direction and a lean with the tilt the arm leaves at them, or for a kept grasp the lean and the wrist's goal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bounds of the search, its answers, the searches, and the lean's turn; read by the touch stroke's `lie`, by the high five and by the hand-to-face law, which compares the tilts of a held prop's candidate sides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No turn or lean is assumed for any region or hand; every candidate is solved by the resolver, which owns the ranges.
 */
export namespace AutoMovieMotionHumanTouchUpright {
  /** The turn either way of head on a held vessel's facing is sought within, degrees (provisional: past it the palm faces away from the region). */
  export const SPAN: number = 90;

  /** The step between a held vessel's facing candidates, degrees (provisional). */
  export const STEP: number = 15;

  /** The step between the leans toward the face a held vessel is tried at, degrees (provisional). */
  export const LEAN_STEP: number = 5;

  /** The most a held vessel is leaned toward the face to let the arm hold it as a drinker does, degrees (provisional: past it the vessel pours). */
  export const LEAN: number = 60;

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

    /** How far the vessel's axis is asked to lean from the world's up toward the region, degrees. */
    lean: number;

    /** How far the reached hand carries the vessel's axis off the asked one, degrees; 0 when the region's normal has no level part. */
    tilt: number;
  }

  /**
   * A vessel held by a kept grasp, leaned toward the face: the lean and the
   * wrist's goal that brings the vessel there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The lean found and the goal it gives, so the stroke and its reference read the one goal the arm was admitted with.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the stroke reads the goal, a reader of the law the lean.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The goal is the admitted one, never rebuilt by the caller.
   */
  export interface IHeld {
    /** How far the vessel's axis leans from where the grasp holds it toward the region, degrees. */
    lean: number;

    /** The wrist's goal at that lean: its point, its rotation, the elbow's hint and the vessel's point as the contact, world. */
    goal: IHumanPosture.IGoal;
  }

  /**
   * The facing and the lean the arm brings the vessel at: the least lean
   * toward the face, in `LEAN_STEP` degrees up to `LEAN`, at which a
   * candidate facing's fitted arm drinks
   * (`AutoMovieMotionHumanDrinkingArm.drinks`), with the facing whose hand
   * meets the vessel's axis best. At each
   * lean every facing is screened by its arm fitted on the posture alone,
   * and the best of those that drink is fitted again as the stroke fits it,
   * held to the stroke's reference, and admitted only if that arm drinks too.
   * Held exactly upright at the lips the vessel asked the elbow up to the
   * shoulder's height with the forearm at its turn's end, whatever its turn
   * about its axis: a drinker tilts the glass at the lips.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector, whose along direction is the vessel's axis.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @returns The facing, the lean and the tilt.
   * @throws {HumanRefusal} When no lean up to `LEAN` and no facing holds a drinking arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the search, the admission, the choice, the measured defect and the refusal; the namespace states the candidates.
   * @evidence contracts/development/implementation.md#principled-implementation Every candidate is solved by the resolver and read on its displayed bones; the arm is admitted by the posture a person drinks in (Murphy et al. 2011), the least lean that admits one is taken so the vessel tips no more than the arm needs, and of the admitted facings the hand's tilt decides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two loops, leans then facings, each facing a goal, a solve, a screen and a compare; each lean's best one referred solve and its admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every candidate of a lean is solved; head on is tried first, so a tie keeps it; the admitted arm is the referred one the stroke shows, never the screen's; with none admitted the law is refused, never given a raised arm.
   * @evidence contracts/development/implementation.md#efficient-algorithms Thirteen entry fits per lean tried and one referred fit of its best, whose own entry fit the resolver's memory already holds, stopping at the first lean that admits an arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanTouchLaid.rest` and `AutoMovieMotionHumanDrinkingArm`, whose `read` solves and reads each candidate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function drinking(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
  ): IFacing {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    if (!(level > 1e-6)) return { facing: place.normal, lean: 0, tilt: 0 };
    const goal = (
      facing: IAutoMovieVector3,
      lean: number,
    ): IHumanPosture.IGoal =>
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
        undefined,
        undefined,
        lean,
      );
    let nearest: string = "";
    for (let lean: number = 0; lean <= LEAN + 1e-9; lean += LEAN_STEP) {
      // Every facing is screened by its entry fit, one solve each; head on
      // first, then alternately either way, so a tie keeps the one nearest
      // head on.
      let best: IAutoMovieVector3 | undefined;
      let least: number = Infinity;
      for (const facing of facings(place.normal, level)) {
        const arm: AutoMovieMotionHumanDrinkingArm.IArm =
          AutoMovieMotionHumanDrinkingArm.read(
            body,
            posture,
            side,
            goal(facing, lean),
            false,
          );
        if (lean === 0 && nearest === "") nearest = shown(arm, "and head on");
        if (
          AutoMovieMotionHumanDrinkingArm.drinks(arm) &&
          arm.tilt < least - 1e-9
        ) {
          least = arm.tilt;
          best = facing;
        }
      }
      if (best === undefined) continue;
      // The best is admitted only as the stroke will show it: fitted to the
      // same goal, held to the reference the stroke is held to.
      const admitted: AutoMovieMotionHumanDrinkingArm.IArm =
        AutoMovieMotionHumanDrinkingArm.read(
          body,
          posture,
          side,
          goal(best, lean),
          true,
        );
      if (AutoMovieMotionHumanDrinkingArm.drinks(admitted))
        return { facing: best, lean, tilt: admitted.tilt };
    }
    throw refusal(
      side,
      `and no turn of it within ${SPAN} degrees either way of head on`,
      nearest,
    );
  }

  /**
   * The least lean toward the face at which a vessel the hand holds by a
   * kept grasp is brought to the region by a drinking arm, and the wrist's
   * goal there. The grasp fixes the vessel in the hand, so only its lean is
   * free: the hand's rotation at the region is the grasp's turned by the lean
   * (`tip`), and the wrist stands where that rotation puts the vessel's point
   * on the region, as the touch stroke places a held rotation. Leans are
   * tried as `drinking` tries them, ascending by `LEAN_STEP` up to `LEAN`,
   * each screened by its fit on the posture and admitted by its fit held to
   * its own reference, the arm the stroke shows.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector: the vessel's point in the hand.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @param rotation The hand's rotation the grasp presents the vessel at the region with, world.
   * @returns The least admitted lean and the wrist's goal at it.
   * @throws {HumanRefusal} When no lean up to `LEAN` holds a drinking arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fixed, what is sought, the order, the admission and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A kept grasp fixes the hand-to-vessel rotation, not the hand, so the same drink is admitted by the same posture (Murphy et al. 2011) however the vessel came to the hand; the vessel's point stays on the region as the stroke keeps it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of a goal, a screen and an admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The admitted arm is the referred one the stroke shows; with none admitted the law is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry fit per lean tried and one referred fit of a lean that passes it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanTouchLaid.rest` for the vessel's point and contact, `tip` and `AutoMovieMotionHumanDrinkingArm`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function held(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IHeld {
    const laid: IHumanPosture.IGoal = AutoMovieMotionHumanTouchLaid.rest(
      body,
      posture,
      side,
      effector,
      place,
      "up",
      hint,
      "upright",
    );
    const contact: IAutoMovieVector3 = laid.contact ?? { x: 0, y: 0, z: 0 };
    const at: IAutoMovieVector3 = Vector3.add(
      laid.point,
      Quaternion.rotateVector(laid.rotation!, contact),
    );
    let nearest: string = "";
    for (let lean: number = 0; lean <= LEAN + 1e-9; lean += LEAN_STEP) {
      const turned: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(tip(place.normal, lean), rotation),
      );
      const goal: IHumanPosture.IGoal = {
        ...laid,
        rotation: turned,
        point: Vector3.subtract(at, Quaternion.rotateVector(turned, contact)),
      };
      const arm: AutoMovieMotionHumanDrinkingArm.IArm =
        AutoMovieMotionHumanDrinkingArm.read(body, posture, side, goal, false);
      if (lean === 0) nearest = shown(arm, "as the grasp holds it");
      if (
        AutoMovieMotionHumanDrinkingArm.drinks(arm) &&
        AutoMovieMotionHumanDrinkingArm.drinks(
          AutoMovieMotionHumanDrinkingArm.read(body, posture, side, goal, true),
        )
      )
        return { lean, goal };
    }
    throw refusal(side, "in the grasp it was taken up by", nearest);
  }

  /**
   * The facing an upright vessel's arm reaches best, with its tilt: of the
   * candidate facings, the one whose reached hand keeps the vessel's axis
   * nearest the world's up, the nearest to head on on a tie. A vessel at
   * the lips is `drinking`'s.
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `AutoMovieMotionHumanTouchLaid.lie` and `held`, so a laid and a held vessel lean alike.
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

  /** The candidate facings, head on first and then alternately either way by `STEP`. */
  function facings(
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

  /** The arm of the upright, unleaned vessel, for a refusal. */
  function shown(
    arm: AutoMovieMotionHumanDrinkingArm.IArm,
    how: string,
  ): string {
    return `upright ${how} the upper arm is raised ${arm.elevation.toFixed(0)} degrees, the elbow ${(arm.drop * 1000).toFixed(0)} mm below the shoulder and the forearm's twist ${arm.room.toFixed(0)} degrees inside its range`;
  }

  /** The refusal of a vessel no lean lets the arm drink with. */
  function refusal(
    side: HumanHand.Side,
    turn: string,
    nearest: string,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: "reach",
      axis: "facing",
      value: side,
      reason: `no lean of the held vessel toward the face up to ${LEAN} degrees ${turn} lets the ${side} arm bring it to the region as a person drinks, the upper arm raised at most ${AutoMovieMotionHumanDrinkingArm.ELEVATION} degrees, the elbow ${AutoMovieMotionHumanDrinkingArm.DROP * 1000} mm or more below the shoulder and the forearm's twist ${AutoMovieMotionHumanTouchLaid.MARGIN} degrees inside its range (${nearest})`,
      fix: "bring the vessel to a region nearer the chin, or hold it by its side",
    });
  }
}
