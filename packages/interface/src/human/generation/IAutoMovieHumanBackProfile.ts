/**
 * Survey back-shape inputs and a person's height-parameterized sagittal profile, with millimetre derivatives.
 *
 * The interface package owns these declarations; AutoMovieHumanBackProfile in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Survey back-shape inputs and a person's height-parameterized sagittal profile, with millimetre derivatives. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IShape, IKnot, IProfile, IColumn declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IShape, IKnot, IProfile, IColumn separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanBackProfile exchanges the named IShape, IKnot, IProfile, IColumn contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanBackProfile {
  /** One sex's back shape, the survey's means; angles in degrees, length in mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One sex's back shape, the survey's means; angles in degrees, length in mm.
   * @evidence contracts/development/design.md#principled-representation `kyphosis`: Kyphosis angle: between the surface tangents at C7 and at the thoracolumbar inflection. `lordosis`: Lordosis angle: between the tangents at the thoracolumbar inflection and at the PSIS level. `thoracicBending`: Thoracic bending angle: the chord C7 to the kyphosis apex from the vertical.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBackProfile.SHAPE, AutoMovieHumanBackProfile.shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `kyphosis`, `lordosis`, `thoracicBending`, `trunkLength`, `stature`; callers supply the complete record.
   */
  export interface IShape {
    /** Kyphosis angle: between the surface tangents at C7 and at the thoracolumbar inflection. */
    kyphosis: number;

    /** Lordosis angle: between the tangents at the thoracolumbar inflection and at the PSIS level. */
    lordosis: number;

    /** Thoracic bending angle: the chord C7 to the kyphosis apex from the vertical. */
    thoracicBending: number;

    /** Trunk length D: the spatial distance C7 to the PSIS middle, mm. */
    trunkLength: number;

    /** The sample's mean stature, mm, that {@link trunkLength} belongs to. */
    stature: number;
  }

  /** One knot of the back line: a height, its forward place and the place's first and second derivatives in height.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One knot of the back line: a height, its forward place and the place's first and second derivatives in height.
   * @evidence contracts/development/design.md#principled-representation `name`: The knot's anatomical name. `y`: Height above the floor, mm. `x`: Forward place relative to cervicale's, mm (negative behind it).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBackProfile.knots.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `y`, `x`, `slope`, `curvature`; callers supply the complete record.
   */
  export interface IKnot {
    /** The knot's anatomical name. */
    name: "cervicale" | "kyphosisApex" | "inflection" | "lordosisApex" | "psis";

    /** Height above the floor, mm. */
    y: number;

    /** Forward place relative to cervicale's, mm (negative behind it). */
    x: number;

    /** dx/dy, the surface's lean: positive where the line runs backward as it descends. */
    slope: number;

    /** d2x/dy2, mm^-1: the arc's own, zero at the inflection. */
    curvature: number;
  }

  /** A person's back line.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A person's back line.
   * @evidence contracts/development/design.md#principled-representation `knots`: The five knots, from cervicale down. `radii`: The thoracic and lumbar arcs' radii, mm. `at`: The forward place at a height relative to cervicale's, with its first and second derivatives in height; above cervicale it holds cervicale's tangent, below the PSIS level it runs on along that level's tangent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBackProfile.of. Also types AutoMovieHumanTrunkLaws.profile.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `knots`, `radii`, `at`; callers supply the complete record.
   */
  export interface IProfile {
    /** The five knots, from cervicale down. */
    knots: IKnot[];

    /** The thoracic and lumbar arcs' radii, mm. */
    radii: [number, number];

    /**
     * The forward place at a height relative to cervicale's, with its first
     * and second derivatives in height; above cervicale it holds cervicale's
     * tangent, below the PSIS level it runs on along that level's tangent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The forward place at a height relative to cervicale's, with its first and second derivatives in height; above cervicale it holds cervicale's tangent, below the PSIS level it runs on along that level's tangent.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanBackProfile and the callback provider must satisfy the documented at contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanBackProfile and its callback provider own the cost of each at invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanBackProfile and the callback provider determine when the inputs to at describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanBackProfile and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanBackProfile.IProfile.at callable contract, without an implementation body. AutoMovieHumanBackProfile and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanBackProfile.IProfile.at declares only the invocation boundary; decomposition belongs to AutoMovieHumanBackProfile and the callback provider.
     */
    at: (y: number) => [number, number, number];
  }

  /** The thoracic and lumbar columns' lengths, mm: Gray 1918's 28 cm and
  18 cm of a 71 cm male column; only their ratio is read.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The thoracic and lumbar columns' lengths, mm: Gray 1918's 28 cm and 18 cm of a 71 cm male column; only their ratio is read.
 * @evidence contracts/development/design.md#principled-representation `thoracic`: Reference thoracic column length, millimetres; only its ratio to lumbar length enters the curve. `lumbar`: Reference lumbar column length, millimetres; only its ratio to thoracic length enters the curve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBackProfile.IColumn is the canonical exchange used by AutoMovieHumanBackProfile.COLUMN.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `thoracic`, `lumbar`; callers supply the complete record.
 */
  export type IColumn = {
    /** Reference thoracic column length, millimetres; only its ratio to lumbar length enters the curve. */
    readonly thoracic: number;
    /** Reference lumbar column length, millimetres; only its ratio to thoracic length enters the curve. */
    readonly lumbar: number;
  };
}
