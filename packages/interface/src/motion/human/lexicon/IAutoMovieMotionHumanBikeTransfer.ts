/**
 * A grounded high-seat mount or dismount on a stopped bicycle at a
 * World Triathlon boundary. The scene supplies this same bicycle before and
 * after the stopped transfer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the bicycle, transfer direction and authored boundary in world metres and degrees.
 * @evidence contracts/development/design.md#principled-representation A world line and its crossing heading determine the valid side for the displayed ground-contact sole.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanBikeTransfer reads this record and delegates entering and leaving the high seat to existing seat laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mount or dismount operates on the scene bicycle and the line uses world geometry independent of athlete root position.
 */
export interface IAutoMovieMotionHumanBikeTransfer {
  /** Subject id of the bicycle. */
  on: string;

  /** Transfer from the floor to the saddle, or back to the floor. */
  mode: "mount" | "dismount";

  /** Point on the mount or dismount line in world metres and course heading in degrees. */
  line: { x: number; z: number; heading: number };
}
