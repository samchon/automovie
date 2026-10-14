/**
 * The timeline a production asserts its events happened on.
 *
 * This chronology is independent of edit order: pinned shots may overlap or move backward relative to the preceding cut.
 *
 * Declaring the clock admits shot pins and cross-shot criteria; omission asserts no story-time relationship.
 *
 * @evidence contracts/common.md#principled-implementation An explicit second-based epoch establishes the common chronology on which affine shot pins place realized events and cross-shot synchronization compares their times.
 * @evidence contracts/common.md#clear-and-simple-design The clock defines only units and epoch while each shot owns its origin and rate, keeping narrative chronology separate from film presentation placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Story time is not inferred from edit order; absent clock means pins and cross-shot criteria are inadmissible rather than silently sharing an invented epoch.
 * @evidence contracts/common.md#meaningful-documentation Defines epoch, second units, independent chronology and the admission effect of declaring or omitting the clock.
 * @author Samchon
 */
export interface IAutoMovieStoryClock {
  /** Story-clock unit. */
  units: "second";

  /** Non-blank statement of what story time zero denotes. */
  epoch: string;
}
