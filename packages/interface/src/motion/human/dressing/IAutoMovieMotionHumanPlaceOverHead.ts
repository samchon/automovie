import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Set a neck loop over a partner's head with both hands: a ribbon medal over a
 * bowed head, or a necklace from behind a seated partner. The loop, held in one
 * hand at one of its handles, is taken in the other hand at its other handle,
 * raised above the partner's crown, lowered around the head to the neck and
 * laid with its back on the nape, its front falling onto the chest; from then
 * it is worn on the partner's upper chest and the hands let go.
 */
export interface IAutoMovieMotionHumanPlaceOverHead {
  /**
   * The loop's scene subject, held at entry in one hand at `holdLeft` or
   * `holdRight`, with `wear` and `front` sockets and an `opening` aperture.
   */
  prop: string;

  /**
   * The performer who receives it, who bows, kneels or sits first when the
   * crown is high.
   */
  partner: string;

  /**
   * The hand that holds the loop at entry; the right when absent. The other
   * hand takes the loop's other handle.
   */
  side?: AutoMovieHumanSide;
}
