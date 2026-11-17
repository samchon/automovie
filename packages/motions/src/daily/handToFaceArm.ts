import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanHandToFaceArm,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchDrink,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchDrink } from "../compose/AutoMovieMotionHumanTouchDrink";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";

/**
 * The arm a hand-to-face task lays on its place (`handToFace`): how the
 * effector lies, the elbow's hint and the reference every second's fit is
 * held to, and, for a held vessel, its lean toward the lips and the way it
 * faces.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is solved for one hand and who reads it.
 * @evidence contracts/development/design.md#principled-representation One record per hand: the lay, the hint, the reference and a vessel's lean and facing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function and its input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Delegates the vessel's search, the hint and the reference to their owners.
 */
export namespace handToFaceArm {
  /**
   * One hand's arm at the face.
   *
   * A held vessel is carried upright and brought to the face as a drinker
   * holds it: leaned toward the lips as little as lets the arm stay low, and
   * turned the way its arm then meets it best. Its elbow is hinted where the
   * arm hangs, moved into the drinking range where it lies outside, the hint
   * its drinking arm was found with, so the arm shown is the one admitted. A vessel held as the grasp it was taken up by presents
   * it (`own`) has its turn in the hand fixed, so only its lean toward the
   * lips is sought, with the grasp's elbow hint: the same drink takes the
   * same arm however the vessel came to the hand.
   *
   * @param props The hand and its place.
   * @returns The arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the vessel's lay, its hint and the held grasp's case.
   * @evidence contracts/development/implementation.md#principled-implementation The drinking search (`AutoMovieMotionHumanTouchDrink`) for a vessel, the held grasp's own hint and turn, else the laid arm's least-strain hint and reference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The vessel, the held tool, the hint and the reference, in that order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A held grasp's turn is never re-solved.
   * @evidence contracts/development/implementation.md#efficient-algorithms One elbow solve per hand; a vessel adds its upright search, none when the law already found its drink with its rim side (`drink`).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanTouchDrink`, `AutoMovieMotionHumanBend` and `AutoMovieMotionHumanTouchLaid`; a drink found with the rim side is used as found, never searched again.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(props: IAutoMovieMotionHumanHandToFaceArm.IProps): IAutoMovieMotionHumanHandToFaceArm.IArm {
    const { body, atFace, turned, side, effector, place, tangent, own } = props;
    const lay: IAutoMovieMotionHumanTouch.ITouch["lay"] = props.upright
      ? "upright"
      : "tangent";
    const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      atFace,
      side,
    );
    const vessel: IAutoMovieMotionHumanTouchDrink.IDrink | undefined =
      props.drink ??
      (props.upright && own === null
        ? AutoMovieMotionHumanTouchDrink.drinking(
            body,
            atFace,
            side,
            effector,
            place(atFace, 0),
            hang,
            { posture: turned, place: place(turned, 0) },
          )
        : undefined);
    const tipped: IAutoMovieMotionHumanTouchDrink.IHeld | undefined =
      own === null
        ? undefined
        : props.upright
          ? AutoMovieMotionHumanTouchDrink.held(
              body,
              atFace,
              side,
              effector,
              place(atFace, 0),
              own.bend,
              own.wrist.rotation,
              { posture: turned, place: place(turned, 0) },
            )
          : { lean: 0, goal: { ...own.wrist, bend: own.bend } };
    const lean: number | undefined = vessel?.lean ?? tipped?.lean;
    const facing: IAutoMovieVector3 | undefined = vessel?.facing;
    const bend: IAutoMovieVector3 =
      own?.bend ??
      vessel?.bend ??
      AutoMovieMotionHumanTouchLaid.bend(
        body,
        atFace,
        side,
        effector,
        place(atFace, 0),
        tangent,
        lay,
        facing,
        "natural",
        vessel?.lean,
      );
    const goal: IAutoMovieHumanLimbGoal =
      tipped === undefined
        ? AutoMovieMotionHumanTouchLaid.rest(
            body,
            atFace,
            side,
            effector,
            place(atFace, 0),
            tangent,
            bend,
            lay,
            facing,
            undefined,
            undefined,
            vessel?.lean,
          )
        : tipped.goal;
    const reference: IAutoMovieMotionHumanHandToFaceArm.IArm["reference"] =
      tipped === undefined
        ? AutoMovieMotionHumanTouchLaid.laid(
            body,
            atFace,
            side,
            effector,
            place(atFace, 0),
            tangent,
            bend,
            lay,
            facing,
            undefined,
            undefined,
            vessel?.lean,
          )
        : AutoMovieMotionHumanTouchLaid.reference(
            body,
            atFace,
            side,
            tipped.goal,
          );
    return {
      lay,
      bend,
      reference,
      goal,
      ...(lean === undefined ? {} : { lean }),
      ...(facing === undefined ? {} : { facing }),
    };
  }
}
