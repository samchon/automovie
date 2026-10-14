import {
  IAutoMovieActionCall,
  IAutoMovieMotion,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { IAutoMovieActionSynthesizer } from "../../../../packages/engine/src/perform/IAutoMovieActionSynthesizer";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const synth: IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
  actor: string,
): IAutoMovieMotion | null =>
  action.verb === "launch" || action.verb === "attachTo"
    ? null
    : validSynthesizer(action, actor);

/**
 * Performs launch, lookAt, reach, point gesture and attach drafts with matching blank staged references and checks each original located type violation.
 *
 * Scenarios:
 * 1. Retains tab projectile, space targets, singleton blank group and blank attachment parent in the original six-action draft; nonblank admission is covered by the respective launch/positional/mount entries.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs launch, lookAt, reach, point gesture and attach drafts with matching blank staged references and checks each original located type violation.
 * @evidence contracts/testing.md#independent-expectations Whitespace-only projectile, node target, group member and parent references are invalid even if the staged lookup contains them; the authored per-action field paths are independent expectations.
 * @evidence contracts/testing.md#distinguishing-cases Retains tab projectile, space targets, singleton blank group and blank attachment parent in the original six-action draft; nonblank admission is covered by the respective launch/positional/mount entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_secondary_nonempty_refs unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_secondary_nonempty_refs(): void {
  const script: IAutoMovieScript = makeScriptWrite();
  const baseStaged: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite(),
  );
  if (baseStaged.success !== true) throw new Error("staging must succeed");

  const blankTarget: IAutoMovieSceneNode = {
    ...baseStaged.scene.nodes[0]!,
    id: " ",
    transform: {
      ...baseStaged.scene.nodes[0]!.transform,
      translation: { x: 1.5, y: 0, z: 0 },
    },
  };
  const blankProjectile: IAutoMovieSceneNode = {
    ...baseStaged.scene.nodes[0]!,
    id: "\t",
    transform: {
      ...baseStaged.scene.nodes[0]!.transform,
      translation: { x: 0.2, y: 1, z: 0 },
    },
  };
  const arrow: IAutoMovieSceneNode = {
    ...baseStaged.scene.nodes[0]!,
    id: "arrow",
    transform: {
      ...baseStaged.scene.nodes[0]!.transform,
      translation: { x: 0, y: 1, z: 0 },
    },
  };
  const staged: IAutoMovieStagedSet.ISuccess = {
    ...baseStaged,
    scene: {
      ...baseStaged.scene,
      nodes: [...baseStaged.scene.nodes, blankTarget, blankProjectile, arrow],
    },
  };

  const performed: IAutoMoviePerformedShot = performShot({
    script,
    staged,
    performance: makePerformanceWrite({
      duration: 6,
      draft: [
        {
          verb: "launch",
          actor: "knightA",
          start: 0,
          duration: 0.4,
          projectile: "\t",
          at: { kind: "point", point: { x: 1, y: 1, z: 0 } },
          speed: 10,
        },
        {
          verb: "launch",
          actor: "knightA",
          start: 1,
          duration: 0.4,
          projectile: "arrow",
          at: { kind: "node", node: " " },
          speed: 10,
        },
        {
          verb: "lookAt",
          actor: "knightA",
          start: 2,
          duration: 0.4,
          to: { kind: "node", node: " " },
        },
        {
          verb: "reach",
          actor: "knightA",
          start: 3,
          duration: 0.4,
          hand: "right",
          to: { kind: "group", nodes: [" "] },
        },
        {
          verb: "gesture",
          actor: "knightA",
          start: 4,
          duration: 0.4,
          kind: "point",
          at: { kind: "node", node: " " },
        },
        {
          verb: "attachTo",
          actor: "knightB",
          start: 5,
          duration: 0.4,
          parent: " ",
          bone: "leftHand",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: synth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });

  TestValidator.equals(
    "blank secondary performance refs fail",
    performed.success,
    false,
  );
  TestValidator.equals(
    "blank projectile violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[0].projectile"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "blank launch node target violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[1].at.node"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "blank lookAt node target violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[2].to.node"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "blank reach group target violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[3].to.nodes[0]"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "blank gesture node target violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[4].at.node"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "blank attach parent violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[5].parent"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
