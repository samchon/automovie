import { AutoMovieEngineViewLoft } from "@automovie/engine";
import type {
  IAutoMovieHumanSectionSource,
  IAutoMovieHumanSiteControls,
  IAutoMovieHumanSiteViewPart,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanSourceRealization,
  IAutoMovieLoftContract,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanSiteDefinition } from "./AutoMovieHumanSiteDefinition";

/**
 * A body part lofted from view knots at named sites: the composition every
 * body part shares between its own laws and the view-to-section operator
 * (`AutoMovieEngineViewLoft`), so the trunk, the limbs and the digits differ
 * only in their axis and their knots.
 *
 * Knots. Each site stands at a station of the part's axis and gives the four
 * edges of the box there as signed chart coordinates relative to the axis
 * (the extremes along `+u`, `+v`, `-u`, `-v`), and what owns the fullness: a
 * taut-tape girth or a sourced conic shoulder. An outline uses the natural
 * cubic spline of its knots (the operator's), so each published measure is a
 * knot and the outline is C2 between. Explicit jets/ranges select the shared
 * C2 quintic owner instead of the default natural cubic.
 *
 * Fullness by ownership. A tape's site gets its common conic shoulder solved
 * on that site's box by the Illinois rule on the taut-tape girth
 * (`AutoMovieEngineViewSection.solve`; a tape outside the box's reach keeps the
 * reach's end with the operator's diagnostic); an untaped site keeps the
 * caller's sourced shoulder. Both become knots of one shoulder outline
 * (`kind: "shoulder"`), so one owner kind runs along the whole part; the
 * caller's sourced quarter departures, if any, ride beside it. A pole's knot
 * repeats its neighbouring site's shoulder, since no owner speaks there and
 * the pole's own station carries no section.
 *
 * Stations. Every site is a layer, so every measure stands on a section of its
 * own; each run between two consecutive sites is cut into the fewest equal
 * intervals no wider than the caller's gap. The caller keeps sites apart:
 * two sites a millimetre apart leave an interval a fraction of its
 * neighbours', which the C2 station rule prints as a ring.
 *
 * Diagnostics, never a throw: sites not strictly rising, a box that does not
 * hold its axis (an edge on the wrong side), a tape no section fits; the
 * operator's own follow.
 */
export namespace AutoMovieHumanSiteViewPart {
  /** Retain one call-owned prepared source until its explicit generating owner changes. No geometry or cache is global; child sources are invalidated when a coupled parent is replaced. */
  export function lazy<T>(
    factory: IAutoMovieHumanSiteViewPart.LazyFactory<T>,
    owner: IAutoMovieHumanSiteViewPart.LazyOwner = (): undefined => undefined,
  ): IAutoMovieHumanSiteViewPart.LazyResult<T> {
    let prepared: { owner: unknown; value: T } | undefined;
    return (): T => {
      const current: unknown = owner();
      if (prepared === undefined || prepared.owner !== current)
        prepared = { owner: current, value: factory() };
      return prepared.value;
    };
  }

  /** Prepare the identical production source without constructing a raw loft. */
  export function define(
    input: IAutoMovieHumanSectionSource,
  ): IAutoMovieHumanSourceDefinition {
    return AutoMovieHumanSiteDefinition.of(input);
  }

  /** Publish the exact shared generating controls; no sibling part or source solve is needed. */
  export function fromControls(
    prepared: IAutoMovieHumanSiteControls.IOutput,
  ): IAutoMovieHumanSourceDefinition {
    return AutoMovieHumanSiteDefinition.publish(prepared);
  }

  /** Loft this exact prepared part once; copy diagnostics so the shared definition remains unchanged. */
  export function loft(
    definition: IAutoMovieHumanSourceDefinition,
  ): IAutoMovieHumanSourceRealization {
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [
      ...definition.diagnostics,
    ];
    if (definition.part === null)
      return { ...definition, loft: null, diagnostics };
    const result: IAutoMovieViewLoft.IResult = AutoMovieEngineViewLoft.create(
      definition.part,
    );
    diagnostics.push(...result.diagnostics);
    return { ...definition, loft: result, diagnostics };
  }

  /**
   * Build and loft a part from its sites.
   *
   * @param input The axis, the sites, the pole and the sampling.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(
    input: IAutoMovieHumanSectionSource,
  ): IAutoMovieHumanSourceRealization {
    return loft(define(input));
  }

  /**
   * The identical original edge used by construction and input-dimension
   * solves, before any fullness, section or loft is realized.
   *
   * @evidence contracts/common.md#principled-implementation Copies the same named signed edge, authored jets, scalar range and zero closing knots that create supplies to the shared engine source owner.
   * @evidence contracts/common.md#clear-and-simple-design One edge conversion is shared by actual construction and source-only metric queries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads defining sites only; no final section, sampled polygon or replacement spline supplies an edge.
   * @evidence contracts/common.md#meaningful-documentation Separates original scalar declaration from section/fullness realization and preserves normalized-jet units.
   * @evidence contracts/performance.md#efficient-algorithms Copies n knots and at most two poles in O(n) time and space; it runs no loft or girth solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Both consumers use this owner, so a changed source field cannot silently be dropped by a parallel conversion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns an owned declaration with no cache or source-result lifetime beyond its caller.
   */
  export function outline(
    input: Pick<
      IAutoMovieHumanSectionSource,
      "sites" | "pole" | "poleJets" | "ranges" | "parameter"
    >,
    quarter: 0 | 1 | 2 | 3,
  ): IAutoMovieViewPart.IOutline {
    return AutoMovieHumanSiteDefinition.outline(input, quarter);
  }
}
