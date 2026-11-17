import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouchDrink,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanDrinkingPool } from "../compose/AutoMovieMotionHumanDrinkingPool";
import { AutoMovieMotionHumanTouchDrink } from "../compose/AutoMovieMotionHumanTouchDrink";
import { AutoMovieMotionHumanTouchUpright } from "../compose/AutoMovieMotionHumanTouchUpright";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The side of a held vessel's rim a drink is taken from, found by the
 * drink's own admission (`AutoMovieMotionHumanTouchDrink.drinking`): the
 * first side, in the order the held prop lists them (`HumanHeld.sides`, the
 * act's own side first, then alternately either way), at which a lean and a
 * facing let the arm hold the vessel as a person drinks.
 *
 * The side and the facing both turn the hand about the vessel's axis: the
 * facing turns the vessel about the mouth, the side turns which point of the
 * rim meets the mouth, so the hand's turn at the lips is the facing less the
 * side. Choosing the side first by how upright the arm holds the vessel
 * without leaning it (`HumanHeld.steadiest`), and only then searching the
 * lean and the facing, confined the hand's turn to that one side's span of
 * facings: a drink whose forearm needed a turn beyond it was refused at the
 * span's edge (facing 90 degrees off head on, the forearm at its twist's
 * end), though another side holds it. With the side free, the sides carry
 * the hand's turn round the whole rim and the facings need cover only the
 * turn between two neighbouring sides, so each side tries the facings
 * within that turn of head on: the rim meets the lips from before the face,
 * as a drinker brings it, rather than from beside the mouth.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is chosen, the order, the shared freedom of side and facing, and the defect it answers.
 * @evidence contracts/development/design.md#principled-representation The answer is the effector of the admitted side with the drink it was admitted with, so the stroke shows that arm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and one function, read by `handToFace`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No side is assumed for any vessel or hand; every side tried is admitted or refused by the drink's own search.
 */
export namespace handToFaceVessel {
  /**
   * The side found and its drink.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The admitted side's effector and its facing, lean and hint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the law's effector and the arm's drink.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The drink is the one the side was admitted with, never solved again.
   */
  export interface IVessel {
    /** The effector of the admitted side. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /** The facing, lean, tilt and elbow hint its arm was admitted with. */
    drink: IAutoMovieMotionHumanTouchDrink.IDrink;
  }

  /**
   * The first side whose drink is admitted.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on at the region.
   * @param side The hand.
   * @param sides The effectors of the rim's sides, in the order tried (`HumanHeld.sides`).
   * @param place The region.
   * @param hint The elbow's hint each candidate starts from, world.
   * @param after Where the vessel is held while the drinker drinks.
   * @returns The side and its drink.
   * @throws {HumanRefusal} The drink's refusal when no side admits one, naming the nearest arm of every side tried; any other refusal at once.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the result and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The side is a free turn of the vessel in the hand, so it is searched by the same admission as the lean and the facing; the first admitted side in the act's own order is kept, as the facings keep head on first. The facings' span is half the turn between two evenly spaced sides, rounded up to the facings' step, so every turn of the hand round the rim is still tried.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One span, one pool, one loop of drink searches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the drink's own facing refusal moves the search to the next side; every other refusal propagates. The span is derived from the sides' count, never tuned; it premises sides spaced evenly round the rim, as `HumanHeld.SIDES` are.
   * @evidence contracts/development/implementation.md#efficient-algorithms A drink the act's own side admits costs that side's search alone, five facings per lean (eight sides give a 30-degree span) in place of thirteen, and no upright pre-search of every side (up to eight sides of up to thirteen facings and two more fits each); a refused drink costs one search per side, forty screen fits per lean. Unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One pool (`AutoMovieMotionHumanDrinkingPool`) serves every side, since the body, the hand and the posture stay fixed; every candidate still fits its own goal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The pool lives until return or throw; only the effector and the numeric drink escape.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    sides: readonly IAutoMovieMotionHumanTouchEffector.IEffector[],
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    hint: IAutoMovieVector3,
    after: IAutoMovieMotionHumanTouchDrink.IAfter,
  ): IVessel {
    // The hand's turn at the lips is the facing less the side, so with the
    // sides spaced evenly round the rim (`HumanHeld.SIDES`) the facings need
    // cover only half the turn between two neighbouring sides, rounded up to
    // the facings' step; head on stays the first tried.
    const span: number =
      AutoMovieMotionHumanTouchUpright.STEP *
      Math.ceil(180 / sides.length / AutoMovieMotionHumanTouchUpright.STEP - 1e-9);
    const pool: AutoMovieMotionHumanDrinkingPool.IPool =
      AutoMovieMotionHumanDrinkingPool.of(
        body,
        posture,
        side,
        sides.length,
        Math.min(span, AutoMovieMotionHumanTouchUpright.SPAN),
      );
    let refusal: IAutoMovieMotionHumanRefusal | undefined;
    for (const effector of sides) {
      try {
        return {
          effector,
          drink: AutoMovieMotionHumanTouchDrink.drinking(
            body,
            posture,
            side,
            effector,
            place,
            hint,
            after,
            pool,
          ),
        };
      } catch (error) {
        if (!(error instanceof HumanRefusal && error.axis === "facing"))
          throw error;
        refusal = error;
      }
    }
    throw refusal ?? new Error("A held vessel has at least one side of its rim");
  }
}
