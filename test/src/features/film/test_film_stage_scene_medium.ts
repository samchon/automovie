import { stageScene } from "@automovie/engine";
import type {
  IAutoMovieFog,
  IAutoMovieMedium,
  IAutoMovieStage,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Stage a physical haze: admitted ranges are lowered verbatim, a fog beside it
 * is refused, and a stage without one composes no medium.
 *
 * Scenarios:
 *
 * 1. A medium of scattering 0.05, absorption 0.01 and anisotropy 0.6 is lowered
 *    verbatim onto the composed scene.
 * 2. A stage without a medium, and one with `medium: null`, compose a scene with
 *    no `medium` key.
 * 3. A medium beside `fog`, and beside `fogVisibility`, is refused at
 *    `$input.medium`.
 * 4. Negative scattering, non-finite absorption, and anisotropy of 1 and −1 are
 *    each refused at their field; anisotropy 0 and coefficients of 0 are
 *    admitted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs stageScene with authored media and reads the composed scene and the violations; a medium dropped, copied wrongly, admitted beside a fog or with a boundary anisotropy fails.
 * @evidence contracts/development/testing.md#independent-expectations The ranges are the issue's: coefficients finite and at least zero, the Henyey-Greenstein parameter strictly within (−1, 1), where its phase function is finite; the fog exclusion is the issue's rule.
 * @evidence contracts/development/testing.md#distinguishing-cases Present, absent and null media; both fog forms; each field's boundary on both sides. The marched picture belongs to the GPU captures of the medium.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test over the film fixtures, discovered by its export name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios with their inputs and expected outcomes.
 */
export function test_film_stage_scene_medium(): void {
  const medium: IAutoMovieMedium = {
    scattering: 0.05,
    absorption: 0.01,
    anisotropy: 0.6,
  };
  const staged: (over: Partial<IAutoMovieStage>) => IAutoMovieStagedSet = (
    over: Partial<IAutoMovieStage>,
  ): IAutoMovieStagedSet =>
    stageScene(makeScriptWrite(), makeStagingWrite(over));

  const hazy: IAutoMovieStagedSet = staged({ medium });
  TestValidator.equals(
    "the medium is lowered verbatim",
    hazy.success === true ? hazy.scene.medium : null,
    medium,
  );
  TestValidator.equals(
    "no medium composes no key",
    [staged({}), staged({ medium: null })].map(
      (set: IAutoMovieStagedSet): boolean =>
        set.success === true && !("medium" in set.scene),
    ),
    [true, true],
  );

  const fog: IAutoMovieFog = {
    density: 0.02,
    color: { r: 0.6, g: 0.6, b: 0.6, a: null, hex: null },
  };
  const refusedAt: (
    over: Partial<IAutoMovieStage>,
    kind: "type" | "range",
    path: string,
  ) => boolean = (
    over: Partial<IAutoMovieStage>,
    kind: "type" | "range",
    path: string,
  ): boolean => {
    const set: IAutoMovieStagedSet = staged(over);
    return set.success === false && hasViolation(set, kind, path);
  };
  TestValidator.equals(
    "a fog beside a medium is refused",
    [
      refusedAt({ medium, fog }, "type", "$input.medium"),
      refusedAt(
        {
          medium,
          fogVisibility: {
            cameraDepthM: 20,
            transmittance: 0.5,
            color: fog.color,
          },
        },
        "type",
        "$input.medium",
      ),
    ],
    [true, true],
  );
  TestValidator.equals(
    "each out-of-range field is refused where written",
    [
      refusedAt(
        { medium: { ...medium, scattering: -0.01 } },
        "range",
        "$input.medium.scattering",
      ),
      refusedAt(
        { medium: { ...medium, absorption: Number.POSITIVE_INFINITY } },
        "range",
        "$input.medium.absorption",
      ),
      refusedAt(
        { medium: { ...medium, anisotropy: 1 } },
        "range",
        "$input.medium.anisotropy",
      ),
      refusedAt(
        { medium: { ...medium, anisotropy: -1 } },
        "range",
        "$input.medium.anisotropy",
      ),
    ],
    [true, true, true, true],
  );
  const clear: IAutoMovieStagedSet = staged({
    medium: { scattering: 0, absorption: 0, anisotropy: 0 },
  });
  TestValidator.equals(
    "zero coefficients and anisotropy are admitted",
    clear.success,
    true,
  );
}
