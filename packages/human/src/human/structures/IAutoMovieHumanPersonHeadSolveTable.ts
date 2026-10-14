/**
 * Which head measurements the head solve meets, which it pursues second, and which face channels it moves (`HUMAN_PERSON_HEAD_SOLVE`).
 *
 * @evidence contracts/common.md#principled-implementation Primary measurement names, secondary least-squares names and movable channels define the bounded head-solve contract over existing measurement instruments.
 * @evidence contracts/common.md#clear-and-simple-design One policy table separates what must be met from what is pursued within the remaining freedom.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional secondary misses are reported rather than refused or hidden by an altered primary tolerance.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish met rules, optional secondary targets and face shape channels that the solve sets.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The primary and secondary head solve policy lists specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the primary and secondary head solve policy lists; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The primary and secondary head solve policy lists acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSolveTable {
  /** Names of `HUMAN_HEAD_MEASUREMENTS` rules the solve meets. */
  measurements: string[];

  /**
   * Names of rules the solve pursues second, by least squares within the freedom the met measurements leave; a target for one is optional and its miss is reported, never refused.
   */
  secondary: string[];

  /** Head view face shape channels the solve sets. */
  channels: string[];
}
