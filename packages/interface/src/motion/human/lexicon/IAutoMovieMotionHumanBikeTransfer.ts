/**
 * A grounded high-seat mount or dismount on a stopped bicycle at a World
 * Triathlon boundary. The scene supplies this same bicycle before and after the
 * stopped transfer.
 */
export interface IAutoMovieMotionHumanBikeTransfer {
  /** Subject id of the bicycle. */
  on: string;

  /** Transfer from the floor to the saddle, or back to the floor. */
  mode: "mount" | "dismount";

  /**
   * Point on the mount or dismount line in world metres and course heading in
   * degrees.
   */
  line: { x: number; z: number; heading: number };
}
