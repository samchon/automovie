import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { HumanPopulationAnchors, f1, f2 } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `HumanPopulationAnchors.ratio` carries a course the survey does not measure
 * by the surveyed measure nearest it: the mean, over the sex's reference
 * people, of the course over what the survey expects of its carrier given their
 * own inputs. A carrier that is itself given is expected at the reference's own
 * value.
 *
 * The reference women are `f1` and `f2`.
 *
 * Scenarios:
 *
 * 1. The thumb rides the hand length, given the hand length: the ratio is the two
 *    women's mean thumb over hand length.
 * 2. The head above nasion rides the head length, given the head length: the mean
 *    of their head height less face height over head length.
 * 3. Every anchor carries a positive ratio for both sexes.
 */
export function test_unit_motions_executable_human_population_anchors_ratio(): void {
  const women: IAutoMovieHumanParameters[] = [f1, f2];
  const mean = (read: (p: IAutoMovieHumanParameters) => number): number =>
    women.reduce(
      (sum: number, p: IAutoMovieHumanParameters): number => sum + read(p),
      0,
    ) / women.length;

  // 1. The thumb.
  TestValidator.predicate(
    "the mean thumb over hand length",
    nclose(
      HumanPopulationAnchors.ratio(
        "female",
        HumanPopulationAnchors.ANCHORS.thumbLength,
      ),
      mean(
        (p: IAutoMovieHumanParameters): number =>
          p.extremities!.hands!.left.thumbLength /
          p.extremities!.hands!.left.handLength,
      ),
      1e-12,
    ),
  );

  // 2. The head above nasion.
  TestValidator.predicate(
    "the mean vertex-to-nasion over head length",
    nclose(
      HumanPopulationAnchors.ratio(
        "female",
        HumanPopulationAnchors.ANCHORS.vertexToNasion,
      ),
      mean(
        (p: IAutoMovieHumanParameters): number =>
          (p.head.height - p.head.faceHeight) / p.head.length,
      ),
      1e-12,
    ),
  );

  // 3. Every anchor.
  TestValidator.predicate(
    "every anchor positive",
    Object.values(HumanPopulationAnchors.ANCHORS).every(
      (anchor: HumanPopulationAnchors.IAnchor): boolean =>
        HumanPopulationAnchors.ratio("female", anchor) > 0 &&
        HumanPopulationAnchors.ratio("male", anchor) > 0,
    ),
  );
}
