import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyToeMeasurements } from "./IAutoMovieHumanBodyToeMeasurements";

/**
 * Answer each side's midfoot bones and every toe ray's bones.
 *
 * The connected source moves all toes on one joint and registers no bony
 * landmark of the navicular, cuboid, cuneiforms, metatarsals or phalanges;
 * its per-toe points are rig joint positions without bones or skin weights.
 * Each bone is therefore `missing-bone-landmark`. Those points follow a
 * two-phalanx hallux and three-phalanx lesser toes, so a request for a
 * biphalangeal lesser toe refuses that ray's bones as
 * `anatomical-variant-absent` rather than deleting a phalanx from a
 * three-phalanx source. An observed value refuses its bone as
 * `acquisition-not-registered`. Foot length and breadth belong to the skin.
 *
 * @author Samchon
 */
export function resolveHumanBodyForefootParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const bone = "missing-bone-landmark" as const;
  const toe = (request: IAutoMovieHumanBodyToeMeasurements | undefined) =>
    request?.phalangealPattern === "biphalangeal"
      ? ("anatomical-variant-absent" as const)
      : bone;
  const left = input.targets?.leftLowerLimb?.foot;
  const right = input.targets?.rightLowerLimb?.foot;
  return [
    humanBodyUnavailablePart("leftNavicular", left?.midfoot?.navicular, bone),
    humanBodyUnavailablePart("rightNavicular", right?.midfoot?.navicular, bone),
    humanBodyUnavailablePart("leftCuboid", left?.midfoot?.cuboid, bone),
    humanBodyUnavailablePart("rightCuboid", right?.midfoot?.cuboid, bone),
    humanBodyUnavailablePart(
      "leftMedialCuneiform",
      left?.midfoot?.medialCuneiform,
      bone,
    ),
    humanBodyUnavailablePart(
      "rightMedialCuneiform",
      right?.midfoot?.medialCuneiform,
      bone,
    ),
    humanBodyUnavailablePart(
      "leftIntermediateCuneiform",
      left?.midfoot?.intermediateCuneiform,
      bone,
    ),
    humanBodyUnavailablePart(
      "rightIntermediateCuneiform",
      right?.midfoot?.intermediateCuneiform,
      bone,
    ),
    humanBodyUnavailablePart(
      "leftLateralCuneiform",
      left?.midfoot?.lateralCuneiform,
      bone,
    ),
    humanBodyUnavailablePart(
      "rightLateralCuneiform",
      right?.midfoot?.lateralCuneiform,
      bone,
    ),
    humanBodyUnavailablePart(
      "leftHalluxFirstMetatarsal",
      left?.hallux?.firstMetatarsal,
      bone,
    ),
    humanBodyUnavailablePart(
      "rightHalluxFirstMetatarsal",
      right?.hallux?.firstMetatarsal,
      bone,
    ),
    humanBodyUnavailablePart(
      "leftHalluxProximalPhalanx",
      left?.hallux?.proximalPhalanx,
      bone,
    ),
    humanBodyUnavailablePart(
      "rightHalluxProximalPhalanx",
      right?.hallux?.proximalPhalanx,
      bone,
    ),
    humanBodyUnavailablePart(
      "leftHalluxDistalPhalanx",
      left?.hallux?.distalPhalanx,
      bone,
    ),
    humanBodyUnavailablePart(
      "rightHalluxDistalPhalanx",
      right?.hallux?.distalPhalanx,
      bone,
    ),
    ...(
      [
        ["Second", "secondToe"],
        ["Third", "thirdToe"],
        ["Fourth", "fourthToe"],
        ["Fifth", "fifthToe"],
      ] as const
    ).flatMap(([ordinal, key]) => {
      const l = left?.[key];
      const r = right?.[key];
      return [
        humanBodyUnavailablePart(
          `left${ordinal}ToeMetatarsal`,
          l?.metatarsal,
          toe(l),
        ),
        humanBodyUnavailablePart(
          `right${ordinal}ToeMetatarsal`,
          r?.metatarsal,
          toe(r),
        ),
        humanBodyUnavailablePart(
          `left${ordinal}ToeProximalPhalanx`,
          l?.proximalPhalanx,
          toe(l),
        ),
        humanBodyUnavailablePart(
          `right${ordinal}ToeProximalPhalanx`,
          r?.proximalPhalanx,
          toe(r),
        ),
        humanBodyUnavailablePart(
          `left${ordinal}ToeMiddlePhalanx`,
          l?.middlePhalanx,
          toe(l),
        ),
        humanBodyUnavailablePart(
          `right${ordinal}ToeMiddlePhalanx`,
          r?.middlePhalanx,
          toe(r),
        ),
        humanBodyUnavailablePart(
          `left${ordinal}ToeDistalPhalanx`,
          l?.distalPhalanx,
          toe(l),
        ),
        humanBodyUnavailablePart(
          `right${ordinal}ToeDistalPhalanx`,
          r?.distalPhalanx,
          toe(r),
        ),
      ];
    }),
  ];
}
