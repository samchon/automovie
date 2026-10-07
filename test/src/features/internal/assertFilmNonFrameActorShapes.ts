import { type IAutoMovieStagedSet, performShot } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  validSynthesizer,
} from "./filmFixtures";
import { createSkeleton } from "./fixtures";
import { hasViolation, namedFacts } from "./predicates";

/** Run the existing camera and malformed actor boundary assertions against the same staged set. */
export function assertFilmNonFrameActorShapes(
  staged: IAutoMovieStagedSet.ISuccess,
): void {
  const cameraGesture = performShot({
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
    skeleton: () => createSkeleton(),
  });
  TestValidator.equals(
    "non-frame camera actor rejected",
    namedFacts([
      ["refused", () => cameraGesture.success === false],
      [
        "violated",
        () => hasViolation(cameraGesture, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const objectActor = performShot({
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
    skeleton: () => createSkeleton(),
  });
  TestValidator.equals(
    "object actor rejected",
    namedFacts([
      ["refused", () => objectActor.success === false],
      [
        "violated",
        () => hasViolation(objectActor, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const nonStringActorEntry = performShot({
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
    skeleton: () => createSkeleton(),
  });
  TestValidator.equals(
    "non-string actor entry rejected",
    namedFacts([
      ["refused", () => nonStringActorEntry.success === false],
      [
        "violated",
        () =>
          hasViolation(nonStringActorEntry, "type", "$input.draft[0].actor[0]"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
