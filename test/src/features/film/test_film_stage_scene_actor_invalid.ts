import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieStagedSet, stageScene } from "@automovie/engine";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Pins actor placement numeric gates: staged positions become scene node translations and `facingDeg` becomes a Y-axis quaternion, so both must be finite before composition.
 *
 * Scenarios:
 *
 * 1. `knightA` declares a non-finite position, yielding `range` on
 * `$input.actors[0].position`.
 * 2. `knightB` declares a non-finite facing angle, yielding `range` on
 * `$input.actors[1].facingDeg`.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages two actors with non-finite position and facing operands and requires both addressed range violations rather than a successful scene.
 * @evidence contracts/testing.md#independent-expectations Literal Infinity violates the finite metre-position and degree-angle contract; expected paths identify each independently faulty authored actor and do not use returned diagnostic snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Keeps both simultaneous actor faults; positive actor placement and other staging/reference gates remain in the established staging entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_stage_scene_actor_invalid and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_stage_scene_actor_invalid(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      actors: [
        {
          node: "knightA",
          position: { x: Number.POSITIVE_INFINITY, y: 0, z: 0 },
          facingDeg: 0,
        },
        {
          node: "knightB",
          position: { x: 0, y: 0, z: 0.7 },
          facingDeg: Number.POSITIVE_INFINITY,
        },
      ],
    }),
  );

  TestValidator.equals("fails", staged.success, false);
  TestValidator.equals(
    "non-finite position rejected",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "range", "$input.actors[0].position"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "non-finite facing rejected",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "range", "$input.actors[1].facingDeg"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
