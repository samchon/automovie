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
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "./AutoMovieMotionHumanTouchUpright";

/**
 * How far a vessel is leaned toward the face at the lips, and turned there,
 * so the arm that brings it holds it as a person drinks: the least lean, in
 * `LEAN_STEP` degrees up to `LEAN`, whose fitted arm drinks with the
 * vessel where it was asked (`AutoMovieMotionHumanDrinkingArm.drinks`, its
 * reached axis within a `LEAN_STEP` of the asked one), with the facing
 * (`AutoMovieMotionHumanTouchUpright`) whose hand meets the vessel's axis
 * best, or for a vessel held by the grasp it was taken up by, the lean
 * alone (`held`). Held exactly upright at the lips the vessel asks the elbow
 * up to the shoulder's height; a drinker tips the glass at the lips with the
 * elbow low (Murphy, Willén and Sunnerhagen 2011).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is sought, the admission and its source, the held case and the measured defect it answers.
 * @evidence contracts/development/design.md#principled-representation A drink at the lips is a lean of the vessel's axis toward the face, with a facing about that axis when the hand's turn is free.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The lean's bounds and steps, the held answer, the two searches and one lean's admission; read by the hand-to-face law and its drinking signature spec; split from the facing (`AutoMovieMotionHumanTouchUpright`) so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No lean is assumed for any region or hand; every candidate is solved by the resolver and admitted on the arm the stroke shows.
 */
export namespace AutoMovieMotionHumanTouchDrink {
  /** The step between the leans toward the face a held vessel is tried at, degrees (provisional). */
  export const LEAN_STEP: number = 5;

  /** The most a held vessel is leaned toward the face to let the arm hold it as a drinker does, degrees (provisional: past it the vessel pours). */
  export const LEAN: number = 60;

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

  /** The step between the leans the search tries first, degrees, inside whose first admitting bracket it tries every `LEAN_STEP` (provisional). */
  export const COARSE: number = 15;

  /**
   * Where the vessel is held after it arrives, while the drinker drinks: the
   * posture with the head turned for the drinking phase and the region on
   * it. A lean is admitted only if the arm still holds the vessel at its
   * asked axis there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and frame.
   * @evidence contracts/development/design.md#principled-representation The drinking phase's posture and region, the second place the arm must hold the vessel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `trial` and `held`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The region is read on that posture, never moved by hand.
   */
  export interface IAfter {
    /** The posture of the drinking phase. */
    posture: IHumanPosture;

    /** The region on it. */
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">;
  }

  /**
   * The facing and the lean the arm brings the vessel at: the least lean
   * toward the face, in `LEAN_STEP` degrees up to `LEAN`, at which a
   * candidate facing's fitted arm drinks (`admitted`), with the facing whose
   * hand meets the vessel's axis best. Leans are tried every `COARSE`
   * degrees, then every `LEAN_STEP` inside the first bracket that admits
   * one, which returns the least admitting lean when admission holds at
   * every lean above the least one: the elbow drops as the vessel leans
   * toward the face, so a lean that admits an arm is not followed by a
   * greater one that does not, within a bracket. Held exactly upright at
   * the lips the vessel asked the elbow up to the shoulder's height with the
   * forearm at its turn's end, whatever its turn about its axis: a drinker
   * tilts the glass at the lips.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector, whose along direction is the vessel's axis.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @param after Where the vessel is held while the drinker drinks; the arrival alone when absent.
   * @returns The facing, the lean and the tilt.
   * @throws {HumanRefusal} When no lean up to `LEAN` and no facing holds a drinking arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the search, its assumption, the admission, the choice, the measured defect and the refusal; the namespace states the candidates.
   * @evidence contracts/development/implementation.md#principled-implementation Every candidate is solved by the resolver and read on its displayed bones; the arm is admitted by the posture a person drinks in (Murphy et al. 2011), the least lean that admits one is taken so the vessel tips no more than the arm needs, and of the admitted facings the hand's tilt decides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One coarse-to-fine walk of the leans (`least`), each lean one `trial`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The monotone admission the refinement relies on is stated here and read by the drinking signature spec, which checks that the lean a step below the returned one does not admit; with none admitted the law is refused, never given a raised arm.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five coarse leans and at most two fine ones, each thirteen entry fits and one referred fit, where every 5-degree lean took thirteen.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `trial`, `least` and `AutoMovieMotionHumanDrinkingArm`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function drinking(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    after?: IAfter,
  ): AutoMovieMotionHumanTouchUpright.IFacing {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    if (!(level > 1e-6)) return { facing: place.normal, lean: 0, tilt: 0 };
    let nearest: INearest | undefined;
    const found: AutoMovieMotionHumanTouchUpright.IFacing | undefined = least(
      (lean: number): AutoMovieMotionHumanTouchUpright.IFacing | undefined =>
        trial(
          body,
          posture,
          side,
          effector,
          place,
          hint,
          lean,
          (arm: AutoMovieMotionHumanDrinkingArm.IArm, at: string): void => {
            nearest = near(nearest, arm, at);
          },
          after,
        ),
    );
    if (found !== undefined) return found;
    throw refusal(
      side,
      `and no turn of it within ${AutoMovieMotionHumanTouchUpright.SPAN} degrees either way of head on`,
      nearest!,
    );
  }

  /**
   * Whether a lean admits a drinking arm, and with which facing: every
   * candidate facing is screened by its arm fitted on the posture alone,
   * head on first and then alternately either way, and the best of those
   * that drink with the vessel where it was asked (`holds`), the one whose hand
   * meets the vessel's axis best, is fitted again as the stroke fits it,
   * held to the stroke's reference, and admitted only if that arm drinks
   * too and, with `after`, the arm still holds the vessel at its asked axis
   * in the drinking phase.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector, whose along direction is the vessel's axis.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @param lean The lean toward the face, degrees.
   * @param after Where the vessel is held while the drinker drinks; the arrival alone when absent.
   * @returns The facing, the lean and the tilt; none when the lean admits no arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the screen, the order, the choice and the admission.
   * @evidence contracts/development/implementation.md#principled-implementation The admitted arm is the one the stroke shows, fitted to the same goal and reference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation to `trial`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every facing is solved; a tie keeps the one nearest head on.
   * @evidence contracts/development/implementation.md#efficient-algorithms Thirteen entry fits and one referred fit, whose own entry fit the resolver's memory already holds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `drinking` and by the spec that checks its least lean.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function admitted(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    lean: number,
    after?: IAfter,
  ): AutoMovieMotionHumanTouchUpright.IFacing | undefined {
    return trial(
      body,
      posture,
      side,
      effector,
      place,
      hint,
      lean,
      (): void => {},
      after,
    );
  }
  /**
   * The least lean toward the face at which a vessel the hand holds by a
   * kept grasp is brought to the region by a drinking arm, and the wrist's
   * goal there. The grasp fixes the vessel in the hand, so only its lean is
   * free: the hand's rotation at the region is the grasp's turned by the lean
   * (`tip`), and the wrist stands where that rotation puts the vessel's point
   * on the region, as the touch stroke places a held rotation. Leans are
   * tried as `drinking` tries them, every `COARSE` and then every
   * `LEAN_STEP` inside the first admitting bracket up to `LEAN`, each screened by its fit on the posture and admitted by its fit held to
   * its own reference, the arm the stroke shows.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param effector The effector: the vessel's point in the hand.
   * @param place The region.
   * @param hint The elbow's hint, world.
   * @param rotation The hand's rotation the grasp presents the vessel at the region with, world.
   * @param after Where the vessel is held while the drinker drinks; the arrival alone when absent.
   * @returns The least admitted lean and the wrist's goal at it.
   * @throws {HumanRefusal} When no lean up to `LEAN` holds a drinking arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fixed, what is sought, the order, the admission and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A kept grasp fixes the hand-to-vessel rotation, not the hand, so the same drink is admitted by the same posture (Murphy et al. 2011) however the vessel came to the hand; the vessel's point stays on the region as the stroke keeps it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One coarse-to-fine walk (`least`) of a goal, a screen and an admission per lean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The admitted arm is the referred one the stroke shows; with none admitted the law is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry fit per lean tried, five coarse and at most two fine, and one referred fit of a lean that passes it.
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
    after?: IAfter,
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
    // The vessel's axis in the hand: the one the grasp stands upright.
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(rotation),
      { x: 0, y: 1, z: 0 },
    );
    let nearest: INearest | undefined;
    const found: IHeld | undefined = least(
      (lean: number): IHeld | undefined => {
        const turned: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(
            AutoMovieMotionHumanTouchUpright.tip(place.normal, lean),
            rotation,
          ),
        );
        const goal: IHumanPosture.IGoal = {
          ...laid,
          rotation: turned,
          point: Vector3.subtract(at, Quaternion.rotateVector(turned, contact)),
        };
        // The same vessel in the drinking phase: the hand keeps the turn
        // and the vessel's point follows the region.
        const later = (phase: IAfter): AutoMovieMotionHumanDrinkingArm.IArm => {
          const there: IHumanPosture.IGoal = AutoMovieMotionHumanTouchLaid.rest(
            body,
            phase.posture,
            side,
            effector,
            phase.place,
            "up",
            hint,
            "upright",
          );
          return AutoMovieMotionHumanDrinkingArm.read(
            body,
            phase.posture,
            side,
            {
              ...there,
              rotation: turned,
              point: Vector3.subtract(
                Vector3.add(
                  there.point,
                  Quaternion.rotateVector(there.rotation!, contact),
                ),
                Quaternion.rotateVector(turned, contact),
              ),
            },
            true,
            axis,
          );
        };
        const arm: AutoMovieMotionHumanDrinkingArm.IArm =
          AutoMovieMotionHumanDrinkingArm.read(
            body,
            posture,
            side,
            goal,
            false,
            axis,
          );
        nearest = near(nearest, arm, `at a lean of ${lean} degrees`);
        return holds(arm) &&
          holds(
            AutoMovieMotionHumanDrinkingArm.read(
              body,
              posture,
              side,
              goal,
              true,
              axis,
            ),
          ) &&
          (after === undefined || later(after).tilt <= LEAN_STEP)
          ? { lean, goal }
          : undefined;
      },
    );
    if (found !== undefined) return found;
    throw refusal(side, "in the grasp it was taken up by", nearest!);
  }

  /**
   * The least lean an attempt admits, in `LEAN_STEP` degrees up to `LEAN`:
   * every `COARSE` degrees first, then every `LEAN_STEP` from the bracket's
   * low end up to the coarse lean that admitted (`drinking` states the
   * assumption).
   */
  function least<T>(attempt: (lean: number) => T | undefined): T | undefined {
    for (let coarse: number = 0; coarse <= LEAN + 1e-9; coarse += COARSE) {
      const found: T | undefined = attempt(coarse);
      if (found === undefined) continue;
      for (
        let fine: number = Math.max(0, coarse - COARSE + LEAN_STEP);
        fine < coarse - 1e-9;
        fine += LEAN_STEP
      ) {
        const finer: T | undefined = attempt(fine);
        if (finer !== undefined) return finer;
      }
      return found;
    }
    return undefined;
  }

  /** One lean of `drinking`'s search (`admitted`), each screened arm shown to `seen` with where it was tried. */
  function trial(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    lean: number,
    seen: (arm: AutoMovieMotionHumanDrinkingArm.IArm, at: string) => void,
    after?: IAfter,
  ): AutoMovieMotionHumanTouchUpright.IFacing | undefined {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    // The vessel's axis in the hand: the effector's along axis, which an
    // upright lay stands on the leaned axis.
    const axis: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.local(
      body,
      side,
      effector,
    ).forward;
    const goal = (
      facing: IAutoMovieVector3,
      on: IHumanPosture = posture,
      at: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal"> = place,
    ): IHumanPosture.IGoal =>
      AutoMovieMotionHumanTouchLaid.rest(
        body,
        on,
        side,
        effector,
        at,
        "up",
        hint,
        "upright",
        facing,
        undefined,
        undefined,
        lean,
      );
    let best: IAutoMovieVector3 | undefined;
    let tilt: number = Infinity;
    for (const facing of AutoMovieMotionHumanTouchUpright.facings(
      place.normal,
      level,
    )) {
      const arm: AutoMovieMotionHumanDrinkingArm.IArm =
        AutoMovieMotionHumanDrinkingArm.read(
          body,
          posture,
          side,
          goal(facing),
          false,
          axis,
        );
      seen(
        arm,
        `at a lean of ${lean} degrees facing (${facing.x.toFixed(2)}, ${facing.z.toFixed(2)})`,
      );
      if (holds(arm) && arm.tilt < tilt - 1e-9) {
        tilt = arm.tilt;
        best = facing;
      }
    }
    if (best === undefined) return undefined;
    const shown: AutoMovieMotionHumanDrinkingArm.IArm =
      AutoMovieMotionHumanDrinkingArm.read(
        body,
        posture,
        side,
        goal(best),
        true,
        axis,
      );
    // In the drinking phase the hand keeps the facing and the lean while
    // the region moves with the head.
    return holds(shown) &&
      (after === undefined ||
        AutoMovieMotionHumanDrinkingArm.read(
          body,
          after.posture,
          side,
          goal(best, after.posture, after.place),
          true,
          axis,
        ).tilt <= LEAN_STEP)
      ? { facing: best, lean, tilt: shown.tilt }
      : undefined;
  }

  /** Whether a fitted arm drinks (`AutoMovieMotionHumanDrinkingArm.drinks`) with the vessel where it was asked: the reached axis within one `LEAN_STEP` of the asked one, so an arm whose hand cannot reach the asked lean is not admitted at it. */
  function holds(arm: AutoMovieMotionHumanDrinkingArm.IArm): boolean {
    return AutoMovieMotionHumanDrinkingArm.drinks(arm) && arm.tilt <= LEAN_STEP;
  }
  /** The candidate whose arm was raised least, for a refusal: its arm and where it was tried. */
  interface INearest {
    /** Its fitted arm. */
    arm: AutoMovieMotionHumanDrinkingArm.IArm;

    /** Its lean and facing, in words. */
    at: string;
  }

  /** The nearer of a candidate and the nearest so far: the one whose upper arm is raised less. */
  function near(
    nearest: INearest | undefined,
    arm: AutoMovieMotionHumanDrinkingArm.IArm,
    at: string,
  ): INearest {
    return nearest === undefined || arm.elevation < nearest.arm.elevation
      ? { arm, at }
      : nearest;
  }

  /** The refusal of a vessel no lean lets the arm drink with. */
  function refusal(
    side: HumanHand.Side,
    turn: string,
    closest: INearest,
  ): HumanRefusal {
    const nearest: string = `the arm raised least, ${closest.at}, is raised ${closest.arm.elevation.toFixed(1)} degrees with the elbow ${(closest.arm.drop * 1000).toFixed(0)} mm below the shoulder and the forearm's twist ${closest.arm.room.toFixed(0)} degrees inside its range`;
    return new HumanRefusal({
      kind: "reach",
      axis: "facing",
      value: side,
      reason: `no lean of the held vessel toward the face up to ${LEAN} degrees ${turn} lets the ${side} arm bring it to the region as a person drinks, the upper arm raised at most ${AutoMovieMotionHumanDrinkingArm.ELEVATION} degrees, the elbow ${AutoMovieMotionHumanDrinkingArm.DROP * 1000} mm or more below the shoulder and the forearm's twist ${AutoMovieMotionHumanTouchLaid.MARGIN} degrees inside its range (${nearest})`,
      fix: "bring the vessel to a region nearer the chin, or hold it by its side",
    });
  }
}
