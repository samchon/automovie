import { stageScene } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../../../internal/filmFixtures";
import { hasViolation, namedFacts } from "../../../internal/predicates";

/**
 * Pins the "everyone in the cast must stand somewhere" gate: a cast member
 * staging never places can never appear on screen, so staging fails rather than
 * silently dropping the character.
 *
 * Scenarios:
 *
 * 1. Staging places only `knightA` while the script casts two knights → a `type`
 *    violation on `$input.actors` naming the unplaced `knightB`, and no scene
 *    is composed.
 */
export function test_unit_engine_film_film_stage_scene_unplaced_cast(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      actors: [
        { node: "knightA", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
      ],
    }),
  );
  TestValidator.equals("fails", staged.success, false);
  TestValidator.equals(
    "names the unplaced cast node",
    namedFacts([
      ["stagedSuccess", (): boolean => staged.success === false],
      [
        "hasViolationStagedType",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.actors"),
      ],
      [
        "stagedViolationsV",
        (): boolean =>
          staged.success === false &&
          staged.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.value === "knightB",
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
