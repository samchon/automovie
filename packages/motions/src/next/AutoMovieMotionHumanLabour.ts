import { HumanLabour as HumanLabourSource } from "../lexicon/HumanLabour";
import { HUMAN_LABOUR_HAMMER } from "./presets/HUMAN_LABOUR_HAMMER";
import { HUMAN_LABOUR_HAUL } from "./presets/HUMAN_LABOUR_HAUL";
import { HUMAN_LABOUR_SCRUB } from "./presets/HUMAN_LABOUR_SCRUB";

/**
 * Work with the hands and with loads: carrying a box, a bag or a load on the hip, hauling, pushing a cart, hammering, sawing, stirring, screwing, scrubbing, digging, raking and chopping, tossing and hurling, and holding an infant. It is a behaviour, not a mechanism: it adds no method of its own, and each act is a row of a law its families own (carry of Gait, the tools of Operate, the throw of ThrowCatch). The rows that fix values the law's parameters leave open are data on `AutoMovieMotionHumanLabour` (`HAUL`, `HAMMER` and `SCRUB`); the rows that only choose a kind or a tool are plain rows.
 *
 * Presets, named parameter values spread into a law's parameters beside the hold; a preset adds no method:
 * - `HAUL`: The haul preset: both hands carry a load of 0.25 of the body mass, the most a carry accepts, at the `slow` walk (about 0.82 m/s); labour, strain.
 * - `HAMMER`: The hammer preset: a hammer swung 4 times, which at 2 Hz take 2 s (`useTool.PERIODS`); building, repair.
 * - `SCRUB`: The scrub preset: six passes of the cloth, circles at the tool-stroke hand speed (`useTool.STROKE_SPEED`); cleaning a table, a window, a floor.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 * - `HumanLabour`: Work with the hands and with loads, each a row of a shipped action; the composition gives where to and on what.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by `typeof` and never wrapped, so its parameters, units, frames and refusals are those its own comment states. The family's shared model and each law's parameters are declared by {@link IAutoMovieMotionHumanLabour} in `@automovie/interface`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the family covers, how its members relate and where its model is declared.
 * @evidence contracts/development/design.md#principled-representation Each member is the shipped law, preset or row itself, so the units, frames and invariants are those its owner states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the family groups; each stays owned by its module.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is wrapped, widened or redefined, so no behaviour is added here.
 */
export namespace AutoMovieMotionHumanLabour {
  /**
   * Work with the hands and with loads, each a row of a shipped action; the
   * composition gives where to and on what. Register the ones a film uses.
   */
  export import HumanLabour = HumanLabourSource;

  /**
   * The haul preset: both hands carry a load of 0.25 of the body mass, the most a carry accepts, at the `slow` walk (about 0.82 m/s); labour, strain. Spread into `carry`'s parameters with the destination; the `haul` row of `HumanLabour` fixes these values.
   */
  export const HAUL: typeof HUMAN_LABOUR_HAUL = HUMAN_LABOUR_HAUL;

  /**
   * The hammer preset: a hammer swung 4 times, which at 2 Hz take 2 s (`useTool.PERIODS`); building, repair. Spread into `useTool`'s parameters; the `hammer` row of `HumanLabour` fixes these values.
   */
  export const HAMMER: typeof HUMAN_LABOUR_HAMMER = HUMAN_LABOUR_HAMMER;

  /**
   * The scrub preset: six passes of the cloth, circles at the tool-stroke hand speed (`useTool.STROKE_SPEED`); cleaning a table, a window, a floor. Spread into `wipe`'s parameters; the `scrub` row of `HumanLabour` fixes this value.
   */
  export const SCRUB: typeof HUMAN_LABOUR_SCRUB = HUMAN_LABOUR_SCRUB;
}
