/**
 * One source-native relief station and an optional source-reference offset.
 * The vertex comes from the shared anatomical registration, not a person's
 * sculpt input. A displacement uses head-frame metres and is converted by the
 * registered material chart's shape-only native reference before performance.
 *
 * @evidence contracts/common.md#principled-implementation A guide station names one registered native vertex; an optional head-frame displacement is converted on the same shape-only reference before current-state lifting.
 * @evidence contracts/common.md#clear-and-simple-design Vertex identity and optional reference displacement express a station without copying current positions into the material guide.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These are internal anatomical registration stations, not person-provided vertices; undefined displacement means the registered vertex itself, not an invented offset.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies native source ownership, metre units and conversion before performance; the chart validates coverage and finite XYZ.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The station type chooses no algorithm; its compiler owns coordinate and displacement registration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The station record has no cache or request coordination; material correspondence remains with its chart.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This record owns no handle or running task; guide-array lifetime belongs to its caller and compiler.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinMaterialGuidePoint {
  /** Native vertex of the shared source skin. */
  vertex: number;

  /** Optional authored guide displacement in source-reference head-frame metres. */
  displacement?: readonly number[];
}
