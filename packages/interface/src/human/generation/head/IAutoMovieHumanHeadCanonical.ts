import type { IAutoMovieViewCurves } from "../../../construction/IAutoMovieViewCurves";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanNeckConstruction } from "../IAutoMovieHumanNeckConstruction";
import type { IAutoMovieHumanNeckSource } from "../IAutoMovieHumanNeckSource";
import type { IAutoMovieHumanHeadNeckLayout } from "./IAutoMovieHumanHeadNeckLayout";
import type { IAutoMovieHumanHeadTape } from "./IAutoMovieHumanHeadTape";

/**
 * Type contracts exchanged by AutoMovieHumanHeadCanonical; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanHeadCanonical exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IPrepared, IClosureAttempt, IOutput, IOfPlaces. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanHeadCanonical; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IPrepared, IClosureAttempt, IOutput, IOfPlaces contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanHeadCanonical {
  /**
   * One original family, with independent guides/lower material and a lazy upper closure.
   *
   * Both consumers retain this invocation's one generating family and original axis.
   * Retains only the original base, one requested lower adapter and one requested closed source.
   *
   * @evidence contracts/development/design.md#principled-representation The caliper layout and exact lower interval belong to the same original family whose selected full source closes the public tape. `layout`: Public caliper/neck layout before the upper fullness parameter is selected. `preparationMilliseconds`: Actual eager stages; reading this does not request the upper closure or a loft. `guides`: Actual unchanged source guides and axis; no fullness or complete geometry is claimed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Guide-only records cannot masquerade as a complete section source; explicit full closure returns the selected actual part. Returned by AutoMovieHumanHeadCanonical.prepare. Also types AutoMovieHumanHeadComposer.canonical.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second completed head, old success, proxy final source or silent failed solve is published. Required fields are `layout`, `preparationMilliseconds`, `guides`, `curves`, `tapeInvariant`, `closureAttempt`, `result`; callers supply the complete record.
   * @evidence contracts/development/common.md#meaningful-documentation The tape family preserves every guide and the complete source below nasion; lower material does not require the upper numerical choice. One original family, with independent guides/lower material and a lazy upper closure.
   */
  export interface IPrepared {
    /** Public caliper/neck layout before the upper fullness parameter is selected. */
    layout: IAutoMovieHumanHeadLayout;
    /** Actual eager stages; reading this does not request the upper closure or a loft. */
    readonly preparationMilliseconds: Readonly<{
      /** Existing selected-tragion placement, elapsed ms. */
      placement: number;
      /** Complete unchanged original neck solves and declarations, elapsed ms. */
      neckOriginal: number;
      /** Cranial caliper alone, excluding the preceding neck stage, elapsed ms. */
      cranialCaliper: number;
      /** Actual base mass and original edge preparation, elapsed ms. */
      massAndGuides: number;
    }>;
    /** Actual unchanged source guides and axis; no fullness or complete geometry is claimed. */
    guides: Pick<
      IAutoMovieViewPart,
      "name" | "axis" | "stations" | "front" | "side" | "pole"
    >;
    /** Prepared original edges, independent of section/fullness admission. */
    readonly curves: IAutoMovieViewCurves.IResult;
    /**
     * The family's pre-closure member and its layout, exact on and below nasion.
     *
     * The upper tape closure varies only `cranialTapePower`. In
     * `AutoMovieHumanHeadMassSource.prepare` that power enters two scalar
     * outlines and nothing else: the fullness shoulder, through its knots at
     * nasion (`vault`), frontotemporale (`cranial`) and the last station, and
     * the face departure, through its frontotemporale knot (`frontal -
     * cranial`). The front, back and side support outlines, the axis, the
     * stations and the pole are built once before the power is read. Every
     * shoulder and departure knot carries explicit zero first and second jets,
     * so `AutoMovieViewOutline` interpolates each knot span by its own quintic
     * Hermite: a span's values and station derivatives depend only on its two
     * end knots. On and below nasion both members share the spans `gonion ->
     * nasion` (shoulder constant `vault`; the pre-closure member's single span
     * `gonion -> last` is the same constant) and `zygion -> nasion` (departure
     * constant `face - vault`), with every lower knot identical. Their native
     * sections, frames and first/second station derivatives are therefore
     * bit-identical at every station at or below nasion, and differ only above
     * it. The layout differs only by that power, which no regional consumer
     * reads. A consumer whose every mass read lies at or below nasion may use
     * this member without the closure; a consumer reading above nasion (the
     * ears, whose top lies above it, and the orbital domes, whose footprint
     * reaches it) must still request the closed member.
     */
    readonly tapeInvariant: {
      /** The pre-closure layout, equal to the closed plan except `cranialTapePower`. */
      plan: IAutoMovieHumanHeadLayout;

      /** The pre-closure mass, exact on and below nasion only. */
      part: IAutoMovieViewPart;
    };

    /** Actual attempt snapshot; reading it requests no source and preserves an original failure. */
    readonly closureAttempt: IClosureAttempt;
    /** Already resolved full closure, or null; reading this never computes it. */
    readonly result: IOutput | null;
    /**
     * Borrow the exact lower original interval once, without the upper solve.
     *
     * Existing restriction reads the unchanged family's original values, parameter jets and axis below nasion.
     * The output is an explicit regular adapter interval, never a second full head.
     * An upper request or a different placement context is rejected; no old source or missing derivative is substituted.
     * One requested interval scalar restriction and engine loft, then constant-time reuse.
     * Returns the same adapter for the same immutable placement and generating family.
     * Only one placement identity and its actual adapter survive with this preparation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Placement retains its actual calibration-mm domain; the independent upper tape parameter is not read.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanHeadCanonical owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadCanonical.IPrepared.lower declares the invocation boundary only; AutoMovieHumanHeadCanonical and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanHeadCanonical.IPrepared.lower must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanHeadCanonical.IPrepared.lower owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanHeadCanonical and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanHeadCanonical producer or caller supplying the callback owns captured state and its lifetime.
     */
    lower(
      placement: IAutoMovieHumanNeckSource.IOutput,
    ): IAutoMovieHumanNeckConstruction.IOutput;
    /**
     * Borrow the same lower original before either consumer requests a loft.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Borrow the same lower original before either consumer requests a loft.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanHeadCanonical owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadCanonical.IPrepared.lowerSource declares the invocation boundary only; AutoMovieHumanHeadCanonical and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanHeadCanonical.IPrepared.lowerSource must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanHeadCanonical.IPrepared.lowerSource owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanHeadCanonical and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanHeadCanonical producer or caller supplying the callback owns captured state and its lifetime.
     */
    lowerSource(
      placement: IAutoMovieHumanNeckSource.IOutput,
    ): IAutoMovieViewPart;
    /**
     * Resolve the actual complete original once when its upper field is needed.
     *
     * Solves the original family's actual tape and returns its selected part/witness unchanged.
     * Full-source demand is explicit and independent of guide/lower consumers.
     * Every source failure propagates; no cached coefficient or incomplete source is returned as closed.
     * The full closure is attempted once per immutable preparation, including a failed attempt, without a raw loft; retained reads return its result or rethrow its original failure.
     * Production, original sections and raw readers borrow that identical selected part or observe the same original failure; a new input context owns a fresh attempt.
     * The result or original error and immutable source dependencies live with this one invocation, without a global failure cache.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Stage observations record actual work, excluding time spent waiting before this demand.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanHeadCanonical owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHeadCanonical.IPrepared.closed declares the invocation boundary only; AutoMovieHumanHeadCanonical and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanHeadCanonical.IPrepared.closed must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanHeadCanonical.IPrepared.closed owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanHeadCanonical and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanHeadCanonical producer or caller supplying the callback owns captured state and its lifetime.
     */
    closed(): IOutput;
  }

  /**
   * Observed outcome of this immutable family's one explicit full-closure attempt.
   *
   * Original and raw consumers observe the same family-owned attempt rather than maintaining separate retries.
   * A failed family retains its original error until that caller-owned family is released, with no global or cross-input cache.
   *
   * @evidence contracts/development/design.md#principled-representation Distinguishes an unrequested source from a successful closure and its original thrown failure; inspecting the record never requests geometry. Observed outcome of this immutable family's one explicit full-closure attempt. Alternatives are a record with state; a record with state; a record with state, error.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One discriminant carries the original unknown error only after failure, while result remains the separate successful-source observer. Also types AutoMovieHumanHeadCanonical.attempt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A failure is neither a successful partial source nor a replacement error; even undefined thrown values retain an explicit failed state. The representation is used by AutoMovieHumanHeadCanonical.attempt, AutoMovieHumanHeadCanonical.prepare, AutoMovieHumanHeadComposer.prepare for observed outcome of this immutable family's one explicit full-closure attempt.
   * @evidence contracts/development/common.md#meaningful-documentation The state belongs to one prepared immutable input/curve family; changed parametric inputs require a fresh preparation. Observed outcome of this immutable family's one explicit full-closure attempt.
   */
  export type IClosureAttempt =
    | {
        /** Closure lifecycle discriminant "unrequested"; the failed branch retains its thrown error. */
        readonly state: "unrequested";
      }
    | {
        /** Closure lifecycle discriminant "succeeded"; the failed branch retains its thrown error. */
        readonly state: "succeeded";
      }
    | {
        /** Closure lifecycle discriminant "failed"; the failed branch retains its thrown error. */
        readonly state: "failed";
        /** Original thrown failure retained after the closure attempt; no retry or conversion is implied. */
        readonly error: unknown;
      };

  /**
   * Actual canonical original and its independently named calibration stages.
   *
   * Consumers borrow this result rather than repeating calibration.
   * The owning head preparation retains the selected original's immutable dependencies.
   *
   * @evidence contracts/development/design.md#principled-representation Keeps the same source that produced the public-input tape witness. `tape`: Exact selected original and its public-input witness. `caliperMilliseconds`: Retained aggregate neck placement/original and cranial-caliper elapsed time, milliseconds. `attachmentMilliseconds`: Actual unchanged base-source and ear-datum preparation elapsed time, milliseconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Source, witness and elapsed stage observations have distinct fields. Returned by AutoMovieHumanHeadCanonical.of. Also types AutoMovieHumanHeadCanonical.completed, AutoMovieHumanHeadCanonical.closed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A source result establishes neither loft nor final merge success. Required fields are `tape`, `caliperMilliseconds`, `attachmentMilliseconds`, `tapeMilliseconds`; callers supply the complete record.
   * @evidence contracts/development/common.md#meaningful-documentation Stage times are elapsed milliseconds, not isolated CPU costs or renderer costs. Actual canonical original and its independently named calibration stages.
   */
  export interface IOutput {
    /** Exact selected original and its public-input witness. */
    tape: IAutoMovieHumanHeadTape.IResult;
    /** Retained aggregate neck placement/original and cranial-caliper elapsed time, milliseconds. */
    caliperMilliseconds: number;
    /** Actual unchanged base-source and ear-datum preparation elapsed time, milliseconds. */
    attachmentMilliseconds: number;
    /** Actual full scalar tape closure elapsed time, milliseconds. */
    tapeMilliseconds: number;
  }

  /** The places argument of AutoMovieHumanHeadCanonical.of. Calibrate the original once, preserving public guides and lower material.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Calibrate the original once, preserving public guides and lower material.
   * @evidence contracts/development/design.md#principled-representation `tragion`: Vertical tragion placement in the head's registered frame, millimetres; omission uses the resolved head layout. `ears`: Independent vertical ear placements in the head's registered frame, millimetres. `faceExponent`: Dimensionless front-face superellipse exponent; omission uses the head producer's normal section exponent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadCanonical.IOfPlaces is the canonical exchange used by AutoMovieHumanHeadCanonical.of, AutoMovieHumanHeadCanonical.prepare.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `tragion`: Vertical tragion placement in the head's registered frame, millimetres; omission uses the resolved head layout. `ears`: Independent vertical ear placements in the head's registered frame, millimetres. `faceExponent`: Dimensionless front-face superellipse exponent; omission uses the head producer's normal section exponent. `neckOriginal`: Prepared original neck layout reused by head placement; omission requests the producer's own layout.
   */
  export type IOfPlaces = {
    /** Vertical tragion placement in the head's registered frame, millimetres; omission uses the resolved head layout. */
    tragion?: number;
    /** Independent vertical ear placements in the head's registered frame, millimetres. */
    ears?: {
      /** Placement of the person's left ear in the containing record's vertical datum, millimetres. */
      left: number;
      /** Placement of the person's right ear in the containing record's vertical datum, millimetres. */
      right: number;
    };
    /** Dimensionless front-face superellipse exponent; omission uses the head producer's normal section exponent. */
    faceExponent?: number;
    /** Prepared original neck layout reused by head placement; omission requests the producer's own layout. */
    neckOriginal?: IAutoMovieHumanHeadNeckLayout.IOutput;
  };
}
