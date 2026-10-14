import type {
  IAutoMovieHumanBodyBasisChannel,
  IAutoMovieHumanBodyChannelScale,
} from "@automovie/human";

import { bodyMeasuredChannel } from "./bodyMeasuredChannel";

/**
 * The channel groups whose controls the body panel can state in millimetres.
 *
 * A group is listed when at least one of its channels is a measured control of its own (`bodyMeasuredChannel`): its own rule evaluated at its endpoints, and not a one-sided channel that only answers an anatomical target. A group is listed once, in the order its first measurable channel appears in the basis, so the panel's group menu follows the basis and not an alphabetical or hand-kept list. Pure; the panel owns the DOM it builds from this.
 *
 * @evidence contracts/common.md#principled-implementation Filtering with the shared own-measurement predicate and insertion-ordered Set deduplication preserves the first qualifying channel's group order without requiring an authored group catalogue.
 * @evidence contracts/common.md#clear-and-simple-design The helper derives menu group names from basis channels and scale data while DOM creation stays with the body panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Group eligibility is computed from actual measurement availability, without subject-specific lists or hidden groups inserted to match a fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states own-rule eligibility, exclusion of bound-target-only channels, stable first-measurable order and caller ownership of menu DOM.
 * @evidence contracts/performance.md#efficient-algorithms One scan of c channels performs O(c) expected time with constant-time scale-map access; the insertion-ordered Set and output retain only g qualifying distinct groups, without filtered channel or repeated-group arrays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Group derivation is one synchronous query over supplied readings and maintains no cross-render cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Intermediate channel and group collections end with the call and only the returned string array survives; no external resources are opened.
 */
export function bodyMeasuredGroups(
  channels: readonly IAutoMovieHumanBodyBasisChannel[],
  scales: ReadonlyMap<string, IAutoMovieHumanBodyChannelScale>,
): string[] {
  const groups: Set<string> = new Set();
  for (const channel of channels)
    if (bodyMeasuredChannel(channel, scales.get(channel.id)))
      groups.add(channel.group);
  return [...groups];
}
