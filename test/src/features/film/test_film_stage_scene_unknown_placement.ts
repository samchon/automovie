import { stageScene } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Pins the inverse referential gate: staging may only place nodes the script
 * cast: a placement naming a stranger is a contradiction with the plan, not a
 * new character.
 *
 * Scenarios:
 *
 * 1. Staging places a third node `ghost` the cast never mentions (both cast
 *    knights properly placed) → a `type` violation on `$input.actors[2].node`
 *    carrying "ghost".
 *
 * @evidence contracts/testing.md#behavioral-verification Adds a ghost placement beside both valid cast placements and requires staging failure with the actor-node type finding and ghost value, catching an unplanned actor silently entering the scene.
 * @evidence contracts/testing.md#independent-expectations The explicit script cast excludes ghost, so its literal placement address and id define the refusal independently; the report helper checks kind and path inclusion.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all planned actors placed while adding one unknown actor, isolating the inverse reference gate; absent planned actors and successful cast composition are separate entries.
 * @evidence contracts/testing.md#execution-ownership This named portable unit owns the unknown-placement case through actual stageScene and record fixtures; it starts no process, browser, renderer or native artifact.
 */
export function test_film_stage_scene_unknown_placement(): void {
  const base: ReturnType<typeof makeStagingWrite> = makeStagingWrite();
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      actors: [
        ...base.actors,
        { node: "ghost", position: { x: 1, y: 0, z: 1 }, facingDeg: 0 },
      ],
    }),
  );
  TestValidator.equals("fails", staged.success, false);
  TestValidator.equals(
    "names the stranger",
    namedFacts([
      ["stagedSuccess", (): boolean => staged.success === false],
      [
        "hasViolationStagedType",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.actors[2].node"),
      ],
      [
        "stagedViolationsV",
        (): boolean =>
          staged.success === false &&
          staged.violations.some(
            (v: IAutoMovieConstraintViolation): boolean => v.value === "ghost",
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
