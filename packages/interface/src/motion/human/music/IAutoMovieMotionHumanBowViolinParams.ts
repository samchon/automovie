/**
 * A straight, right-handed stroke of a held violin bow over a fixed violin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, prop subjects, available strings, direction and timing.
 * @evidence contracts/development/design.md#principled-representation Named subject and string ids select physical contacts; direction and seconds define one stroke.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four inputs of the registered bowViolin law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The law reads the declared hair and string geometry instead of passing custom coordinates.
 */
export interface IAutoMovieMotionHumanBowViolinParams {
  /** Subject of the bow already held in the right hand, with hairFrog and hairTip contacts. */
  bow: string;

  /** Subject of the violin staged as a fixed prop, with the createInstrument string convention. */
  violin: string;

  /** Outer string in the coplanar violin archetype: high E or low G, respectively. */
  string: "string1" | "string4";

  /** Which way the hair passes the sounding point. Down proceeds from frog toward tip. Defaults to down. */
  direction?: "down" | "up";

  /** Time on the string, in seconds. Defaults to one second. */
  seconds?: number;
}
