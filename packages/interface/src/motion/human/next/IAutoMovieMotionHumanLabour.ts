import type { IAutoMovieMotionHumanGait } from "./IAutoMovieMotionHumanGait";
import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanThrowCatch } from "./IAutoMovieMotionHumanThrowCatch";

/**
 * Work with the hands and with loads: carrying a box, a bag or a load on the
 * hip, hauling, pushing a cart, hammering, sawing, stirring, screwing,
 * scrubbing, digging, raking and chopping, tossing and hurling, and holding an
 * infant. It is a behaviour, not a mechanism: it adds no method of its own, and
 * each act is a row of a law its families own (carry of Gait, the tools of
 * Operate, the throw of ThrowCatch). The rows that fix values the law's
 * parameters leave open are data on `AutoMovieMotionHumanLabour` (`HAUL`,
 * `HAMMER` and `SCRUB`); the rows that only choose a kind or a tool are plain
 * rows.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanLabour<Chain>
  extends
    IAutoMovieMotionHumanGait<Chain>,
    IAutoMovieMotionHumanOperate<Chain>,
    IAutoMovieMotionHumanThrowCatch<Chain> {}

/** The parameter values the presets of the Labour behaviour fix. */
export namespace IAutoMovieMotionHumanLabour {
  /** The haul: both hands carry a heavy load at the slow walk. */
  export interface IHaulPreset {
    /** The carry's grip: both hands. */
    kind: "twoHands";

    /** The carry's pace: the slow walk, about 0.82 m/s. */
    pace: "slow";

    /** The load as a share of the body mass: 0.25, the most a carry accepts. */
    load: number;
  }

  /** The hammer: nails driven by a hammer swung a fixed number of times. */
  export interface IHammerPreset {
    /** The tool: a hammer. */
    tool: "hammer";

    /** The strokes the hammer is swung: 4, which at 2 Hz take 2 s. */
    count: number;
  }

  /** The scrub: a surface wiped by a number of passes of the cloth. */
  export interface IScrubPreset {
    /** The passes of the cloth: 6. */
    count: number;
  }
}
