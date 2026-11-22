import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Set a neck loop over a partner's head with both hands (#4015): a ribbon
 * medal over a bowed head, or a necklace from behind a seated partner. The
 * loop, held in one hand at one of its handles, is taken in the other hand
 * at its other handle, raised above the partner's crown, lowered around the
 * head to the neck and laid with its back on the nape, its front falling
 * onto the chest; from then it is worn on the partner's upper chest and the
 * hands let go.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path, the custody change and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The loop and the partner; the path follows from the partner's head and chest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `placeOverHead` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A loop not held, a loop too narrow for the partner's head, the dresser as the partner and a crown out of reach are refused at runtime by the law.
 */
export interface IAutoMovieMotionHumanPlaceOverHead {
  /** The loop's scene subject, held at entry in one hand at `holdLeft` or `holdRight`, with `wear` and `front` sockets and an `opening` aperture. */
  prop: string;

  /** The performer who receives it, who bows, kneels or sits first when the crown is high. */
  partner: string;

  /** The hand that holds the loop at entry; the right when absent. The other hand takes the loop's other handle. */
  side?: AutoMovieHumanSide;
}
