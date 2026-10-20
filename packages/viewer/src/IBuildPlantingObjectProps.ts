import type {
  IAutoMoviePlantingArrangement,
  IAutoMoviePlantingState,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Derived plant records and placements projected into the viewer's branch/leaf instance batches. Optional materials are borrowed; absent materials are created and owned by the returned planting object.
 *
 * @evidence contracts/common.md#principled-implementation The input separates derived local plant structure from world member placement and optional borrowed materials, preserving full transform components for the projection.
 * @evidence contracts/common.md#clear-and-simple-design One renderer input shape names source plant, arrangement, material ownership and branch resolution without duplicating numerical plant derivation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The viewer receives actual derived records rather than fixture geometry; branch taper averaging remains the builder's explicitly documented approximation.
 * @evidence contracts/common.md#meaningful-documentation Members identify plant versus placement ownership, borrowed/default materials and the six-segment default; upstream owners admit their numerical inputs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input type performs no instance matrix generation or plant traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared plant structure permits batching but this type supplies no independent cross-arrangement cache identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Supplied records/materials are borrowed; buildPlantingObject owns its created geometry, defaults and instance allocations.
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
