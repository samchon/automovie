import { type IAutoMovieHumanBodyBasis, humanBodyChannelReach } from "@automovie/human";

import type { IConnectedBodyReach } from "./IConnectedBodyReach";

/**
 * Read which body channels a person generation's body view can evaluate.
 *
 * A source target the generation does not carry is unavailable. A channel
 * whose own endpoint is unavailable cannot be evaluated at all and is listed
 * as missing with that target named. A channel that drives an unavailable
 * envelope corrective can be evaluated up to the corrective's onset; its
 * reach ends there and the reason names the corrective
 * (`humanBodyChannelReach`, the reach the builder's solve brackets in). The panel shows both
 * and the measured solve brackets within this reach, so a target past it is
 * refused by the inverse with the reach it found; a document that asks past
 * it is refused by the runtime with the missing target named. Nothing is
 * hidden or silently clamped in the document.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Determines which body channels the editor can offer on a generation's body view.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Lists channels whose endpoint is unavailable as missing and limits the rest to the reach the view evaluates.
 * @author Samchon
 */
export function connectedBodyReach(body: IAutoMovieHumanBodyBasis): IConnectedBodyReach {
  const unavailable = new Set(body.unavailableTargets ?? []);
  const limits = new Map<string, string[]>();
  const missing = body.channels.filter(
    (channel) => unavailable.has(channel.positive) || (channel.negative !== null && unavailable.has(channel.negative)),
  );
  return {
    basis: {
      ...body,
      channels: body.channels
        .filter((channel) => !missing.includes(channel))
        .map((channel) => {
          const reach = humanBodyChannelReach(body, channel);
          if (reach.limits.length !== 0) limits.set(channel.id, reach.limits);
          return { ...channel, maximum: reach.maximum, minimum: reach.minimum };
        }),
    },
    missing,
    limits,
  };
}
