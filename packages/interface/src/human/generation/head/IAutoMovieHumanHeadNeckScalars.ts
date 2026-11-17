import type { IAutoMovieViewOutline } from "../../../construction/IAutoMovieViewOutline";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Affine physical-Y neck axes and radius-dependent scalar declarations sharing invariant prepared sources.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadNeckScalars in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Affine physical-Y neck axes and radius-dependent scalar declarations sharing invariant prepared sources. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IOutput, IAxis declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IOutput, IAxis separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadNeckScalars exchanges the named IOutput, IAxis contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanHeadNeckScalars {
  /** One call-owned generating family, with prepared immutable bases shared by the constraint owner.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One call-owned generating family, with prepared immutable bases shared by the constraint owner.
   * @evidence contracts/development/design.md#principled-representation `centre`: Actual physical-station centre, independent of the lower-radius trial. `preparedCentre`: The identical invariant axis prepared once by this generating owner. `clock`: Original course parameter length, not another tape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadNeckScalars.create. Read by AutoMovieHumanHeadNeckBase.admissible, AutoMovieHumanHeadNeckBaseTrial.create. Also types AutoMovieHumanHeadNeckBase.family.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centre`, `preparedCentre`, `clock`, `constant`, `basis`; callers supply the complete record.
   */
  export interface IOutput {
    /**
     * Actual numeric radius declaration at a selected lower radius.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Actual numeric radius declaration at a selected lower radius.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanHeadNeckScalars and the callback provider must satisfy the documented radius contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanHeadNeckScalars and its callback provider own the cost of each radius invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanHeadNeckScalars and the callback provider determine when the inputs to radius describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanHeadNeckScalars and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanHeadNeckScalars.IOutput.radius callable contract, without an implementation body. AutoMovieHumanHeadNeckScalars and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadNeckScalars.IOutput.radius declares only the invocation boundary; decomposition belongs to AutoMovieHumanHeadNeckScalars and the callback provider.
     */
    radius(base: number): IAutoMovieViewPart.IOutline;

    /** Actual physical-station centre, independent of the lower-radius trial. */
    centre: IAutoMovieViewPart.IOutline;

    /** The identical invariant axis prepared once by this generating owner. */
    preparedCentre: IAutoMovieViewOutline.IOutline;

    /** Original course parameter length, not another tape. */
    clock: number;

    /** Radius-independent radius ordinate basis. */
    constant: IAutoMovieViewOutline.IOutline;

    /** Radius coefficient of the unknown lower radius. */
    basis: IAutoMovieViewOutline.IOutline;
  }

  /** One affine lower-neck generating axis, before its scalar controls or either anatomical consumer.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One affine lower-neck generating axis, before its scalar controls or either anatomical consumer.
   * @evidence contracts/development/design.md#principled-representation `parameter`: Original parameter is physical world-Y in calibration mm. `anchor`: Shared normal-plane origin, calibration mm. `first`: Derivative per physical station mm, including its unit Y component.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadNeckScalars.axis. Also types AutoMovieHumanHeadNeckBase.axis, AutoMovieHumanHeadNeckScalars.affine.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `parameter`, `anchor`, `first`, `second`; callers supply the complete record.
   */
  export interface IAxis {
    /** Original parameter is physical world-Y in calibration mm. */
    readonly parameter: "physical-Y-mm";

    /** Shared normal-plane origin, calibration mm. */
    readonly anchor: readonly [number, number, number];

    /** Derivative per physical station mm, including its unit Y component. */
    readonly first: readonly [number, number, number];

    /** The declared affine primitive has zero second derivative. */
    readonly second: readonly [number, number, number];

    /**
     * Actual point on the declared lower/normal affine primitive; no completed curve is read.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Actual point on the declared lower/normal affine primitive; no completed curve is read.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanHeadNeckScalars and the callback provider must satisfy the documented point contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanHeadNeckScalars and its callback provider own the cost of each point invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanHeadNeckScalars and the callback provider determine when the inputs to point describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanHeadNeckScalars and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanHeadNeckScalars.IAxis.point callable contract, without an implementation body. AutoMovieHumanHeadNeckScalars and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadNeckScalars.IAxis.point declares only the invocation boundary; decomposition belongs to AutoMovieHumanHeadNeckScalars and the callback provider.
     */
    point(station: number): [number, number, number];
  }
}
