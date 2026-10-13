import type { IAutoMovieMeshDeformationField } from "@automovie/interface";

import type { IPortraitSurfaceHost } from "./IPortraitSurfaceHost";

/**
 * A replaceable anatomical surface layer, such as cheek volume or a facial crease. Fields use the engine's metre frame and are evaluated together on the same unmodified surface. A layer changes skin, not a detached overlay.
 *
 * @evidence contracts/common.md#principled-implementation Compact engine fields derive from one unchanged connected millimetre host and compose in stable layer-ID order with the shared attachment mask.
 * @evidence contracts/common.md#clear-and-simple-design Layer identity, optional local sampling and field generation stay with the layer; refinement and masked deformation have dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional spacing refines eligible field-box faces but pending coincident rims are exempt; authored fields are neither clinical tissue mechanics nor recovered anatomical detail.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish deterministic identity, millimetre sampling domain and metre-valued fields from a nonmutating borrowed host.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The layer protocol describes coefficients and a factory; its fields callback and runtime coordinator separately account for actual algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Layer identity specifies deterministic ordering without implementing a compiled-field cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type creates no field closure, refinement mesh or reader task; actual layer producers and application own those resources.
 * @author Samchon
 */
export interface IPortraitSurfaceLayer {
  /** Unique stable identity, used for deterministic composition order. */
  id: string;

  /** Optional positive millimetre edge target around field boxes; pending contact faces are exempt and omission preserves sampling. */
  sampleSpacing?: number;

  /**
   * Derive metric fields from this instance's actual surface attachments. Borrow the unchanged host without mutation and return engine metre vectors; the coordinator compiles fields before optional shared sampling.
   *
   * @evidence contracts/common.md#principled-implementation Host attachment positions and normal directions locate compact metre-space deformation fields on the same pre-layer skin for every provider.
   * @evidence contracts/common.md#clear-and-simple-design The callback owns its anatomical field coefficients; the coordinator owns stable ordering, graph-distance masking, refinement and engine admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The borrowed host is not runtime-frozen, so callback mutation would violate the common basis premise; generated fields do not establish clinical constitutive behavior.
   * @evidence contracts/common.md#meaningful-documentation Prose states host borrowing/purity, metre output vectors and field compilation before optional sampling.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This fields signature evaluates no attachment or kernel; the concrete factory and surface-layer coordinator own field generation and deformation cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The callback declaration implements no compiled-field cache or geometry invalidation; the coordinator supplies the unchanged common host.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No field arrays or reader closures are acquired by this type; their actual producer and layer application own the values and lifetime.
   */
  fields: (host: IPortraitSurfaceHost) => IAutoMovieMeshDeformationField[];
}
