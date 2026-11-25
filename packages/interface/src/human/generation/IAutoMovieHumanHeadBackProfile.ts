/**
 * Type contracts exchanged by AutoMovieHumanHeadBackProfile; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadBackProfile {
  /** The profile's owners, calibration millimetres; x forward, y up. */
  export interface IProfile {
    /** Retained cranial axis's forward place; not necessarily the g/op midpoint. */
    centre: number;

    /** Posterior reach behind the axis at the template's reference height. */
    reach: number;

    /**
     * Retained horizontal-tangent reference height, distinct from the
     * maximizing g-to-posterior caliper point.
     */
    occiput: number;

    /** Vertex height. */
    vertex: number;

    /** The neck ring's back on the midline: height, forward place and `dx/dy`. */
    ring: {
      /** Profile height in the registered head frame, millimetres. */
      y: number;
      /** Forward coordinate of the posterior head profile, millimetres. */
      x: number;
      /**
       * Forward-coordinate derivative with respect to height, millimetres per
       * millimetre.
       */
      slope: number;
    };
  }
}
