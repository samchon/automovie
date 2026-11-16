import { support } from "../actions/support";
import { getUp } from "../floor/getUp";
import { HumanActionRow } from "../law/HumanActionRow";
import type { HumanSupport } from "../law/HumanSupport";

/** The feet, bearing anywhere on the floor the stance's solve lays them. */
const FEET: readonly HumanSupport.IContact[] = [
  { part: "leftFoot", kind: "bear" },
  { part: "rightFoot", kind: "bear" },
];

/**
 * A part on the action's surface (`support.IParams.on`), on its own side,
 * in from the edge by an inset in forearm-and-hand lengths
 * (`HumanSupport.IContact.inset`).
 */
const on = (
  part: HumanSupport.Part,
  inset: number = 0,
): HumanSupport.IContact => ({
  part,
  kind: "bear",
  target: "on",
  ...(inset === 0 ? {} : { inset }),
});

/**
 * Seated upright on a surface: the hip and the knee at a right angle, the
 * seated reference posture (ANSI/HFES 100-2007), the arms left to hang as the
 * body's relaxed arms, which the support planner lays under every stated
 * posture.
 */
const SEATED: HumanSupport.IStance["prefer"] = {
  pitch: 0,
  roll: 0,
  joints: {
    leftUpperLeg: [90, 0, 0],
    rightUpperLeg: [90, 0, 0],
    leftLowerLeg: [90, 0, 0],
    rightLowerLeg: [90, 0, 0],
  },
};

/**
 * Movements over a surface as rows of the support planner (`support`): each
 * a list of stances, the composition giving the surface (`on`), so a
 * movement across several supports is data over the one planner that fits
 * the body, refuses and is checked. The stances follow the movements as
 * coaching and parkour practice describe them (a vault over a box flies
 * from its hands to its feet, which no support sequence holds, so it is a
 * law of its own):
 * - a scramble onto a ledge, its supports moved in stages: the palms laid
 *   flat on the top half a forearm and hand's length in from the edge, one knee
 *   brought up onto the edge, the other foot set on the top beside it
 *   while the hands still bear, then standing up on the top, the knee's
 *   foot stepping up beside the other;
 * - a slide off a table's edge: seated upright on it with the seat and the
 *   hands beside it half a forearm and hand's length back from the edge
 *   (the table behind the body), the feet down to the floor, standing.
 * No timing study was read, so each move takes the planner's provisional
 * time, and the insets are provisional. The standing posture is the floor
 * laws' own key (`getUp.POSES`), the seated one the seated reference
 * posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each row's stances, the surface it reads, where each contact lies on it, and what is provisional.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of the support planner, its stances data over that law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion or a place of its own; the postures are the floor laws' keys and a cited standard's, and the places the composition's surface with insets in the body's own lengths.
 */
export namespace HumanSupportRows {
  /** Scramble up onto a ledge: the palms on its top, a knee up onto its edge, the other foot up, standing on it. */
  export const scramble = HumanActionRow.of("scramble", support, {
    stances: [
      { contacts: [...FEET, on("leftHand", 0.5), on("rightHand", 0.5)] },
      {
        contacts: [
          FEET[0]!,
          on("leftHand", 0.5),
          on("rightHand", 0.5),
          on("rightKnee"),
        ],
      },
      {
        contacts: [
          on("leftHand", 0.5),
          on("rightHand", 0.5),
          on("rightKnee"),
          on("leftFoot", 0.5),
        ],
      },
      {
        contacts: [on("leftFoot", 0.5), on("rightFoot", 0.5)],
        prefer: getUp.POSES.stood,
      },
    ],
  });

  /** Slide off a table's edge: seated upright on it with the hands beside the seat, the feet down to the floor, standing. */
  export const slideOff = HumanActionRow.of("slideOff", support, {
    stances: [
      {
        contacts: [
          on("seat", -0.5),
          on("leftHand", -0.5),
          on("rightHand", -0.5),
        ],
        prefer: SEATED,
      },
      {
        contacts: [
          on("seat", -0.5),
          on("leftHand", -0.5),
          on("rightHand", -0.5),
          ...FEET,
        ],
        prefer: SEATED,
      },
      { contacts: FEET, prefer: getUp.POSES.stood },
    ],
  });
}
