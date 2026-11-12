import type {
  IAutoMoviePlantingArrangement,
  IAutoMoviePlantingState,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Derived plant records and placements projected into the viewer's branch/leaf instance batches. Optional materials are borrowed; absent materials are created and owned by the returned planting object.
 *
 * @evidence contracts/development/design.md#principled-representation The input separates derived local plant structure from world member placement and optional borrowed materials, preserving full transform components for the projection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One renderer input shape names source plant, arrangement, material ownership and branch resolution without duplicating numerical plant derivation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The viewer receives actual derived records rather than fixture geometry; branch taper averaging remains the builder's explicitly documented approximation.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify plant versus placement ownership, borrowed/default materials and the six-segment default; upstream owners admit their numerical inputs.
 */
export interface IBuildPlantingObjectProps {
  /** Derived local branches, leaves, domain and growth stage; numerical admission belongs to the plant owner. */
  plant: IAutoMoviePlantingState;

  /** Admitted member placements and rejected-slot metadata, with full translation/quaternion/per-axis scale. */
  arrangement: IAutoMoviePlantingArrangement;

  /** Borrowed branch material; absence creates an owned opaque default. */
  branchMaterial?: THREE.Material;

  /** Borrowed leaf material; absence creates an owned double-sided default when leaves exist. */
  leafMaterial?: THREE.Material;

  /** Cylinder radial resolution passed to Three, six by default; the caller owns resolution admission. */
  branchSegments?: number;
}
