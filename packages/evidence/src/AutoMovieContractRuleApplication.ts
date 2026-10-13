


/** Earliest operation at which one structured rule may be applied.
 *
 * @evidence contracts/common.md#principled-implementation Five closed application boundaries separate composition, observation, population, post-draft and revision routing.
 * @evidence contracts/common.md#clear-and-simple-design One union prevents arbitrary new timing strings from entering structured rule metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unproduced rule case is a declared routing identity, not authority to add a new runtime feature.
 * @evidence contracts/common.md#meaningful-documentation The comment states earliest safe operation for rule application.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The application-boundary literals erase without allocating routing state or acquiring a handle; parsed metadata retention belongs to readAutoMovieContractRules and its returned-record caller.
 */
export type AutoMovieContractRuleApplication =
  | "composition-safe"
  | "observation-only"
  | "population-distribution"
  | "post-draft-frequency"
  | "revision-only";
