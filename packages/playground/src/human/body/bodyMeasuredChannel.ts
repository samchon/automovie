import type {
  IAutoMovieHumanBodyBasisChannel,
  IAutoMovieHumanBodyChannelScale,
} from "@automovie/human";

/**
 * Whether the body panel offers a channel as a measured control of its own.
 *
 * It is offered when the channel names its own rule in
 * `HUMAN_BODY_MEASUREMENTS` and that rule evaluated at neutral and at the
 * positive endpoint, and at the negative endpoint when the channel has one.
 * A channel the rule cannot evaluate (a landmark missing, a plane with no
 * closed loop) is not offered. A one-sided channel that only answers an
 * anatomical target through the binding table (`upperarmFatRight` reading
 * the left mid-upper-arm rule on the right arm) is not offered here either:
 * the person editor's Anatomy group offers it by its request path, and a
 * second row for the same channel would be a second input overwriting the
 * same weight. The group list and the rows read this one predicate.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Decides once which channels the body panel offers as millimetre controls.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps a bound one-sided channel to one row, under its anatomical path, instead of two inputs for one weight.
 * @author Samchon
 */
export function bodyMeasuredChannel(
  channel: IAutoMovieHumanBodyBasisChannel,
  scale: IAutoMovieHumanBodyChannelScale | undefined,
): boolean {
  const measurement = scale?.measurement;
  return (
    measurement !== null &&
    measurement !== undefined &&
    measurement.id === channel.id &&
    measurement.neutral !== null &&
    measurement.positive !== null &&
    (channel.negative === null || measurement.negative !== null)
  );
}
