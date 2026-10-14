/**
 * One consumer's neutral and evaluated rest exterior in matching vertex order.
 *
 * A whole-person consumer supplies its complete head and body partitions in the same metre frame, so a head-only channel and a body channel displace the internal assembly against the same exterior. These are runtime-owned evaluated arrays, never personal vertices or independently authored skin. The caller owns source correspondence and the shared-boundary evaluation.
 *
 * @evidence contracts/common.md#principled-implementation Matching neutral/evaluated arrays in common metres give joined head/body displacement with exact vertex correspondence.
 * @evidence contracts/common.md#clear-and-simple-design The consumer owns shared-boundary samples while assembly reads one neutral/evaluated pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Runtime-generated partitions remain distinct from personal authored vertices or stored body documents.
 * @evidence contracts/common.md#meaningful-documentation Comments specify neutral immutability, matching evaluated order and caller-owned correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Exterior arrays supply results without implementing shared-boundary or displacement algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current paired arrays define no cached follower compilation themselves.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Exterior storage belongs to its consumer; this reference acquires no skin allocation or task.
 * @author Samchon
 */
export interface IHumanBodyExteriorRestReference {
  /** Immutable neutral exterior in common body metres. */
  neutral: readonly number[];

  /** Evaluated rest exterior in exactly the neutral array's vertex order. */
  evaluated: readonly number[];
}
