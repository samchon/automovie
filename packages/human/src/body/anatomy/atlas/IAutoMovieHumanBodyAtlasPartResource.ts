import type { IAutoMovieMesh } from "@automovie/interface";

import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyAtlasRegistration } from "./IAutoMovieHumanBodyAtlasRegistration";
import type { IAutoMovieHumanBodyAtlasSource } from "./IAutoMovieHumanBodyAtlasSource";

/**
 * One independently acquired atlas bone registered by the offline compiler.
 *
 * This is a shared source resource, not personal document vertices and not a
 * clinically resolved anatomical part. The explicit document inspection
 * selection is its consumer; default bodies do not display it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasPartResource {
  /** Individually named atlas bone. */
  id: AutoMovieHumanBodyBoneId;

  /** Original source identity and redistribution rights. */
  source: IAutoMovieHumanBodyAtlasSource;

  /** Reference placement and exact supported shape. */
  registration: IAutoMovieHumanBodyAtlasRegistration;

  /** Acquired bone surface in the body's registered reference frame. */
  mesh: IAutoMovieMesh;

  /**
   * SHA-256 of JSON.stringify(mesh), verified by the offline compiler before
   * publishing this resource. Source-generation admission owns its binding;
   * synchronous browser replay does not recompute this cryptographic digest.
   */
  compiledMeshSha256: string;
}
