import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyChannelReach } from "../structures/IAutoMovieHumanBodyChannelReach";
import type { IAutoMovieHumanBodyBasisChannel } from "../structures/shape/IAutoMovieHumanBodyBasisChannel";

/**
 * Read how far a channel can be evaluated on its basis.
 *
 * Missing corrective targets cut each side's declared channel envelope at the nearest matching driver's onset, before that missing displacement would activate. Reasons name every matching missing driver, not just the tightest cut. The channel's own missing endpoint target remains a separate caller responsibility. Measured inverses and editor reach displays share this source-evaluability interval; it is not a clinically certified physiological range.
 *
 * @evidence contracts/common.md#principled-implementation Missing-target membership selects matching channel/side drivers, whose nearest onset clips the admitted minimum/maximum before unavailable corrective activation.
 * @evidence contracts/common.md#clear-and-simple-design One source-reach helper supplies both editors and inverses while own endpoint availability stays with their channel admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interval prevents missing corrective displacement from being evaluated but cannot certify anatomy, clinical reach or the channel's own endpoint availability.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies source envelope units, both-side onset clipping, all recorded reasons and the independent missing-endpoint limit.
 * @evidence contracts/performance.md#efficient-algorithms One unavailable-target set and two driver scans cost linear target/driver work, avoiding trial geometry merely to determine declared source availability.
 * @evidence contracts/performance.md#reuse-equivalent-work Both sides share the unavailable set and the same onset rule; consumers reuse this owner rather than duplicating editor/solver limits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two scalar bounds and reason strings escape; the target set and local scan state expire without retaining basis geometry or a solve task.
 */
export function humanBodyChannelReach(
  basis: IAutoMovieHumanBodyBasis,
  channel: IAutoMovieHumanBodyBasisChannel,
): IAutoMovieHumanBodyChannelReach {
  const unavailable: Set<string> = new Set(basis.unavailableTargets ?? []);
  const limits: string[] = [];
  const onset: (side: "positive" | "negative") => number = (side: "positive" | "negative"): number => {
    let limit: number = Infinity;
    for (const corrective of basis.correctives ?? [])
      if (unavailable.has(corrective.target))
        for (const input of corrective.inputs)
          if (
            "channel" in input &&
            input.channel === channel.id &&
            input.side === side
          ) {
            const at: number = input.onset ?? 0;
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
