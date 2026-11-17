import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanGlutealParent } from "../trunk/IAutoMovieHumanGlutealParent";

/**
 * Type contracts exchanged by AutoMovieHumanMassSource; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanMassSource exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IConnection, IContact, ISeed. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanMassSource; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IConnection, IContact, ISeed contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanMassSource {
  /** Actual parent-derived placement, not a central curvature estimate.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual parent-derived placement, not a central curvature estimate.
   * @evidence contracts/development/design.md#principled-representation `parent`: Identical whole-parent fields consumed by the actual parent lofts. `wall`: Original wall at the unchanged public apex Y/Z, mm. `normal`: Anatomical AP outward unit axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMassSource.seed, AutoMovieHumanMassSource.rebase. Also types AutoMovieHumanTrunkBuild.connection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `rootInterval`: Parent-derived common AP interval for the same footprint, after bounded numerical phase refinement; not an interval certificate. `original`: Exact source before any internal extension, retained for source ownership and comparison. `transfer`: Whether the original supported root was kept or only a new inward prefix was authored.
   */
  export interface IConnection {
    /** Identical whole-parent fields consumed by the actual parent lofts. */
    parent: IAutoMovieHumanGlutealParent.IParent;
    /** Original wall at the unchanged public apex Y/Z, mm. */
    wall: AutoMovieVector3Tuple;
    /** Anatomical AP outward unit axis. */
    normal: AutoMovieVector3Tuple;
    /** Public apex's positive distance from the actual wall, mm. */
    amplitude: number;
    /** Shared-parent-supported internal root origin, mm. */
    root: AutoMovieVector3Tuple;
    /** Root-to-wall distance along the outward axis, mm. */
    embed: number;
    /** Parent-derived common AP interval for the same footprint, after bounded numerical phase refinement; not an interval certificate. */
    rootInterval?: readonly [number, number];
    /** Exact source before any internal extension, retained for source ownership and comparison. */
    original?: {
      /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
      part: IAutoMovieViewPart;
      /** The same part expressed as the canonical construction view, with physical lengths in metres. */
      view: IAutoMovieConstructionView;
    };
    /** Whether the original supported root was kept or only a new inward prefix was authored. */
    transfer?: "original-root" | "inner-prefix";
    /**
     * Same whole-parent reader that determined the root, with its explicit absence.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Same whole-parent reader that determined the root, with its explicit absence.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanMassSource owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanMassSource.IConnection.contact declares the invocation boundary only; AutoMovieHumanMassSource and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanMassSource.IConnection.contact must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanMassSource.IConnection.contact owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanMassSource and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanMassSource producer or caller supplying the callback owns captured state and its lifetime.
     */
    contact(phi: number): IContact | string;
  }

  /** Actual root-curve point and the same parent chord that supports it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual root-curve point and the same parent chord that supports it.
   * @evidence contracts/development/design.md#principled-representation `point`: World point in calibration mm. `chord`: Whole-parent boundary owners, physical stations and phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanMassSource.originalContact, AutoMovieHumanMassSource.contact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `chord`; callers supply the complete record.
   */
  export interface IContact {
    /** World point in calibration mm. */
    point: AutoMovieVector3Tuple;
    /** Whole-parent boundary owners, physical stations and phases. */
    chord: IAutoMovieHumanGlutealParent.IChord;
  }

  /** Actual original-parent exit on the declared lower source guide; the final kept atlas still validates this owner.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual original-parent exit on the declared lower source guide; the final kept atlas still validates this owner.
   * @evidence contracts/development/design.md#principled-representation `owner`: Boundary source name consumed by the join's hostFace. `part`: Actual mass chart [physical station mm, phase radians]. `host`: Actual original-parent chart [physical station mm, phase radians].
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanMassSource.seed. Also types AutoMovieHumanBodyTree.seed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `owner`, `part`, `host`, `point`; callers supply the complete record.
   */
  export interface ISeed {
    /** Boundary source name consumed by the join's hostFace. */
    owner: string;
    /** Actual mass chart [physical station mm, phase radians]. */
    part: [number, number];
    /** Actual original-parent chart [physical station mm, phase radians]. */
    host: [number, number];
    /** Original world point, calibration mm. */
    point: AutoMovieVector3Tuple;
  }
}
