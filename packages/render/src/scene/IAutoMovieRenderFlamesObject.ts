/**
 * A shot's flames, built and mounted on their props.
 *
 * `prepareFlames` returns it. The caller owns it until `dispose`. Each
 * cue's mesh is named `flame:<node>/<cue id>` and parented to its prop's model
 * object at the emitter frame, so a host finds it by that name in the scene it
 * mounted, as the semantic mask does.
 */
export interface IAutoMovieRenderFlamesObject {
  /**
   * Shape every flame for shot-local `seconds`, show the ones burning and hide
   * the rest. The shape is evaluated at exactly `seconds`, not at the light's
   * key grid. A non-finite time throws a `RangeError`.
   */
  apply(seconds: number): void;

  /** Detach the meshes and release their geometries and materials; idempotent. */
  dispose(): void;
}
