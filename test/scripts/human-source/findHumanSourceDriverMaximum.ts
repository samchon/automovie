import type { IHumanSourceGenerationChannel } from "./structures/IHumanSourceGenerationChannel.ts";
import type { IHumanSourceGenerationCorrective } from "./structures/IHumanSourceGenerationCorrective.ts";

/**
 * A conservative bound on the gain of one body endpoint, used as the face
 * driver channel `driver:<endpoint>`'s admitted maximum.
 *
 * The person builder's gain of an endpoint is the weight of the body channel
 * side it belongs to plus the activation of every body corrective targeting
 * it (`humanPersonBodyEndpointGains`). A side's weight reaches its envelope
 * (the channel maximum for the positive endpoint, minus the minimum for the
 * negative one), and an activation is capped at one, so the bound is that
 * envelope plus one per targeting corrective. Not all correctives need be
 * simultaneously attainable; this is not a clinical or attainable maximum.
 * The face and the body then
 * express the same macro value over the body's whole envelope and the seam
 * stays continuous. Beyond gain one the endpoint row is extrapolated
 * linearly, which the generation manifest records as a convention; within
 * [0, 1] nothing changes. An endpoint that two channel sides own, or that
 * nothing in the body can drive, refuses by name.
 */
export function findHumanSourceDriverMaximum(
  endpoint: string,
  bodyChannels: readonly IHumanSourceGenerationChannel[],
  bodyCorrectives: readonly IHumanSourceGenerationCorrective[],
): number {
  const sides: number[] = [];
  for (const channel of bodyChannels) {
    if (channel.positive === endpoint) sides.push(channel.maximum);
    if (channel.negative === endpoint) sides.push(-channel.minimum);
  }
  if (sides.length > 1) throw new Error(`Driver ${endpoint}: ${sides.length} body channel sides own it.`);
  const correctives = bodyCorrectives.filter((corrective) => corrective.target === endpoint).length;
  const maximum = (sides[0] ?? 0) + correctives;
  if (!(maximum > 0)) throw new Error(`Driver ${endpoint}: no body channel side or corrective drives it.`);
  return maximum;
}
