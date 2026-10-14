/**
 * The current closed collider whose original skin faces precede appended cap faces.
 *
 * @evidence contracts/common.md#principled-implementation Original skin faces remain the incidence prefix before appended closure caps, so sampled native triangle ordinals keep their meaning.
 * @evidence contracts/common.md#clear-and-simple-design A readonly position/index pair supplies the current closed collider to the incidence compiler without another topology wrapper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The compiler receives real current oriented geometry, not an independent raw body or fixture-specific support list.
 * @evidence contracts/common.md#meaningful-documentation The members state flat XYZ head metres, caller ownership and original incidence followed by cap faces.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The props declaration performs no welding or adjacency construction; the boundary compiler owns those complete-buffer scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Readonly borrowed arrays are compilation inputs, and the boundary factory copies them to preserve its own snapshot identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller buffers remain caller-owned during compilation; this argument does not retain a triangle-query cache.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootBoundaryProps {
  /** Flat current XYZ coordinates, head-frame metres, owned by the caller. */
  positions: readonly number[];

  /** Original oriented incidence plus the current cap's appended faces. */
  indices: readonly number[];
}
