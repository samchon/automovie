import type { IAutoMovieConstructionSource } from "../../../construction/IAutoMovieConstructionSource";
import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieLoftSectionConnect } from "../../../construction/IAutoMovieLoftSectionConnect";
import type { IAutoMovieViewLoft } from "../../../construction/IAutoMovieViewLoft";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadCanonical } from "./IAutoMovieHumanHeadCanonical";
import type { IAutoMovieHumanHeadDome } from "./IAutoMovieHumanHeadDome";
import type { IAutoMovieHumanHeadFeatures } from "./IAutoMovieHumanHeadFeatures";
import type { IAutoMovieHumanHeadNeckCurves } from "./IAutoMovieHumanHeadNeckCurves";
import type { IAutoMovieHumanHeadNeckLayout } from "./IAutoMovieHumanHeadNeckLayout";

/**
 * Call-owned head source definitions, requested raw results, regional attempts
 * and anatomical placement inputs. Runtime construction and admission remain
 * with AutoMovieHumanHeadComposer in Human.
 */
export namespace IAutoMovieHumanHeadComposer {
  /**
   * The composed head's canonical inputs, source context and raw results.
   *
   * Raw inspection and the body realization retain the same original part
   * dependencies. Caller ownership includes the map, parts, raw lofts and
   * transitive source closures; there is no global registry.
   */
  export interface IOutput {
    /** The exact closed layout consumed by every source builder below. */
    plan: IAutoMovieHumanHeadLayout;

    /**
     * The same original definition consumed by both this tree and selected raw
     * readers.
     */
    definition: IDefinition;

    /** Explicit raw demand for the mass used in this composition. */
    readonly mass: IAutoMovieViewLoft.IResult;

    /**
     * The head mass's view part, the root of its construction tree
     * (`AutoMovieHumanHeadTree`).
     */
    massPart: IAutoMovieViewPart;

    /**
     * Explicit source leaf borrowing massPart without redeclaring its
     * functions.
     */
    massView: IAutoMovieConstructionSource;

    /**
     * Invocation-owned actual mm sources; passed unchanged to realization,
     * without a global registry.
     */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;

    /**
     * Every real regional Dome attachment attempt; a failed attempt prevents
     * publication of this output.
     */
    attachments: readonly IAutoMovieHumanHeadDome.IAttempt[];

    /**
     * Same lower-head source/course used to author the mass; null only on a
     * retired layout without base context.
     */
    neck: IAutoMovieHumanHeadNeckCurves.IOutput | null;

    /** Every face original, placed; raw getters create only the requested lofts. */
    parts: IPlaced[];

    /**
     * Independent originals outside the skin tree; each loft getter is an
     * explicit selected raw request.
     */
    studies: {
      /**
       * Geometric part with its original axis and section laws; its declared
       * source frame and units apply.
       */
      part: IAutoMovieViewPart;
      /**
       * The same part expressed as the canonical construction view, with
       * physical lengths in metres.
       */
      view: IAutoMovieConstructionView;
      /** Result of lofting this exact geometric part, including its diagnostics. */
      readonly loft: IAutoMovieViewLoft.IResult;
    }[];

    /** Canonical source-edge diagnostics, independent of raw loft selection. */
    readonly diagnostics: IAutoMovieLoftContract.IDiagnostic[];

    /**
     * Prepare only the named raw originals and return their diagnostics. The
     * composed mass owns its lip contact field.
     */
    prepareRaw(names: readonly string[]): IRaw;
  }

  /** The results and diagnostics of one explicitly selected raw request. */
  export interface IRaw {
    /** Actual loft results by selected original name, in request order. */
    readonly lofts: ReadonlyMap<string, IAutoMovieViewLoft.IResult>;

    /** Diagnostics from the same selected results, in request order. */
    readonly diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Actual original regional definitions and every attachment outcome.
   *
   * Compose borrows this exact definition and source map rather than preparing
   * regional inputs again. Its caller owns all original part and parent-source
   * dependencies and attempt records.
   */
  export interface IDefinition {
    /**
     * Requested catalogue scope, not a certificate that all attempted sources
     * succeeded. Partial top-level definitions cannot assemble a whole head.
     */
    requestScope:
      | "unrequested"
      | "selected-top-level"
      | "selected-tape-invariant"
      | "complete-regional-catalogue";

    /** The identical canonical mass/neck preparation. */
    base: IBase;
    /** The full closure selected by this definition, if its scope requires one. */
    readonly closureAttempt: IAutoMovieHumanHeadCanonical.IClosureAttempt;
    /** Actual valid regional sources in their authored order. */
    parts: IAutoMovieHumanHeadFeatures.IFeature[];
    /** Actual source context, including the canonical mass. */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;
    /** Every attempted real Dome, including unavailable children. */
    attachments: IAutoMovieHumanHeadDome.IAttempt[];
    /**
     * Existing independent eye-study originals, explicitly outside the
     * production source map/tree.
     */
    studies: IAutoMovieViewPart[];
    /**
     * Loft exactly the requested names once and return their raw results and
     * diagnostics.
     */
    prepareRaw(names: readonly string[]): IRaw;
    /**
     * Read one actual original's call-owned raw loft, without full composition.
     *
     * Uses the actual source from this definition, including its selected
     * canonical mass. One named supplier serves selected raw observation and
     * complete composition. An unavailable original is refused with its attempt
     * cause; no replacement part or complete tree is manufactured. Resolving an
     * original reads the source map or its independent studies before lofting.
     * Callers share multiple raw outputs through prepareRaw.
     */
    loft(name: string): IAutoMovieViewLoft.IResult;
  }

  /**
   * Canonical mass preparation, independent of regional face source success.
   *
   * The same record is passed to composition; mass source and neck are not
   * rebuilt. The caller owns the layout, original closures and any requested
   * raw mass loft for its definition lifetime.
   */
  export interface IBase {
    /**
     * Public caliper/neck layout; upper fullness selection is a later explicit
     * demand.
     */
    layout: IAutoMovieHumanHeadLayout;
    /** Actual unchanged guides and axis, with no complete fullness-source claim. */
    guides: IAutoMovieHumanHeadCanonical.IPrepared["guides"];
    /**
     * Already prepared original edges; reading them does not demand upper
     * fullness closure.
     */
    readonly guideCurves: IAutoMovieHumanHeadCanonical.IPrepared["curves"];
    /**
     * Actual original neck, cranial caliper and mass/guide costs; inspecting
     * them requests no upper closure.
     */
    readonly preparationMilliseconds: IAutoMovieHumanHeadCanonical.IPrepared["preparationMilliseconds"];
    /**
     * Perform the explicit full-closure request and return the selected member
     * or original failure.
     */
    attemptClosure: IAutoMovieHumanHeadCanonical.IPrepared["attemptClosure"];
    /**
     * Same owner's exact lower interval supplier; it does not activate upper
     * tape closure.
     */
    lower: IAutoMovieHumanHeadCanonical.IPrepared["lower"];
    /** Same lower original, available before either neck consumer lofts it. */
    lowerSource: IAutoMovieHumanHeadCanonical.IPrepared["lowerSource"];
    /**
     * Pre-closure member and layout, exact on and below nasion (see
     * `AutoMovieHumanHeadCanonical.IPrepared.tapeInvariant`); reading it
     * requests no closure.
     */
    readonly tapeInvariant: IAutoMovieHumanHeadCanonical.IPrepared["tapeInvariant"];
    /**
     * Explicitly request the actual full public-input closure.
     *
     * Delegates to the same canonical constraint owner used by production and
     * preserves its selected actual source. A method owns full-source demand
     * while layout, guides and attempt observations remain independent. A
     * failed attempt throws its original value. Pass the selected output
     * directly when production and inspection share one request.
     */
    closed(): IAutoMovieHumanHeadCanonical.IOutput;
    /**
     * Loft the selected canonical mass for a raw request. Supply an existing
     * closure when the request already owns one.
     */
    loft(
      closure?: IAutoMovieHumanHeadCanonical.IOutput,
    ): IAutoMovieViewLoft.IResult;
    /** Same original neck family as the mass; null only without base context. */
    neck: IAutoMovieHumanHeadNeckCurves.IOutput | null;
    /**
     * Original edge admission diagnostics only; native loft admission is
     * deferred with loft().
     */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * A placed original part, its source leaf and lazy raw demand.
   *
   * Inspection and realization borrow the identical original part. The composed
   * output owns this record and its retained source/loft dependencies.
   */
  export interface IPlaced {
    /** The part. */
    feature: IAutoMovieHumanHeadFeatures.IFeature;

    /**
     * Exact section owner when this original contributes to its parent's
     * analytic skin.
     */
    sectionOwner?: IAutoMovieLoftSectionConnect.IOriginal;

    /**
     * Explicit raw demand in the unchanged generating frame; reading it borrows
     * definition.loft(name).
     */
    readonly loft: IAutoMovieViewLoft.IResult;

    /**
     * Explicit reference to the same evaluated millimetre source in the
     * invocation map.
     */
    view: IAutoMovieConstructionSource;
  }

  /** Explicit selected placement laws, calibration mm. */
  export interface IPlaces {
    /**
     * Same-layout original neck preparation supplied before head construction;
     * no parent source is acquired here.
     */
    neckOriginal?: IAutoMovieHumanHeadNeckLayout.IOutput;

    /**
     * The tragion's height, from its drop under the vertex
     * (`AutoMovieHumanHeadArcs.tragionDrop`).
     */
    tragion?: number;

    /**
     * Each auricle's top, from its height over the tragion
     * (`AutoMovieHumanEarPlace.aboveTragion`).
     */
    ears?: {
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

    /**
     * The face plan's super-ellipse exponent
     * (`AutoMovieHumanFacePlan.exponent`).
     */
    faceExponent?: number;
  }
}
