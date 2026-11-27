import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Work with a long tool held in two hands, standing, in cycles at a work point:
 * chopping and splitting with an axe, a side chop at a standing trunk, a
 * sledgehammer or pickaxe swung at the ground, digging and throwing with a
 * shovel, and raking.
 *
 * The tool is the prop the trailing hand holds near the shaft's end (taken up
 * before, as `pickUp` does), rigid in that hand, so its `face` is a fixed
 * offset in the hand's frame; the lead hand closes on the shaft between the
 * trailing hand and the face and slides along it as the stroke needs.
 */
export namespace IAutoMovieMotionHumanLongTool {
  /**
   * The stroke: `chop` brings the face down overhead onto the work point (a
   * block's top, a log to split), `side` swings it level into a standing trunk,
   * `swing` brings a sledgehammer's or pickaxe's head down at the ground, `dig`
   * drives a shovel's blade in, levers, lifts and throws the load toward `to`,
   * and `rake` pulls the tines along the ground toward the performer and lifts
   * them back.
   */
  export type Stroke = "chop" | "side" | "swing" | "dig" | "rake";

  /** Parameters. */
  export interface IParams {
    /** The stroke. */
    stroke: Stroke;

    /**
     * The held long tool's prop subject, in the trailing hand since a pick-up:
     * its `face` is the working point.
     */
    prop: string;

    /**
     * The work point, world metres: the block's top or the log, the trunk, the
     * ground struck, dug or raked.
     */
    at: IAutoMovieVector3;

    /**
     * Where a dug load is thrown, world metres; a metre to the lead hand's side
     * when absent.
     */
    to?: IAutoMovieVector3;

    /**
     * The trailing hand, which holds the tool near its end; the hand that holds
     * `prop` when absent.
     */
    hand?: AutoMovieHumanSide;

    /** How many strokes, a whole number of at least 1; 3 when absent. */
    count?: number;
  }
}
