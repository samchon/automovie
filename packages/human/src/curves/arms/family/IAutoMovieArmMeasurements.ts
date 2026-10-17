import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/** Internal arm-section recipe, resolved before constructing world-space curves.
 *
 * Segment dimensions are millimetres; section shape ratios and basis coefficients are dimensionless. Identity conversion supplies these recipes from physical measurements and explicit common rules, rather than selecting saved curves.
 *
 * @author Samchon
 */
export interface IAutoMovieArmMeasurements {
  /** Descriptive identity of generated family inputs; it never selects a saved body network. */
  identity: string;

  /** Independent side recipes; shared torso and hand boundaries are supplied separately at construction. */
  sides: {
    /** Subject-left dimensions and ordered mechanical courses. */
    left: IAutoMovieArmMeasurements.Side;

    /** Subject-right dimensions and ordered mechanical courses. */
    right: IAutoMovieArmMeasurements.Side;
  };
}
export namespace IAutoMovieArmMeasurements {
  /** One section's location on the existing shoulder-elbow-wrist joint chain.
   *
   * @author Samchon
   */
  export interface Station {
    /** Stable semantic course identifier carried into actual inspection and source attribution. */
    name: string;

    /** Selects the upper-arm axis, elbow origin, or forearm axis used before parent placement. */
    segment: "upperarm" | "elbow" | "forearm";

    /** Joint-centre segment fraction in [0,1]; the elbow course uses zero at the elbow. */
    mechanicalFraction: number;

    /** Optional interior continuation rule. A segment-axis field gives zero transverse radius/roll derivative at this support; omission retains physical secants. It does not certify a global maximum or a measured muscle attachment. */
    longitudinalTangent?: "segment-axis";

    /** Interior section dimensions; absent at the first and last courses because their actual skin belongs to upstream owners. */
    skin?: Skin;
  }

  /** Four-pole section dimensions in the segment chart, not world-space controls.
   *
   * @author Samchon
   */
  export interface Skin {
    /** Translation from the mechanical course origin, in segment-local millimetres. */
    originOffsetInSegmentMm: C.Vector;

    /** Row-major linear map whose columns are section U, V and normal in the segment chart; admitted as orientation-preserving and nonsingular, without orthonormal refitting. */
    sectionBasisInSegment: C.Matrix;

    /** Full U reference diameter in millimetres, multiplied by each pole's U ratio divided by two. */
    breadthMm: number;

    /** Full V reference diameter in millimetres, multiplied by each pole's V ratio divided by two. */
    depthMm: number;

    /** Section-centre displacement along unrolled U, in millimetres. */
    centerOffsetUmm: number;

    /** Section-centre displacement along unrolled V, in millimetres. */
    centerOffsetVmm: number;

    /** U coefficients for the four cyclic poles; [1,0,-1,0] gives symmetric cardinal locations. */
    cardinalShapeURatios: readonly [number, number, number, number];

    /** V coefficients in the same pole order; [0,1,0,-1] pairs with the symmetric U coefficients. */
    cardinalShapeVRatios: readonly [number, number, number, number];

    /** Per-pole displacement along the section normal, in millimetres; nonzero values permit a nonplanar loop. */
    cardinalNormalOffsetsMm: readonly [number, number, number, number];

    /** Positive handle-length multiplier at most one; its dimensional scale is selected by roundingRule. */
    quarterRoundingRatio: number;

    /** Uses half the opposite pole span on the tangent axis, or the smaller adjacent chord projection, to size shared node handles. */
    roundingRule: "oppositeCardinalSpan" | "minimumAdjacentCardinalProjection";

    /** Rotation of pole U/V coefficients and their tangent directions in degrees; centre offsets remain on the unrolled axes. */
    rollOffsetDegrees: number;
  }

  /** Joint-centre lengths and eight courses consumed by the same tensor operator.
   *
   * @author Samchon
   */
  export interface Side {
    /** Shoulder-to-elbow joint-centre distance in millimetres, distinct from a palpable anthropometric length. */
    upperArmLengthMm: number;

    /** Elbow-to-hand joint-centre distance in millimetres; the actual wrist skin boundary may be offset from the Hand joint. */
    forearmLengthMm: number;

    /** Three upper-arm, one elbow and four forearm courses, with strictly increasing physical arc coordinates and externally owned endpoint skin. */
    stations: readonly Station[];
  }
}
