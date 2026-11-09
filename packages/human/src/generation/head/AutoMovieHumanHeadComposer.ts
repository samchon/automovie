import {
  type AutoMovieLoftContract,
  AutoMovieViewLoft,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionSource,
  IAutoMovieConstructionView,
} from "@automovie/interface";

import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadCanonical } from "./AutoMovieHumanHeadCanonical";
import type { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import type { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import type { AutoMovieHumanHeadNeckCurves } from "./AutoMovieHumanHeadNeckCurves";
import type { AutoMovieHumanHeadNeckLayout } from "./AutoMovieHumanHeadNeckLayout";
import { AutoMovieHumanHeadOriginalSources } from "./AutoMovieHumanHeadOriginalSources";
import { AutoMovieHumanHeadTree } from "./AutoMovieHumanHeadTree";

/**
 * The head subtree's parts placed: the head mass authored from its views
 * (`AutoMovieHumanHeadMassPart`), and every face part drawn from its own
 * (`AutoMovieHumanHeadFeatures` and kin), each in the anatomical frame its
 * own generating curves define. The joins are not made here: the
 * construction tree (`AutoMovieHumanHeadTree`) names each merge and diff,
 * and the engine realizes them (`realizeAutoMovieConstruction`). A join's
 * search may locate an intersection, but cannot move a whole anatomical
 * part or redefine an independently supplied distance.
 *
 * @evidence contracts/common.md#principled-implementation Composes parts already placed by their generating anatomical frames; a parent's realized skin never supplies a compensating translation.
 * @evidence contracts/common.md#clear-and-simple-design Owns part ordering, original millimetre sources and raw loft results; explicit source leaves borrow those same parts and the tree owns joins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not move a part onto another surface to conceal incompatible landmarks or a failed intersection.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes anatomical placement from intersection search and states which owner constructs each representation.
 * @evidence contracts/performance.md#efficient-algorithms Bounded neck scalar solves and two bare caliper basis preparations precede original authoring. Selected raw requests create at most one loft per named part; tree authoring creates none.
 * @evidence contracts/performance.md#reuse-equivalent-work Raw inspection and production realization borrow each identical original part, including custom axis callbacks, without a declaration roundtrip or second unit conversion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned source map, original parts and raw lofts; their immutable dependencies share that lifetime, with no global or cross-input cache.
 */
export namespace AutoMovieHumanHeadComposer {
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
   */
  export interface IBase {
    /** Public caliper/neck layout; upper fullness selection is a later explicit demand. */
    layout: IAutoMovieHumanHeadLayout;
    /** Actual unchanged guides and axis, with no complete fullness-source claim. */
    guides: AutoMovieHumanHeadCanonical.IPrepared["guides"];
    /** Already prepared original edges; reading them does not demand upper fullness closure. */
    readonly guideCurves: AutoMovieHumanHeadCanonical.IPrepared["curves"];
    /** Actual original neck, cranial caliper and mass/guide costs; inspecting them requests no upper closure. */
    readonly preparationMilliseconds: AutoMovieHumanHeadCanonical.IPrepared["preparationMilliseconds"];
    /** Side-effect-free actual full-closure attempt, including its original failure. */
    readonly closureAttempt: AutoMovieHumanHeadCanonical.IClosureAttempt;
    /** Same owner's exact lower interval supplier; it does not activate upper tape closure. */
    lower: AutoMovieHumanHeadCanonical.IPrepared["lower"];
    /** Same lower original, available before either neck consumer lofts it. */
    lowerSource: AutoMovieHumanHeadCanonical.IPrepared["lowerSource"];
    /** Pre-closure member and layout, exact on and below nasion (see `AutoMovieHumanHeadCanonical.IPrepared.tapeInvariant`); reading it requests no closure. */
    readonly tapeInvariant: AutoMovieHumanHeadCanonical.IPrepared["tapeInvariant"];
    /** Whether full closure has succeeded; a retained failed attempt remains false. */
    readonly calibrated: boolean;
    /** Already completed public-input closure, or null; reading this state performs no geometry. */
    readonly calibration: AutoMovieHumanHeadCanonical.IOutput | null;

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
    closed(): AutoMovieHumanHeadCanonical.IOutput;
    /** Already requested raw mass, or null; this readonly observation never creates a loft. */
    readonly raw: AutoMovieViewLoft.IResult | null;
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
    loft(): AutoMovieViewLoft.IResult;
    /** Same original neck family as the mass; null only without base context. */
    neck: AutoMovieHumanHeadNeckCurves.IOutput | null;
    /** Original edge admission diagnostics only; native loft admission is deferred with loft(). */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
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
    parts: AutoMovieHumanHeadFeatures.IFeature[];
    /** Actual source context, including the canonical mass. */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;
    /** Every attempted real Dome, including unavailable children. */
    attachments: AutoMovieHumanHeadDome.IAttempt[];
    /** Existing independent eye-study originals, explicitly outside the production source map/tree. */
    studies: IAutoMovieViewPart[];
    /** Raw results requested through this definition; enumeration never creates a loft. */
    lofts: ReadonlyMap<string, AutoMovieViewLoft.IResult>;
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
    loft(name: string): AutoMovieViewLoft.IResult;
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
   */
  export interface IPlaced {
    /** The part. */
    feature: AutoMovieHumanHeadFeatures.IFeature;

    /** Explicit raw demand in the unchanged generating frame; reading it borrows definition.loft(name). */
    readonly loft: AutoMovieViewLoft.IResult;

    /** Explicit reference to the same evaluated millimetre source in the invocation map. */
    view: IAutoMovieConstructionSource;
  }

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
   */
  export interface IOutput {
    /** The exact closed layout consumed by every source builder below. */
    plan: IAutoMovieHumanHeadLayout;

    /** The same original definition consumed by both this tree and selected raw readers. */
    definition: IDefinition;

    /** Explicit raw demand for the mass; observing definition.base.raw does not create it. */
    readonly mass: AutoMovieViewLoft.IResult;

    /** The head mass's view part, the root of its construction tree (`AutoMovieHumanHeadTree`). */
    massPart: IAutoMovieViewPart;

    /** Explicit source leaf borrowing massPart without redeclaring its functions. */
    massView: IAutoMovieConstructionSource;

    /** Invocation-owned actual mm sources; passed unchanged to realization, without a global registry. */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;

    /** Every real regional Dome attachment attempt; a failed attempt prevents publication of this output. */
    attachments: readonly AutoMovieHumanHeadDome.IAttempt[];

    /** Same lower-head source/course used to author the mass; null only on a retired layout without base context. */
    neck: AutoMovieHumanHeadNeckCurves.IOutput | null;

    /** Every face original, placed; raw getters create only the requested lofts. */
    parts: IPlaced[];

    /** Independent originals outside the skin tree; each loft getter is an explicit selected raw request. */
    studies: {
      part: IAutoMovieViewPart;
      view: IAutoMovieConstructionView;
      readonly loft: AutoMovieViewLoft.IResult;
    }[];

    /** Canonical source-edge and already-requested raw diagnostics; this observation never lofts an unrequested part. */
    readonly diagnostics: AutoMovieLoftContract.IDiagnostic[];
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
   */
  export interface IPlaces {
    /** Same-layout original neck preparation supplied before head construction; no parent source is acquired here. */
    neckOriginal?: AutoMovieHumanHeadNeckLayout.IOutput;

    /** The tragion's height, from its drop under the vertex (`AutoMovieHumanHeadArcs.tragionDrop`). */
    tragion?: number;

    /** Each auricle's top, from its height over the tragion (`AutoMovieHumanEarPlace.aboveTragion`). */
    ears?: { left: number; right: number };

    /** The face plan's super-ellipse exponent (`AutoMovieHumanFacePlan.exponent`). */
    faceExponent?: number;
  }

  /**
   * Prepare the canonical mass and neck before any regional source is requested.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same neck law, selected tragion, caliper closure and mass source as full composition.
   * @evidence contracts/common.md#clear-and-simple-design Separates canonical material preparation from optional regional authoring.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A later regional failure cannot create a substitute mass, and this stage claims no completed head tree.
   * @evidence contracts/common.md#meaningful-documentation Input layout and optional original placement laws retain calibration-mm meanings.
   * @evidence contracts/performance.md#efficient-algorithms Caliper and guide preparation run eagerly; the upper tape solve, lower adapter loft and full raw loft run only at their respective explicit demands.
   * @evidence contracts/performance.md#reuse-equivalent-work Original consumers and tree authoring borrow this source directly; selected raw consumers request its single call-owned lazy loft without rebuilding mass or neck.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the original source, closed plan and lazy closure; a requested loft is retained only by that same preparation, without a global cache.
   */
  export function prepare(
    skeleton: IAutoMovieHumanHeadLayout,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    neckBase?: number,
    places?: IPlaces,
  ): IBase {
    const canonical: AutoMovieHumanHeadCanonical.IPrepared =
      AutoMovieHumanHeadCanonical.prepare(skeleton, neckBase, ears, places);
    let mass: AutoMovieViewLoft.IResult | undefined;
    const loft: () => AutoMovieViewLoft.IResult =
      (): AutoMovieViewLoft.IResult => {
        if (mass === undefined)
          mass = AutoMovieViewLoft.create(canonical.closed().tape.part);
        return mass;
      };
    return {
      layout: canonical.layout,
      guides: canonical.guides,
      guideCurves: canonical.curves,
      preparationMilliseconds: canonical.preparationMilliseconds,
      lower: canonical.lower,
      lowerSource: canonical.lowerSource,
      tapeInvariant: canonical.tapeInvariant,
      loft,
      neck: canonical.layout.neck.curves ?? null,
      diagnostics: canonical.curves.diagnostics,
      get closureAttempt(): AutoMovieHumanHeadCanonical.IClosureAttempt {
        return canonical.closureAttempt;
      },
      get calibrated(): boolean {
        return canonical.result !== null;
      },
      get calibration(): AutoMovieHumanHeadCanonical.IOutput | null {
        return canonical.result;
      },
      closed: canonical.closed,
      /** Observe only this preparation's existing raw result, without preparing one. */
      get raw(): AutoMovieViewLoft.IResult | null {
        return mass ?? null;
      },
    };
  }

  /**
   * Author actual regional originals and collect every Dome before lofting.
   *
   * @evidence contracts/common.md#principled-implementation Each original builder receives the same canonical mass and actual outer-parent sources; all Dome outcomes use the one regional attempt owner.
   * @evidence contracts/common.md#clear-and-simple-design One original-definition stage supplies both source-only inspection and complete composition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed sources remain explicit attempts and produce no substitute geometry or successful head tree.
   * @evidence contracts/common.md#meaningful-documentation The returned source context contains actual mm inputs, and its valid siblings do not override failed premises.
   * @evidence contracts/performance.md#efficient-algorithms Each regional source is authored once; this stage creates no regional loft, Boolean or whole figure.
   * @evidence contracts/performance.md#reuse-equivalent-work The complete composer borrows this identical part list and source map, including all original callback dependencies.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the definitions, context and attempt records; no global source registry is introduced.
   */
  export function define(
    base: IBase,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    places?: IPlaces,
  ): IDefinition {
    return AutoMovieHumanHeadOriginalSources.create(
      base,
      ears,
      places,
    ).request();
  }

  /**
   * Compose the head.
   *
   * @param skeleton The landmark skeleton, the vault exponent solved.
   * @param ears The two auricles' inputs, world mm.
   * @param neckBase The original neck scaffold's bottom mean, calibration mm, locating an internal body overlap; absent, the layout's top mean. This is not a named base-tape point.
   * @param places Heights the published laws give, calibration mm; absent, the skeleton's own.
   *
   * @evidence contracts/common.md#principled-implementation Retains every authored millimetre part unchanged for both its raw loft and invocation-bound production leaf; arbitrary original frame/scalar callbacks are not converted to sampled declarations.
   * @evidence contracts/common.md#clear-and-simple-design A mass and an ordered list of features become one output record; joins remain in the tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing intersection remains a tree diagnostic; a parent-foot translation cannot hide or change it.
   * @evidence contracts/common.md#meaningful-documentation Defines the input layout, optional published places and ownership of placement versus joins.
   * @evidence contracts/performance.md#efficient-algorithms Tree authoring creates original leaves and getter records only. Explicit raw requests create at most one result per selected name; reading diagnostics enumerates only already-performed admissions.
   * @evidence contracts/performance.md#reuse-equivalent-work Parents, children and selected raw readers borrow the same actual definition and source map; source-leaf realization never requires a preloft or sampled callback.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the original definition, parts and any explicitly requested raw results; immutable dependencies share that lifetime without a global registry.
   */
  export function compose(
    skeleton: IAutoMovieHumanHeadLayout,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    neckBase?: number,
    places?: IPlaces,
    prepared?: IBase,
    originals?: IDefinition,
  ): IOutput {
    // A selected definition, and one authored on the pre-closure host whose
    // mass is exact only below nasion, cannot stand in for the closed head.
    if (
      originals?.requestScope === "selected-top-level" ||
      originals?.requestScope === "selected-tape-invariant" ||
      originals?.requestScope === "unrequested"
    )
      throw new Error(
        "An unrequested or selected original definition cannot assemble a complete head",
      );
    const base: IBase =
      originals?.base ?? prepared ?? prepare(skeleton, ears, neckBase, places);
    const {
      plan,
      part: massPart,
    }: AutoMovieHumanHeadCanonical.IOutput["tape"] = base.closed().tape;
    const definition: IDefinition = originals ?? define(base, ears, places);
    const attachments: AutoMovieHumanHeadDome.IAttempt[] =
      definition.attachments;

    // Parents precede their children, but never relocate their geometry.
    // The supplied anatomy owns each frame; intersection and blend failures
    // are the tree's observations of those unchanged curves. A failed
    // regional attachment authors no part, so the head is composed without
    // it; only a head whose every attachment fails is refused.
    const failures: AutoMovieHumanHeadDome.IAttempt[] = attachments.filter(
      (attempt: AutoMovieHumanHeadDome.IAttempt): boolean =>
        attempt.error !== null,
    );
    if (failures.length > 0 && failures.length === attachments.length)
      throw new Error(
        `Head original attachment failures: ${JSON.stringify(
          attachments.map(
            (attempt: AutoMovieHumanHeadDome.IAttempt): object => {
              const owner: IAutoMovieViewPart | null = attempt.parentSource;
              const domain: [number, number] | null = attempt.domain;
              return {
                name: attempt.name,
                parent: attempt.parent,
                domain,
                base: attempt.base,
                point: attempt.point,
                definition: attempt.definition,
                endpointPlanes:
                  owner === null || domain === null
                    ? null
                    : domain.map(
                        (
                          station: number,
                        ): ReturnType<IAutoMovieViewPart["axis"]["at"]> =>
                          owner.axis.at(station),
                      ),
                station: attempt.attachment?.station ?? null,
                frame: attempt.attachment?.frame ?? null,
                error: attempt.error,
              };
            },
          ),
        )}`,
      );
    const place: (feature: AutoMovieHumanHeadFeatures.IFeature) => IPlaced = (
      feature: AutoMovieHumanHeadFeatures.IFeature,
    ): IPlaced => {
      return {
        feature,
        view: AutoMovieHumanHeadTree.leaf(feature.part),
        get loft(): AutoMovieViewLoft.IResult {
          return definition.loft(feature.part.name);
        },
      };
    };
    const parts: IPlaced[] = definition.parts.map(place);

    const studies: IOutput["studies"] = definition.studies.map(
      (part: IAutoMovieViewPart): IOutput["studies"][number] => {
        const view: IAutoMovieConstructionView =
          AutoMovieHumanHeadTree.view(part);
        return {
          part,
          view,
          get loft(): AutoMovieViewLoft.IResult {
            return definition.loft(part.name);
          },
        };
      },
    );
    const sources: ReadonlyMap<string, IAutoMovieViewPart> = definition.sources;
    return {
      plan,
      definition,
      massPart,
      massView: AutoMovieHumanHeadTree.leaf(massPart),
      sources,
      attachments,
      neck: base.neck,
      parts,
      studies,
      /** Only explicit raw demand invokes the identical definition's supplier. */
      get mass(): AutoMovieViewLoft.IResult {
        return definition.loft(massPart.name);
      },
      /** Reading diagnostics enumerates performed admissions, never unrequested geometry. */
      get diagnostics(): AutoMovieLoftContract.IDiagnostic[] {
        return [
          ...base.diagnostics,
          ...(definition.lofts.has(massPart.name)
            ? []
            : (base.raw?.diagnostics ?? [])),
          ...[...definition.lofts.values()].flatMap(
            (
              result: AutoMovieViewLoft.IResult,
            ): AutoMovieLoftContract.IDiagnostic[] => result.diagnostics,
          ),
        ];
      },
    };
  }
}
