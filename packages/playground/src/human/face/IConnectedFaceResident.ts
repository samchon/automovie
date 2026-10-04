import type { AutoMovieTextureCache } from "@automovie/viewer";
import type * as THREE from "three";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness";

/**
 * One allocated face group on the GPU and what decides whether a later
 * frame may write into its buffers instead of allocating a new group.
 *
 * @author Samchon
 */
export interface IConnectedFaceResident {
  /** The displayed Three group. */
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

  /** Whether GPU resources were already released. */
  released: boolean;
}
