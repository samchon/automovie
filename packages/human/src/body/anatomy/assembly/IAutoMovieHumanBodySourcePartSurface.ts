import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanBodyAtlasSource } from "../atlas/IAutoMovieHumanBodyAtlasSource";
import type { IAutoMovieHumanBodySourceVertexBinding } from "./IAutoMovieHumanBodySourceVertexBinding";

/**
 * One acquired or reproducibly authored boundary member of an anatomical part.
 *
 * Multiple muscle heads or cartilage islands retain separate source receipts
 * instead of being welded through empty space. Common-neutral geometry is
 * registered offline to the assembly rig generation. A boundary mesh is not
 * the independently validated tetrahedral GeneratedSolid representation.
 *
 * @evidence contracts/common.md#principled-implementation Original rights, compiled identity and attachment binding travel with the actual boundary.
 * @evidence contracts/common.md#clear-and-simple-design One surface member separates source identity from part grouping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Acquired tissue boundaries are not relabeled skin primitives or empty geometry records.
 * @evidence contracts/common.md#meaningful-documentation States subdivision, offline registration and volumetric qualification limits.
 * @evidence contracts/modeling.md#part-identity-and-grouping A stable member identity preserves disconnected source subdivisions within their anatomical owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The part generator owns named numerical inputs.
 * @evidence contracts/modeling.md#emitted-geometry Actual boundary positions, normals and oriented source triangles supply geometry.
 * @evidence contracts/modeling.md#spatial-conventions Mesh coordinates are common-neutral metres registered to the one assembly graph.
 * @evidence contracts/modeling.md#shared-boundaries Source binding preserves attachment responsibility without claiming contact validation.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly consumer owns current-source observation.
 * @evidence contracts/anatomy.md#anatomical-source The original receipt and compiled digest distinguish atlas or authored boundary from personal reconstruction.
 * @evidenceExclude contracts/anatomy.md#permitted-range The shared source rig admits motion.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is offline immutable source geometry, not editor vertices.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourcePartSurface {
  /** Stable source member identity, independent of material or anatomical owner. */
  id: string;
  /** Original acquired or authored source identity, rights and acquisition conditions. */
  source: IAutoMovieHumanBodyAtlasSource;
  /** SHA-256 of JSON.stringify(mesh), bound by source admission and publisher. */
  compiledMeshSha256: string;
  /** Actual registered boundary; skin is null because the separate named binding owns attachment. */
  mesh: IAutoMovieMesh;
  /** Offline anatomical-bone ordinals and weights over this surface's actual vertex population. */
  binding: IAutoMovieHumanBodySourceVertexBinding;
}
