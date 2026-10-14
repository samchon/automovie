import type { AutoMovieTextureCache } from "../../AutoMovieTextureCache.js";
import type * as THREE from "three";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness.js";

/**
 * One allocated face group on the GPU and what decides whether a later
 * frame may write into its buffers instead of allocating a new group.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Retains one allocated group, part-ordered native meshes, copied static reuse structure and exact geometry witnesses. The structure fixes material/static topology while publication writes current coordinates; released withdraws authority rather than proving physical retirement.
 * @evidence contracts/common.md#clear-and-simple-design Resident allocation/reuse state stays with the face renderer, distinct from each prepared numerical frame and the viewport's scene attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuse reads actual static structure and mesh witnesses without fixture ids, prose hashes or a fabricated validation result. Offscreen allocation is not described as observed display.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish allocated group, private static copies, part ordering, texture cache and logical withdrawal despite possible cleanup failure.
 * @evidence contracts/performance.md#efficient-algorithms Retained structure/witness data grows with parts and static numerical buffers, plus native geometry and asset cache populations; renderer preparation/compare owns those costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Compatible frames reuse this resident's group/materials while current coordinates upload; exact witness dependencies permit geometry-gate reuse without treating changed material configuration as equal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The face renderer owns group resources and cache, registering retirement during preparation and releasing on nonactive discard, replacement or close. Failed scope retirement retains its closer/uncertain resources; concurrently prepared resident count has no independent cap here.
 */
export interface IConnectedFaceResident {
  /** Allocated Three group; it becomes displayed only after viewport publication. */
  group: THREE.Group;

  /**
   * Static structure the group was built from: materials and every part with
   * its position and normal arrays reduced to their lengths. Index and UV
   * arrays are the witnesses' copies; the rest is a private copy.
   */
  structure: unknown;

  /** The group's meshes, in model part order. */
  meshes: THREE.Mesh[];

  /** Witnesses of the arrays last published into the group. */
  witnesses: IConnectedFaceMeshWitness[];

  /** Textures the group's materials use. */
  textures: AutoMovieTextureCache;

  /** Whether this resident was withdrawn; retirement completion can still fail. */
  released: boolean;
}
