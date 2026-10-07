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
 * @evidence contracts/common.md#principled-implementation The clipped surface carries its retained-triangle map and affine vertex preimages, so later bindings are rebound by identity instead of by position.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the clip owner's anonymous return type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent triangle mapping refuses rather than silently dropping an attachment.
 * @evidence contracts/common.md#meaningful-documentation States the map's key and value domains, the preimage order and ownership.
 * @evidence contracts/modeling.md#shared-boundaries Clipped edges reuse one preimage per undirected source edge, so adjacent regions meet at identical vertices.
 * @evidence contracts/modeling.md#spatial-conventions The surface keeps the basis's metre Y-up head frame; ordinals and preimages are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record carries one existing surface and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The clip owner emits the geometry this record carries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The crop producer and consuming assembly observe the clipped surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline preparation output is not a person-authoring input.
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
