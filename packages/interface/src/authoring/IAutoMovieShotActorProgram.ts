/**
 * Runtime facts for one actor of a thin shot program that the host cannot derive from the model alone.
 *
 * speed sets how fast a locomote carries the actor, and eyeHeight raises its staged placement to the point a lookAt aims from and at. Placement and facing come from the stage, and skeleton and gaits from the named model.
 *
 * @evidence contracts/common.md#principled-implementation `compileDefinedShot` refuses an entry whose node is blank, repeated or absent from `stage.actors`, whose model id is blank, whose speed is not finite and positive, or whose eye height is not finite and non-negative; the production host then resolves `model` in its runtime registry, refuses a missing or rig-less model and a duplicate gait name, and builds the actor context from the stage placement plus these values.
 * @evidence contracts/common.md#clear-and-simple-design Holds only the scale-dependent values a generic builder would otherwise guess, keyed by node; geometry, skeleton and gait curves stay with the model, and position and facing stay with the stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default speed or eye height is supplied for a missing or invalid value; the host refuses the entry and names the field instead.
 * @evidence contracts/common.md#meaningful-documentation States what each value drives, its unit and bounds, which node the entry may name, and that resolving the model is the host's job with the refusals it applies.
 */
export interface IAutoMovieShotActorProgram {
  /** Non-blank `stage.actors` node, named by at most one entry. */
  node: string;

  /**
   * Non-blank id in the host's runtime model registry that supplies the skeleton and gait profiles; the production host refuses an id that resolves to no model or to a rig-less one.
   */
  model: string;

  /** Finite positive locomotion speed in world metres per second. */
  speed: number;

  /** Finite non-negative eye height above the staged root, in metres. */
  eyeHeight: number;
}
