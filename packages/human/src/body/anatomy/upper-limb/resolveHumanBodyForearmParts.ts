import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyForearmMeasurements } from "./IAutoMovieHumanBodyForearmMeasurements";

/**
 * Answer each side's radius, ulna, brachioradialis, flexor digitorum superficialis and extensor digitorum.
 *
 * No qualified radius, ulna or forearm-muscle generator is registered here. Fixed landmark and tissue causes report that limitation without inspecting the supplied basis. Each side's two bones and three muscle bellies remain separate; observed values in their own requests receive `acquisition-not-registered` precedence. Forearm twist or skin girth/length cannot establish radioulnar articulation or internal boundaries.
 *
 * @evidence contracts/common.md#principled-implementation Ten fixed unavailable results preserve separate bilateral forearm bones/muscles and shared request-local observation precedence.
 * @evidence contracts/common.md#clear-and-simple-design One side mapping owns named forearm components while the common unavailable helper detects observed acquisition requests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed causes cannot prove missing caller-source anatomy because basis is unread; exterior twist and dimensions cannot replace radioulnar or tissue geometry.
 * @evidence contracts/common.md#meaningful-documentation The prose states generation limits, component separation and acquisition precedence without asserting inspected source absence.
 * @evidence contracts/performance.md#efficient-algorithms Ten output records are constant-size and observed detection traverses only each supplied part subtree.
 * @evidence contracts/performance.md#reuse-equivalent-work Bilateral forearms reuse the same mapping/helper but distinct requests receive independently allocated failure records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local side arrays expire after composition; returned records retain no forearm mesh or borrowed basis.
 * @author Samchon
 */
export function resolveHumanBodyForearmParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const muscle: AutoMovieHumanBodyAnatomicalUnavailableReason =
    "missing-tissue-boundary";
  return (["left", "right"] as const).flatMap(
    (side: "left" | "right"): IAutoMovieHumanBodyPartResolution[] => {
      const forearm: IAutoMovieHumanBodyForearmMeasurements | undefined =
        input.targets?.[`${side}UpperLimb`]?.forearm;
      return [
        humanBodyUnavailablePart(
          `${side}Radius` as const,
          forearm?.radius,
          "missing-bone-landmark",
        ),
        humanBodyUnavailablePart(
          `${side}Ulna` as const,
          forearm?.ulna,
          "missing-bone-landmark",
        ),
        humanBodyUnavailablePart(
          `${side}Brachioradialis` as const,
          forearm?.brachioradialis,
          muscle,
        ),
        humanBodyUnavailablePart(
          `${side}FlexorDigitorumSuperficialis` as const,
          forearm?.flexorDigitorumSuperficialis,
          muscle,
        ),
        humanBodyUnavailablePart(
          `${side}ExtensorDigitorum` as const,
          forearm?.extensorDigitorum,
          muscle,
        ),
      ];
    },
  );
}
