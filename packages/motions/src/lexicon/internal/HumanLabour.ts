import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { carry } from "../../carrying/internal/carry";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_LABOUR_HAMMER } from "../../next/presets/HUMAN_LABOUR_HAMMER";
import { HUMAN_LABOUR_HAUL } from "../../next/presets/HUMAN_LABOUR_HAUL";
import { HUMAN_LABOUR_SCRUB } from "../../next/presets/HUMAN_LABOUR_SCRUB";
import { holdInfant } from "../../tasks/internal/holdInfant";
import { longTool } from "../../tasks/internal/longTool";
import { useTool } from "../../tasks/internal/useTool";
import { wipe } from "../../tasks/internal/wipe";
import { throwObject } from "../../throwing/internal/throwObject";

/**
 * Work with the hands and with loads, each a row of a shipped action; the
 * composition gives where to and on what. Register the ones a film uses.
 */
export namespace HumanLabour {
  /**
   * Carry a box in both hands, at the normal walk's speed (about 1.5 m/s,
   * {@link IAutoMovieMotionHumanWalkParams.pace}) with a load of 0.1 of the body
   * mass when `load` is absent; moving boxes, shopping.
   */
  export const carryBox: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryBox"]
  > = AutoMovieMotionHumanActionRow.of("carryBox", carry, {
    kind: "twoHands",
  });

  /**
   * Carry a bag or a case in one hand, at the normal walk's speed (about 1.5
   * m/s, {@link IAutoMovieMotionHumanWalkParams.pace}) with a load of 0.1 of the
   * body mass when `load` is absent; commuting, travelling.
   */
  export const carryBag: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryBag"]
  > = AutoMovieMotionHumanActionRow.of("carryBag", carry, {
    kind: "oneHand",
  });

  /**
   * Carry a load on the hip, as a basket or a child is carried, at the normal
   * walk's speed (about 1.5 m/s, {@link IAutoMovieMotionHumanWalkParams.pace})
   * with a load of 0.1 of the body mass when `load` is absent.
   */
  export const carryOnHip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["carryOnHip"]
  > = AutoMovieMotionHumanActionRow.of("carryOnHip", carry, {
    kind: "hip",
  });

  /**
   * Push a cart, a pram or a trolley ahead, at the normal walk's speed (about
   * 1.5 m/s, {@link IAutoMovieMotionHumanWalkParams.pace}); shopping, a stroll
   * with a pram.
   */
  export const pushCart: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["pushCart"]
  > = AutoMovieMotionHumanActionRow.of("pushCart", carry, { kind: "push" });

  /**
   * Haul a heavy load slowly in both hands: the slow walk (about 0.82 m/s,
   * {@link IAutoMovieMotionHumanWalkParams.pace}) with a load of 0.25 of the
   * body mass, the most a carry accepts; labour, strain.
   */
  export const haul: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["haul"]
  > = AutoMovieMotionHumanActionRow.of("haul", carry, HUMAN_LABOUR_HAUL);

  /**
   * Drive nails: a hammer swung four times at 2 Hz, 2 s
   * ({@link useTool.PERIODS}); building, repair.
   */
  export const hammer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["hammer"]
  > = AutoMovieMotionHumanActionRow.of("hammer", useTool, HUMAN_LABOUR_HAMMER);

  /**
   * Saw through a board: 4 push-pull cycles of 0.5 s, 2 s, when `cycles` is
   * absent ({@link useTool.PERIODS}).
   */
  export const saw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["saw"]
  > = AutoMovieMotionHumanActionRow.of("saw", useTool, { tool: "saw" });

  /** Stir a pot. */
  export const stir: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["stir"]
  > = AutoMovieMotionHumanActionRow.of("stir", useTool, { tool: "stir" });

  /**
   * Drive a screw: 4 turns of 0.7 s, 2.8 s, when `cycles` is absent
   * ({@link useTool.PERIODS}).
   */
  export const screw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["screw"]
  > = AutoMovieMotionHumanActionRow.of("screw", useTool, {
    tool: "screwdriver",
  });

  /**
   * Scrub a surface: six passes of the cloth. Circles at the tool-stroke hand
   * speed (`useTool.STROKE_SPEED`); cleaning a table, a window, a floor.
   */
  export const scrub: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["scrub"]
  > = AutoMovieMotionHumanActionRow.of("scrub", wipe, HUMAN_LABOUR_SCRUB);

  /**
   * Toss something lightly to a place or a person. The release speed follows
   * from the distance by the range equation (`throwObject`, Dupuy et al. 2000);
   * handing something across a short gap, a light throw.
   */
  export const toss: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["toss"]
  > = AutoMovieMotionHumanActionRow.of("toss", throwObject, { style: "toss" });

  /**
   * Hurl something overarm. The release speed follows from the distance by the
   * range equation (`throwObject`); a long or angry throw.
   */
  export const hurl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["hurl"]
  > = AutoMovieMotionHumanActionRow.of("hurl", throwObject, {
    style: "overarm",
  });

  /**
   * Chop or split overhead with an axe onto a block or a log. 3 strokes when
   * `cycles` is absent; the time of a stroke is not stated in the law
   * (`longTool`, provisional, missing a timing study).
   */
  export const chop: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["chop"]
  > = AutoMovieMotionHumanActionRow.of("chop", longTool, { stroke: "chop" });

  /**
   * Chop level into a standing trunk. 3 strokes when `cycles` is absent; the
   * time of a stroke is not stated in the law (`longTool`, provisional, missing
   * a timing study).
   */
  export const sideChop: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["sideChop"]
  > = AutoMovieMotionHumanActionRow.of("sideChop", longTool, {
    stroke: "side",
  });

  /**
   * Swing a sledgehammer or a pickaxe down at the ground. 3 strokes when
   * `cycles` is absent; the time of a stroke is not stated in the law
   * (`longTool`, provisional, missing a timing study).
   */
  export const sledge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["sledge"]
  > = AutoMovieMotionHumanActionRow.of("sledge", longTool, { stroke: "swing" });

  /**
   * Dig with a shovel and throw each load aside. 3 strokes when `cycles` is
   * absent; the time of a stroke is not stated in the law (`longTool`,
   * provisional, missing a timing study).
   */
  export const dig: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["dig"]
  > = AutoMovieMotionHumanActionRow.of("dig", longTool, { stroke: "dig" });

  /**
   * Rake or hoe the ground toward oneself. 3 strokes when `cycles` is absent;
   * the time of a stroke is not stated in the law (`longTool`, provisional,
   * missing a timing study).
   */
  export const rake: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["rake"]
  > = AutoMovieMotionHumanActionRow.of("rake", longTool, { stroke: "rake" });

  /**
   * Cradle an infant across the front, its head in the holding arm's crook.
   * Held 4 s when `seconds` is absent (`IAutoMovieMotionHumanHoldInfant`,
   * provisional).
   */
  export const cradleInfant: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["cradleInfant"]
  > = AutoMovieMotionHumanActionRow.of("cradleInfant", holdInfant, {
    kind: "cradle",
  });

  /**
   * Hold an infant against the shoulder and pat its back. Held 4 s when
   * `seconds` is absent (`IAutoMovieMotionHumanHoldInfant`, provisional).
   */
  export const burpInfant: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["burpInfant"]
  > = AutoMovieMotionHumanActionRow.of("burpInfant", holdInfant, {
    kind: "shoulder",
  });

  /**
   * Feed a cradled infant from a bottle in the other hand. Held 4 s when
   * `seconds` is absent (`IAutoMovieMotionHumanHoldInfant`, provisional).
   */
  export const feedInfant: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["labour"]["feedInfant"]
  > = AutoMovieMotionHumanActionRow.of("feedInfant", holdInfant, {
    kind: "feed",
  });
}
