import type {
  IAutoMoviePlantingArrangement,
  IAutoMoviePlantingState,
} from "@automovie/interface";
import type * as THREE from "three";

/*
 * Derived plant records and placements projected into the viewer's branch/leaf
 * instance batches. Optional materials are borrowed; absent materials are
 * created and owned by the returned planting object.
 */
export interface IBuildPlantingObjectProps {
  /*
   * Derived local branches, leaves, domain and growth stage; numerical
   * admission belongs to the plant owner.
   */
  plant: IAutoMoviePlantingState;

  /*
   * Admitted member placements and rejected-slot metadata, with full
   * translation/quaternion/per-axis scale.
   */
  arrangement: IAutoMoviePlantingArrangement;

  /*
   * Borrowed branch material; absence creates an owned opaque default.
   */
  branchMaterial?: THREE.Material;

  /*
   * Borrowed leaf material; absence creates an owned double-sided default when
   * leaves exist.
   */
  leafMaterial?: THREE.Material;

  /*
   * Cylinder radial resolution passed to Three, six by default; the caller owns
   * resolution admission.
   */
  branchSegments?: number;
}
