import { validateSceneMedium } from "@automovie/engine";
import type {
  IAutoMovieFog,
  IAutoMovieMedium,
  IAutoMovieScene,
  IAutoMovieValidation,
} from "@automovie/interface";
import {
  applySceneMedium,
  buildScene,
  readAutoMovieSceneMedium,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { hasViolation } from "../internal/hasViolation";

/**
 * A scene authored directly is admitted as a stage is: a medium beside a fog,
 * or one whose coefficients or anisotropy lie outside their ranges, is refused
 * before `buildScene` attaches either atmosphere, and `applySceneMedium`
 * refuses a medium outside its ranges.
 *
 * Scenarios:
 *
 * 1. `validateSceneMedium` refuses a medium beside a fog at `$input.medium`, and
 *    admits the same medium without the fog, a fog without a medium and a scene
 *    with `medium: null`.
 * 2. It refuses scattering −0.01, an infinite absorption and an anisotropy of 1,
 *    −1 and NaN, each at its own field; coefficients of 0 and an anisotropy of
 *    0 are admitted.
 * 3. `buildScene` throws, naming the medium, for a scene with both a fog and a
 *    medium and for one whose anisotropy is 1; it builds the admitted scene
 *    with the medium attached and no fog.
 * 4. `applySceneMedium` throws a `RangeError` for an anisotropy of 1 and leaves
 *    the scene's medium as it was.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario's scene or medium and the refusal or admission it pins.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the engine's scene admission, the render scene builder and the medium attachment and reads their violations, throws and the attached record; a builder that attaches both atmospheres, or a medium whose phase function is 0/0, fails.
 * @evidence contracts/development/testing.md#independent-expectations The ranges and the exclusion are issue #4084's: coefficients finite and at least zero, the Henyey-Greenstein g strictly inside (−1, 1), where `(1 − g²) / (4π (1 + g² − 2g cos θ)^1.5)` is finite, and never a fog beside a medium.
 * @evidence contracts/development/testing.md#distinguishing-cases A medium with and without a fog, a fog alone, a null medium, each field on both sides of its bound, and the three entry points. The stage's own refusals belong to test_film_stage_scene_medium and the march to the draw tests of the medium.
 * @evidence contracts/development/testing.md#execution-ownership In-memory scenes and Three scene graphs; no renderer.
 */
export function test_render_scene_medium_admission(): void {
  const medium: IAutoMovieMedium = {
    scattering: 0.05,
    absorption: 0.01,
    anisotropy: 0.6,
  };
  const fog: IAutoMovieFog = {
    density: 0.02,
    color: { r: 0.6, g: 0.6, b: 0.6, a: null, hex: null },
  };
  const scene: (over: Partial<IAutoMovieScene>) => IAutoMovieScene = (
    over: Partial<IAutoMovieScene>,
  ): IAutoMovieScene => ({
    id: "barn",
    name: null,
    nodes: [],
    cameras: [],
    lights: [],
    ...over,
  });

  // 1. The fog exclusion.
  TestValidator.equals(
    "a medium beside a fog is refused; either alone is admitted",
    [
      hasViolation(
        validateSceneMedium({ medium, fog }),
        "type",
        "$input.medium",
      ),
      validateSceneMedium({ medium }).success,
      validateSceneMedium({ fog }).success,
      validateSceneMedium({ medium: null, fog }).success,
    ],
    [true, true, true, true],
  );

  // 2. The ranges.
  const refused: (over: Partial<IAutoMovieMedium>, field: string) => boolean = (
    over: Partial<IAutoMovieMedium>,
    field: string,
  ): boolean => {
    const result: IAutoMovieValidation = validateSceneMedium({
      medium: { ...medium, ...over },
    });
    return hasViolation(result, "range", `$input.medium.${field}`);
  };
  TestValidator.equals(
    "each out-of-range field is refused where written",
    [
      refused({ scattering: -0.01 }, "scattering"),
      refused({ absorption: Number.POSITIVE_INFINITY }, "absorption"),
      refused({ anisotropy: 1 }, "anisotropy"),
      refused({ anisotropy: -1 }, "anisotropy"),
      refused({ anisotropy: Number.NaN }, "anisotropy"),
    ],
    [true, true, true, true, true],
  );
  TestValidator.predicate(
    "zero coefficients and anisotropy are admitted",
    validateSceneMedium({
      medium: { scattering: 0, absorption: 0, anisotropy: 0 },
    }).success,
  );

  // 3. The scene builder.
  TestValidator.error("a scene with a fog and a medium is not built", () =>
    buildScene(scene({ medium, fog }), (): undefined => undefined),
  );
  TestValidator.error("a scene whose anisotropy is 1 is not built", () =>
    buildScene(
      scene({ medium: { ...medium, anisotropy: 1 } }),
      (): undefined => undefined,
    ),
  );
  let named: boolean = false;
  try {
    buildScene(scene({ medium, fog }), (): undefined => undefined);
  } catch (error) {
    named = (error as Error).message.includes("$input.medium");
  }
  TestValidator.predicate("the refusal names the medium", named);
  const built: ReturnType<typeof buildScene> = buildScene(
    scene({ medium }),
    (): undefined => undefined,
  );
  TestValidator.predicate(
    "an admitted scene carries its medium and no fog",
    JSON.stringify(readAutoMovieSceneMedium(built.scene)) ===
      JSON.stringify(medium) && built.scene.fog === null,
  );

  // 4. The attachment of a hand-built graph.
  const graph: THREE.Scene = new THREE.Scene();
  applySceneMedium(graph, medium);
  let range: boolean = false;
  try {
    applySceneMedium(graph, { ...medium, anisotropy: 1 });
  } catch (error) {
    range = error instanceof RangeError;
  }
  TestValidator.predicate(
    "an anisotropy of 1 is refused and the medium kept",
    range &&
      JSON.stringify(readAutoMovieSceneMedium(graph)) ===
        JSON.stringify(medium),
  );
}
