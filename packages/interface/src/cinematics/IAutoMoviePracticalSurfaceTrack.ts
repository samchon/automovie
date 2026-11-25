/**
 * A shot-local sequence of material changes on one placed prop part. A screen's
 * graphics can follow a handheld device because the target identifies its scene
 * node and model part, which keep their ordinary placement and animation.
 */
export interface IAutoMoviePracticalSurfaceTrack {
  /** Stable id of the placed prop in the shot scene. */
  node: string;

  /** Id of the surface part within the prop's registered generated model. */
  part: string;

  /**
   * Nonempty list of keys in strictly increasing order. The first is at zero. A
   * following shot authors its own opening key, including when it continues the
   * last material from this shot.
   */
  keys: readonly {
    /** Finite shot-local seconds in the half-open interval [0, duration). */
    time: number;

    /** Model-scoped material id applied from this key until the next key. */
    material: string;
  }[];
}
