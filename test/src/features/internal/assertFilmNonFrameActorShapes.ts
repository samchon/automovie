import { performShot } from "@automovie/engine";
import {
  type IAutoMoviePerformedShot,
  IAutoMovieSkeleton,
  type IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  validSynthesizer,
} from "./filmFixtures";
import { createSkeleton } from "./fixtures";
import { hasViolation, namedFacts } from "./predicates";

/** Run the existing non-frame camera actor case against the supplied staged set. test_film_perform_shot_bad_refs owns this portable real performShot refusal and its exact actor path; namedFacts stops within a group at the first false guard, and this helper creates no host or dynamically registered test. */
export function assertFilmNonFrameActorShapes(
  staged: IAutoMovieStagedSet.ISuccess,
): void {
  const cameraGesture: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "cam-main",
          start: 0,
          duration: 1,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "non-frame camera actor rejected",
    namedFacts([
      ["refused", (): boolean => cameraGesture.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(cameraGesture, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
