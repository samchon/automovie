import { AutoMovieEngineQuaternion, AutoMovieEngineRomTolerance, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDrinkingArm,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouchDrink,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import { AutoMovieMotionHumanDrinkingLean } from "./AutoMovieMotionHumanDrinkingLean";
import { AutoMovieMotionHumanDrinkingPool } from "./AutoMovieMotionHumanDrinkingPool";
import { AutoMovieMotionHumanDrinkingSwivel } from "./AutoMovieMotionHumanDrinkingSwivel";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "./AutoMovieMotionHumanTouchUpright";

/*
 * How far a vessel is leaned toward the face at the lips, and turned there, so
 * the arm that brings it holds it as a person drinks: the least lean, in
 * `LEAN_STEP` degrees up to `LEAN`, whose fitted arm drinks with the vessel
 * where it was asked (`AutoMovieMotionHumanDrinkingArm.drinks`, its reached
 * axis within a `LEAN_STEP` of the asked one), with the facing
 * (`AutoMovieMotionHumanTouchUpright`) whose hand meets the vessel's axis best,
 * or for a vessel held by the grasp it was taken up by, the lean alone
 * (`held`). Held exactly upright at the lips the vessel asks the elbow up to
 * the shoulder's height; a drinker tips the glass at the lips with the elbow
 * low (Murphy, Willén and Sunnerhagen 2011).
 */
export namespace AutoMovieMotionHumanTouchDrink {
  /*
   * The step between the leans toward the face a held vessel is tried at,
   * degrees (provisional).
   */
  export const LEAN_STEP: number = AutoMovieMotionHumanDrinkingLean.STEP;

  /*
   * The facing and the lean the arm brings the vessel at: the least lean toward
   * the face, in `LEAN_STEP` degrees up to `LEAN`, at which a candidate
   * facing's fitted arm drinks (`admitted`), with the facing whose hand meets
   * the vessel's axis best. Leans are tried every `COARSE` degrees, then every
   * `LEAN_STEP` inside the first bracket that admits one, which returns the
   * least admitting lean when admission holds at every lean above the least
   * one: the elbow drops as the vessel leans toward the face, so a lean that
   * admits an arm is not followed by a greater one that does not, within a
   * bracket. Held exactly upright at the lips the vessel asked the elbow up to
   * the shoulder's height with the forearm at its turn's end, whatever its turn
   * about its axis: a drinker tilts the glass at the lips.
   * Parameter body: The body.
   * Parameter posture: The posture the arm is solved on.
   * Parameter side: The hand.
   * Parameter effector: The effector, whose along direction is the vessel's axis.
   * Parameter place: The region.
   * Parameter hint: The elbow's hint each candidate starts from, world; moved into
   * the drinking range where it lies outside
   * (`AutoMovieMotionHumanDrinkingSwivel`).
   * Parameter after: Where the vessel is held while the drinker drinks; the arrival
   * alone when absent.
   * Parameter pool: The preparation a search over several sides of a vessel's rim
   * shares (`handToFaceVessel`), whose nearest arm then spans every side
   * tried; this search's own when absent.
   * Returns: The facing, the lean, the tilt and the elbow's hint the arm was
   * admitted with.
   * When no lean up to `LEAN` and no facing holds a
   * drinking arm.
   */
  export function drinking(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, DrinkingPlace>,
    hint: IAutoMovieVector3,
    after?: IAutoMovieMotionHumanTouchDrink.IAfter,
    pool: AutoMovieMotionHumanDrinkingPool.IPool = AutoMovieMotionHumanDrinkingPool(
      body,
      posture,
      side,
    ),
  ): IAutoMovieMotionHumanTouchDrink.IDrink {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    if (!(level > 1e-6))
      return { facing: place.normal, lean: 0, tilt: 0, bend: hint };
    const missed: AutoMovieMotionHumanDrinkingLean.IMisses =
      AutoMovieMotionHumanDrinkingLean.misses();
    const found: IAutoMovieMotionHumanTouchDrink.IDrink | undefined =
      AutoMovieMotionHumanDrinkingLean.least(
        (lean: number): IAutoMovieMotionHumanTouchDrink.IDrink | undefined => {
          missed.begin();
          return trial(
            body,
            posture,
            side,
            effector,
            place,
            hint,
            lean,
            (arm: IAutoMovieMotionHumanDrinkingArm.IArm, at: string): void => {
              pool.nearest = AutoMovieMotionHumanDrinkingArm.nearer(
                pool.nearest,
                arm,
                at,
                LEAN_STEP,
              );
              missed.see(arm);
            },
            after,
            pool.read,
            pool.bounds,
            pool.span,
            pool.admits(),
          );
        },
        missed.least,
      );
    if (found !== undefined) return found;
    throw AutoMovieMotionHumanDrinkingArm.refused(
      side,
      `up to ${LEAN} degrees and no turn of it within ${pool.span} degrees either way of head on${pool.sides > 1 ? ` on any of the ${pool.sides} sides of its rim` : ""}`,
      pool.nearest,
    );
  }

  /*
   * Whether a lean admits a drinking arm, and with which facing: every
   * candidate facing is screened by its arm fitted on the posture alone, head
   * on first and then alternately either way, and the best of those that drink
   * with the vessel where it was asked (`holds`), the one whose hand meets the
   * vessel's axis best, is fitted again as the stroke fits it, held to the
   * stroke's reference, and admitted only if that arm drinks too and, with
   * `after`, the arm still holds the vessel at its asked axis in the drinking
   * phase.
   * Parameter body: The body.
   * Parameter posture: The posture the arm is solved on.
   * Parameter side: The hand.
   * Parameter effector: The effector, whose along direction is the vessel's axis.
   * Parameter place: The region.
   * Parameter hint: The elbow's hint each candidate starts from, world; moved into
   * the drinking range where it lies outside
   * (`AutoMovieMotionHumanDrinkingSwivel`).
   * Parameter lean: The lean toward the face, degrees.
   * Parameter after: Where the vessel is held while the drinker drinks; the arrival
   * alone when absent.
   * Returns: The facing, the lean, the tilt and the elbow's hint; none when the
   * lean admits no arm.
   */
  export function admitted(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, AdmittedPlace>,
    hint: IAutoMovieVector3,
    lean: number,
    after?: IAutoMovieMotionHumanTouchDrink.IAfter,
  ): IAutoMovieMotionHumanTouchDrink.IDrink | undefined {
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

  /*
   * The least lean toward the face at which a vessel the hand holds by a kept
   * grasp is brought to the region by a drinking arm, and the wrist's goal
   * there. The grasp fixes the vessel in the hand, so only its lean is free:
   * the hand's rotation at the region is the grasp's turned by the lean
   * (`tip`), and the wrist stands where that rotation puts the vessel's point
   * on the region, as the touch stroke places a held rotation. Leans are tried
   * as `drinking` tries them, every `COARSE` and then every `LEAN_STEP` inside
   * the first admitting bracket up to `LEAN`, each screened by its fit on the
   * posture and admitted by its fit held to its own reference, the arm the
   * stroke shows.
   * Parameter body: The body.
   * Parameter posture: The posture the arm is solved on.
   * Parameter side: The hand.
   * Parameter effector: The effector: the vessel's point in the hand.
   * Parameter place: The region.
   * Parameter hint: The elbow's hint, world.
   * Parameter rotation: The hand's rotation the grasp presents the vessel at the
   * region with, world.
   * Parameter after: Where the vessel is held while the drinker drinks; the arrival
   * alone when absent.
   * Returns: The least admitted lean and the wrist's goal at it.
   * When no lean up to `LEAN` holds a drinking arm.
   */
  export function held(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, HeldPlace>,
    hint: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    after?: IAutoMovieMotionHumanTouchDrink.IAfter,
  ): IAutoMovieMotionHumanTouchDrink.IHeld {
    const read: ReturnType<typeof AutoMovieMotionHumanDrinkingArm.prepareRead> =
      AutoMovieMotionHumanDrinkingArm.prepareRead(body, side);
    const laid: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanTouchLaid.rest(
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
    const at: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      laid.point,
      AutoMovieEngineQuaternion.rotateVector(laid.rotation!, contact),
    );
    // The vessel's axis in the hand: the one the grasp stands upright.
    const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(rotation),
      { x: 0, y: 1, z: 0 },
    );
    let nearest: IAutoMovieMotionHumanDrinkingArm.INearest | undefined;
    const missed: AutoMovieMotionHumanDrinkingLean.IMisses =
      AutoMovieMotionHumanDrinkingLean.misses();
    const found: IAutoMovieMotionHumanTouchDrink.IHeld | undefined =
      AutoMovieMotionHumanDrinkingLean.least(
        (lean: number): IAutoMovieMotionHumanTouchDrink.IHeld | undefined => {
          missed.begin();
          const turned: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
            AutoMovieEngineQuaternion.multiply(
              AutoMovieMotionHumanTouchUpright.tip(place.normal, lean),
              rotation,
            ),
          );
          const goal: IAutoMovieHumanLimbGoal = {
            ...laid,
            rotation: turned,
            point: AutoMovieEngineVector3.subtract(
              at,
              AutoMovieEngineQuaternion.rotateVector(turned, contact),
            ),
          };
          // The same vessel in the drinking phase: the hand keeps the turn
          // and the vessel's point follows the region.
          const later = (
            phase: IAutoMovieMotionHumanTouchDrink.IAfter,
          ): IAutoMovieMotionHumanDrinkingArm.IArm => {
            const there: IAutoMovieHumanLimbGoal =
              AutoMovieMotionHumanTouchLaid.rest(
                body,
                phase.posture,
                side,
                effector,
                phase.place,
                "up",
                hint,
                "upright",
              );
            return read(
              phase.posture,
              {
                ...there,
                rotation: turned,
                point: AutoMovieEngineVector3.subtract(
                  AutoMovieEngineVector3.add(
                    there.point,
                    AutoMovieEngineQuaternion.rotateVector(there.rotation!, contact),
                  ),
                  AutoMovieEngineQuaternion.rotateVector(turned, contact),
                ),
              },
              true,
              axis,
            );
          };
          const arm: IAutoMovieMotionHumanDrinkingArm.IArm = read(
            posture,
            goal,
            false,
            axis,
          );
          nearest = AutoMovieMotionHumanDrinkingArm.nearer(
            nearest,
            arm,
            `at a lean of ${lean} degrees`,
            LEAN_STEP,
          );
          missed.see(arm);
          return holds(arm) &&
            holds(read(posture, goal, true, axis)) &&
            (after === undefined || later(after).tilt <= LEAN_STEP)
            ? { lean, goal }
            : undefined;
        },
        missed.least,
      );
    if (found !== undefined) return found;
    throw AutoMovieMotionHumanDrinkingArm.refused(
      side,
      `up to ${LEAN} degrees in the grasp it was taken up by`,
      nearest!,
    );
  }

  /*
   * The most a held vessel is leaned toward the face, degrees: the lean that
   * lays its wall level (`AutoMovieMotionHumanDrinkingLean.MOST` states the
   * basis).
   */
  const LEAN: number = AutoMovieMotionHumanDrinkingLean.MOST;

  /*
   * One lean of `drinking`'s search (`admitted`), each screened arm shown to
   * `seen` with where it was tried.
   */
  function trial(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, TrialPlace>,
    hint: IAutoMovieVector3,
    lean: number,
    seen: (arm: IAutoMovieMotionHumanDrinkingArm.IArm, at: string) => void,
    after?: IAutoMovieMotionHumanTouchDrink.IAfter,
    read: ReturnType<
      typeof AutoMovieMotionHumanDrinkingArm.prepareRead
    > = AutoMovieMotionHumanDrinkingArm.prepareRead(body, side),
    bounds?: () => ReturnType<
      typeof AutoMovieMotionHumanDrinkingSwivel.bounded
    >,
    span: number = AutoMovieMotionHumanTouchUpright.SPAN,
    admits?: (point: IAutoMovieVector3) => boolean,
  ): IAutoMovieMotionHumanTouchDrink.IDrink | undefined {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    // The vessel's axis in the hand: the effector's along axis, which an
    // upright lay stands on the leaned axis.
    const axis: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.local(
      body,
      side,
      effector,
    ).forward;

    // The vessel's axis read on the hand's anatomical axes, for the refusal.
    const anatomy: (name: TrialAnatomyName) => string = (
      name: TrialAnatomyName2,
    ): string =>
      AutoMovieEngineVector3.dot(
        axis,
        AutoMovieMotionHumanTouchEffector.axis(side, name),
      ).toFixed(2);

    // Each facing's arm is hinted inside the drinking range: the hint moved
    // to the nearest swivel whose shoulder lies in it, kept where it does
    // (`AutoMovieMotionHumanDrinkingSwivel`); the drinking phase keeps it.
    const bound: ReturnType<typeof AutoMovieMotionHumanDrinkingSwivel.bounded> =
      (
        bounds ?? AutoMovieMotionHumanDrinkingPool(body, posture, side).bounds
      )();
    const laid = (
      facing: IAutoMovieVector3,
      on: IAutoMovieMotionHumanPosture,
      at: Pick<IAutoMovieMotionHumanTarget.IPlace, TrialLaidAt>,
      bend: IAutoMovieVector3,
    ): IAutoMovieHumanLimbGoal =>
      AutoMovieMotionHumanTouchLaid.rest(
        body,
        on,
        side,
        effector,
        at,
        "up",
        bend,
        "upright",
        facing,
        undefined,
        undefined,
        lean,
      );
    let best: IAutoMovieVector3 | undefined;
    let selected: IAutoMovieHumanLimbGoal | undefined;
    let reference: IAutoMovieHumanLimbReference | undefined;
    let tilt: number = Infinity;
    for (const facing of AutoMovieMotionHumanTouchUpright.facings(
      place.normal,
      level,
      span,
      side,
    )) {
      // A wrist no reaching elbow in the drinking range can place is
      // refused before any fit (`AutoMovieMotionHumanSwivelBound.admits`).
      const wrist: IAutoMovieHumanLimbGoal = laid(facing, posture, place, hint);
      if (admits !== undefined && !admits(wrist.point)) continue;
      const candidate: IAutoMovieHumanLimbGoal = {
        ...wrist,
        bend: bound(wrist.point, hint),
      };
      const improves = (arm: IAutoMovieMotionHumanDrinkingArm.IArm): boolean =>
        holds(arm) && arm.tilt < tilt - AutoMovieEngineRomTolerance;
      const arm: ReturnType<typeof read> = read(
        posture,
        candidate,
        false,
        axis,
        improves,
      );
      seen(
        arm,
        `at a lean of ${lean} degrees facing (${facing.x.toFixed(2)}, ${facing.z.toFixed(2)}) with the vessel's axis (fingers ${anatomy("fingers")}, palm ${anatomy("palm")}, thumb ${anatomy("thumb")}) in the hand`,
      );
      // Two tilts within the joints' tolerance (the resolution a fit meets
      // a rotation to) are one, so a rounding-sized difference between a
      // hand's fit and its mirror's never chooses another facing.
      if (improves(arm)) {
        tilt = arm.tilt;
        best = facing;
        selected = candidate;
        reference = arm.reference;
      }

      // A tilt is an angle, never below 0, and a later facing replaces the
      // best only below it by the tolerance, so none can replace a tilt
      // within it of 0.
      if (tilt <= AutoMovieEngineRomTolerance) break;
    }
    if (best === undefined || selected === undefined) return undefined;
    const shown: IAutoMovieMotionHumanDrinkingArm.IArm = read(
      posture,
      reference === undefined ? selected : { ...selected, reference },
      reference === undefined,
      axis,
    );
    // In the drinking phase the hand keeps the facing and the lean while
    // the region moves with the head.
    return holds(shown) &&
      (after === undefined ||
        read(
          after.posture,
          laid(best, after.posture, after.place, selected.bend),
          true,
          axis,
        ).tilt <= LEAN_STEP)
      ? { facing: best, lean, tilt: shown.tilt, bend: selected.bend }
      : undefined;
  }

  /*
   * Whether a fitted arm drinks (`AutoMovieMotionHumanDrinkingArm.drinks`) with
   * the vessel where it was asked: the reached axis within one `LEAN_STEP` of
   * the asked one, so an arm whose hand cannot reach the asked lean is not
   * admitted at it.
   */
  function holds(arm: IAutoMovieMotionHumanDrinkingArm.IArm): boolean {
    return AutoMovieMotionHumanDrinkingArm.drinks(arm) && arm.tilt <= LEAN_STEP;
  }
}

/*
 * The alternatives of `TrialLaidAt`'s site.
 */
type TrialLaidAt = "point" | "normal";

/*
 * The alternatives of `TrialAnatomyName2`'s site.
 */
type TrialAnatomyName2 = "fingers" | "palm" | "thumb";

/*
 * The alternatives of `TrialAnatomyName`'s site.
 */
type TrialAnatomyName = "fingers" | "palm" | "thumb";

/*
 * The alternatives of `TrialPlace`'s site.
 */
type TrialPlace = "point" | "normal";

/*
 * The alternatives of `HeldPlace`'s site.
 */
type HeldPlace = "point" | "normal";

/*
 * The alternatives of `AdmittedPlace`'s site.
 */
type AdmittedPlace = "point" | "normal";

/*
 * The alternatives of `DrinkingPlace`'s site.
 */
type DrinkingPlace = "point" | "normal";
