import type { IAutoMovieSectionPlane } from "@automovie/engine";
import type * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "./IAutoMovieSectionRenderer.js";

/**
 * Inspection clipping applied to existing material state without deleting or
 * rebuilding source geometry. One converted plane set is shared by the subtree.
 *
 * @evidence contracts/development/design.md#principled-representation Separates the borrowed renderer switch, existing scene subtree and engine world-space remove-side half-spaces so applyAutoMovieSectionPlanes converts clipping convention without altering authored geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One props record keeps clipping application inputs together; the narrow renderer interface exposes only the mutable switch this operation needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty planes mean release for every subtree; no geometry deletion or special scene identity is encoded in the input.
 * @evidence contracts/development/common.md#meaningful-documentation Members state renderer mutation, caller ownership of root/geometry, world-space convention and empty-list release behavior.
 */
export interface IApplyAutoMovieSectionPlanesProps {
  /**
   * Renderer switch mutated to reflect whether the supplied plane list is empty.
   */
  renderer: IAutoMovieSectionRenderer;

  /**
   * Caller-owned subtree whose materials receive the plane set; geometry and
   * hierarchy remain owned by their builders.
   */
  root: THREE.Object3D;

  /**
   * World-space engine half-spaces; an empty list releases clipping. The runtime
   * converts their remove-side normal once without changing these records.
   */
  planes: readonly IAutoMovieSectionPlane[];
}
