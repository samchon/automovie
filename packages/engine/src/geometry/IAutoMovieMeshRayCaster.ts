import type { IAutoMovieMeshRayHit } from "./IAutoMovieMeshRayHit";
import type { IAutoMovieMeshRayQueryOptions } from "./IAutoMovieMeshRayQueryOptions";

/**
 * Synchronous ray queries over one owned resident-mesh snapshot, returned by
 * `createAutoMovieMeshRayCaster`.
 *
 * Every query takes an XYZ `origin` and `direction` in the mesh-local metre
 * frame, a `maximum` travel and an optional `minimum` travel (default zero),
 * and accepts a hit whose travel lies in the inclusive interval [minimum,
 * maximum]. Positive infinity is an unbounded maximum. The direction is
 * normalized first, so travel is metres along the ray. A query throws on a
 * non-finite origin, a zero or non-finite direction, `minimum > maximum`, an
 * exclusion outside the original triangle ordinals, and arithmetic a triangle
 * or box cannot represent. A null answer means no unexcluded triangle lies in
 * the interval, never that the origin is inside a volume.
 *
 * Triangle winding does not matter, an edge belongs to both its triangles, and
 * a ray within the 1e-18 determinant threshold of a triangle's plane passes it.
 * The three queries share one traversal stack, which is safe because each runs
 * to completion without calling back into the caller.
 *
 * @evidence contracts/common.md#principled-implementation Each query is the same Moller-Trumbore intersection over a median-split bounding volume hierarchy with an inclusive slab test, so `nearest`, `nearestHit` and `blocked` agree on which triangles are hit and differ only in what they keep.
 * @evidence contracts/common.md#clear-and-simple-design Three entry points over one private `cast`: travel only, travel with identity, and a yes-or-no that stops early, because callers either measure clearance, attribute a hit to a face, or test occlusion, and each would otherwise pay for what it discards.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self-hits are avoided by query-local triangle exclusions or an explicit minimum travel, never by nudging the origin, and unrepresentable arithmetic throws with the triangle ordinal instead of becoming a NaN hit.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the frame and units, the inclusive interval and its defaults, every refusal, what null does and does not mean, the winding, edge and grazing rules, and why the shared stack is safe.
 * @evidence contracts/performance.md#efficient-algorithms A query visits only hierarchy nodes whose slab interval meets the running nearest travel, so cost follows the triangles near the ray rather than the n resident triangles, with an O(n) worst case for a ray grazing everything; `blocked` additionally ends at its first admitted hit.
 * @evidence contracts/performance.md#reuse-equivalent-work The hierarchy, the corner and edge tables and the traversal stack are built once per caster and reused by every query; the hair builder compiles one caster per host skin and shares it across all strands.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caster retains nine float64 edge values and one ordinal per triangle, typed bounds and links for fewer hierarchy nodes than triangles, and a stack of twice the node count, all fixed at construction, while the corner table and construction lists are released once creation returns; nothing grows per query and everything is released when the caller drops the caster.
 */
export interface IAutoMovieMeshRayCaster {
  /**
   * Travel to the nearest unexcluded triangle, in metres along the normalized
   * ray, or null when none lies in [minimum, maximum]. The value is the raw
   * computed travel, so a hit at the origin can be negative zero.
   *
   * @evidence contracts/common.md#principled-implementation Shrinks the accepted interval to the best travel found so far, so a node or triangle farther than the current nearest is pruned and the returned travel is the minimum over every admitted intersection.
   * @evidence contracts/common.md#clear-and-simple-design Returns only the scalar because clearance and occlusion-depth callers, such as body layer surfaces and face occlusion baking, need no identity and should not allocate a record for it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The travel is reported as computed, including the sign of zero, rather than clamped to the minimum or rounded, so a caller compares exactly what the kernel measured.
   * @evidence contracts/common.md#meaningful-documentation States the unit, the interval, the null case and that the raw travel can be negative zero.
   * @evidence contracts/performance.md#efficient-algorithms Visits only nodes whose slab interval is not beyond the running best, so it reads near the ray's first hit and stops pruning the rest; the worst case is every node for a ray grazing all n triangles.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call is one independent ray; reuse lives in the caster's prebuilt hierarchy, not in any result kept between calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates only the hit record it unwraps, which the call drops before returning a number; the traversal stack is the caster's preallocated one.
   */
  nearest: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => number | null;

  /**
   * The nearest unexcluded hit with its original triangle ordinal, or null
   * when none lies in [minimum, maximum]. Its travel equals `nearest`'s for the
   * same arguments, and equal travel selects the lowest ordinal. The record is
   * newly allocated and owned by the caller.
   *
   * @evidence contracts/common.md#principled-implementation Runs the same nearest traversal as `nearest` and breaks equal-travel ties by the original ordinal rather than the hierarchy's sorted order, so the attributed triangle does not depend on how the tree was split.
   * @evidence contracts/common.md#clear-and-simple-design A separate entry for callers that must name the face they hit, such as hair exterior intervals and rooted stems, so the scalar `nearest` stays allocation-light.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No triangle is preferred by mesh, region or caller; the tie rule is the ordinal alone and applies identically to every admitted equal hit.
   * @evidence contracts/common.md#meaningful-documentation States that travel matches `nearest`, the lowest-ordinal tie rule, the null case and that the record belongs to the caller.
   * @evidence contracts/performance.md#efficient-algorithms Same pruned nearest traversal as `nearest`; the tie rule adds one comparison per equal hit and no extra pass.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One ray per call with no cached answers; hair callers reuse the caster, not individual hits.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one two-field record per hit, which the caller owns and may keep; the caster holds no reference to it.
   */
  nearestHit: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => IAutoMovieMeshRayHit | null;

  /**
   * Whether any unexcluded triangle lies in [minimum, maximum]. It returns at
   * the first admitted hit in traversal order, which need not be the nearest.
   *
   * @evidence contracts/common.md#principled-implementation An occlusion test needs existence only, so the traversal returns on the first triangle that passes the same inclusive interval test the nearest queries use, and its answer equals `nearest(...) !== null`.
   * @evidence contracts/common.md#clear-and-simple-design A boolean entry for occlusion callers, so a visibility test neither keeps searching for a nearer hit nor allocates a record it would discard.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Stopping early changes which triangle ended the search, never the answer, because any admitted hit proves obstruction; no hit is skipped to make the search shorter.
   * @evidence contracts/common.md#meaningful-documentation States what true means, that it stops at the first admitted hit, and that that hit need not be the nearest.
   * @evidence contracts/performance.md#efficient-algorithms Ends at the first admitted hit instead of shrinking the interval to the nearest, so an occluded ray usually reads one leaf; an unoccluded ray still visits every node its slab meets.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one ray per call with nothing cached between calls; the reused work is the caster's hierarchy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a boolean and drops the at most one internal hit record before returning; nothing is retained.
   */
  blocked: (
    origin: readonly number[],
    direction: readonly number[],
    maximum: number,
    minimum?: number,
    options?: IAutoMovieMeshRayQueryOptions,
  ) => boolean;
}
