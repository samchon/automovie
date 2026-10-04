/**
 * One figure instance's physical sample registration for a connected surface.
 *
 * `samples` holds one canonical sample ID per connected-surface vertex, in
 * vertex order, captured before any UV split. The region gatherer maps them
 * through the same source-to-UV table as positions, so attribute aliases of a
 * source point keep one identity. `domain` names the current figure instance
 * and registered generation (`humanPhysicalSourceDomain`), not a normal island
 * or the generation alone.
 *
 * @evidence contracts/common.md#principled-implementation Identity follows caller-owned canonical samples through the existing correspondence instead of coordinate coincidence.
 * @evidence contracts/common.md#clear-and-simple-design Two named fields replace an anonymous registration object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UV ordinals, normal islands and contact never become sample identity.
 * @evidence contracts/common.md#meaningful-documentation States alignment, the domain's meaning and its producer.
 * @evidence contracts/modeling.md#spatial-conventions Sample IDs are dimensionless and aligned with the connected surface's vertex order.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Identifies physical points, not parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The gatherer emits geometry; registration adds no vertex or triangle.
 * @evidence contracts/modeling.md#shared-boundaries Material and UV aliases of one source point receive the same instance-bound identity.
 * @evidenceExclude contracts/modeling.md#rendered-observation Builders own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Identifies supplied geometry, not an anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal registration, not a sculpt input.
 * @author Samchon
 */
export interface IHumanPhysicalSampleRegistration {
  /** Nonblank instance-and-generation domain of every sample. */
  domain: string;
  /** Non-negative safe-integer sample ID per connected-surface vertex. */
  samples: readonly number[];
}
