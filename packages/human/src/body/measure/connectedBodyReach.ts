import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisChannel,
} from "@automovie/human";
import type { IConnectedBodyReach } from "@automovie/human/body/measure/IConnectedBodyReach";
import { humanBodyChannelReach } from "@automovie/human/body/measure/humanBodyChannelReach";

/**
 * Read which body channels a person generation's body view can evaluate.
 *
 * A source target the generation does not carry is unavailable. A channel whose own endpoint is unavailable cannot be evaluated at all and is listed as missing with that target named. A channel that drives an unavailable envelope corrective can be evaluated up to the corrective's onset; its reach ends there and the reason names the corrective (`humanBodyChannelReach`, the reach the builder's solve brackets in). The panel shows both and the measured solve brackets within this reach, so a target past it is refused by the inverse with the reach it found; a document that asks past it is refused by the runtime with the missing target named. Nothing is hidden or silently clamped in the document.
 *
 * @evidence contracts/common.md#principled-implementation Missing endpoint targets remove a channel from evaluable reach, while the shared Human reach owner shortens available domains at missing corrective onset without mutating the original basis or authored document.
 * @evidence contracts/common.md#clear-and-simple-design The helper derives usable channels, disabled originals and named limitations together; numerical reach rules remain with the Human owner and DOM presentation with the panels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing endpoints receive no invented geometry, and shortened solver bounds remain distinct from silently clamping authored document weights.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes missing endpoints from corrective onset, describes named refusal and preserves original document intent.
 * @evidence contracts/performance.md#efficient-algorithms One outer c-channel scan replaces repeated missing-array membership tests; each available channel's shared reach call rebuilds u unavailable-target references and scans h correctives plus i inputs, costing O(c(u+h+i)) overall with O(c+u+n) retained output for n limitation sentences.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous reach derivation retains no cross-basis cache; mounting panels compute one view for their admitted immutable basis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result retains copied available channel rows, original missing rows and limitation strings while sharing the remaining basis data; no worker or renderer handle is acquired.
 */
export function connectedBodyReach(
  body: IAutoMovieHumanBodyBasis,
): IConnectedBodyReach {
  const unavailable: Set<string> = new Set(body.unavailableTargets ?? []);
  const limits: Map<string, string[]> = new Map();
  const missing: IAutoMovieHumanBodyBasisChannel[] = [];
  const channels: IAutoMovieHumanBodyBasisChannel[] = [];
  for (const channel of body.channels) {
    if (
      unavailable.has(channel.positive) ||
      (channel.negative !== null && unavailable.has(channel.negative))
    ) {
      missing.push(channel);
      continue;
    }
    const reach: ReturnType<typeof humanBodyChannelReach> =
      humanBodyChannelReach(body, channel);
    if (reach.limits.length !== 0) limits.set(channel.id, reach.limits);
    channels.push({
      ...channel,
      maximum: reach.maximum,
      minimum: reach.minimum,
    });
  }
  return {
    basis: {
      ...body,
      channels,
    },
    missing,
    limits,
  };
}
