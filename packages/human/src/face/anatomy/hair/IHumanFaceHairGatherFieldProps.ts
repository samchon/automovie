import type { IHumanFaceHairGatherAttachment } from "./IHumanFaceHairGatherAttachment";

/**
 * Current scalp geometry and one already resolved attachment compiled into the gathering direction field. Arrays remain caller-owned and must retain their admitted resident correspondence for the compilation.
 *
 * @evidence contracts/common.md#principled-implementation Current positions, original incidence, connected domain and resolved tie share resident correspondence so graph distances describe the same scalp.
 * @evidence contracts/common.md#clear-and-simple-design Compilation receives one geometry/attachment bundle, leaving neutral angular selection with the anchor resolver and contact with the integrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The inputs retain admitted source correspondence rather than loading a predefined path or remapping a failed domain to another scalp.
 * @evidence contracts/common.md#meaningful-documentation The fields state current metre positions, source corner indices, connected triangle ordinals and same-source anchor ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The graph-input declaration selects no priority or propagation strategy; createHumanFaceHairGatherField owns compilation over its vertices and edges.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Arrays remain caller-owned during compilation; the returned field's compiled snapshot is owned by the concrete factory, not cached by this argument.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Geometry buffers are borrowed for compilation, and this props type acquires no persistent handle or worker.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherFieldProps {
  /** Current head-frame positions in metres. */
  positions: readonly number[];

  /** Source triangle corner indices. */
  indices: readonly number[];

  /** Connected growth-domain triangle ordinals. */
  triangles: readonly number[];

  /** Attachment resolved from the same source and current geometry. */
  anchor: IHumanFaceHairGatherAttachment;
}
