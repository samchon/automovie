import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "./HumanTrunk";

/**
 * Keep the hands an action holds by contact where the action put them while
 * a trunk layer moves the chest and the shoulder girdles under them.
 *
 * An action that poses its arms by joint angles, such as a hug, carries its
 * hands with any change of the trunk above the arm, so an additive trunk
 * layer would slide them off their contacts. While the active action
 * declares a contact window on a hand whose arm has no limb goal, the arm
 * gets one at the hand's frame in the posture before the layer, bent the way
 * the arm hangs, and inverse kinematics re-solves the arm after the trunk as
 * the layer contract requires. A free hand, one already held by a limb goal,
 * and one on the performer's own body, which the layer moves with it, are
 * left to the layer.
 *
 * @param before The posture the action gives, before the layer.
 * @param after The posture with the layer's joint angles added.
 * @param context The layer's context: the body, the active action and the borrowed FK.
 * @returns `after`, with a limb goal for each held, unconstrained arm.
 */
export function affectHeldHands(
  before: IAutoMovieMotionHumanPosture,
  after: IAutoMovieMotionHumanPosture,
  context: IAutoMovieMotionHumanLayer.IContext,
): IAutoMovieMotionHumanPosture {
  const contacts: readonly IAutoMovieMotionHumanContactWindow[] =
    context.action()?.contacts ?? [];
  const held: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean =>
      before.limbs[ARM[side]] === undefined &&
      contacts.some(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === HAND[side] &&
          !(
            window.support.kind === "person" &&
            window.support.subject === context.subject
          ),
      ),
  );
  if (held.length === 0) return after;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = reader(
    context.body,
  )(before, context.resolution);
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...after.limbs };
  for (const side of held) {
    const hand: IAutoMovieResolvedBone = bones.get(HAND[side])!;
    limbs[ARM[side]] = {
      point: hand.worldPosition,
      rotation: hand.worldRotation,
      bend: AutoMovieMotionHumanBend.hang(context.body, before, side),
    };
  }
  return { ...after, limbs };
}

/** Each side's arm limb. */
const ARM: Readonly<Record<AutoMovieHumanSide, AutoMovieHumanLimb>> = {
  left: "leftArm",
  right: "rightArm",
};

/** Each side's hand bone, which is also the hand's contact part. */
const HAND: Readonly<Record<AutoMovieHumanSide, AutoMovieHumanoidBone>> = {
  left: "leftHand",
  right: "rightHand",
};

/** One prepared reader of both hands per body. */
const READERS: WeakMap<
  IAutoMovieMotionHumanBody,
  ReturnType<typeof HumanTrunk.prepareResolve>
> = new WeakMap();

/** The body's prepared reader of both hands' world frames. */
function reader(
  body: IAutoMovieMotionHumanBody,
): ReturnType<typeof HumanTrunk.prepareResolve> {
  let read: ReturnType<typeof HumanTrunk.prepareResolve> | undefined =
    READERS.get(body);
  if (read === undefined) {
    read = HumanTrunk.prepareResolve(
      body,
      new Set<AutoMovieHumanoidBone>(["leftHand", "rightHand"]),
    );
    READERS.set(body, read);
  }
  return read;
}
