import { IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot, type IAutoMovieStagedSet, performShot } from "@automovie/engine";


import {
  makePerformanceWrite,
  makeScriptWrite,
  validSynthesizer,
} from "./filmFixtures";
import { createSkeleton } from "./fixtures";
import { hasViolation, namedFacts } from "./predicates";

/** Run the existing non-frame camera actor, object actor and null list-entry cases against the supplied staged set. test_film_perform_shot_bad_refs owns these portable real performShot refusals and their exact actor paths; namedFacts stops within a group at the first false guard, and this helper creates no host or dynamically registered test. */
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

  const objectActor: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "locomote",
          actor: {} as never,
          start: 0,
          duration: 1,
          gait: "walk",
          to: { kind: "point", point: { x: 1, y: 0, z: 0 } },
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "object actor rejected",
    namedFacts([
      ["refused", (): boolean => objectActor.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(objectActor, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const nonStringActorEntry: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: [null] as never,
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
    "non-string actor entry rejected",
    namedFacts([
      ["refused", (): boolean => nonStringActorEntry.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(nonStringActorEntry, "type", "$input.draft[0].actor[0]"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
