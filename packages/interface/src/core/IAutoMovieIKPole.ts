/**
 * Pole target controlling which way a `twoBone` IK chain bends.
 *
 * The bend axis crosses the effective goal direction with the root-to-node
 * vector, or current upper segment when node is null, then rolls by angle. A
 * root-to-goal length below 1e-8 uses the upper segment's direction. A cross
 * shorter than 1e-8 uses a deterministic perpendicular from world +Y or +X. CCD
 * and FABRIK ignore the pole.
 */
export interface IAutoMovieIKPole {
  /**
   * Node supplying the bend reference, or null to use the current upper
   * segment; a collinear reference uses the documented deterministic
   * perpendicular.
   */
  node: string | null;

  /** Finite degree roll of the bend axis about the effective goal direction. */
  angle: number;
}
