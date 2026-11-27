import type * as THREE from "three";

/**
 * A viewer-owned planting cluster with one branch batch and an optional leaf
 * batch.
 */
export interface IAutoMovieRenderPlantingObject {
  /** Add this group to the current scene. */
  object: THREE.Group;

  /**
   * Every branch of every member in one instanced batch; actual submissions
   * depend on the renderer.
   */
  branches: THREE.InstancedMesh;

  /** Every leaf of every member in one instanced batch, or `null` when bare. */
  leaves: THREE.InstancedMesh | null;

  /**
   * Allocated branch slots: member count times branch count, including
   * degenerate slots.
   */
  branchCount: number;

  /**
   * Allocated leaf slots: member count times leaf count, without a
   * visible-pixel guarantee.
   */
  leafCount: number;

  /** Release geometries, and the materials this object created. */
  dispose: () => void;
}
