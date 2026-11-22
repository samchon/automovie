import type { IAutoMovieMotionHumanGait } from "./IAutoMovieMotionHumanGait";
import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanThrowCatch } from "./IAutoMovieMotionHumanThrowCatch";

/**
 * Work with the hands and with loads: carrying a box, a bag or a load on the hip, hauling, pushing a cart, hammering, sawing, stirring, screwing, scrubbing, digging, raking and chopping, tossing and hurling, and holding an infant. It is a behaviour, not a mechanism: it adds no method of its own, and each act is a row of a law its families own (carry of Gait, the tools of Operate, the throw of ThrowCatch). The rows that fix values the law's parameters leave open are data on `AutoMovieMotionHumanLabour` (`HAUL`, `HAMMER` and `SCRUB`); the rows that only choose a kind or a tool are plain rows.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the families the work acts with, which values its presets fix and that it adds no method.
 * @evidence contracts/development/design.md#principled-representation The behaviour's vocabulary is the Gait, Operate and ThrowCatch interfaces, extended rather than redeclared, so each law keeps one method.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The preset types and the runtime data; no method the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no carry, tool or throw method is declared a second time.
 */
export interface IAutoMovieMotionHumanLabour<Chain>
  extends
    IAutoMovieMotionHumanGait<Chain>,
    IAutoMovieMotionHumanOperate<Chain>,
    IAutoMovieMotionHumanThrowCatch<Chain> {}

/**
 * The parameter values the presets of the Labour behaviour fix.
 */
export namespace IAutoMovieMotionHumanLabour {
  /**
   * The haul: both hands carry a heavy load at the slow walk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three values the haul fixes and their owner.
   * @evidence contracts/development/design.md#principled-representation The carry's own `kind`, `pace` and `load` as one record, so it fits any body as the carry does.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the values the haul row fixes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are the carry's own, spread into its parameters.
   */
  export interface IHaulPreset {
    /** The carry's grip: both hands. */
    kind: "twoHands";

    /** The carry's pace: the slow walk, about 0.82 m/s. */
    pace: "slow";

    /** The load as a share of the body mass: 0.25, the most a carry accepts. */
    load: number;
  }

  /**
   * The hammer: nails driven by a hammer swung a fixed number of times.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the tool and the stroke count the hammer fixes.
   * @evidence contracts/development/design.md#principled-representation The tool's own `tool` and `count` as one record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the values the hammer row fixes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are the tool law's own, spread into its parameters.
   */
  export interface IHammerPreset {
    /** The tool: a hammer. */
    tool: "hammer";

    /** The strokes the hammer is swung: 4, which at 2 Hz take 2 s. */
    count: number;
  }

  /**
   * The scrub: a surface wiped by a number of passes of the cloth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the pass count the scrub fixes.
   * @evidence contracts/development/design.md#principled-representation The wipe's own `count` as one record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the value the scrub row fixes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the member is the wipe law's own, spread into its parameters.
   */
  export interface IScrubPreset {
    /** The passes of the cloth: 6. */
    count: number;
  }
}
