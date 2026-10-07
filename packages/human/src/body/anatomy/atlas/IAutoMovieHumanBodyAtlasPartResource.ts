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
 * @evidence contracts/common.md#principled-implementation The actual source surface remains separate from unavailable clinical resolution.
 * @evidence contracts/common.md#clear-and-simple-design Identity, source, registration and registered surface have one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An acquired bone is not replaced by a primitive or relabeled outer skin.
 * @evidence contracts/common.md#meaningful-documentation States offline ownership and explicit inspection consumption.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each resource owns exactly one closed bone identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels This resource exposes no deformation channel.
 * @evidence contracts/modeling.md#emitted-geometry Original atlas triangulation supplies the surface population, without guessed bone primitives.
 * @evidence contracts/modeling.md#spatial-conventions Mesh positions are already registered common-frame metres; the receipt and registration own original conversions.
 * @evidence contracts/modeling.md#shared-boundaries No inferred cartilage, skin attachment or clearance is added to the acquired boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The compiled candidate model adapter owns observation.
 * @evidence contracts/anatomy.md#anatomical-source The source receipt identifies the atlas and acquisition limits; one atlas cannot certify a person's bone.
 * @evidenceExclude contracts/anatomy.md#permitted-range This source does not define clinical bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Only the offline compiler supplies vertices.
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
