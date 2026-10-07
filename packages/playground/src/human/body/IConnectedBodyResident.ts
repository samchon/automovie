import type { AutoMovieTextureCache } from "@automovie/viewer";
import type * as THREE from "three";

import type { ConnectedBodyPart } from "./ConnectedBodyPart";

/**
 * One Three.js group the body preview renderer owns, with what it was built from.
 *
 * `parts` and `materials` record the structure the group's buffers match, so a
 * later frame with the same structure reuses them. `released` marks a group
 * whose GPU resources have been freed.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Keeps the displayed body's buffers alive between edits that change only coordinates.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Records the part and finish structure a resident group's buffers were built for.
 * @author Samchon
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

  /** Whether the group's GPU resources have been released. */
  released: boolean;
}
