/**
 * The timeline a production asserts its events happened on.
 *
 * This chronology is independent of edit order: pinned shots may overlap or move backward relative to the preceding cut.
 *
 * Declaring the clock admits shot pins and cross-shot criteria; omission asserts no story-time relationship.
 *
 * @evidence contracts/development/design.md#principled-representation An explicit second-based epoch establishes the common chronology on which affine shot pins place realized events and cross-shot synchronization compares their times.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The clock defines only units and epoch while each shot owns its origin and rate, keeping narrative chronology separate from film presentation placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Story time is not inferred from edit order; absent clock means pins and cross-shot criteria are inadmissible rather than silently sharing an invented epoch.
 * @evidence contracts/development/common.md#meaningful-documentation Defines epoch, second units, independent chronology and the admission effect of declaring or omitting the clock.
 */
export interface IAutoMovieStoryClock {
  /** Story-clock unit. */
  units: "second";

  /** Non-blank statement of what story time zero denotes. */
  epoch: string;
}
