import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanBodyAtlasSource } from "../atlas/IAutoMovieHumanBodyAtlasSource";
import type { IAutoMovieHumanBodySourceVertexBinding } from "./IAutoMovieHumanBodySourceVertexBinding";

/**
 * One acquired or reproducibly authored boundary member of an anatomical part.
 *
 * Multiple muscle heads or cartilage islands retain separate source receipts instead of being welded through empty space. Common-neutral geometry is registered offline to the assembly rig generation. A boundary mesh is not the independently validated tetrahedral GeneratedSolid representation.
 *
 * @evidence contracts/common.md#principled-implementation A stable boundary member keeps its acquired/authored provenance, mesh digest and anatomical-graph binding together in one common-neutral source registration.
 * @evidence contracts/common.md#clear-and-simple-design Separate members retain muscle heads or cartilage islands independently instead of welding disconnected structures through empty space.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An indexed boundary mesh is explicitly distinct from independently validated tetrahedral solid geometry, and attachment ownership stays in the named binding.
 * @evidence contracts/common.md#meaningful-documentation Members identify source rights/conditions, compiled mesh digest, null-skin boundary meaning and four-slot offline anatomical weighting.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A source-surface record describes geometry and registration without choosing a skinning or welding algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mesh digests identify source bytes, while this declaration implements no resident-geometry cache or equivalence test.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The surface interface references caller-supplied meshes without acquiring GPU buffers or asset fetches.
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
