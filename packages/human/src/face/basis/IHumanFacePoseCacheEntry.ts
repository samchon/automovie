/**
 * The latest immutable pose result and the complete geometric input key.
 *
 * @evidence contracts/common.md#principled-implementation The key includes admitted weights and independent optical dimensions; appearance inputs do not alter the pose.
 * @evidence contracts/common.md#clear-and-simple-design One entry retains one result without an eviction policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuse requires identical geometry inputs.
 * @evidence contracts/common.md#meaningful-documentation Identifies the key's geometric responsibility.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Serialization transports quantities without conversion.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no measured value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission remains upstream.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no control.
 *
 * @author Samchon
 */
export interface IHumanFacePoseCacheEntry<T> {
  /** Exact serialized geometric input values. */
  key: string;

  /** Result treated as immutable by every downstream consumer. */
  result: T;
}
