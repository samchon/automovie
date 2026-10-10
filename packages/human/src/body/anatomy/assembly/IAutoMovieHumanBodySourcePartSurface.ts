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
