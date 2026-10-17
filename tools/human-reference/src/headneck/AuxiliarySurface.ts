import type { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import type { V3 } from "../geometry/V3.ts";

/**
 * A separate private source component used for geometric contact observations.
 *
 * @evidence contracts/common.md#principled-implementation Component-local topology and a geometric bounding-box centre identify auxiliary contact geometry separately from skin.
 * @evidence contracts/common.md#clear-and-simple-design One record carries the component and its context-owned spatial index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates are private runtime observations, without a shipped identity catalogue or certified anatomical correspondence.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the native millimetre frame, classification uncertainty and index ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record declaration executes no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no requests or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The loading context owns runtime arrays and the index; this erased record creates no resource.
 * @author Samchon
 */
export interface AuxiliarySurface {
  /** Geometric component classification label, without clinical identity certification. */
  name: string;
  /** Original component positions in the admitted native world-millimetre frame. */
  vertices: V3[];
  /** Component-local triangle connectivity, confined to private observation tooling. */
  triangles: [number, number, number][];
  /** Axis-aligned component bounding-box midpoint in native world millimetres. */
  centre: V3;
  /** Closest-surface index over this component, owned by its head context. */
  idx: SurfaceIndex;
}
