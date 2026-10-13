/**
 * Host-compilable runtime facts for one actor in a thin shot program.
 *
 * `speed` sets how fast a `locomote` carries the actor, and `eyeHeight` lifts
 * its placement to the point a `lookAt` aims from and at.
 *
 * @evidence contracts/common.md#principled-implementation Supplies the scale-dependent facts a generic builder cannot infer: production binds `speed` and `eyeHeight` into the actor context, where `locomote` reads the speed and `makeActorSynthesizer` raises the placement by the eye height for `lookAt`.
 * @evidence contracts/common.md#clear-and-simple-design Four fields keyed by `node`; skeleton and gait curves stay with the runtime model named by `model`, so this record repeats none of the rig geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same bounds are checked twice, by `compileDefinedShot` and by production's `actorRuntimeOf`, and only production also refuses an unavailable or rig-less model, so an engine-only caller accepts any non-blank `model` string.
 * @evidence contracts/common.md#meaningful-documentation States the metres-per-second and metre units, that `eyeHeight` is measured above the staged root, which verbs read each value, and that `model` must resolve to a rigged runtime model.
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
