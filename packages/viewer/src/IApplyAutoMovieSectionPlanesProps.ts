import type { IAutoMovieSectionPlane } from "@automovie/engine";
import type * as THREE from "three";
import type { IAutoMovieSectionRenderer } from "./IAutoMovieSectionRenderer";

/**
 * Inspection clipping applied to existing material state without deleting or
 * rebuilding source geometry. One converted plane set is shared by the subtree.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Supplies an inspection-owned cut rather than an authored delivery-camera field.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Keeps renderer enable, selected subtree and declared half-spaces explicit at the conversion boundary.
 * @author Samchon
 */
export interface IApplyAutoMovieSectionPlanesProps {
  /**
   * Renderer switch mutated to reflect whether the supplied plane list is empty.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Preserves the runtime enable needed for an inspection cut.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Supplies the clipping enable alongside the same selected plane set.
   */
  renderer: IAutoMovieSectionRenderer;

  /**
   * Caller-owned subtree whose materials receive the plane set; geometry and
   * hierarchy remain owned by their builders.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Selects the existing production inspected without removing meshes.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Keeps clipping separate from source scene or camera mutation.
   */
  root: THREE.Object3D;

  /**
   * World-space engine half-spaces; an empty list releases clipping. The runtime
   * converts their remove-side normal once without changing these records.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Retains the authored inspection half-spaces and empty release condition.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Supplies the intersection of kept half-spaces realized on the material boundary.
   */
  planes: readonly IAutoMovieSectionPlane[];
}
