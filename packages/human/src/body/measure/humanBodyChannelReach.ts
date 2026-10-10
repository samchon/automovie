import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyChannelReach } from "../structures/IAutoMovieHumanBodyChannelReach";
import type { IAutoMovieHumanBodyBasisChannel } from "../structures/shape/IAutoMovieHumanBodyBasisChannel";

/**
 * Read how far a channel can be evaluated on its basis.
 *
 * A basis may lack some source targets (`unavailableTargets`). A corrective
 * whose target is missing cannot fire, so a channel that drives it can be
 * evaluated only up to the corrective's onset on that side; past it the
 * builder would need the missing target and refuses. The reach is the
 * channel's envelope cut at the nearest such onset on each side, with one
 * sentence per cut naming the missing target. A channel whose own endpoint
 * target is missing cannot be evaluated at all; that is the caller's
 * concern, read from the channel's targets. The measured solve brackets in
 * this reach, and the editors show it, so both agree on where a target is
 * refused.
 */
export function humanBodyChannelReach(
  basis: IAutoMovieHumanBodyBasis,
  channel: IAutoMovieHumanBodyBasisChannel,
): IAutoMovieHumanBodyChannelReach {
  const unavailable = new Set(basis.unavailableTargets ?? []);
  const limits: string[] = [];
  const onset = (side: "positive" | "negative"): number => {
    let limit = Infinity;
    for (const corrective of basis.correctives ?? [])
      if (unavailable.has(corrective.target))
        for (const input of corrective.inputs)
          if (
            "channel" in input &&
            input.channel === channel.id &&
            input.side === side
          ) {
            const at = input.onset ?? 0;
            limit = Math.min(limit, at);
            limits.push(
              `${side === "positive" ? "Above" : "Below"} weight ${side === "positive" ? at : -at} the source lacks ${corrective.target}.`,
            );
          }
    return limit;
  };
  return {
    maximum: Math.min(channel.maximum, onset("positive")),
    minimum: Math.max(channel.minimum, -onset("negative")),
    limits,
  };
}
