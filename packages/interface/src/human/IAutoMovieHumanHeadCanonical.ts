import type { IAutoMovieViewCurves } from "../construction/IAutoMovieViewCurves";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanNeckConstruction } from "./IAutoMovieHumanNeckConstruction";
import type { IAutoMovieHumanNeckSource } from "./IAutoMovieHumanNeckSource";
import type { IAutoMovieHumanHeadNeckLayout } from "./IAutoMovieHumanHeadNeckLayout";
import type { IAutoMovieHumanHeadTape } from "./IAutoMovieHumanHeadTape";

/**
 * Type contracts exchanged by AutoMovieHumanHeadCanonical; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadCanonical {
  /**
   * One original family, with independent guides/lower material and a lazy
   * upper closure.
   *
   * Both consumers retain this invocation's one generating family and original
   * axis. Retains only the original base, one requested lower adapter and one
   * requested closed source.
   */
  export interface IPrepared {
    /**
     * Public caliper/neck layout before the upper fullness parameter is
     * selected.
     */
    layout: IAutoMovieHumanHeadLayout;
    /**
     * Actual eager stages; reading this does not request the upper closure or a
     * loft.
     */
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
    /**
     * Actual unchanged source guides and axis; no fullness or complete geometry
     * is claimed.
     */
    guides: Pick<
      IAutoMovieViewPart,
      "name" | "axis" | "stations" | "front" | "side" | "pole"
    >;
    /** Prepared original edges, independent of section/fullness admission. */
    readonly curves: IAutoMovieViewCurves.IResult;
    /**
     * The family's pre-closure member and its layout, exact on and below
     * nasion.
     *
     * The upper tape closure varies only `cranialTapePower`. In
     * `AutoMovieHumanHeadMassSource.prepare` that power enters two scalar
     * outlines and nothing else: the fullness shoulder, through its knots at
     * nasion (`vault`), frontotemporale (`cranial`) and the last station, and
     * the face departure, through its frontotemporale knot (`frontal -
     * cranial`). The front, back and side support outlines, the axis, the
     * stations and the pole are built once before the power is read. Every
     * shoulder and departure knot carries explicit zero first and second jets,
     * so `AutoMovieEngineViewOutline` interpolates each knot span by its own quintic
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
    readonly tapeInvariant: IPreparedTapeInvariant;

    /**
     * Actual attempt snapshot; reading it requests no source and preserves an
     * original failure.
     */
    readonly closureAttempt: IClosureAttempt;
    /** Already resolved full closure, or null; reading this never computes it. */
    readonly result: IOutput | null;
    /**
     * Borrow the exact lower original interval once, without the upper solve.
     *
     * Existing restriction reads the unchanged family's original values,
     * parameter jets and axis below nasion. The output is an explicit regular
     * adapter interval, never a second full head. An upper request or a
     * different placement context is rejected; no old source or missing
     * derivative is substituted. One requested interval scalar restriction and
     * engine loft, then constant-time reuse. Returns the same adapter for the
     * same immutable placement and generating family. Only one placement
     * identity and its actual adapter survive with this preparation.
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
     *
     * Solves the original family's actual tape and returns its selected
     * part/witness unchanged. Full-source demand is explicit and independent of
     * guide/lower consumers. Every source failure propagates; no cached
     * coefficient or incomplete source is returned as closed. The full closure
     * is attempted once per immutable preparation, including a failed attempt,
     * without a raw loft; retained reads return its result or rethrow its
     * original failure. Production, original sections and raw readers borrow
     * that identical selected part or observe the same original failure; a new
     * input context owns a fresh attempt. The result or original error and
     * immutable source dependencies live with this one invocation, without a
     * global failure cache.
     */
    closed(): IOutput;
  }

  /** The tapeInvariant object of {@link IPrepared}. */
  export type IPreparedTapeInvariant = {
    /**
     * The pre-closure layout, equal to the closed plan except
     * `cranialTapePower`.
     */
    plan: IAutoMovieHumanHeadLayout;

    /** The pre-closure mass, exact on and below nasion only. */
    part: IAutoMovieViewPart;
  };

  /**
   * Observed outcome of this immutable family's one explicit full-closure
   * attempt.
   *
   * Original and raw consumers observe the same family-owned attempt rather
   * than maintaining separate retries. A failed family retains its original
   * error until that caller-owned family is released, with no global or
   * cross-input cache.
   */
  export type IClosureAttempt =
    | {
        /**
         * Closure lifecycle discriminant "unrequested"; the failed branch
         * retains its thrown error.
         */
        readonly state: "unrequested";
      }
    | {
        /**
         * Closure lifecycle discriminant "succeeded"; the failed branch retains
         * its thrown error.
         */
        readonly state: "succeeded";
      }
    | {
        /**
         * Closure lifecycle discriminant "failed"; the failed branch retains
         * its thrown error.
         */
        readonly state: "failed";
        /**
         * Original thrown failure retained after the closure attempt; no retry
         * or conversion is implied.
         */
        readonly error: unknown;
      };

  /**
   * Actual canonical original and its independently named calibration stages.
   *
   * Consumers borrow this result rather than repeating calibration. The owning
   * head preparation retains the selected original's immutable dependencies.
   */
  export interface IOutput {
    /** Exact selected original and its public-input witness. */
    tape: IAutoMovieHumanHeadTape.IResult;
    /**
     * Retained aggregate neck placement/original and cranial-caliper elapsed
     * time, milliseconds.
     */
    caliperMilliseconds: number;
    /**
     * Actual unchanged base-source and ear-datum preparation elapsed time,
     * milliseconds.
     */
    attachmentMilliseconds: number;
    /** Actual full scalar tape closure elapsed time, milliseconds. */
    tapeMilliseconds: number;
  }

  /**
   * The places argument of AutoMovieHumanHeadCanonical.of. Calibrate the
   * original once, preserving public guides and lower material.
   */
  export type IOfPlaces = {
    /**
     * Vertical tragion placement in the head's registered frame, millimetres;
     * omission uses the resolved head layout.
     */
    tragion?: number;
    /**
     * Independent vertical ear placements in the head's registered frame,
     * millimetres.
     */
    ears?: IOfPlacesEars;
    /**
     * Dimensionless front-face superellipse exponent; omission uses the head
     * producer's normal section exponent.
     */
    faceExponent?: number;
    /**
     * Prepared original neck layout reused by head placement; omission requests
     * the producer's own layout.
     */
    neckOriginal?: IAutoMovieHumanHeadNeckLayout.IOutput;
  };

  /** The ears object of {@link IOfPlaces}. */
  export type IOfPlacesEars = {
    /**
     * Placement of the person's left ear in the containing record's vertical
     * datum, millimetres.
     */
    left: number;
    /**
     * Placement of the person's right ear in the containing record's vertical
     * datum, millimetres.
     */
    right: number;
  };
}
