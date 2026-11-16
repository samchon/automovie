import type { HumanSegment } from "./HumanSegment";

/**
 * Select a placed carrier for an exact film second in placement order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns the last matching placed action used by displayed poses, posture reads and layer action contexts.
 * @evidence contracts/development/design.md#principled-representation Reads existing segment entry seconds and returns a borrowed segment, without a new timing or cache representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One last-match selector serves three existing readers and does not own their pose, layer or cache policies.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses placement order without assuming chronological sorting or constructing a time index.
 */
export namespace HumanSegmentSelection {
  /**
   * The last placed segment entered by a second, with the existing endpoint
   * allowance. State construction and placement own the dense segment list.
   *
   * @param segments The unchanged placement-order array, initialized empty and populated by placement pushes.
   * @param seconds Film seconds.
   * @returns The last matching segment reference, or none before any entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States placement-order priority, dense input ownership, the film second and borrowed or absent result.
   * @evidence contracts/development/implementation.md#principled-implementation The first match from the array's end is exactly the last match of the prior forward scan, even when entry seconds are unsorted; the existing seconds plus 1e-12 comparison is unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Return for an empty array, compute the same comparison limit once and stop a reverse scan at its first match.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not sort, merge, clamp or sample entries; duplicate/equal entries retain last-placement priority and no selected evaluator is replaced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Uses O(R) comparisons for R inspected entries, at most S for S segments; a matching final segment needs one comparison. Auxiliary space is O(1), with no reversed array, callback, new runtime API or index cache.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Three readers share one selection rule and one scalar limit per query; no result persists across mutable placement or public query lifetimes.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state and returns the existing borrowed segment reference.
   */
  export function last(
    segments: readonly HumanSegment.ISegment[],
    seconds: number,
  ): HumanSegment.ISegment | undefined {
    if (segments.length === 0) return undefined;
    const limit: number = seconds + 1e-12;
    for (let index: number = segments.length - 1; index >= 0; --index) {
      const segment: HumanSegment.ISegment = segments[index];
      if (segment.entryTime <= limit) return segment;
    }
    return undefined;
  }
}
