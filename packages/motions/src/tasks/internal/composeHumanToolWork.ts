import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

/*
 * One-handed tool work from a working base composed from shipped actions :
 * kneeling or crouching at floor level, seated at a bench, or standing. The
 * base is taken first, then `useTool` cycles from it, so the base, the pickup
 * and the tool are fitted, refused and checked as those actions are. The tool
 * is taken up once the base has settled, since a kneeling or seated body rests
 * its free hands as it goes down.
 *
 * The work point's height chooses the base when the author names none: below
 * `FLOOR_REACH` of the stature the performer kneels on one knee, up to
 * `CROUCH_REACH` it crouches, and above it stands (provisional bands between
 * the standing work heights `useTool` already reaches and the floor).
 */
export namespace composeHumanToolWork {
  /*
   * A working base.
   */
  export type Base = "kneel" | "crouch" | "seated" | "standing";

  /*
   * Work below this share of the stature is done kneeling (provisional).
   */
  export const FLOOR_REACH: number = 0.15;

  /*
   * Work below this share of the stature, and above `FLOOR_REACH`, is done
   * crouching (provisional).
   */
  export const CROUCH_REACH: number = 0.35;

  /*
   * What the work names: the tool, the prop and its grip, the work point and
   * the hand.
   */
  export interface IWork {
    /*
     * The tool's stroke.
     */
    tool: IAutoMovieMotionHumanToolWork.Kind;

    /*
     * The tool's subject, which lies within reach of the base.
     */
    prop: string;

    /*
     * The tool's grip affordance.
     */
    handle: string;

    /*
     * The work point.
     */
    on: IAutoMovieMotionTarget;

    /*
     * The working hand; the right when absent.
     */
    hand?: AutoMovieHumanSide;

    /*
     * Stroke cycles; `useTool`'s own count when absent.
     */
    cycles?: number;

    /*
     * Where a kneeling base's knee comes down, beside the work; the reverse
     * lunge's place when absent.
     */
    knee?: IAutoMovieMotionTarget;
  }

  /*
   * The base a work point's height asks for.
   * Parameter height: The work point's height above the floor, metres.
   * Parameter stature: The performer's stature, metres.
   * Returns: The base.
   */
  export function baseFor(height: number, stature: number): Base {
    const share: number = height / stature;
    return share < FLOOR_REACH
      ? "kneel"
      : share < CROUCH_REACH
        ? "crouch"
        : "standing";
  }

  /*
   * Take the base, then work the tool from it.
   * Parameter chain: The performer's chain; the tool lies within reach of the base.
   * Parameter base: The working base.
   * Parameter work: The tool work.
   * Parameter seat: The seat for a seated base.
   * Returns: The chain with the base and the work appended.
   * When a seated base names no seat.
   */
  export function at<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    base: Base,
    work: IWork,
    seat?: IAutoMovieMotionHumanSeated.ISeat,
  ): Chain {
    const based: Chain =
      base === "kneel"
        ? chain.act("kneel", {
            kind: "one",
            hold: 0,
            rise: false,
            ...(work.knee === undefined ? {} : { at: work.knee }),
          })
        : base === "crouch"
          ? chain.act("crouch", { depth: "full", hold: 0 })
          : base === "seated"
            ? chain.act("sit", { seat: required(seat) })
            : chain;
    // The base comes first and the tool is taken up from it: a kneeling or
    // seated body settles its free hands before the working hand closes.
    return based
      .act("pickUp", {
        prop: work.prop,
        handle: work.handle,
        hand: work.hand ?? "right",
      })
      .act("useTool", {
        tool: work.tool,
        prop: work.prop,
        on: work.on,
        ...(work.hand === undefined ? {} : { hand: work.hand }),
        ...(work.cycles === undefined ? {} : { count: work.cycles }),
      });
  }

  /*
   * The seat a seated base needs.
   */
  function required(
    seat: IAutoMovieMotionHumanSeated.ISeat | undefined,
  ): IAutoMovieMotionHumanSeated.ISeat {
    if (seat === undefined)
      throw new Error("A seated tool base needs the seat it sits on.");
    return seat;
  }
}
