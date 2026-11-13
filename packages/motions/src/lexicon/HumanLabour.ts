import { carry } from "../carrying/carry";
import { HumanActionRow } from "../law/HumanActionRow";
import { useTool } from "../tasks/useTool";
import { wipe } from "../tasks/wipe";
import { throwObject } from "../throwing/throwObject";

/**
 * Work with the hands and with loads, each a row of a shipped action; the
 * composition gives where to and on what. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (HumanActionRow), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanLabour {
  /** Carry a box in both hands. */
  export const carryBox = HumanActionRow.of("carryBox", carry, {
    how: "twoHands",
  });

  /** Carry a bag or a case in one hand. */
  export const carryBag = HumanActionRow.of("carryBag", carry, {
    how: "oneHand",
  });

  /** Carry a load on the hip, as a basket or a child is carried. */
  export const carryOnHip = HumanActionRow.of("carryOnHip", carry, {
    how: "hip",
  });

  /** Push a cart, a pram or a trolley ahead. */
  export const pushCart = HumanActionRow.of("pushCart", carry, { how: "push" });

  /** Haul a heavy load slowly in both hands (the load is half the body's mass, provisional). */
  export const haul = HumanActionRow.of("haul", carry, {
    how: "twoHands",
    pace: "slow",
    load: 0.5,
  });

  /** Drive nails: a hammer swung four times. */
  export const hammer = HumanActionRow.of("hammer", useTool, {
    tool: "hammer",
    cycles: 4,
  });

  /** Saw through a board. */
  export const saw = HumanActionRow.of("saw", useTool, { tool: "saw" });

  /** Stir a pot. */
  export const stir = HumanActionRow.of("stir", useTool, { tool: "stir" });

  /** Drive a screw. */
  export const screw = HumanActionRow.of("screw", useTool, {
    tool: "screwdriver",
  });

  /** Scrub a surface: six passes of the cloth. */
  export const scrub = HumanActionRow.of("scrub", wipe, { cycles: 6 });

  /** Toss something lightly to a place or a person. */
  export const toss = HumanActionRow.of("toss", throwObject, { style: "toss" });

  /** Hurl something overarm. */
  export const hurl = HumanActionRow.of("hurl", throwObject, {
    style: "overarm",
  });
}
