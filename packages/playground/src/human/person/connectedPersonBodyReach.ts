import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import type { IConnectedPersonBodyReach } from "./IConnectedPersonBodyReach";

/**
 * Read which body channels a person generation's body view can evaluate.
 *
 * A source target the generation does not carry is unavailable. A channel
 * whose own endpoint is unavailable cannot be evaluated at all and is listed
 * as missing with that target named. A channel that drives an unavailable
 * envelope corrective can be evaluated up to the corrective's onset; its
 * reach ends there and the reason names the corrective. The panel shows both
 * and the measured solve brackets within this reach, so a target past it is
 * refused by the inverse with the reach it found; a document that asks past
 * it is refused by the runtime with the missing target named. Nothing is
 * hidden or silently clamped in the document.
 *
 * @author Samchon
 */
export function connectedPersonBodyReach(body: IAutoMovieHumanBodyBasis): IConnectedPersonBodyReach {
  const unavailable = new Set(body.unavailableTargets ?? []);
  const limits = new Map<string, string[]>();
  const onset = (channel: string, side: "positive" | "negative"): number => {
    let limit = Infinity;
    for (const corrective of body.correctives ?? [])
      if (unavailable.has(corrective.target))
        for (const input of corrective.inputs)
          if ("channel" in input && input.channel === channel && input.side === side) {
            const at = input.onset ?? 0;
            limit = Math.min(limit, at);
            limits.set(channel, [
              ...(limits.get(channel) ?? []),
              `${side === "positive" ? "Above" : "Below"} weight ${side === "positive" ? at : -at} the source lacks ${corrective.target}.`,
            ]);
          }
    return limit;
  };
  const missing = body.channels.filter(
    (channel) => unavailable.has(channel.positive) || (channel.negative !== null && unavailable.has(channel.negative)),
  );
  return {
    basis: {
      ...body,
      channels: body.channels
        .filter((channel) => !missing.includes(channel))
        .map((channel) => ({
          ...channel,
          maximum: Math.min(channel.maximum, onset(channel.id, "positive")),
          minimum: Math.max(channel.minimum, -onset(channel.id, "negative")),
        })),
    },
    missing,
    limits,
  };
}
