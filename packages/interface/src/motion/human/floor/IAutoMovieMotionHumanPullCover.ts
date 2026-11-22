/**
 * Pull a sheet or blanket up while lying, or push it off (#3987): both hands
 * take the cover's edge where it lies over the thighs and draw it up the
 * body to the chest, or take it at the chest and push it down to the
 * thighs before sitting up. The cover is a soft prop the hands grip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two ways, where the hands go and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The cover and the way; the places follow from the lying body's own regions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `pullCover` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A performer who is not lying is refused at runtime; the arm course's reach refusals stand.
 */
export interface IAutoMovieMotionHumanPullCover {
  /** The cover's scene subject: a soft prop lying over the body. */
  prop: string;

  /** Push the cover off, from the chest down to the thighs, instead of pulling it up. */
  off?: boolean;
}
