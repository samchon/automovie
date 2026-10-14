import {
  IAutoMovieShotPerformance,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/**
 * Performs the coherent duel and checks shot/camera identities and clips, actor motion joins, clocks, positive repeat and a staged-node reach target.
 *
 * Scenarios:
 * 1. Preserve authored shot/camera identities, two-second clip clocks and both actor-motion joins with zero offsets.
 * 2. Admit positive integer repeat with the existing fixture synthesizer.
 * 3. Admit a reach to a staged node with the same synthesizer.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs the coherent duel and checks shot/camera identities and clips, actor motion joins, clocks, positive repeat and a staged-node reach target.
 * @evidence contracts/testing.md#independent-expectations Authored beat/scene/camera ids determine output identity and two seconds determine duration within canonical 1e-6 predicates. Each performance must reference its own emitted motion, which is a join consistency check. Repeat and reach observe admission only, without independently measuring repeated motion content, reach geometry or pixels.
 * @evidence contracts/testing.md#distinguishing-cases Retains the two-actor draft with null final, camera motion, zero offsets, integer repeat and positional reach; invalid input and ROM excess are separate entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_valid unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_valid(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const performed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("success", performed.success, true);
  if (performed.success !== true) return;

  TestValidator.equals("shot id", performed.shot.id, "shot:beat-1");
  TestValidator.equals("shot name", performed.shot.name, "the charge");
  TestValidator.equals("shot scene", performed.shot.scene, "scene-duel");
  TestValidator.equals("live camera", performed.shot.camera, "cam-main");
  TestValidator.predicate("shot duration", nclose(performed.shot.duration, 2));

  TestValidator.predicate(
    "frame action compiled into a camera clip",
    performed.shot.cameraMotion !== null,
  );
  if (performed.shot.cameraMotion !== null) {
    TestValidator.equals(
      "camera clip id",
      performed.shot.cameraMotion.id,
      "cam:beat-1",
    );
    TestValidator.equals(
      "camera clip drives the live camera",
      performed.shot.cameraMotion.tracks.map((t: IAutoMovieTrack): string =>
        t.channel.kind === "node" ? t.channel.node : "",
      ),
      ["cam-main", "cam-main"],
    );
    TestValidator.predicate(
      "camera clip spans the shot",
      nclose(performed.shot.cameraMotion.duration, 2),
    );
  }

  TestValidator.equals(
    "one performance per knight",
    performed.shot.performances
      .map((p: IAutoMovieShotPerformance): string => p.node)
      .sort((a: string, b: string): number => a.localeCompare(b)),
    ["knightA", "knightB"],
  );
  for (const p of performed.shot.performances) {
    TestValidator.equals(
      `motion id of ${p.node}`,
      p.motion,
      performed.motions[p.node]!.id,
    );
    TestValidator.predicate(
      `start offset of ${p.node}`,
      nclose(p.startOffset, 0),
    );
  }

  const repeated: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "knightA",
          start: 0,
          duration: 2,
          repeat: 2,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "positive integer repeat accepted",
    repeated.success,
    true,
  );

  const reaching: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "reach",
          actor: "knightA",
          start: 0,
          duration: 1,
          hand: "right",
          to: { kind: "node", node: "knightB" },
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "positional reach target accepted",
    reaching.success,
    true,
  );
}
