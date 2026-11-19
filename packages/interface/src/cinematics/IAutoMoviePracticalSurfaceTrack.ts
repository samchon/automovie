/**
 * A shot-local sequence of material changes on one placed prop part. A screen's
 * graphics can follow a handheld device because the target identifies its scene
 * node and model part, which keep their ordinary placement and animation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the target frame, time units and bounds, the required opening key and when a key takes effect.
 * @evidence contracts/development/design.md#principled-representation Scene node and model-scoped part identify one instance surface; strictly increasing shot-local times select fixed material ids by last applicable key.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The track owns timing and identity only. Geometry, appearance and bytes remain on the existing model and asset records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The performance gate requires a registered generated rigid prop and registered material ids, with no implicit first key, interpolation or executable content.
 */
export interface IAutoMoviePracticalSurfaceTrack {
  /** Stable id of the placed prop in the shot scene. */
  node: string;

  /** Id of the surface part within the prop's registered generated model. */
  part: string;

  /**
   * Nonempty list of keys in strictly increasing order. The first is at zero.
   * A following shot authors its own opening key, including when it continues
   * the last material from this shot.
   */
  keys: readonly {
    /** Finite shot-local seconds in the half-open interval [0, duration). */
    time: number;

    /** Model-scoped material id applied from this key until the next key. */
    material: string;
  }[];
}
