import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";

/**
 * Put a held wearable on another performer (#4015): a ring onto a finger, a
 * necklace at the nape, a medal or a flower at the chest, a crown on the
 * head. The dresser carries the item in one hand to the partner's region,
 * the item is worn on the bone under that region from the arrival, and the
 * hand lets go and returns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is carried where, when custody passes and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The partner's named body region locates the wear; the item's own `point`, when given, is the point brought to it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The item, the partner, the region, the hand, the item's point and the hold the dressing scenes use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reach, an item not held and a missing partner are refused at runtime by the law.
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

  /** The item's point brought to the region, such as its `wear` socket; the hand's palm when absent. */
  point?: string;

  /** Seconds the hand rests at the region before letting go; the phrase's own hold when absent. */
  hold?: number;
}
