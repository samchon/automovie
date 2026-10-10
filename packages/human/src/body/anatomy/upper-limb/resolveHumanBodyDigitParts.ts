import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's thumb and finger bones: the thumb's first metacarpal,
 * proximal and distal phalanges, and each finger's metacarpal and three
 * phalanges.
 *
 * Unlike the carpus, every ray has rig joint centres at its CMC, MCP and
 * interphalangeal joints, which approximate the articular centres a phalanx
 * length is defined between. What is missing is the bone itself: no
 * generator with held-out surface validation produces a metacarpal or
 * phalanx, so each is `geometry-not-validated`. The whole-hand finger
 * length, diameter and spacing channels move all rays together and are no
 * per-ray measurement. The thumb has no middle phalanx. An observed value in
 * a part's request refuses it as `acquisition-not-registered`.
 *
 * @author Samchon
 */
export function resolveHumanBodyDigitParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const reason = "geometry-not-validated" as const;
  return (["left", "right"] as const).flatMap((side) => {
    const hand = input.targets?.[`${side}UpperLimb`]?.hand;
    return [
      humanBodyUnavailablePart(
        `${side}ThumbFirstMetacarpal` as const,
        hand?.thumb?.firstMetacarpal,
        reason,
      ),
      humanBodyUnavailablePart(
        `${side}ThumbProximalPhalanx` as const,
        hand?.thumb?.proximalPhalanx,
        reason,
      ),
      humanBodyUnavailablePart(
        `${side}ThumbDistalPhalanx` as const,
        hand?.thumb?.distalPhalanx,
        reason,
      ),
      ...(
        [
          ["IndexFinger", "indexFinger"],
          ["MiddleFinger", "middleFinger"],
          ["RingFinger", "ringFinger"],
          ["LittleFinger", "littleFinger"],
        ] as const
      ).flatMap(([name, key]) => [
        humanBodyUnavailablePart(
          `${side}${name}Metacarpal` as const,
          hand?.[key]?.metacarpal,
          reason,
        ),
        humanBodyUnavailablePart(
          `${side}${name}ProximalPhalanx` as const,
          hand?.[key]?.proximalPhalanx,
          reason,
        ),
        humanBodyUnavailablePart(
          `${side}${name}MiddlePhalanx` as const,
          hand?.[key]?.middlePhalanx,
          reason,
        ),
        humanBodyUnavailablePart(
          `${side}${name}DistalPhalanx` as const,
          hand?.[key]?.distalPhalanx,
          reason,
        ),
      ]),
    ];
  });
}
