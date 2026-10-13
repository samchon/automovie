import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyToeMeasurements } from "./IAutoMovieHumanBodyToeMeasurements";
import type { IAutoMovieHumanBodyFootMeasurements } from "./IAutoMovieHumanBodyFootMeasurements";

/**
 * Answer each side's midfoot and toe bones with the current region generator's unavailable reports.
 *
 * This resolver does not inspect the connected basis or establish that its bones, sites or toe axes are absent. No qualified midfoot/toe landmark generator is registered here, so requests receive `missing-bone-landmark`. A requested biphalangeal lesser toe receives `anatomical-variant-absent`; no bone is removed from a source mesh. Observed requests receive `acquisition-not-registered` through the shared report helper. Foot exterior dimensions and coarse source parts are separate consumers.
 *
 * @evidence contracts/common.md#principled-implementation Forefoot reports enumerate fixed anatomical owners and delegate acquisition precedence; unsupported clinical generation remains explicit.
 * @evidence contracts/common.md#clear-and-simple-design The helper owns reason precedence while this resolver maps each side and toe ordinal to its request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Biphalangeal requests report variant absence without deleting bones or assuming default triphalangeal inputs.
 * @evidence contracts/common.md#meaningful-documentation Documentation states basis is not inspected and separates current generator limitations from source anatomy absence.
 * @evidence contracts/performance.md#efficient-algorithms Forty-eight fixed part reports visit each request subtree for acquisition detection; input size drives that helper cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Each toe request is read once per side/ordinal locally; reports depend on current requests and are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned forefoot array bounds report population by the fixed part list and acquires no geometry resources.
 */
export function resolveHumanBodyForefootParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const bone: AutoMovieHumanBodyAnatomicalUnavailableReason = "missing-bone-landmark";
  const toe: (request: IAutoMovieHumanBodyToeMeasurements | undefined) => "anatomical-variant-absent" | "missing-bone-landmark" = (request: IAutoMovieHumanBodyToeMeasurements | undefined): "anatomical-variant-absent" | "missing-bone-landmark" =>
    request?.phalangealPattern === "biphalangeal"
      ? ("anatomical-variant-absent" as const)
      : bone;
  const left: IAutoMovieHumanBodyFootMeasurements | undefined = input.targets?.leftLowerLimb?.foot;
  const right: IAutoMovieHumanBodyFootMeasurements | undefined = input.targets?.rightLowerLimb?.foot;
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
    ).flatMap(([ordinal, key]: readonly ["Second" | "Third" | "Fourth" | "Fifth", "secondToe" | "thirdToe" | "fourthToe" | "fifthToe"]): IAutoMovieHumanBodyPartResolution[] => {
      const l: IAutoMovieHumanBodyToeMeasurements | undefined = left?.[key];
      const r: IAutoMovieHumanBodyToeMeasurements | undefined = right?.[key];
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
