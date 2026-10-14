import type {
  IAutoMovieHumanBodyBasisChannel,
  IAutoMovieHumanBodyChannelScale,
} from "@automovie/human";

/**
 * Whether the body panel offers a channel as a measured control of its own.
 *
 * It is offered when the channel names its own rule in `HUMAN_BODY_MEASUREMENTS` and that rule evaluated at neutral and at the positive endpoint, and at the negative endpoint when the channel has one. A channel the rule cannot evaluate (a landmark missing, a plane with no closed loop) is not offered. A one-sided channel that only answers an anatomical target through the binding table (`upperarmFatRight` reading the left mid-upper-arm rule on the right arm) is not offered here either: the person editor's Anatomy group offers it by its request path, and a second row for the same channel would be a second input overwriting the same weight. The group list and the rows read this one predicate.
 *
 * @evidence contracts/common.md#principled-implementation Admission requires an own-ID measurement with non-null neutral and positive readings, plus a negative reading only when the channel declares that direction; bound-target-only measurements therefore cannot create duplicate detailed controls.
 * @evidence contracts/common.md#clear-and-simple-design One predicate is shared by group discovery and row rendering, keeping their definition of an independently measurable channel identical.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The predicate uses declared measurement identity and endpoint availability rather than a list of special channel names or a fabricated value for missing geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment states the own-rule and endpoint requirements, unavailable geometry cases and why anatomical-target-only bindings do not receive another detailed row.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of optional-field, identity and null checks gives constant time and space per channel without evaluating geometry again.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This predicate only reads an already computed channel scale and coordinates no requests or caches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only one borrowed measurement reference is read; no retained state, handle or task is acquired.
 *
 * @author Samchon
 */
export function bodyMeasuredChannel(
  channel: IAutoMovieHumanBodyBasisChannel,
  scale: IAutoMovieHumanBodyChannelScale | undefined,
): boolean {
  const measurement:
    | IAutoMovieHumanBodyChannelScale["measurement"]
    | undefined = scale?.measurement;
  return (
    measurement !== null &&
    measurement !== undefined &&
    measurement.id === channel.id &&
    measurement.neutral !== null &&
    measurement.positive !== null &&
    (channel.negative === null || measurement.negative !== null)
  );
}
