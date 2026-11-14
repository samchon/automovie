import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import type { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchDrink } from "../compose/AutoMovieMotionHumanTouchDrink";
import type { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import type { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import type { AutoMovieMotionHumanTouchUpright } from "../compose/AutoMovieMotionHumanTouchUpright";
import type { HumanGrasp } from "../handling/HumanGrasp";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

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
  /** One hand's arm. */
  export interface IArm {
    /** What the effector's along axis lies on. */
    lay: AutoMovieMotionHumanTouch.ITouch["lay"];

    /** The elbow's hint, world. */
    bend: IAutoMovieVector3;

    /** The arm laid at the face, which every second's fit is held to. */
    reference: NonNullable<AutoMovieMotionHumanTouch.ITouch["reference"]>;

    /** A vessel's lean toward the lips, degrees; absent for no vessel. */
    lean?: number;

    /** The level direction a vessel faces against; absent for no vessel searched. */
    facing?: IAutoMovieVector3;
  }

  /** What `of` reads. */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The entry with the head at the face as the hand arrives. */
    atFace: IHumanPosture;

    /** The entry with the head turned, as a drinker's is in the drinking phase. */
    turned: IHumanPosture;

    /** The hand. */
    side: HumanHand.Side;

    /** The hand's effector. */
    effector: AutoMovieMotionHumanTouchEffector.IEffector;

    /** The hand's place at a posture and second. */
    place: (
      posture: IHumanPosture,
      seconds: number,
    ) => Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">;

    /** The row's tangent. */
    tangent: AutoMovieMotionHumanTouchForm.Tangent;

    /** Whether the row holds its effector upright, a vessel. */
    upright: boolean;

    /** The grasp a held tool was taken up by, which keeps its turn; null for none. */
    own: HumanGrasp.IKey | null;
  }

  /**
   * One hand's arm at the face.
   *
   * A held vessel is carried upright and brought to the face as a drinker
   * holds it: leaned toward the lips as little as lets the arm stay low, and
   * turned the way its arm then meets it best. Its elbow is hinted where the
   * arm hangs, the hint its drinking arm was found with, so the arm shown is
   * the one admitted. A vessel held as the grasp it was taken up by presents
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One elbow solve per hand; a vessel adds its upright search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanTouchDrink`, `AutoMovieMotionHumanBend` and `AutoMovieMotionHumanTouchLaid`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(props: IProps): IArm {
    const { body, atFace, turned, side, effector, place, tangent, own } = props;
    const lay: AutoMovieMotionHumanTouch.ITouch["lay"] = props.upright
      ? "upright"
      : "tangent";
    const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      atFace,
      side,
    );
    const vessel: AutoMovieMotionHumanTouchUpright.IFacing | undefined =
      props.upright && own === null
        ? AutoMovieMotionHumanTouchDrink.drinking(
            body,
            atFace,
            side,
            effector,
            place(atFace, 0),
            hang,
            { posture: turned, place: place(turned, 0) },
          )
        : undefined;
    const tipped: AutoMovieMotionHumanTouchDrink.IHeld | undefined =
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
      (vessel !== undefined ? hang : undefined) ??
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
    const reference: IArm["reference"] =
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
      ...(lean === undefined ? {} : { lean }),
      ...(facing === undefined ? {} : { facing }),
    };
  }
}
