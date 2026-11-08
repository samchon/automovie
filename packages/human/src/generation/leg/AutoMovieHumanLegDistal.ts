import type { IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanFootSource } from "../foot/AutoMovieHumanFootSource";

/**
 * Retain the unchanged named-thigh-and-later generating authority.
 *
 * @evidence contracts/common.md#principled-implementation Borrows the actual base's scalar/native owner and axis on the exact closed interval retained by LegProximal; no alternate whole leg is published.
 * @evidence contracts/common.md#clear-and-simple-design One bounded capability separates regional readings from explicit full-parent completion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changes no curve, parameter, bone, cap, tolerance or derivative availability and rejects every query outside its declared interval.
 * @evidence contracts/common.md#meaningful-documentation The physical domain is calibration mm; the full proximal source remains separately unresolved until its owner completes it.
 * @evidence contracts/performance.md#efficient-algorithms One original preparation precedes unchanged native station reads; this performs no trunk/tape solve or loft.
 * @evidence contracts/performance.md#reuse-equivalent-work Base, every coupled leg and foot retain this same authority object; only the proximal prefix changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One invocation owns this finite preparation; no global cache or previous-context result is used.
 */
export function AutoMovieHumanLegDistal(
  part: IAutoMovieViewPart,
  thigh: number,
): AutoMovieHumanFootSource.IRegion {
  const last: number = part.stations.at(-1)!;
  if (!(Number.isFinite(thigh) && thigh >= part.stations[0]! && thigh < last))
    throw new Error(
      "The retained distal authority needs its actual named thigh inside the original domain",
    );
  const domain: readonly [number, number] = [thigh, last];
  let original: AutoMovieHumanFootSource.ISource | undefined;
  return {
    name: part.name,
    axis: part.axis,
    domain,
    at(station: number): AutoMovieHumanFootSource.IStation {
      if (
        !(
          Number.isFinite(station) &&
          station >= domain[0] &&
          station <= domain[1]
        )
      )
        throw new Error(
          `${part.name}: query outside retained distal authority [${domain.join(", ")}] mm`,
        );
      original ??= AutoMovieHumanFootSource.prepare(part);
      return AutoMovieHumanFootSource.at(original, station);
    },
  };
}
