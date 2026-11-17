import type { IAutoMovieConstructionSource } from "../../../construction/IAutoMovieConstructionSource";
import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewLoft } from "../../../construction/IAutoMovieViewLoft";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadCanonical } from "./IAutoMovieHumanHeadCanonical";
import type { IAutoMovieHumanHeadDome } from "./IAutoMovieHumanHeadDome";
import type { IAutoMovieHumanHeadFeatures } from "./IAutoMovieHumanHeadFeatures";
import type { IAutoMovieHumanHeadNeckCurves } from "./IAutoMovieHumanHeadNeckCurves";
import type { IAutoMovieHumanHeadNeckLayout } from "./IAutoMovieHumanHeadNeckLayout";

/** Type contracts exchanged by AutoMovieHumanHeadComposer; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadComposer {
  /**
   * The composed head's canonical inputs, source context and raw results.
   *
   * @evidence contracts/common.md#principled-implementation One closed layout supplies all original parts; source leaves bind those exact millimetre definitions at realization.
   * @evidence contracts/common.md#clear-and-simple-design The original definition owns the source map and lazy raw supplier; source-edge and already-requested raw diagnostics remain observable without creating geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Studies remain outside the production tree, and neither raw loft nor context presence establishes final join success.
   * @evidence contracts/common.md#meaningful-documentation Names original-source lifetime, study boundary, diagnostics and the shared plan.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Raw inspection and the body realization retain the same original part dependencies.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Caller ownership includes the map, parts, raw lofts and transitive source closures; there is no global registry.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The composed head's canonical inputs, source context and raw results.
   * @evidence contracts/development/design.md#principled-representation `plan`: The exact closed layout consumed by every source builder below. `definition`: The same original definition consumed by both this tree and selected raw readers. `mass`: Explicit raw demand for the mass; observing definition.base.raw does not create it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadComposer.compose. Read by AutoMovieHumanHeadLane.vermilion, AutoMovieHumanHeadTree.of. Also types AutoMovieHumanHeadComposer.studies, AutoMovieHumanHeadLane.composed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `plan`, `definition`, `mass`, `massPart`, `massView`, `sources`, `attachments`, `neck`, `parts`, `studies`, `diagnostics`; callers supply the complete record.
   */
  export interface IOutput {
    /** The exact closed layout consumed by every source builder below. */
    plan: IAutoMovieHumanHeadLayout;

    /** The same original definition consumed by both this tree and selected raw readers. */
    definition: IDefinition;

    /** Explicit raw demand for the mass; observing definition.base.raw does not create it. */
    readonly mass: IAutoMovieViewLoft.IResult;

    /** The head mass's view part, the root of its construction tree (`AutoMovieHumanHeadTree`). */
    massPart: IAutoMovieViewPart;

    /** Explicit source leaf borrowing massPart without redeclaring its functions. */
    massView: IAutoMovieConstructionSource;

    /** Invocation-owned actual mm sources; passed unchanged to realization, without a global registry. */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;

    /** Every real regional Dome attachment attempt; a failed attempt prevents publication of this output. */
    attachments: readonly IAutoMovieHumanHeadDome.IAttempt[];

    /** Same lower-head source/course used to author the mass; null only on a retired layout without base context. */
    neck: IAutoMovieHumanHeadNeckCurves.IOutput | null;

    /** Every face original, placed; raw getters create only the requested lofts. */
    parts: IPlaced[];

    /** Independent originals outside the skin tree; each loft getter is an explicit selected raw request. */
    studies: {
      /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
      part: IAutoMovieViewPart;
      /** The same part expressed as the canonical construction view, with physical lengths in metres. */
      view: IAutoMovieConstructionView;
      /** Result of lofting this exact geometric part, including its diagnostics. */
      readonly loft: IAutoMovieViewLoft.IResult;
    }[];

    /** Canonical source-edge and already-requested raw diagnostics; this observation never lofts an unrequested part. */
    readonly diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Actual original regional definitions and every attachment outcome.
   *
   * @evidence contracts/common.md#principled-implementation Production composition and source-only observation consume the same original regional builders and actual parent map.
   * @evidence contracts/common.md#clear-and-simple-design Original definitions precede lofting; explicit failed attempts remain data and prohibit complete publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed child is replaced by geometry, and valid siblings do not imply a successful whole head.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes caller-owned original definitions, source context and source-attempt outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work compose borrows this exact definition and source map rather than preparing regional inputs again.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its caller owns all original part and parent-source dependencies and attempt records.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual original regional definitions and every attachment outcome.
   * @evidence contracts/development/design.md#principled-representation `requestScope`: Requested catalogue scope, not a certificate that all attempted sources succeeded. `base`: The identical canonical mass/neck preparation. `parts`: Actual valid regional sources in their authored order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadComposer.define. Read by AutoMovieHumanHeadComposer.compose. Also types AutoMovieHumanHeadComposer.definition, AutoMovieHumanHeadOriginalSources.empty.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `requestScope`: Requested catalogue scope, not a certificate that all attempted sources succeeded.
   */
  export interface IDefinition {
    /** Requested catalogue scope, not a certificate that all attempted sources succeeded. Partial top-level definitions cannot assemble a whole head. */
    requestScope?:
      | "unrequested"
      | "selected-top-level"
      | "selected-tape-invariant"
      | "complete-regional-catalogue";

    /** The identical canonical mass/neck preparation. */
    base: IBase;
    /** Actual valid regional sources in their authored order. */
    parts: IAutoMovieHumanHeadFeatures.IFeature[];
    /** Actual source context, including the canonical mass. */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;
    /** Every attempted real Dome, including unavailable children. */
    attachments: IAutoMovieHumanHeadDome.IAttempt[];
    /** Existing independent eye-study originals, explicitly outside the production source map/tree. */
    studies: IAutoMovieViewPart[];
    /** Raw results requested through this definition; enumeration never creates a loft. */
    lofts: ReadonlyMap<string, IAutoMovieViewLoft.IResult>;
    /**
     * Read one actual original's call-owned raw loft, without full composition.
     *
     * @evidence contracts/common.md#principled-implementation Uses the actual source from this definition; mass borrows the canonical base's same lazy result.
     * @evidence contracts/common.md#clear-and-simple-design One named supplier serves selected raw observation and complete composition.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable original is refused with its attempt cause; no replacement part or complete tree is manufactured.
     * @evidence contracts/common.md#meaningful-documentation Creates only the requested raw result, with studies separate from production topology.
     * @evidence contracts/performance.md#efficient-algorithms One engine loft per requested name, then constant-time map lookup.
     * @evidence contracts/performance.md#reuse-equivalent-work compose and selected raw readers borrow the identical raw result and original callbacks.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only this call-owned definition retains its requested results; no cross-input cache is added.
     */
    loft(name: string): IAutoMovieViewLoft.IResult;
  }

  /**
   * Canonical mass preparation, independent of regional face source success.
   *
   * @evidence contracts/common.md#principled-implementation Retains one caliper/neck family; explicit full-source demand selects its closed upper field while guide/lower consumers borrow the proven invariant originals.
   * @evidence contracts/common.md#clear-and-simple-design One preparation record precedes regional composition without a second head model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is not a fallback, proxy or successful partial head tree.
   * @evidence contracts/common.md#meaningful-documentation Fields distinguish canonical original inputs, lazy raw loft and source-edge diagnostics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work The same record is passed to composition; mass source and neck are not rebuilt.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the layout, original closures and any requested raw mass loft for its definition lifetime.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Canonical mass preparation, independent of regional face source success.
   * @evidence contracts/development/design.md#principled-representation `layout`: Public caliper/neck layout; upper fullness selection is a later explicit demand. `guides`: Actual unchanged guides and axis, with no complete fullness-source claim. `guideCurves`: Already prepared original edges; reading them does not demand upper fullness closure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadComposer.prepare. Read by AutoMovieHumanHeadComposer.define, AutoMovieHumanHeadComposer.compose, AutoMovieHumanHeadOriginalSources.create. Also types AutoMovieHumanHeadComposer.base, AutoMovieHumanHeadLane.source.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `layout`, `guides`, `guideCurves`, `preparationMilliseconds`, `closureAttempt`, `lower`, `lowerSource`, `tapeInvariant`, `calibrated`, `calibration`, `raw`, `neck`, `diagnostics`; callers supply the complete record.
   */
  export interface IBase {
    /** Public caliper/neck layout; upper fullness selection is a later explicit demand. */
    layout: IAutoMovieHumanHeadLayout;
    /** Actual unchanged guides and axis, with no complete fullness-source claim. */
    guides: IAutoMovieHumanHeadCanonical.IPrepared["guides"];
    /** Already prepared original edges; reading them does not demand upper fullness closure. */
    readonly guideCurves: IAutoMovieHumanHeadCanonical.IPrepared["curves"];
    /** Actual original neck, cranial caliper and mass/guide costs; inspecting them requests no upper closure. */
    readonly preparationMilliseconds: IAutoMovieHumanHeadCanonical.IPrepared["preparationMilliseconds"];
    /** Side-effect-free actual full-closure attempt, including its original failure. */
    readonly closureAttempt: IAutoMovieHumanHeadCanonical.IClosureAttempt;
    /** Same owner's exact lower interval supplier; it does not activate upper tape closure. */
    lower: IAutoMovieHumanHeadCanonical.IPrepared["lower"];
    /** Same lower original, available before either neck consumer lofts it. */
    lowerSource: IAutoMovieHumanHeadCanonical.IPrepared["lowerSource"];
    /** Pre-closure member and layout, exact on and below nasion (see `AutoMovieHumanHeadCanonical.IPrepared.tapeInvariant`); reading it requests no closure. */
    readonly tapeInvariant: IAutoMovieHumanHeadCanonical.IPrepared["tapeInvariant"];
    /** Whether full closure has succeeded; a retained failed attempt remains false. */
    readonly calibrated: boolean;
    /** Already completed public-input closure, or null; reading this state performs no geometry. */
    readonly calibration: IAutoMovieHumanHeadCanonical.IOutput | null;

    /**
     * Explicitly request the actual full public-input closure.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to the same canonical constraint owner used by production and preserves its selected actual source.
     * @evidence contracts/common.md#clear-and-simple-design A method owns full-source demand while layout, guides and attempt observations remain independent.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No property read invokes closure, and a failed attempt rethrows its original value without another source.
     * @evidence contracts/common.md#meaningful-documentation Separates available guides and observed completion from required public-input geometry.
     * @evidence contracts/performance.md#efficient-algorithms Performs the actual constraint once on explicit first demand.
     * @evidence contracts/performance.md#reuse-equivalent-work Subsequent production and inspection calls receive the identical canonical result or original failure.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only this invocation retains the actual selected source and attempt.
     */
    closed(): IAutoMovieHumanHeadCanonical.IOutput;
    /** Already requested raw mass, or null; this readonly observation never creates a loft. */
    readonly raw: IAutoMovieViewLoft.IResult | null;
    /**
     * Call-owned lazy raw loft of that identical source, prepared at most once.
     *
     * @evidence contracts/common.md#principled-implementation Lofts the exact retained massPart only when a raw or complete geometry consumer requests it.
     * @evidence contracts/common.md#clear-and-simple-design Explicit lazy consumption is separate from original-source admission.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It never replaces the source or reports unperformed loft admission as success.
     * @evidence contracts/common.md#meaningful-documentation The returned raw result belongs to this immutable source preparation.
     * @evidence contracts/performance.md#efficient-algorithms The first request performs one engine loft; subsequent requests return the retained result in constant time.
     * @evidence contracts/performance.md#reuse-equivalent-work Explicit raw consumers borrow the same result; ordinary source-leaf realization receives the actual part independently.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only this call-owned source closure retains a requested loft; there is no global cache.
     */
    loft(): IAutoMovieViewLoft.IResult;
    /** Same original neck family as the mass; null only without base context. */
    neck: IAutoMovieHumanHeadNeckCurves.IOutput | null;
    /** Original edge admission diagnostics only; native loft admission is deferred with loft(). */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * A placed original part, its source leaf and lazy raw demand.
   *
   * @evidence contracts/common.md#principled-implementation The leaf and explicit raw getter resolve the same retained feature part.
   * @evidence contracts/common.md#clear-and-simple-design Original input, tree key and optional raw demand remain separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled declaration replaces the actual source callbacks.
   * @evidence contracts/common.md#meaningful-documentation States each representation's production or inspection role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Inspection and realization borrow the identical original part.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The composed output owns this record and its retained source/loft dependencies.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A placed original part, its source leaf and lazy raw demand.
   * @evidence contracts/development/design.md#principled-representation `feature`: The part. `loft`: Explicit raw demand in the unchanged generating frame; reading it borrows definition.loft(name). `view`: Explicit reference to the same evaluated millimetre source in the invocation map.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadTree.join. Also types AutoMovieHumanHeadComposer.place, AutoMovieHumanHeadComposer.parts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `feature`, `loft`, `view`; callers supply the complete record.
   */
  export interface IPlaced {
    /** The part. */
    feature: IAutoMovieHumanHeadFeatures.IFeature;

    /** Explicit raw demand in the unchanged generating frame; reading it borrows definition.loft(name). */
    readonly loft: IAutoMovieViewLoft.IResult;

    /** Explicit reference to the same evaluated millimetre source in the invocation map. */
    view: IAutoMovieConstructionSource;
  }

  /**
   * Explicit selected placement laws, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Passes the actual tragion/ear-height and face-fullness laws from the lane to source authors.
   * @evidence contracts/common.md#clear-and-simple-design Three optional values keep placement separate from shape and realization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts These are generating laws, not post-fit translations or guarantees of anatomical accuracy.
   * @evidence contracts/common.md#meaningful-documentation Fields state named sites, units and callers.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The lane owns calculation of these values.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A fixed-size numeric record owns no acquired resources.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicit selected placement laws, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `neckOriginal`: Same-layout original neck preparation supplied before head construction; no parent source is acquired here. `tragion`: The tragion's height, from its drop under the vertex (`AutoMovieHumanHeadArcs.tragionDrop`). `ears`: Each auricle's top, from its height over the tragion (`AutoMovieHumanEarPlace.aboveTragion`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadComposer.prepare, AutoMovieHumanHeadComposer.define, AutoMovieHumanHeadComposer.compose. Also types AutoMovieHumanHeadLane.places.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `neckOriginal`: Same-layout original neck preparation supplied before head construction; no parent source is acquired here. `tragion`: The tragion's height, from its drop under the vertex (`AutoMovieHumanHeadArcs.tragionDrop`). `ears`: Each auricle's top, from its height over the tragion (`AutoMovieHumanEarPlace.aboveTragion`). `faceExponent`: The face plan's super-ellipse exponent (`AutoMovieHumanFacePlan.exponent`).
   */
  export interface IPlaces {
    /** Same-layout original neck preparation supplied before head construction; no parent source is acquired here. */
    neckOriginal?: IAutoMovieHumanHeadNeckLayout.IOutput;

    /** The tragion's height, from its drop under the vertex (`AutoMovieHumanHeadArcs.tragionDrop`). */
    tragion?: number;

    /** Each auricle's top, from its height over the tragion (`AutoMovieHumanEarPlace.aboveTragion`). */
    ears?: {
      /** Placement of the person's left ear in the containing record's vertical datum, millimetres. */
      left: number;
      /** Placement of the person's right ear in the containing record's vertical datum, millimetres. */
      right: number;
    };

    /** The face plan's super-ellipse exponent (`AutoMovieHumanFacePlan.exponent`). */
    faceExponent?: number;
  }
}
