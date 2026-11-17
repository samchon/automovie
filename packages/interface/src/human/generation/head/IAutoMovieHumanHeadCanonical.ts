import type { IAutoMovieViewCurves } from "../../../construction/IAutoMovieViewCurves";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanNeckConstruction } from "../IAutoMovieHumanNeckConstruction";
import type { IAutoMovieHumanNeckSource } from "../IAutoMovieHumanNeckSource";
import type { IAutoMovieHumanHeadNeckLayout } from "./IAutoMovieHumanHeadNeckLayout";
import type { IAutoMovieHumanHeadTape } from "./IAutoMovieHumanHeadTape";

/** Type contracts exchanged by AutoMovieHumanHeadCanonical; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadCanonical {
  /**
   * One original family, with independent guides/lower material and a lazy upper closure.
   * @evidence contracts/common.md#principled-implementation The caliper layout and exact lower interval belong to the same original family whose selected full source closes the public tape.
   * @evidence contracts/common.md#clear-and-simple-design Guide-only records cannot masquerade as a complete section source; explicit full closure returns the selected actual part.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No second completed head, old success, proxy final source or silent failed solve is published.
   * @evidence contracts/common.md#meaningful-documentation The tape family preserves every guide and the complete source below nasion; lower material does not require the upper numerical choice.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data schedules no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Both consumers retain this invocation's one generating family and original axis.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the original base, one requested lower adapter and one requested closed source.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One original family, with independent guides/lower material and a lazy upper closure.
   * @evidence contracts/development/design.md#principled-representation `layout`: Public caliper/neck layout before the upper fullness parameter is selected. `preparationMilliseconds`: Actual eager stages; reading this does not request the upper closure or a loft. `guides`: Actual unchanged source guides and axis; no fullness or complete geometry is claimed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadCanonical.prepare. Also types AutoMovieHumanHeadComposer.canonical.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `layout`, `preparationMilliseconds`, `guides`, `curves`, `tapeInvariant`, `closureAttempt`, `result`; callers supply the complete record.
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
     * @evidence contracts/common.md#principled-implementation Existing restriction reads the unchanged family's original values, parameter jets and axis below nasion.
     * @evidence contracts/common.md#clear-and-simple-design The output is an explicit regular adapter interval, never a second full head.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts An upper request or a different placement context is rejected; no old source or missing derivative is substituted.
     * @evidence contracts/common.md#meaningful-documentation Placement retains its actual calibration-mm domain; the independent upper tape parameter is not read.
     * @evidence contracts/performance.md#efficient-algorithms One requested interval scalar restriction and engine loft, then constant-time reuse.
     * @evidence contracts/performance.md#reuse-equivalent-work Returns the same adapter for the same immutable placement and generating family.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only one placement identity and its actual adapter survive with this preparation.
     */
    lower(
      placement: IAutoMovieHumanNeckSource.IOutput,
    ): IAutoMovieHumanNeckConstruction.IOutput;
    /** Borrow the same lower original before either consumer requests a loft. */
    lowerSource(
      placement: IAutoMovieHumanNeckSource.IOutput,
    ): IAutoMovieViewPart;
    /**
     * Resolve the actual complete original once when its upper field is needed.
     * @evidence contracts/common.md#principled-implementation Solves the original family's actual tape and returns its selected part/witness unchanged.
     * @evidence contracts/common.md#clear-and-simple-design Full-source demand is explicit and independent of guide/lower consumers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Every source failure propagates; no cached coefficient or incomplete source is returned as closed.
     * @evidence contracts/common.md#meaningful-documentation Stage observations record actual work, excluding time spent waiting before this demand.
     * @evidence contracts/performance.md#efficient-algorithms The full closure is attempted once per immutable preparation, including a failed attempt, without a raw loft; retained reads return its result or rethrow its original failure.
     * @evidence contracts/performance.md#reuse-equivalent-work Production, original sections and raw readers borrow that identical selected part or observe the same original failure; a new input context owns a fresh attempt.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The result or original error and immutable source dependencies live with this one invocation, without a global failure cache.
     */
    closed(): IOutput;
  }

  /**
   * Observed outcome of this immutable family's one explicit full-closure attempt.
   *
   * @evidence contracts/common.md#principled-implementation Distinguishes an unrequested source from a successful closure and its original thrown failure; inspecting the record never requests geometry.
   * @evidence contracts/common.md#clear-and-simple-design One discriminant carries the original unknown error only after failure, while result remains the separate successful-source observer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failure is neither a successful partial source nor a replacement error; even undefined thrown values retain an explicit failed state.
   * @evidence contracts/common.md#meaningful-documentation The state belongs to one prepared immutable input/curve family; changed parametric inputs require a fresh preparation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This readonly union schedules no computation.
   * @evidence contracts/performance.md#reuse-equivalent-work Original and raw consumers observe the same family-owned attempt rather than maintaining separate retries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A failed family retains its original error until that caller-owned family is released, with no global or cross-input cache.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Observed outcome of this immutable family's one explicit full-closure attempt.
   * @evidence contracts/development/design.md#principled-representation Observed outcome of this immutable family's one explicit full-closure attempt. Alternatives are a record with state; a record with state; a record with state, error.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHeadCanonical.attempt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadCanonical.attempt, AutoMovieHumanHeadCanonical.prepare, AutoMovieHumanHeadComposer.prepare for observed outcome of this immutable family's one explicit full-closure attempt.
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
   * @evidence contracts/common.md#principled-implementation Keeps the same source that produced the public-input tape witness.
   * @evidence contracts/common.md#clear-and-simple-design Source, witness and elapsed stage observations have distinct fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A source result establishes neither loft nor final merge success.
   * @evidence contracts/common.md#meaningful-documentation Stage times are elapsed milliseconds, not isolated CPU costs or renderer costs.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumers borrow this result rather than repeating calibration.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The owning head preparation retains the selected original's immutable dependencies.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual canonical original and its independently named calibration stages.
   * @evidence contracts/development/design.md#principled-representation `tape`: Exact selected original and its public-input witness. `caliperMilliseconds`: Retained aggregate neck placement/original and cranial-caliper elapsed time, milliseconds. `attachmentMilliseconds`: Actual unchanged base-source and ear-datum preparation elapsed time, milliseconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadCanonical.of. Also types AutoMovieHumanHeadCanonical.completed, AutoMovieHumanHeadCanonical.closed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `tape`, `caliperMilliseconds`, `attachmentMilliseconds`, `tapeMilliseconds`; callers supply the complete record.
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
