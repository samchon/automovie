import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanConstructionCheck } from "../../../common/basis/IHumanConstructionCheck";

/** Generated brow shafts plus exact resident card vertices they replace.
 *
 *
 * @evidence contracts/common.md#principled-implementation Generated shaft parts and materials accompany original checks, exact replaced resident vertices and per-host RGB coverage gains.
 * @evidence contracts/common.md#clear-and-simple-design The assembly extends only model parts/materials and supplies maps for the builder's skin tint and exact card replacement owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Replacement sets follow actual populations independently of names; generated shafts still undergo their original implantation checks.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish emitted shaft geometry, same-population checks, unity at vertices untouched by band splats and exact source replacement sets.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Generated brow assembly result is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Generated brow assembly result specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Generated brow assembly result acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowAssembly extends Pick<
  IAutoMovieModel,
  "parts" | "materials"
> {
  /** Original implantation checks on the same constructed shaft population. */
  checks: readonly IHumanConstructionCheck[];

  /** Per host surface, flat RGB gains from the shaft coverage estimate and normalized barycentric band splats; one at vertices untouched by every splat, without an exact geometric band boundary. */
  tints: ReadonlyMap<string, readonly number[]>;

  /** Original surfaces and exact replacement populations, independent of names. */
  replacements: ReadonlyMap<string, ReadonlySet<number>>;
}
