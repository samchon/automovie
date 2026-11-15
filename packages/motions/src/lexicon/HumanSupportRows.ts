import { support } from "../actions/support";
import { getUp } from "../floor/getUp";
import { HumanActionRow } from "../law/HumanActionRow";
import type { HumanSupport } from "../law/HumanSupport";

/** The feet, bearing anywhere on the floor the stance's solve lays them. */
const FEET: readonly HumanSupport.IContact[] = [
  { part: "leftFoot", kind: "bear" },
  { part: "rightFoot", kind: "bear" },
];

/** A part on the action's surface (`support.IParams.on`), on its own side. */
const on = (part: HumanSupport.Part): HumanSupport.IContact => ({
  part,
  kind: "bear",
  target: "on",
});

/**
 * Movements over a surface as rows of the support planner (`support`): each
 * a list of stances, the composition giving the surface (`on`), so a
 * movement across several supports is data over the one planner that fits
 * the body, refuses and is checked. The stances follow the movements as
 * coaching and parkour practice describe them (a two-hand box vault: hands
 * on the top, the legs tucked through, landing on the feet; a scramble: the
 * hands on the ledge, a knee up, a foot up, standing; a slide off a table's
 * edge: seated with the hands on it, the feet down, standing), with no
 * timing study read yet, so each move takes the planner's provisional time.
 * The tucked and standing postures are the floor laws' own keys
 * (`getUp.POSES`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each row's stances, the surface it reads and that the timing is provisional.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of the support planner, its stances data over that law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion or a place of its own; the postures are the floor laws' keys and the places the composition's surface.
 */
export namespace HumanSupportRows {
  /** Vault a box on both hands: the hands set on its top, the legs tucked through over it, the feet landing. */
  export const boxVault = HumanActionRow.of("boxVault", support, {
    stances: [
      { contacts: FEET },
      { contacts: [...FEET, on("leftHand"), on("rightHand")] },
      { contacts: [on("leftHand"), on("rightHand")], prefer: getUp.POSES.squat },
      { contacts: FEET, prefer: getUp.POSES.stood },
    ],
  });

  /** Scramble up onto a ledge: the hands on it, a knee up, a foot up, standing on it. */
  export const scramble = HumanActionRow.of("scramble", support, {
    stances: [
      { contacts: [...FEET, on("leftHand"), on("rightHand")] },
      { contacts: [FEET[0]!, on("leftHand"), on("rightHand"), on("rightKnee")] },
      { contacts: [on("leftHand"), on("rightHand"), on("rightKnee"), on("leftFoot")] },
      { contacts: [on("leftFoot"), on("rightFoot")], prefer: getUp.POSES.stood },
    ],
  });

  /** Slide off a table's edge: seated on it with the hands beside, the feet down to the floor, standing. */
  export const slideOff = HumanActionRow.of("slideOff", support, {
    stances: [
      { contacts: [on("seat"), on("leftHand"), on("rightHand")] },
      { contacts: [on("seat"), on("leftHand"), on("rightHand"), ...FEET] },
      { contacts: FEET, prefer: getUp.POSES.stood },
    ],
  });
}