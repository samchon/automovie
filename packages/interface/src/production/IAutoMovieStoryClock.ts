/**
 * The timeline a production asserts its events happened on.
 *
 * This chronology is independent of edit order: pinned shots may overlap or
 * move backward relative to the preceding cut.
 *
 * Declaring the clock admits shot pins and cross-shot criteria; omission
 * asserts no story-time relationship.
 */
export interface IAutoMovieStoryClock {
  /** Story-clock unit. */
  units: "second";

  /** Non-blank statement of what story time zero denotes. */
  epoch: string;
}
