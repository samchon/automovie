import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieCurveLengthMeasurement64 } from "../../../geometry/curve/IAutoMovieCurveLengthMeasurement64";

/**
 * Original lower-neck trial declarations, measured tape results and immutable-template polar readers.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadNeckBaseTrial in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original lower-neck trial declarations, measured tape results and immutable-template polar readers. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IOutput, IPolarReading, IPolar, CreateExtents declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IOutput, IPolarReading, IPolar, CreateExtents separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadNeckBaseTrial exchanges the named IOutput, IPolarReading, IPolar, CreateExtents contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanHeadNeckBaseTrial {
  /** One actual source and its requested numerical observation; no prepared callback survives.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One actual source and its requested numerical observation; no prepared callback survives.
   * @evidence contracts/development/design.md#principled-representation `radius`: Actual root-parameter radius declaration, calibration mm. `centre`: Actual physical-Y axis declaration, calibration mm. `height`: Actual finite-clock height declaration with this trial's side phase.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadNeckBaseTrial.create. Also types AutoMovieHumanHeadNeckBase.retained, AutoMovieHumanHeadNeckBase.at.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `radius`, `centre`, `height`, `sidePhase`, `measured`, `points`, `polygon`; callers supply the complete record.
   */
  export interface IOutput {
    /** Actual root-parameter radius declaration, calibration mm. */
    readonly radius: IAutoMovieViewPart.IOutline;

    /** Actual physical-Y axis declaration, calibration mm. */
    readonly centre: IAutoMovieViewPart.IOutline;

    /** Actual finite-clock height declaration with this trial's side phase. */
    readonly height: IAutoMovieViewPart.IOutline;

    /** Positive-Z original polar phase of the authored AP-plane intersection. */
    readonly sidePhase: number;

    /** Engine GL8 K/2K reading of these exact numeric declarations. */
    readonly measured: IAutoMovieCurveLengthMeasurement64;

    /** Actual front, left, C7 and right points, calibration mm. */
    readonly points: [number, number, number][];

    /** Their closed chord polygon, a necessary lower bound only. */
    readonly polygon: number;
  }

  /** Native polar data of the immutable normal template, independent of every world radius/height trial.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Native polar data of the immutable normal template, independent of every world radius/height trial.
   * @evidence contracts/development/design.md#principled-representation `jet`: Original radial value and its first/second polar derivatives, calibration mm. `cos`: Cosine of the exact queried native polar parameter. `sin`: Sine of the exact queried native polar parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHeadNeckBaseTrial.readings, AutoMovieHumanHeadNeckBaseTrial.previous.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `jet`, `cos`, `sin`; callers supply the complete record.
   */
  export interface IPolarReading {
    /** Original radial value and its first/second polar derivatives, calibration mm. */
    readonly jet: readonly [number, number, number];

    /** Cosine of the exact queried native polar parameter. */
    readonly cos: number;

    /** Sine of the exact queried native polar parameter. */
    readonly sin: number;
  }

  /** One native template reader; only fixed-partition query parameters may be retained.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One native template reader; only fixed-partition query parameters may be retained.
   * @evidence contracts/development/design.md#principled-representation `boundaries`: Actual quarter/G2 source-piece boundaries in the immutable native radian clock; inspection/refinement samples are separate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadNeckBaseTrial.prepareNative. Read by AutoMovieHumanHeadNeckBaseTrial.create. Also types AutoMovieHumanHeadNeckBase.polar, AutoMovieHumanHeadNeckBaseTrial.native.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `boundaries`; callers supply the complete record.
   */
  export interface IPolar {
    /** Actual quarter/G2 source-piece boundaries in the immutable native radian clock; inspection/refinement samples are separate. */
    readonly boundaries: readonly number[];

    /**
     * False evaluates without retaining a trial-dependent quadrature parameter.
     */
    at(theta: number, fixedPartition: boolean): IPolarReading;
  }

  /** The extents argument of AutoMovieHumanHeadNeckBaseTrial.create. ISO 8559-1 3.1.7 identifies an anterior trapezius border, not a fixed
  polar angle. IEEE's 2021 Landmarking for Product Development report,
  Table 5 and section 4.21, uses an AP-depth quarter as a manual starting
  location together with greatest width and the neck/shoulder inflection.
  Here the posterior quarter-depth plane is a declared caliper proxy;
  its posterior orientation is an authoring choice, not the report's
  specified direction or a measured clinical landmark. Actual greatest
  width, ridge anatomy and whole course still require observation.
  The plane intersects this same native family at the public side height.
  No f1 tape residual, reference coordinate or finished curve chooses it.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation ISO 8559-1 3.1.7 identifies an anterior trapezius border, not a fixed polar angle.
 * @evidence contracts/development/design.md#principled-representation ISO 8559-1 3.1.7 identifies an anterior trapezius border, not a fixed polar angle. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadNeckBaseTrial.CreateExtents is the canonical exchange used by AutoMovieHumanHeadNeckBaseTrial.create.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadNeckBaseTrial.create for iSO 8559-1 3.1.7 identifies an anterior trapezius border, not a fixed polar angle.
 */
  export type CreateExtents = readonly [number, number, number, number];
}
