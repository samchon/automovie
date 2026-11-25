/**
 * Runtime facts for one actor of a thin shot program that the host cannot
 * derive from the model alone.
 *
 * Speed sets how fast a locomote carries the actor, and eyeHeight raises its
 * staged placement to the point a lookAt aims from and at. Placement and facing
 * come from the stage, and skeleton and gaits from the named model.
 */
export interface IAutoMovieShotActorProgram {
  /** Non-blank `stage.actors` node, named by at most one entry. */
  node: string;

  /**
   * Non-blank id in the host's runtime model registry that supplies the
   * skeleton and gait profiles; the production host refuses an id that resolves
   * to no model or to a rig-less one.
   */
  model: string;

  /** Finite positive locomotion speed in world metres per second. */
  speed: number;

  /** Finite non-negative eye height above the staged root, in metres. */
  eyeHeight: number;
}
