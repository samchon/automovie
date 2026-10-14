import type { IAutoMovieHumanFaceBasisSurface } from "./IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceClipStencil } from "./IAutoMovieHumanFaceClipStencil";

/**
 * A face basis surface clipped above a neutral Y plane, with its provenance.
 *
 * `retainedTriangles` maps each region ID to the wholly retained triangles,
 * source ordinal to output ordinal, whose corner order and barycentric
 * attachment coordinates survive. An absent mapping never means permission
 * to discard an attachment. `correspondence` holds one frozen source-edge
 * preimage per output vertex, in output order. Every array is owned.
 *
 * @evidence contracts/common.md#principled-implementation An open neutral-Y crop retains exact wholly surviving region triangles and frozen source-edge preimages so subsequent endpoint replay uses the same affine correspondence, independently of material UV seams.
 * @evidence contracts/common.md#clear-and-simple-design Clipped Surface, per-region source/output triangle maps and ordered vertex stencils own different provenance domains without fitting coordinates afterward.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent retained-triangle map does not authorize discarding an attachment; the crop emits no cap/anatomy and the preparation caller must revise dependent bindings and prepare new post-crop metadata.
 * @evidence contracts/common.md#meaningful-documentation The comment states source/output ordinals, preserved corner order, attachment obligation, frozen preimages and owned arrays; the surface member explicitly remains open.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This output schema performs no plane clipping or affine stencil evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Provenance maps carry reusable identities, while actual intersection sharing and replay belong to the clip producer/consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned maps and arrays; the type starts no preparation task or asset stream.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisClip {
  /** The clipped surface, open at the cut. */
  surface: IAutoMovieHumanFaceBasisSurface;

  /** Region ID to wholly retained source triangle ordinal to output ordinal. */
  retainedTriangles: Map<string, Map<number, number>>;

  /** One frozen source-edge preimage per output vertex, in output order. */
  correspondence: readonly Readonly<IAutoMovieHumanFaceClipStencil>[];
}
