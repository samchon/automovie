import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
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
  export const LEAN_STEP: number = AutoMovieMotionHumanDrinkingLean.STEP;

  /** The most a held vessel is leaned toward the face, degrees: the lean that lays its wall level (`AutoMovieMotionHumanDrinkingLean.MOST` states the basis). */
  const LEAN: number = AutoMovieMotionHumanDrinkingLean.MOST;

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
   * @param hint The elbow's hint each candidate starts from, world; moved into the drinking range where it lies outside (`AutoMovieMotionHumanDrinkingSwivel`).
   * @param after Where the vessel is held while the drinker drinks; the arrival alone when absent.
   * @param pool The preparation a search over several sides of a vessel's rim shares (`handToFaceVessel`), whose nearest arm then spans every side tried; this search's own when absent.
   * @returns The facing, the lean, the tilt and the elbow's hint the arm was admitted with.
   * @throws {HumanRefusal} When no lean up to `LEAN` and no facing holds a drinking arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the search, its assumption, the admission, the choice, the measured defect, the shared pool and the refusal; the namespace states the candidates.
   * @evidence contracts/development/implementation.md#principled-implementation Every candidate is solved by the resolver and read on its displayed bones; the arm is admitted by the shoulder range healthy drinkers use (Alt Murphy et al. 2006), the least lean that admits one is taken so the vessel tips no more than the arm needs, and of the admitted facings the hand's tilt decides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One coarse-to-fine walk of the leans (`AutoMovieMotionHumanDrinkingLean.least`), each lean one `trial`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The monotone admission the refinement relies on is stated here and read by the drinking signature spec, which checks that the lean a step below the returned one does not admit; with none admitted the law is refused, never given a raised arm.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most seven coarse leans, three about a miss's zero and two fine ones (`AutoMovieMotionHumanDrinkingLean.least`); each lean at most thirteen entry fits, a facing whose wrist leaves no reaching elbow in the drinking range dropped before its fit (`AutoMovieMotionHumanSwivelBound.admits`, exact), ending at the first admitted facing that holds the vessel exactly on its asked axis (no later facing can beat a tilt of 0), then for its best one referred fit and, with `after`, a referred fit in the drinking phase (two solves: its reference and the fit). Each facing's hint is bounded in constant work after one trunk solve per pool.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One pool (fixed body/side reader and the fixed posture's lazy swivel bound) serves every candidate/reference/after fit, and every side of a rim search; each varying hint still runs the original closed-form bound, and every candidate fit remains actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous search owns or borrows one pool until return or throw; the numeric answer/refusal captures no reader, candidate pose or new query history.
   */
  export function drinking(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    after?: IAutoMovieMotionHumanTouchDrink.IAfter,
    pool: AutoMovieMotionHumanDrinkingPool.IPool = AutoMovieMotionHumanDrinkingPool.of(body, posture, side),
  ): IAutoMovieMotionHumanTouchDrink.IDrink {
    const level: number = Math.hypot(place.normal.x, place.normal.z);
    if (!(level > 1e-6))
      return { facing: place.normal, lean: 0, tilt: 0, bend: hint };
    const missed: AutoMovieMotionHumanDrinkingLean.IMisses = AutoMovieMotionHumanDrinkingLean.misses();
    const found: IAutoMovieMotionHumanTouchDrink.IDrink | undefined = AutoMovieMotionHumanDrinkingLean.least(
      (lean: number): IAutoMovieMotionHumanTouchDrink.IDrink | undefined => {
        missed.begin();
        return trial(body, posture, side, effector, place, hint, lean,
          (arm: IAutoMovieMotionHumanDrinkingArm.IArm, at: string): void => {
            pool.nearest = AutoMovieMotionHumanDrinkingArm.nearer(pool.nearest, arm, at, LEAN_STEP);
            missed.see(arm);
          },
          after, pool.read, pool.bounds, pool.span, pool.admits());
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
   * @param hint The elbow's hint each candidate starts from, world; moved into the drinking range where it lies outside (`AutoMovieMotionHumanDrinkingSwivel`).
   * @param lean The lean toward the face, degrees.
   * @param after Where the vessel is held while the drinker drinks; the arrival alone when absent.
   * @returns The facing, the lean, the tilt and the elbow's hint; none when the lean admits no arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the screen, the order, the choice and the admission.
   * @evidence contracts/development/implementation.md#principled-implementation The admitted arm is the one the stroke shows, fitted to the same goal and reference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation to `trial`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every facing is solved; a tie keeps the one nearest head on.
   * @evidence contracts/development/implementation.md#efficient-algorithms Thirteen entry fits and one referred fit, whose reference's entry fit the resolver's memory already holds; with `after`, two more solves for the drinking phase's reference and referred fit. Each facing's hint is bounded in constant work after one trunk solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The single-lean trial uses the same native fixed-body observation producer as drinking, preserving all current facing and reference fits without re-preparing rig metadata for each candidate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Its invocation owns one reader until return or throw and returns only original numeric drink data, with no pose/result history or metadata loan retained.
   */
  export function admitted(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
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
   * @evidence contracts/development/implementation.md#principled-implementation A kept grasp fixes the hand-to-vessel rotation, not the hand, so the same drink is admitted by the same shoulder range (Alt Murphy et al. 2006) however the vessel came to the hand; the vessel's point stays on the region as the stroke keeps it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One coarse-to-fine walk (`AutoMovieMotionHumanDrinkingLean.least`) of a goal, a screen and an admission per lean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The admitted arm is the referred one the stroke shows; with none admitted the law is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per lean tried (at most seven coarse, three about a miss's zero and two fine, `AutoMovieMotionHumanDrinkingLean.least`): one entry fit, and for a lean that passes it one referred fit (its reference's entry fit in the resolver's memory) and, with `after`, the drinking phase's reference and referred fit, two solves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rest/tip retain vessel geometry and one genuine fixed-body observation reader serves every current lean, reference and later-phase native fit; only rig/FK metadata is shared, never a candidate answer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous held search owns one reader until return or throw; returned lean/goal payloads remain numeric and retain no reader or new candidate history.
   */
  export function held(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    after?: IAutoMovieMotionHumanTouchDrink.IAfter,
  ): IAutoMovieMotionHumanTouchDrink.IHeld {
    const read: ReturnType<typeof AutoMovieMotionHumanDrinkingArm.prepareRead> = AutoMovieMotionHumanDrinkingArm.prepareRead(body, side);
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
    const at: IAutoMovieVector3 = Vector3.add(
      laid.point,
      Quaternion.rotateVector(laid.rotation!, contact),
    );
    // The vessel's axis in the hand: the one the grasp stands upright.
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(rotation),
      { x: 0, y: 1, z: 0 },
    );
    let nearest: IAutoMovieMotionHumanDrinkingArm.INearest | undefined;
    const missed: AutoMovieMotionHumanDrinkingLean.IMisses = AutoMovieMotionHumanDrinkingLean.misses();
    const found: IAutoMovieMotionHumanTouchDrink.IHeld | undefined = AutoMovieMotionHumanDrinkingLean.least(
      (lean: number): IAutoMovieMotionHumanTouchDrink.IHeld | undefined => {
        missed.begin();
        const turned: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(
            AutoMovieMotionHumanTouchUpright.tip(place.normal, lean),
            rotation,
          ),
        );
        const goal: IAutoMovieHumanLimbGoal = {
          ...laid,
          rotation: turned,
          point: Vector3.subtract(at, Quaternion.rotateVector(turned, contact)),
        };
        // The same vessel in the drinking phase: the hand keeps the turn
        // and the vessel's point follows the region.
        const later = (phase: IAutoMovieMotionHumanTouchDrink.IAfter): IAutoMovieMotionHumanDrinkingArm.IArm => {
          const there: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanTouchLaid.rest(
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
        const arm: IAutoMovieMotionHumanDrinkingArm.IArm =
          read(
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
          holds(
            read(
              posture,
              goal,
              true,
              axis,
            ),
          ) &&
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

  /** One lean of `drinking`'s search (`admitted`), each screened arm shown to `seen` with where it was tried. */
  function trial(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    lean: number,
    seen: (arm: IAutoMovieMotionHumanDrinkingArm.IArm, at: string) => void,
    after?: IAutoMovieMotionHumanTouchDrink.IAfter,
    read: ReturnType<typeof AutoMovieMotionHumanDrinkingArm.prepareRead> = AutoMovieMotionHumanDrinkingArm.prepareRead(body, side),
    bounds?: () => ReturnType<typeof AutoMovieMotionHumanDrinkingSwivel.bounded>,
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
    const anatomy: (name: "fingers" | "palm" | "thumb") => string = (
      name: "fingers" | "palm" | "thumb",
    ): string =>
      Vector3.dot(axis, AutoMovieMotionHumanTouchEffector.axis(side, name)).toFixed(2);

    // Each facing's arm is hinted inside the drinking range: the hint moved
    // to the nearest swivel whose shoulder lies in it, kept where it does
    // (`AutoMovieMotionHumanDrinkingSwivel`); the drinking phase keeps it.
    const bound: ReturnType<typeof AutoMovieMotionHumanDrinkingSwivel.bounded> =
      (bounds ?? AutoMovieMotionHumanDrinkingPool.of(body, posture, side).bounds)();
    const laid = (
      facing: IAutoMovieVector3,
      on: IAutoMovieMotionHumanPosture,
      at: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
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
      const candidate: IAutoMovieHumanLimbGoal = { ...wrist, bend: bound(wrist.point, hint) };
      const arm: IAutoMovieMotionHumanDrinkingArm.IArm =
        read(
          posture,
          candidate,
          false,
          axis,
        );
      seen(
        arm,
        `at a lean of ${lean} degrees facing (${facing.x.toFixed(2)}, ${facing.z.toFixed(2)}) with the vessel's axis (fingers ${anatomy("fingers")}, palm ${anatomy("palm")}, thumb ${anatomy("thumb")}) in the hand`,
      );
      // Two tilts within the joints' tolerance (the resolution a fit meets
      // a rotation to) are one, so a rounding-sized difference between a
      // hand's fit and its mirror's never chooses another facing.
      if (holds(arm) && arm.tilt < tilt - ROM_TOLERANCE) {
        tilt = arm.tilt;
        best = facing;
        selected = candidate;
      }

      // A tilt is an angle, never below 0, and a later facing replaces the
      // best only below it by the tolerance, so none can replace a tilt
      // within it of 0.
      if (tilt <= ROM_TOLERANCE) break;
    }
    if (best === undefined || selected === undefined) return undefined;
    const shown: IAutoMovieMotionHumanDrinkingArm.IArm =
      read(
        posture,
        selected,
        true,
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

  /** Whether a fitted arm drinks (`AutoMovieMotionHumanDrinkingArm.drinks`) with the vessel where it was asked: the reached axis within one `LEAN_STEP` of the asked one, so an arm whose hand cannot reach the asked lean is not admitted at it. */
  function holds(arm: IAutoMovieMotionHumanDrinkingArm.IArm): boolean {
    return AutoMovieMotionHumanDrinkingArm.drinks(arm) && arm.tilt <= LEAN_STEP;
  }
}
