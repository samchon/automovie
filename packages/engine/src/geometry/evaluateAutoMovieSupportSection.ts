import { createAutoMovieSupportSectionQuery } from "./createAutoMovieSupportSectionQuery";

/**
 * Intersect oriented unit half-planes in an admitted finite XZ chart.
 * Enumerate boundary pairs and retain intersections satisfying every inequality.
 * Tight constraints, rather than coordinate proximity, identify a common vertex.
 * A relative residual filter delegates uncertain signs to the exact-sign
 * determinant owner. Zero incidence means exact equality for the supplied
 * doubles, independently of observation uncertainty. A weak feasible pair refuses.
 * Callers supply finite dense arrays, unit normals and a bounded section.
 *
 * @evidence contracts/common.md#principled-implementation Two-by-two line intersection followed by every half-plane inequality enumerates the vertices of a bounded convex section. Tight-constraint incidence supplies canonical vertex identities, and weak feasible intersections refuse rather than replacing their determinant.
 * @evidence contracts/common.md#clear-and-simple-design This generic engine query serves both continuous support-loft generation and recovery's comparison of fitted versus observed supports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate welding, seed box, observed polygon, mesh or specimen constant supplies an intersection. The explicit relative arithmetic bound does not become a physical error allowance.
 * @evidence contracts/common.md#meaningful-documentation States inequality sense, admitted premises, XZ winding, tight-incidence identity, weak-direction refusal and unresolved binary64 classification limits.
 * @evidence contracts/performance.md#efficient-algorithms For P planes, O(P squared) pairs each test P constraints, costing O(P cubed) time and O(P squared) candidate storage; callers bound P before queries.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each query observes its supplied offsets; no mutable section or result is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a caller-owned ordered vertex list escapes; numerical scratch and incidence maps expire synchronously without a file, process or global cache.
 */
export function evaluateAutoMovieSupportSection(input: {
  normals: readonly (readonly [number, number])[];
  offsets: readonly number[];
  minimumDirectionSine: number;
}): { pair: [number, number]; tight: number[]; point: [number, number] }[] {
  return createAutoMovieSupportSectionQuery(input)(input.offsets);
}
