import { performShot, stageScene } from "@automovie/engine";
import {
  type IAutoMoviePerformedShot,
  IAutoMovieShotPerformance,
  type IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../../../internal/filmFixtures";

/**
 * Performs an invalid draft replaced by revise.final and checks success, the sole performing knight and one camera reused by two frame actions.
 *
 * Scenarios:
 * 1. Preserves the unknown draft actor, valid replacement and same-camera reframing with null rig; null-final and rig-checked neighbors are separate entries.
 */
export function test_unit_engine_film_film_perform_shot_revised(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const performed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "ghost",
          start: 0,
          duration: 1,
          kind: "wave",
        },
      ],
      revise: {
        review: "the draft actor does not exist; recast to knightA.",
        final: [
          {
            verb: "gesture",
            actor: "knightA",
            start: 0,
            duration: 1,
            kind: "wave",
          },
          {
            verb: "frame",
            actor: "cam-main",
            start: 0,
            duration: "auto",
            framing: "medium",
            move: "static",
            on: { kind: "node", node: "knightA" },
          },
          {
            verb: "frame",
            actor: "cam-main",
            start: 1,
            duration: "auto",
            framing: "close",
            move: "push-in",
            on: { kind: "node", node: "knightA" },
          },
        ],
      },
    }),
    synthesize: validSynthesizer,
    skeleton: (): null => null,
  });
  TestValidator.equals("success", performed.success, true);
  if (performed.success !== true) return;
  TestValidator.equals(
    "final list performed",
    performed.shot.performances.map(
      (p: IAutoMovieShotPerformance): string => p.node,
    ),
    ["knightA"],
  );
  TestValidator.equals("live camera", performed.shot.camera, "cam-main");
}
