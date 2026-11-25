/** An explicit endpoint identity and its compacted recipe control index. */

export interface IAutoMovieRecoveryEndpointControlOwner {
  /** Declared endpoint authority independent of occurrence direction. */
  id: string;

  /** Index into the owning compiled recipe controls. */
  controlId: number;
}
