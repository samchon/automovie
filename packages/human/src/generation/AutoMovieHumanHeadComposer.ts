import { AutoMovieEngineViewLoft } from "@automovie/engine";
import type {
  IAutoMovieConstructionView,
  IAutoMovieHumanEar,
  IAutoMovieHumanHeadCanonical,
  IAutoMovieHumanHeadComposer,
  IAutoMovieHumanHeadDome,
  IAutoMovieHumanHeadFeatures,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanPair,
  IAutoMovieLoftContract,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadCanonical } from "./AutoMovieHumanHeadCanonical";
import { AutoMovieHumanHeadOriginalSources } from "./AutoMovieHumanHeadOriginalSources";
import { AutoMovieHumanHeadTree } from "./AutoMovieHumanHeadTree";

/**
 * The head subtree's parts placed: the head mass authored from its views
 * (`AutoMovieHumanHeadMassPart`), and every face part drawn from its own
 * (`AutoMovieHumanHeadFeatures` and kin), each in the anatomical frame its own
 * generating curves define. The joins are not made here: the construction tree
 * (`AutoMovieHumanHeadTree`) names each merge and diff, and the engine realizes
 * them (`realizeAutoMovieConstruction`). A join's search may locate an
 * intersection, but cannot move a whole anatomical part or redefine an
 * independently supplied distance.
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
   * Prepare the canonical mass and neck before any regional source is
   * requested.
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
    ears: IAutoMovieHumanPair<IAutoMovieHumanEar>,
    neckBase?: number,
    places?: IAutoMovieHumanHeadComposer.IPlaces,
  ): IAutoMovieHumanHeadComposer.IBase {
    const canonical: IAutoMovieHumanHeadCanonical.IPrepared =
      AutoMovieHumanHeadCanonical.prepare(skeleton, neckBase, ears, places);
    let mass: IAutoMovieViewLoft.IResult | undefined;
    function loft(): IAutoMovieViewLoft.IResult {
      if (mass === undefined)
        mass = AutoMovieEngineViewLoft.create(canonical.closed().tape.part);
      return mass;
    }
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
      get closureAttempt(): IAutoMovieHumanHeadCanonical.IClosureAttempt {
        return canonical.closureAttempt;
      },
      get calibrated(): boolean {
        return canonical.result !== null;
      },
      get calibration(): IAutoMovieHumanHeadCanonical.IOutput | null {
        return canonical.result;
      },
      closed: canonical.closed,
      /*
       * Observe only this preparation's existing raw result, without preparing
       * one.
       */
      get raw(): IAutoMovieViewLoft.IResult | null {
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
    base: IAutoMovieHumanHeadComposer.IBase,
    ears: IAutoMovieHumanPair<IAutoMovieHumanEar>,
    places?: IAutoMovieHumanHeadComposer.IPlaces,
  ): IAutoMovieHumanHeadComposer.IDefinition {
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
   * @param neckBase The original neck scaffold's bottom mean, calibration mm,
   *   locating an internal body overlap; absent, the layout's top mean. This is
   *   not a named base-tape point.
   * @param places Heights the published laws give, calibration mm; absent, the
   *   skeleton's own.
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
    ears: IAutoMovieHumanPair<IAutoMovieHumanEar>,
    neckBase?: number,
    places?: IAutoMovieHumanHeadComposer.IPlaces,
    prepared?: IAutoMovieHumanHeadComposer.IBase,
    originals?: IAutoMovieHumanHeadComposer.IDefinition,
  ): IAutoMovieHumanHeadComposer.IOutput {
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
    const base: IAutoMovieHumanHeadComposer.IBase =
      originals?.base ?? prepared ?? prepare(skeleton, ears, neckBase, places);
    const {
      plan,
      part: massPart,
    }: IAutoMovieHumanHeadCanonical.IOutput["tape"] = base.closed().tape;
    const definition: IAutoMovieHumanHeadComposer.IDefinition =
      originals ?? define(base, ears, places);
    const attachments: IAutoMovieHumanHeadDome.IAttempt[] =
      definition.attachments;

    // Parents precede their children, but never relocate their geometry.
    // The supplied anatomy owns each frame; intersection and blend failures
    // are the tree's observations of those unchanged curves. A failed
    // regional attachment authors no part, so the head is composed without
    // it; only a head whose every attachment fails is refused.
    const failures: IAutoMovieHumanHeadDome.IAttempt[] = attachments.filter(
      (attempt: IAutoMovieHumanHeadDome.IAttempt): boolean =>
        attempt.error !== null,
    );
    if (failures.length > 0 && failures.length === attachments.length)
      throw new Error(
        `Head original attachment failures: ${JSON.stringify(
          attachments.map(
            (attempt: IAutoMovieHumanHeadDome.IAttempt): object => {
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
    function place(
      feature: IAutoMovieHumanHeadFeatures.IFeature,
    ): IAutoMovieHumanHeadComposer.IPlaced {
      return {
        feature,
        view: AutoMovieHumanHeadTree.leaf(feature.part),
        get loft(): IAutoMovieViewLoft.IResult {
          return definition.loft(feature.part.name);
        },
      };
    }
    const parts: IAutoMovieHumanHeadComposer.IPlaced[] =
      definition.parts.map(place);

    const studies: IAutoMovieHumanHeadComposer.IOutput["studies"] =
      definition.studies.map(
        (
          part: IAutoMovieViewPart,
        ): IAutoMovieHumanHeadComposer.IOutput["studies"][number] => {
          const view: IAutoMovieConstructionView =
            AutoMovieHumanHeadTree.view(part);
          return {
            part,
            view,
            get loft(): IAutoMovieViewLoft.IResult {
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
      /*
       * Only explicit raw demand invokes the identical definition's supplier.
       */
      get mass(): IAutoMovieViewLoft.IResult {
        return definition.loft(massPart.name);
      },
      /*
       * Reading diagnostics enumerates performed admissions, never unrequested
       * geometry.
       */
      get diagnostics(): IAutoMovieLoftContract.IDiagnostic[] {
        return [
          ...base.diagnostics,
          ...(definition.lofts.has(massPart.name)
            ? []
            : (base.raw?.diagnostics ?? [])),
          ...[...definition.lofts.values()].flatMap(
            (
              result: IAutoMovieViewLoft.IResult,
            ): IAutoMovieLoftContract.IDiagnostic[] => result.diagnostics,
          ),
        ];
      },
    };
  }
}
