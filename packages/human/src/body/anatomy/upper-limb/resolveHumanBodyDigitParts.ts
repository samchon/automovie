import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyHandMeasurements } from "./IAutoMovieHumanBodyHandMeasurements";

/**
 * Answer each side's thumb and finger bones: the thumb's first metacarpal, proximal and distal phalanges, and each finger's metacarpal and three phalanges.
 *
 * No qualified metacarpal/phalange generator is registered by this resolver. It returns `geometry-not-validated` without inspecting the supplied basis or establishing the presence of CMC, MCP or interphalangeal landmarks. The thumb has one metacarpal and two phalanges; each other digit has one metacarpal and three phalanges. Observed values in each part request take precedence as `acquisition-not-registered`; whole-hand shape channels cannot substitute for per-ray measurements.
 *
 * @evidence contracts/common.md#principled-implementation Closed thumb and four-finger mappings preserve bilateral ray identities and explicit geometry-unvalidated results with request-local acquisition precedence.
 * @evidence contracts/common.md#clear-and-simple-design Thumb's distinct bone population stays explicit while one shared four-finger mapping covers identical component schemas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No basis inspection proves rig landmarks or bone surfaces; whole-hand length/diameter/spacing channels cannot satisfy independent ray anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose states fixed generation limits, thumb's absent middle phalanx and observed-request failure precedence.
 * @evidence contracts/performance.md#efficient-algorithms Two thumbs and eight non-thumb rays produce a fixed record population; observation scans visit only their respective bone requests.
 * @evidence contracts/performance.md#reuse-equivalent-work Side and finger mappings reuse schemas without sharing per-person bone results or caching request-dependent failures.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary ray arrays end after flatMap and new unavailable records escape; no hand basis or generated digit surface is retained.
 * @author Samchon
 */
export function resolveHumanBodyDigitParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const reason: AutoMovieHumanBodyAnatomicalUnavailableReason =
    "geometry-not-validated";
  return (["left", "right"] as const).flatMap(
    (side: "left" | "right"): IAutoMovieHumanBodyPartResolution[] => {
      const hand: IAutoMovieHumanBodyHandMeasurements | undefined =
        input.targets?.[`${side}UpperLimb`]?.hand;
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
        ).flatMap(
          ([name, key]: readonly [
            "IndexFinger" | "MiddleFinger" | "RingFinger" | "LittleFinger",
            "indexFinger" | "middleFinger" | "ringFinger" | "littleFinger",
          ]): IAutoMovieHumanBodyPartResolution[] => [
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
          ],
        ),
      ];
    },
  );
}
