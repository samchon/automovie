import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Pins mount-coupling integrity: a rider must ride a _different, placed_ actor.
 * Self-mounts and dangling parents are both contradictions staging must hear
 * about before any shot is performed.
 *
 * Scenarios:
 *
 * 1. `knightA` declares `attach.parent = "knightA"` → a `type` violation on
 *    `$input.actors[0].attach.parent` (a node cannot ride itself).
 * 2. `knightB` declares `attach.parent = "horse"` which nobody placed → a `type`
 *    violation on `$input.actors[1].attach.parent` carrying "horse".
 *
 * @evidence contracts/testing.md#behavioral-verification Calls stageScene with a self-mounted actor and an actor naming an unplaced horse, requiring both parent type findings and the unresolved horse value.
 * @evidence contracts/testing.md#independent-expectations A mount parent must be a different placed actor; authored parent ids and literal violation paths are independent of staging output, with path-inclusion witnesses rather than exact report equality.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both refused mount branches together; the valid staging entry owns a placed distinct parent, while this entry does not prove bone compatibility or downstream motion.
 * @evidence contracts/testing.md#execution-ownership The portable named test owns its two mount-refusal inputs, calls actual staging and uses no foreign patch, process, browser or GPU.
 */
export function test_film_stage_scene_mount_invalid(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      actors: [
        {
          node: "knightA",
          position: { x: 0, y: 0, z: 0 },
          facingDeg: 0,
          attach: { parent: "knightA", bone: "chest" },
        },
        {
          node: "knightB",
          position: { x: 0, y: 0, z: 0.7 },
          facingDeg: 180,
          attach: { parent: "horse", bone: "hips" },
        },
      ],
    }),
  );
  TestValidator.equals("fails", staged.success, false);
  TestValidator.equals(
    "self-mount rejected",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.actors[0].attach.parent"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "dangling parent rejected",
    namedFacts([
      ["stagedSuccess", (): boolean => staged.success === false],
      [
        "hasViolationStagedType",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.actors[1].attach.parent"),
      ],
      [
        "stagedViolationsV",
        (): boolean =>
          staged.success === false &&
          staged.violations.some((v: IAutoMovieConstraintViolation): boolean => v.value === "horse"),
      ],
    ]),
    {
      stagedSuccess: true,
      hasViolationStagedType: true,
      stagedViolationsV: true,
    },
  );
}
