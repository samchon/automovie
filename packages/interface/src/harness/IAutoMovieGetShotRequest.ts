/**
 * Query tool: pull an already-built sibling shot, to match its ending
 * pose/position/energy.
 *
 * @author Samchon
 */
export interface IAutoMovieGetShotRequest {
  /** Selects the knowledge query that reads a built shot contract. */
  type: "getShot";

  /** Beat id of the sibling shot to pull. */
  beat: string;
}
