import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { bendFloorHand } from "./bendFloorHand";

/** A flat hand's writer and the share it is written at. */
interface IFlatHand {
  /** The flat hand with its thumb clear of the palm (`bendFloorHand`). */
  primitive: IAutoMovieMotionHumanPrimitive;

  /** The share the next write lays the hand flat by, 0 to 1. */
  share: number;
}

/** A posture at the origin: the thumb's clearance reads only the hand's own frame. */
const NEUTRAL: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/** Each body's flat hands, solved once per side: the thumb's clearance depends only on the hand's own shape. */
const FLAT_HANDS: WeakMap<
  IAutoMovieMotionHumanBody,
  Partial<Record<AutoMovieHumanSide, IFlatHand>>
> = new WeakMap();

/**
 * A seated hand laid flat by a share: the flat shape with its thumb's
 * metacarpal twisted until the thumb clears the palmar plane
 * (`bendFloorHand`), so a palm laid on a thigh or an armrest does not drive
 * its thumb into it. The twist is solved once per body and side.
 *
 * @param body The body.
 * @param posture The posture to write the hand into.
 * @param side The hand.
 * @param share 0 for the posture's own fingers to 1 for the flat hand.
 * @returns The posture with the hand's fingers written.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is written, why the thumb turns and what is solved once.
 * @evidence contracts/development/implementation.md#principled-implementation The flat hand's thumb projects past the palm; the metacarpal twist that clears it is `bendFloorHand`'s, the floor hand's same cause.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One cached writer per body and side, written at the share.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the hand's own shape and range.
 * @evidence contracts/development/implementation.md#efficient-algorithms The thumb's twist is searched once per body and side, never per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work `bendFloorHand`, the one flat hand with a clear thumb.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The cache is keyed weakly by the body and released with it.
 */
export function seatedFlatHand(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  share: number,
): IAutoMovieMotionHumanPosture {
  let hands: Partial<Record<AutoMovieHumanSide, IFlatHand>> | undefined =
    FLAT_HANDS.get(body);
  if (hands === undefined) FLAT_HANDS.set(body, (hands = {}));
  let hand: IFlatHand | undefined = hands[side];
  if (hand === undefined) {
    const made: IFlatHand = { primitive: undefined!, share: 0 };
    made.primitive = bendFloorHand(
      body,
      NEUTRAL,
      side,
      1,
      (): number => made.share,
    );
    hands[side] = hand = made;
  }
  hand.share = share;
  return hand.primitive.write(posture, 0);
}
