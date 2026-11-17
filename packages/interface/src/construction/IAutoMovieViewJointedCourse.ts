import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Data and callback contracts shared by the ViewJointedCourse operations.
 *
 * @evidence contracts/development/design.md#principled-representation Course data separates unit segment directions and mm lengths from quintic-angle turns with radian angles and mm setback/station values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ViewJointedCourse shares admitted turn data with straight-run placement and axis frame evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exactly straight joints explicitly carry zero turn axis/length; nonoverlap and finite geometry are engine admission premises.
 * @evidence contracts/development/common.md#meaningful-documentation Documents turn coordinates, straight-joint convention and retained segment order.
 */
export namespace IAutoMovieViewJointedCourse {
  /**
   * A prepared turn shared by admission, straight-run placement and frame evaluation.
   *
   * @evidence contracts/development/design.md#principled-representation Axis/angle and arclength half-span define the quintic tangent rotation; setback and start locate it between admitted segments.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six fields carry one already admitted corner without another geometry representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit an angle, shorten an overlapping turn or turn a numerical zero into a straight joint.
   * @evidence contracts/development/common.md#meaningful-documentation Members state radians, millimetres, axis direction and source index.
   */
  export interface ITurn {
    /** Index of the interior source centre. */
    centre: number;

    /** Half the turning arclength, mm; zero for an exactly straight joint. */
    half: number;

    /** Total nonnegative angle, radians. */
    angle: number;

    /** Unit rotation axis; zero on a straight joint. */
    axis: AutoMovieVector3Tuple;

    /** Distance removed from each neighbouring segment, mm. */
    setback: number;

    /** Arclength station of the turn's first point, mm. */
    start: number;
  }

  /**
   * Admitted finite segments and nonoverlapping quintic-angle turns.
   *
   * @evidence contracts/development/design.md#principled-representation Prepared directions, lengths and turns share the same centreline definition for frame and run readings.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three finite arrays expose the admitted course without duplicating centreline geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The preparation refuses inadmissible turns instead of shortening or fitting them.
   * @evidence contracts/development/common.md#meaningful-documentation Directions are unit and lengths/start/setbacks are kernel mm; callers keep preparation immutable.
   */
  export interface ICourse {
    /** Unit segment directions in source order. */
    directions: AutoMovieVector3Tuple[];

    /** Positive segment lengths, mm. */
    lengths: number[];

    /** One admitted turn per interior source centre. */
    turns: IAutoMovieViewJointedCourse.ITurn[];
  }
}
