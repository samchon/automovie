import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanHandToFaceArm,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchDrink,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchDrink } from "../../compose/AutoMovieMotionHumanTouchDrink";
import { AutoMovieMotionHumanTouchLaid } from "../../compose/AutoMovieMotionHumanTouchLaid";

/**
 * One hand's arm at the face.
 *
 * A held vessel is carried upright and brought to the face as a drinker holds
 * it: leaned toward the lips as little as lets the arm stay low, and turned the
 * way its arm then meets it best. Its elbow is hinted where the arm hangs,
 * moved into the drinking range where it lies outside, the hint its drinking
 * arm was found with, so the arm shown is the one admitted. A vessel held as
 * the grasp it was taken up by presents it (`own`) has its turn in the hand
 * fixed, so only its lean toward the lips is sought, with the grasp's elbow
 * hint: the same drink takes the same arm however the vessel came to the hand.
 *
 * @param props The hand and its place.
 * @returns The arm.
 */
export function handToFaceArm(
  props: IAutoMovieMotionHumanHandToFaceArm.IProps,
): IAutoMovieMotionHumanHandToFaceArm.IArm {
  const { body, atFace, turned, side, effector, place, tangent, own } = props;
  const lay: IAutoMovieMotionHumanTouch.ITouch["lay"] = props.upright
    ? "upright"
    : "tangent";
  const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    atFace,
    side,
  );

  // The place at the face and, for a held vessel, where it is held while
  // the drinker drinks: each read once, since over a carrier a read
  // resolves the posture.
  const at: Pick<IAutoMovieMotionHumanTarget.IPlace, OfAt> = place(atFace, 0);
  const drinks: boolean =
    props.upright && (own !== null || props.drink === undefined);
  const after: IAutoMovieMotionHumanTouchDrink.IAfter | undefined = drinks
    ? { posture: turned, place: place(turned, 0) }
    : undefined;
  const drinking: () => IAutoMovieMotionHumanTouchDrink.IAfter =
    (): IAutoMovieMotionHumanTouchDrink.IAfter => after!;
  const vessel: IAutoMovieMotionHumanTouchDrink.IDrink | undefined =
    props.drink ??
    (props.upright && own === null
      ? AutoMovieMotionHumanTouchDrink.drinking(
          body,
          atFace,
          side,
          effector,
          at,
          hang,
          drinking(),
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
            at,
            own.bend,
            own.wrist.rotation,
            drinking(),
          )
        : { lean: 0, goal: { ...own.wrist, bend: own.bend } };
  const lean: number | undefined = vessel?.lean ?? tipped?.lean;
  const facing: IAutoMovieVector3 | undefined = vessel?.facing;
  // A hand neither holding its grasp nor drinking from a vessel lays its
  // arm by the least strain, with no facing or lean to keep.
  const bend: IAutoMovieVector3 =
    own?.bend ??
    vessel?.bend ??
    AutoMovieMotionHumanTouchLaid.bend(
      body,
      atFace,
      side,
      effector,
      at,
      tangent,
      lay,
      undefined,
      "natural",
    );
  const goal: IAutoMovieHumanLimbGoal =
    tipped === undefined
      ? AutoMovieMotionHumanTouchLaid.rest(
          body,
          atFace,
          side,
          effector,
          at,
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
          at,
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

/** The alternatives of `OfAt`'s site. */
type OfAt = "point" | "normal";
