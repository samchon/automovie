import type { AutoMovieTextureCache } from "../../AutoMovieTextureCache.js";
import type * as THREE from "three";

import type { ConnectedBodyPart } from "@automovie/human/body/runtime/ConnectedBodyPart";

/**
 * One Three.js group the body preview renderer owns, with what it was built from.
 *
 * `parts` and `materials` record the structure the group's buffers match, so a
 * later frame with the same structure reuses them. `released` marks a group
 * withdrawn from publication; it does not certify physical GPU retirement.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Couples one native body group/ordered meshes with numerical part structure, complete serialized material configuration and its texture-cache owner; structural/material equality permits buffer reuse only with the same renderer loader context, while released means withdrawn rather than physically retired.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the exact resources and comparison facts used by the numerical renderer together, avoiding a second resident graph or cross-owner GPU buffer cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material serialization is actual renderer configuration equivalence, not a lexical prose/fingerprint guard; part topology/order and relevant coordinates are inspected by the structural owner, with no fixture ids or patched native buffers.
 * @evidence contracts/common.md#meaningful-documentation Gives group/part/mesh order, complete finish comparison key, cache ownership and withdrawal-versus-physical-release distinction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resident state shape executes no topology/material comparison or vertex upload.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work sameConnectedBodyStructure and createConnectedBodyRenderer decide actual equivalence/publication reuse, not this record itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Group geometry/material/cache lifetimes belong to the renderer's retirement scope; declaring their references acquires no new native resources or task.
 */
export interface IConnectedBodyResident {
  /** Scene group holding the meshes. */
  group: THREE.Group;

  /** Parts the group was built from, in draw order. */
  parts: ConnectedBodyPart[];

  /** Meshes of the group, one per part. */
  meshes: THREE.Mesh[];

  /** Serialized materials the group's finishes were built from. */
  materials: string;

  /** Texture cache owning the group's textures. */
  textures: AutoMovieTextureCache;

  /** Whether this resident was withdrawn; retirement completion can still fail. */
  released: boolean;
}
