import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionHumanTiming } from "../compose/IAutoMovieMotionHumanTiming";

/**
 * Put a held wearable on another performer: a ring onto a finger, a necklace at
 * the nape, a medal or a flower at the chest, a crown on the head. The dresser
 * carries the item in one hand to the partner's region, the item is worn on the
 * bone under that region from the arrival, and the hand lets go and returns.
 */
export interface IAutoMovieMotionHumanDressPartner {
  /** The held wearable's scene subject. */
  prop: string;

  /** The performer being dressed. */
  partner: string;

  /** The partner's region the item is worn on. */
  region: AutoMovieHumanoidRegion;

  /** The dressing hand, which holds the item; the right when absent. */
  side?: AutoMovieHumanSide;

  /**
   * The item's point brought to the region, such as its `wear` socket; the
   * hand's palm when absent.
   */
  point?: string;

  /**
   * How long the hand stays at the region before letting go: a pause of the arm
   * phrase's visit; a beat when absent.
   */
  hold?: IAutoMovieMotionHumanTiming.Pause;
}
