import type { IAutoMovieSectionPlane } from "@automovie/engine";
import type * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "./IAutoMovieSectionRenderer.js";

/**
 * Inspection clipping applied to existing material state without deleting or
 * rebuilding source geometry. One converted plane set is shared by the subtree.
 *
 * @author Samchon
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
