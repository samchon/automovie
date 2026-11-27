import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDrawFromCarrier,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanRefusal } from "../../law/HumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";

/**
 * The other hand's pull, when the draw asks for one: the hand already holds the
 * worn carrier at its throat, and the carrier hangs from a bone of this
 * performer.
 */
export function drawFromCarrierPulling(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>,
  side: AutoMovieHumanSide,
): drawFromCarrierPulling.IPulled | null {
  const pull: IAutoMovieMotionHumanDrawFromCarrier.IPull | undefined =
    context.params.pull;
  if (pull === undefined) return null;
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const carrier: string = context.params.from.prop;
  if (context.entry.holds[other] !== carrier)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "pull.handle",
      value: pull.handle,
      feasible: {
        kind: "alternatives",
        values: [context.entry.holds[other] ?? "none"],
      },
      reason: `the ${other} hand does not hold ${carrier} to pull it back`,
      fix: `take ${carrier} at ${pull.handle} with the ${other} hand, a pickup of no lift, before the draw`,
    });
  const worn: IAutoMovieMotionHumanProp["worn"] =
    context.prop(carrier).prop.worn;
  if (worn === undefined || worn.subject !== context.subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "pull",
      value: carrier,
      reason: `${carrier} is not worn by ${context.subject}, so it has no place to hang again`,
      fix: "pull back a carrier the drawing performer wears",
    });
  const bone: AutoMovieHumanoidBone = `${other}Hand`;
  const hand: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([bone]),
  ).get(bone)!;
  return {
    side: other,
    part: other === "left" ? "leftHand" : "rightHand",
    limb: other === "left" ? "leftArm" : "rightArm",
    wrist: { position: hand.worldPosition, rotation: hand.worldRotation },
    bend: AutoMovieMotionHumanBend.hang(
      context.body,
      context.entry.posture,
      other,
    ),
    bone: worn.bone,
    turn: (side === "right" ? 1 : -1) * (pull.turn ?? 0),
  };
}

/** `drawFromCarrierPulling` and its records. */
export namespace drawFromCarrierPulling {
  /** The other hand's pull on a worn carrier, read from the entry. */
  export interface IPulled {
    /** The pulling hand. */
    side: AutoMovieHumanSide;

    /** Its contact part. */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /** Its limb. */
    limb: AutoMovieHumanLimb;

    /** Its wrist at the start, world. */
    wrist: IAutoMovieRigidTransform;

    /** Its elbow's hint. */
    bend: IAutoMovieVector3;

    /** The bone the carrier hangs from, worn on again at the end. */
    bone: AutoMovieHumanoidBone;

    /** The trunk's twist, degrees toward the performer's left. */
    turn: number;
  }
}
