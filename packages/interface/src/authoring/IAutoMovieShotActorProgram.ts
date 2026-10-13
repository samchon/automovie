/**
 * Host-compilable runtime facts for one actor in a thin shot program.
 *
 * `speed` sets how fast a `locomote` carries the actor, and `eyeHeight` lifts
 * its placement to the point a `lookAt` aims from and at.
 *
 * @author Samchon
 */
export interface IAutoMovieShotActorProgram {
  /** Staged actor node whose actions these facts support. */
  node: string;

  /**
   * Compiler-owned runtime model id providing the skeleton and gait profiles;
   * production refuses an id that resolves to no model or to a rig-less one.
   */
  model: string;

  /** Finite positive locomotion speed in world meters per second. */
  speed: number;

  /** Finite non-negative eye height above the staged root, in meters. */
  eyeHeight: number;
}
