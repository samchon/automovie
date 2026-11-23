import type * as THREE from "three";

/**
 * A shot's flames, built and mounted on their props.
 *
 * `prepareAutoMovieFlames` returns it. The caller owns it until `dispose`.
 */
export interface IAutoMovieFlamesObject {
  /**
   * One mesh per cue, in cue order, each named `flame:<node>/<cue id>` and
   * parented to its prop's model object at the emitter frame.
   */
  readonly meshes: readonly THREE.Mesh[];

  /**
   * Shape every flame for shot-local `seconds`, show the ones burning and hide
   * the rest. The shape is evaluated at exactly `seconds`, not at the light's
   * key grid. A non-finite time throws a `RangeError`.
   */
  apply(seconds: number): void;

  /** Detach the meshes and release their geometries and materials; idempotent. */
  dispose(): void;
}
