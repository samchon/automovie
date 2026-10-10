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
