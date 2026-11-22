import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { carry } from "../carrying/carry";
import { HumanActionRow } from "../law/HumanActionRow";
import { holdInfant } from "../tasks/holdInfant";
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
  /** Carry a box in both hands, at the normal walk's speed (about 1.5 m/s, {@link IAutoMovieMotionHumanWalkParams.pace}) with a load of 0.1 of the body mass when `load` is absent; moving boxes, shopping. */
  export const carryBox: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryBox"]
  > = HumanActionRow.of("carryBox", carry, {
    how: "twoHands",
  });

  /** Carry a bag or a case in one hand, at the normal walk's speed (about 1.5 m/s, {@link IAutoMovieMotionHumanWalkParams.pace}) with a load of 0.1 of the body mass when `load` is absent; commuting, travelling. */
  export const carryBag: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryBag"]
  > = HumanActionRow.of("carryBag", carry, {
    how: "oneHand",
  });

  /** Carry a load on the hip, as a basket or a child is carried, at the normal walk's speed (about 1.5 m/s, {@link IAutoMovieMotionHumanWalkParams.pace}) with a load of 0.1 of the body mass when `load` is absent. */
  export const carryOnHip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryOnHip"]
  > = HumanActionRow.of("carryOnHip", carry, {
    how: "hip",
  });

  /** Push a cart, a pram or a trolley ahead, at the normal walk's speed (about 1.5 m/s, {@link IAutoMovieMotionHumanWalkParams.pace}); shopping, a stroll with a pram. */
  export const pushCart: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["pushCart"]
  > = HumanActionRow.of("pushCart", carry, { how: "push" });

  /** Haul a heavy load slowly in both hands: the slow walk (about 1.05 m/s, {@link IAutoMovieMotionHumanWalkParams.pace}) with a load of 0.25 of the body mass, the most a carry accepts; labour, strain. */
  export const haul: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["haul"]
  > = HumanActionRow.of("haul", carry, {
    how: "twoHands",
    pace: "slow",
    load: 0.25,
  });

  /** Drive nails: a hammer swung four times at 2 Hz, 2 s ({@link useTool.PERIODS}); building, repair. */
  export const hammer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["hammer"]
  > = HumanActionRow.of("hammer", useTool, {
    tool: "hammer",
    cycles: 4,
  });

  /** Saw through a board: 4 push-pull cycles of 0.5 s, 2 s, when `cycles` is absent ({@link useTool.PERIODS}). */
  export const saw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["saw"]
  > = HumanActionRow.of("saw", useTool, { tool: "saw" });

  /** Stir a pot. */
  export const stir: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["stir"]
  > = HumanActionRow.of("stir", useTool, { tool: "stir" });

  /** Drive a screw: 4 turns of 0.7 s, 2.8 s, when `cycles` is absent ({@link useTool.PERIODS}). */
  export const screw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["screw"]
  > = HumanActionRow.of("screw", useTool, {
    tool: "screwdriver",
  });

  /** Scrub a surface: six passes of the cloth. Circles at the tool-stroke hand speed (`useTool.STROKE_SPEED`); cleaning a table, a window, a floor. */
  export const scrub: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["scrub"]
  > = HumanActionRow.of("scrub", wipe, { cycles: 6 });

  /** Toss something lightly to a place or a person. The release speed follows from the distance by the range equation (`throwObject`, Dupuy et al. 2000); handing something across a short gap, a light throw. */
  export const toss: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["toss"]
  > = HumanActionRow.of("toss", throwObject, { style: "toss" });

  /** Hurl something overarm. The release speed follows from the distance by the range equation (`throwObject`); a long or angry throw. */
  export const hurl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["hurl"]
  > = HumanActionRow.of("hurl", throwObject, {
    style: "overarm",
  });

  /** Chop or split overhead with an axe onto a block or a log. 3 strokes when `cycles` is absent; the time of a stroke is not stated in the law (`longTool`, provisional, missing a timing study). */
  export const chop: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["chop"]
  > = HumanActionRow.of("chop", longTool, { stroke: "chop" });

  /** Chop level into a standing trunk. 3 strokes when `cycles` is absent; the time of a stroke is not stated in the law (`longTool`, provisional, missing a timing study). */
  export const sideChop: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["sideChop"]
  > = HumanActionRow.of("sideChop", longTool, { stroke: "side" });

  /** Swing a sledgehammer or a pickaxe down at the ground. 3 strokes when `cycles` is absent; the time of a stroke is not stated in the law (`longTool`, provisional, missing a timing study). */
  export const sledge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["sledge"]
  > = HumanActionRow.of("sledge", longTool, { stroke: "swing" });

  /** Dig with a shovel and throw each load aside. 3 strokes when `cycles` is absent; the time of a stroke is not stated in the law (`longTool`, provisional, missing a timing study). */
  export const dig: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["dig"]
  > = HumanActionRow.of("dig", longTool, { stroke: "dig" });

  /** Rake or hoe the ground toward oneself. 3 strokes when `cycles` is absent; the time of a stroke is not stated in the law (`longTool`, provisional, missing a timing study). */
  export const rake: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["rake"]
  > = HumanActionRow.of("rake", longTool, { stroke: "rake" });

  /** Cradle an infant across the front, its head in the holding arm's crook. Held 4 s when `seconds` is absent (`IAutoMovieMotionHumanHoldInfant`, provisional). */
  export const cradleInfant: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["cradleInfant"]
  > = HumanActionRow.of("cradleInfant", holdInfant, { hold: "cradle" });

  /** Hold an infant against the shoulder and pat its back. Held 4 s when `seconds` is absent (`IAutoMovieMotionHumanHoldInfant`, provisional). */
  export const burpInfant: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["burpInfant"]
  > = HumanActionRow.of("burpInfant", holdInfant, { hold: "shoulder" });

  /** Feed a cradled infant from a bottle in the other hand. Held 4 s when `seconds` is absent (`IAutoMovieMotionHumanHoldInfant`, provisional). */
  export const feedInfant: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["feedInfant"]
  > = HumanActionRow.of("feedInfant", holdInfant, { hold: "feed" });
}
