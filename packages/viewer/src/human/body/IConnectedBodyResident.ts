import type { AutoMovieTextureCache } from "../../index.js";
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
