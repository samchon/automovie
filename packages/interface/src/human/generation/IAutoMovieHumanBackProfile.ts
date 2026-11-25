/**
 * Survey back-shape inputs and a person's height-parameterized sagittal
 * profile, with millimetre derivatives.
 *
 * The interface package owns these declarations; AutoMovieHumanBackProfile in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanBackProfile {
  /** One sex's back shape, the survey's means; angles in degrees, length in mm. */
  export interface IShape {
    /**
     * Kyphosis angle: between the surface tangents at C7 and at the
     * thoracolumbar inflection.
     */
    kyphosis: number;

    /**
     * Lordosis angle: between the tangents at the thoracolumbar inflection and
     * at the PSIS level.
     */
    lordosis: number;

    /**
     * Thoracic bending angle: the chord C7 to the kyphosis apex from the
     * vertical.
     */
    thoracicBending: number;

    /** Trunk length D: the spatial distance C7 to the PSIS middle, mm. */
    trunkLength: number;

    /** The sample's mean stature, mm, that {@link trunkLength} belongs to. */
    stature: number;
  }

  /**
   * One knot of the back line: a height, its forward place and the place's
   * first and second derivatives in height.
   */
  export interface IKnot {
    /** The knot's anatomical name. */
    name: "cervicale" | "kyphosisApex" | "inflection" | "lordosisApex" | "psis";

    /** Height above the floor, mm. */
    y: number;

    /** Forward place relative to cervicale's, mm (negative behind it). */
    x: number;

    /**
     * Dx/dy, the surface's lean: positive where the line runs backward as it
     * descends.
     */
    slope: number;

    /** D2x/dy2, mm^-1: the arc's own, zero at the inflection. */
    curvature: number;
  }

  /** A person's back line. */
  export interface IProfile {
    /** The five knots, from cervicale down. */
    knots: IKnot[];

    /** The thoracic and lumbar arcs' radii, mm. */
    radii: [number, number];

    /**
     * The forward place at a height relative to cervicale's, with its first and
     * second derivatives in height; above cervicale it holds cervicale's
     * tangent, below the PSIS level it runs on along that level's tangent.
     */
    at: (y: number) => [number, number, number];
  }

  /**
   * The thoracic and lumbar columns' lengths, mm: Gray 1918's 28 cm and 18 cm
   * of a 71 cm male column; only their ratio is read.
   */
  export type IColumn = {
    /**
     * Reference thoracic column length, millimetres; only its ratio to lumbar
     * length enters the curve.
     */
    readonly thoracic: number;
    /**
     * Reference lumbar column length, millimetres; only its ratio to thoracic
     * length enters the curve.
     */
    readonly lumbar: number;
  };
}
