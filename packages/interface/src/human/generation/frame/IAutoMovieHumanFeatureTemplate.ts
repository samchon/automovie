import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Public contracts for bone-relative surface features.
 */
export namespace IAutoMovieHumanFeatureTemplate {
  /**
   * What makes a feature, which decides what moves its height.
   */
  export type Class = "bone" | "tendon" | "pad";

  /**
   * One feature in its segment's frame.
   */
  export interface ITemplate {
    /** The feature's name. */
    name: string;

    /** What makes it. */
    class: Class;

    /** The segment whose frame it is placed in. */
    segment: string;

    /** Its centre in that frame, mm. */
    centre: AutoMovieVector3Tuple;

    /** The unit direction of its long extent in that frame. */
    along: AutoMovieVector3Tuple;

    /** The unit direction of its short extent in that frame, square to `along`. */
    across: AutoMovieVector3Tuple;

    /** Its half extents along and across, mm. */
    extent: [number, number];

    /** Its height at the centre, mm: positive a mound, negative a hollow. */
    height: number;

    /** The footprint's superellipse exponent, at least 2; absent, 2, an ellipse. A value over 2 needs `flat`. */
    squareness?: number;

    /** The share of the footprint's radius, in [0, 1), over which the height is whole before its ramp; absent, the bump. */
    flat?: number;
  }

  /**
   * How a person differs from the template's person at the feature's segment.
   */
  export interface IChange {
    /** The segment's length ratio along the feature's `along`. */
    along: number;

    /** The skeleton's breadth ratio along the feature's `across`. */
    across: number;

    /** The tissue's ratio there. */
    tissue: number;
  }

  /**
   * A template placed in the figure's frame.
   */
  export interface IPlaced {
    /** The centre, mm. */
    centre: AutoMovieVector3Tuple;

    /** The unit direction of the long extent. */
    along: AutoMovieVector3Tuple;

    /** The unit direction of the short extent. */
    across: AutoMovieVector3Tuple;

    /** The unit direction the height stands along, `along x across`. */
    normal: AutoMovieVector3Tuple;
  }

  /**
   * What a feature between two landmarks is given besides them.
   */
  export interface ISpan {
    /** The feature's name. */
    name: string;

    /** What makes it. */
    class: Class;

    /** The segment whose frame the landmarks are given in. */
    segment: string;

    /** The direction out of the skin near the feature, in that frame; it need not be unit nor square to the span. */
    outward: AutoMovieVector3Tuple;

    /** The feature's half width across the span, mm. */
    half: number;

    /** Its height at the centre, mm. */
    height: number;

    /** The footprint's exponent and the plateau's share, as `ITemplate` takes them. */
    squareness?: number;

    /** As `ITemplate.flat`. */
    flat?: number;
  }
}
