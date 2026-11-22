import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { carry } from "../carrying/carry";
import { HumanActionRow } from "../law/HumanActionRow";
import { longTool } from "../tasks/longTool";
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
  export const carryBox: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryBox"]
  > = HumanActionRow.of("carryBox", carry, {
    how: "twoHands",
  });

  /** Carry a bag or a case in one hand. */
  export const carryBag: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryBag"]
  > = HumanActionRow.of("carryBag", carry, {
    how: "oneHand",
  });

  /** Carry a load on the hip, as a basket or a child is carried. */
  export const carryOnHip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryOnHip"]
  > = HumanActionRow.of("carryOnHip", carry, {
    how: "hip",
  });

  /** Push a cart, a pram or a trolley ahead. */
  export const pushCart: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["pushCart"]
  > = HumanActionRow.of("pushCart", carry, { how: "push" });

  /** Haul a heavy load slowly in both hands (the load is a quarter of the body's mass, the most a carry accepts). */
  export const haul: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["haul"]
  > = HumanActionRow.of("haul", carry, {
    how: "twoHands",
    pace: "slow",
    load: 0.25,
  });

  /** Drive nails: a hammer swung four times. */
  export const hammer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["hammer"]
  > = HumanActionRow.of("hammer", useTool, {
    tool: "hammer",
    cycles: 4,
  });

  /** Saw through a board. */
  export const saw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["saw"]
  > = HumanActionRow.of("saw", useTool, { tool: "saw" });

  /** Stir a pot. */
  export const stir: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["stir"]
  > = HumanActionRow.of("stir", useTool, { tool: "stir" });

  /** Drive a screw. */
  export const screw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["screw"]
  > = HumanActionRow.of("screw", useTool, {
    tool: "screwdriver",
  });

  /** Scrub a surface: six passes of the cloth. */
  export const scrub: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["scrub"]
  > = HumanActionRow.of("scrub", wipe, { cycles: 6 });

  /** Toss something lightly to a place or a person. */
  export const toss: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["toss"]
  > = HumanActionRow.of("toss", throwObject, { style: "toss" });

  /** Hurl something overarm. */
  export const hurl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["hurl"]
  > = HumanActionRow.of("hurl", throwObject, {
    style: "overarm",
  });

  /** Chop or split overhead with an axe onto a block or a log. */
  export const chop: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["chop"]
  > = HumanActionRow.of("chop", longTool, { stroke: "chop" });

  /** Chop level into a standing trunk. */
  export const sideChop: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["sideChop"]
  > = HumanActionRow.of("sideChop", longTool, { stroke: "side" });

  /** Swing a sledgehammer or a pickaxe down at the ground. */
  export const sledge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["sledge"]
  > = HumanActionRow.of("sledge", longTool, { stroke: "swing" });

  /** Dig with a shovel and throw each load aside. */
  export const dig: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["dig"]
  > = HumanActionRow.of("dig", longTool, { stroke: "dig" });

  /** Rake or hoe the ground toward oneself. */
  export const rake: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["rake"]
  > = HumanActionRow.of("rake", longTool, { stroke: "rake" });
}
