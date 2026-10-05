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
 * @evidence contracts/common.md#principled-implementation Each part's reason names what the connected source lacks for it: the bone generator, not the joint centres.
 * @evidence contracts/common.md#clear-and-simple-design One answer per owned part from that part's own request subtree, rays and segments enumerated once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A whole-hand finger channel never answers one ray's bones.
 * @evidence contracts/common.md#meaningful-documentation States why the reason differs from the carpus and that the thumb has no middle phalanx.
 * @evidence contracts/modeling.md#part-identity-and-grouping Owns each side's three thumb bones and four bones of each finger.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It reads no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The exterior builder owns the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The exterior consumer displays the answers.
 * @evidence contracts/anatomy.md#anatomical-source The reasons state what the source lacks; no anatomical value is asserted.
 * @evidence contracts/anatomy.md#permitted-range Unregistered observations refuse with their cause and the request is left unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export function resolveHumanBodyDigitParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const reason = "geometry-not-validated" as const;
  return (["left", "right"] as const).flatMap((side) => {
    const hand = input.targets?.[`${side}UpperLimb`]?.hand;
    return [
      humanBodyUnavailablePart(`${side}ThumbFirstMetacarpal` as const, hand?.thumb?.firstMetacarpal, reason),
      humanBodyUnavailablePart(`${side}ThumbProximalPhalanx` as const, hand?.thumb?.proximalPhalanx, reason),
      humanBodyUnavailablePart(`${side}ThumbDistalPhalanx` as const, hand?.thumb?.distalPhalanx, reason),
      ...(
        [
          ["IndexFinger", "indexFinger"],
          ["MiddleFinger", "middleFinger"],
          ["RingFinger", "ringFinger"],
          ["LittleFinger", "littleFinger"],
        ] as const
      ).flatMap(([name, key]) => [
        humanBodyUnavailablePart(`${side}${name}Metacarpal` as const, hand?.[key]?.metacarpal, reason),
        humanBodyUnavailablePart(`${side}${name}ProximalPhalanx` as const, hand?.[key]?.proximalPhalanx, reason),
        humanBodyUnavailablePart(`${side}${name}MiddlePhalanx` as const, hand?.[key]?.middlePhalanx, reason),
        humanBodyUnavailablePart(`${side}${name}DistalPhalanx` as const, hand?.[key]?.distalPhalanx, reason),
      ]),
    ];
  });
}
