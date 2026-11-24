import { stageScene } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../../../internal/filmFixtures";
import { hasViolation, namedFacts } from "../../../internal/predicates";

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
 */
export function test_unit_engine_film_film_stage_scene_mount_invalid(): void {
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
          staged.violations.some(
            (v: IAutoMovieConstraintViolation): boolean => v.value === "horse",
          ),
      ],
    ]),
    {
      stagedSuccess: true,
      hasViolationStagedType: true,
      stagedViolationsV: true,
    },
  );
}
