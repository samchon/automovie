import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  resolveStagedMedium
} from "../../../../../packages/engine/src/film/staging/internal/resolveStagedMedium";
import type { IAutoMovieMedium } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The staged medium is the only physical extinction cue in its scene and keeps
 * its admitted authored coefficients.
 *
 * Scenarios:
 *
 * 1. Null and omitted medium both leave the scene without one. A typed medium at
 *    zero scattering and absorption keeps its identity.
 * 2. The coefficients have separate nonnegative bounds. Both endpoints of the
 *    anisotropy interval are excluded.
 * 3. A competing fog reference and invalid medium can both be diagnosed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify absent and identity-preserved media, anisotropy and coefficient boundaries and competing extinction declarations.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls the stage-medium owner for omitted, null and typed inputs, then reads the ordered collector after out-of-range anisotropy and competing malformed declarations.
 * @evidence contracts/development/testing.md#independent-expectations Zero scattering and absorption satisfy nonnegative bounds. The anisotropy interval excludes both literal endpoints -1 and 1. The selected negative coefficients and simultaneously authored fog violate independent fields and determine the expected finding order.
 */
export function test_engine_film_resolve_staged_medium(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const clear: IAutoMovieMedium = {
    scattering: 0,
    absorption: 0,
    anisotropy: 0,
  };
  TestValidator.predicate(
    "only a declared admitted medium becomes part of the scene",
    resolveStagedMedium({}, out) === undefined &&
      resolveStagedMedium({ medium: null }, out) === undefined &&
      resolveStagedMedium({ medium: clear }, out) === clear &&
      out.items.length === 0,
  );
  for (const anisotropy of [-1, 1])
    resolveStagedMedium({ medium: { ...clear, anisotropy } }, out);
  const refused: IAutoMovieMedium | undefined = resolveStagedMedium(
    {
      medium: { ...clear, scattering: -0.125, absorption: -0.25 },
      fogVisibility: {
        cameraDepthM: 20,
        transmittance: 0.5,
        color: { r: 0, g: 0, b: 0, a: null, hex: null },
      },
    },
    out,
  );
  TestValidator.equals(
    "one medium writes every failure in owned field order",
    [refused, out.items.map(({ kind, path }) => [kind, path])],
    [
      undefined,
      [
        ["range", "$input.medium.anisotropy"],
        ["range", "$input.medium.anisotropy"],
        ["type", "$input.medium"],
        ["range", "$input.medium.scattering"],
        ["range", "$input.medium.absorption"],
      ],
    ],
  );
}
