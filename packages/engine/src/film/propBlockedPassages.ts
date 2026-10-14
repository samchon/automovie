import { IAutoMovieBuiltEnvironment, IAutoMoviePropBox } from "@automovie/interface";
import { IAutoMoviePassageBlockage } from "./IAutoMoviePassageBlockage";
import { createPropPassageBlocker } from "./createPropPassageBlocker";

/**
 * Every opening and connector a world volume intrudes on, openings first, each group in declaration order.
 *
 * An opening is measured through the element that fills it, at its rest pose: the fill's model parts, placed under its rest world matrix, bound the hole. An open cut (`fill: null`), a fill that draws no model or whose model lives outside the record, and a fill whose parent chain is missing or cyclic are reported by neither this query nor the validator, because a passage nothing measures cannot be proven blocked and guessing where the hole is would be worse than saying nothing. A model present in the record but without measurable vertices instead receives builtPlacedPartBoxes' degenerate box at the staged fill element's world origin; this query preserves that fallback.
 *
 * A connector is swept from its own route: each segment's box widens by half the usable width horizontally and rises by the clear height, which is the volume a body traversing it needs. A varying section is read at the segment's ends and at every section station inside it, and the segment takes the widest width and tallest clearance among them, so the box stays an outer bound of the tapering corridor. A connector that states no section, or whose route has no length, sweeps nothing: an unstated width is not a width of zero, and `validateBuiltEnvironment` refuses that record on its own path.
 *
 * Intrusion is {@link propBoundsOverlap}, so a volume that only touches a passage does not block it.
 *
 * @param props.environment The building whose passages are checked.
 * @param props.bounds The intruding world volume, in metres.
 * @returns One blockage per intruded passage.
 *
 * @evidence contracts/common.md#principled-implementation Openings use the union of rest-world part boxes, including the shared staged-element-origin fallback for vertexless held models; connectors use axis-aligned route bounds widened by maximal section dimensions. Strict open-interval overlap preserves boundary-only contact as nonblocking.
 * @evidence contracts/common.md#clear-and-simple-design Delegates invariant passage measurement and strict overlap to createPropPassageBlocker; this one-off API preserves the original environment-and-bounds seam while registry validation shares one preparation across its props.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening, connector or prop is special-cased; every unmeasurable passage is skipped by the same stated rule and left to the validator that owns its refusal.
 * @evidence contracts/common.md#meaningful-documentation States the order of the result, how an opening is measured and at which pose, every skipped case and why, how a connector is swept including varying sections, and the contact rule.
 * @evidence contracts/performance.md#efficient-algorithms Delegates preparation to createPropPassageBlocker, including opening-part traversal, rest-chain composition and per-route-segment section filtering and repeated section queries. The one-off query then scans all prepared passage boxes; it does not establish a linear bound in route/station counts alone.
 * @evidence contracts/performance.md#reuse-equivalent-work The preparation shares rest matrices and element/model indexes across openings for this single query; repeated-prop validation calls createPropPassageBlocker directly to reuse prepared bounds for an unchanged environment during that call, without a global stale-data cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The lookups and indexes are dropped on return; the caller owns the returned blockages, at most one per opening and connector.
 */
export function propBlockedPassages (props: {
  environment: IAutoMovieBuiltEnvironment;
  bounds: IAutoMoviePropBox;
}): IAutoMoviePassageBlockage[] {
  return createPropPassageBlocker(props.environment)(props.bounds);
}
