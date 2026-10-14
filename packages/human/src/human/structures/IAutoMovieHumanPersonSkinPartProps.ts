import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Inputs of `placeHumanPersonSkinPart`: one skin render part of a partition, the evaluated skin it takes positions and normals from, and the source domains its correspondence moves between. Positions use common performed metres, Y up and +Z forward; normals are dimensionless flat XYZ. Source and field populations must align and remain unchanged during placement; the output owns changed fields while untouched mesh attributes stay borrowed.
 *
 * @evidence contracts/common.md#principled-implementation Render vertices address partition skin sources while the normal offset selects that partition in the one shared field; domain conversion preserves physical source identities.
 * @evidence contracts/common.md#clear-and-simple-design One placement operand record groups geometry, source correspondence and physical-domain names needed to scatter final positions and normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit sources and domain names replace positional vertex matching or fixture-specific seam welding.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes metre positions, dimensionless normals, aligned borrowed inputs, output ownership, vertex normal offsets and origin versus person domains.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The render-part scattering correspondence and field references are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the render-part scattering correspondence and field references; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring render-part scattering correspondence and field references acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinPartProps {
  /** The partition builder's render part mesh. */
  mesh: IAutoMovieMesh;

  /** The skin vertex each render vertex reads, in render order. */
  sources: readonly number[];

  /** The partition's evaluated posed skin positions. */
  positions: readonly number[];

  /** The one normal field over both halves: head vertices first, then body. */
  normals: readonly number[];

  /** Where this partition's vertices start in `normals`: zero for the head, the head count for the body. */
  offset: number;

  /** The partition's source sample per skin vertex. */
  samples: readonly number[];

  /** The source domain the partition builder registered the part in. */
  origin: string;

  /** The person's source domain the part is moved to. */
  domain: string;
}
