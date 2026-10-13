import type { IAutoMovieMesh } from "@automovie/interface";

import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyAtlasRegistration } from "./IAutoMovieHumanBodyAtlasRegistration";
import type { IAutoMovieHumanBodyAtlasSource } from "./IAutoMovieHumanBodyAtlasSource";

/**
 * One independently acquired atlas bone registered by the offline compiler.
 *
 * This is a shared source resource, not personal document vertices and not a clinically resolved anatomical part. The explicit document inspection selection is its consumer; default bodies do not display it.
 *
 * @evidence contracts/common.md#principled-implementation An acquired named bone resource binds actual provenance/mesh to exact basis/shape registration, separating compiled mesh identity from original bytes.
 * @evidence contracts/common.md#clear-and-simple-design Geometry, registration and rights travel together for explicit inspection without entering personal documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Atlas surfaces remain unvalidated individual anatomy and default bodies omit unselected resources.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish anatomical identity, source rights, reference shape and publisher-verified mesh digest.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The atlas resource schema selects no rigid-carry or mesh-validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compiled identity names provenance without implementing acquisition or inspection caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publisher-owned resource references open no download stream or GPU allocation.
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

  /** SHA-256 of JSON.stringify(mesh), verified by the offline compiler before publishing this resource. Source-generation admission owns its binding; synchronous browser replay does not recompute this cryptographic digest. */
  compiledMeshSha256: string;
}
