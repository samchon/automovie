import type { IAutoMovieHumanBodyBasisChannel, IAutoMovieHumanBodyChannelScale } from "@automovie/human";

import { bodyMeasuredChannel } from "./bodyMeasuredChannel";

/**
 * The channel groups whose controls the body panel can state in millimetres.
 *
 * A group is listed when at least one of its channels is a measured control
 * of its own (`bodyMeasuredChannel`): its own rule evaluated at its
 * endpoints, and not a one-sided channel that only answers an anatomical
 * target. A group is listed once, in the order its first measurable channel
 * appears in the basis, so the panel's group menu follows the basis and not an
 * alphabetical or hand-kept list. Pure; the panel owns the DOM it builds from
 * this.
 */
export function bodyMeasuredGroups(
  channels: readonly IAutoMovieHumanBodyBasisChannel[],
  scales: ReadonlyMap<string, IAutoMovieHumanBodyChannelScale>,
): string[] {
  return [
    ...new Set(
      channels.filter((channel) => bodyMeasuredChannel(channel, scales.get(channel.id))).map((channel) => channel.group),
    ),
  ];
}
