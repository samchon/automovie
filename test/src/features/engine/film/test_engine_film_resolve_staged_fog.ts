import { AutoMovieEngineViolationCollector, AutoMovieEngineScene } from "@automovie/engine";
import { resolveStagedFog } from "@automovie/engine/internal";
import type { IAutoMovieFog, IAutoMovieStage } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Exponential evaluation uses one log, one square root, one quotient and up to
 * four products at unit optical depth.
 */
const FOG_ROUNDING: number = 32 * Number.EPSILON;

/**
 * One authored fog form determines the canonical squared-depth extinction.
 *
 * Scenarios:
 *
 * 1. A quarter transmission at 16 m yields density sqrt(2 ln 2)/16 and
 *    transmission 1/256 at 32 m. A unit transmission yields zero density.
 * 2. A direct density is borrowed. A second competing fog form is refused.
 * 3. Nonpositive depth, out-of-domain transmission and arithmetic overflow each
 *    identify their own field.
 */
export function test_engine_film_resolve_staged_fog(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const reference: NonNullable<IAutoMovieStage["fogVisibility"]> = {
    cameraDepthM: 16,
    transmittance: 0.25,
    color: { r: 0.25, g: 0.5, b: 0.75, a: null, hex: null },
  };
  const fog: IAutoMovieFog | undefined = resolveStagedFog(
    undefined,
    reference,
    out,
  );
  const clear: IAutoMovieFog | undefined = resolveStagedFog(
    undefined,
    { ...reference, transmittance: 1 },
    out,
  );
  TestValidator.predicate(
    "the reference defines the expected squared-depth falloff and preserves color",
    fog !== undefined &&
      clear !== undefined &&
      fog.color === reference.color &&
      nclose(fog.density, Math.sqrt(2 * Math.LN2) / 16, FOG_ROUNDING) &&
      nclose(AutoMovieEngineScene.sceneFogTransmittance(fog, 32), 1 / 256, FOG_ROUNDING) &&
      clear.density === 0 &&
      AutoMovieEngineScene.sceneFogTransmittance(clear, 32) === 1,
  );
  TestValidator.predicate(
    "a supplied density retains its record",
    resolveStagedFog(fog, undefined, out) === fog,
  );
  const invalid: NonNullable<IAutoMovieStage["fogVisibility"]>[] = [
    { ...reference, cameraDepthM: 0 },
    { ...reference, transmittance: 0 },
    { ...reference, transmittance: 1.25 },
    { ...reference, cameraDepthM: Number.MIN_VALUE },
  ];
  TestValidator.predicate(
    "only admitted finite references produce a canonical fog",
    resolveStagedFog(fog, reference, out) === undefined &&
      invalid.every(
        (item: (typeof invalid)[number]): boolean =>
          resolveStagedFog(undefined, item, out) === undefined,
      ),
  );
  TestValidator.equals(
    "each invalid reference points to its own field",
    out.items.map(({ kind, path }) => [kind, path]),
    [
      ["type", "$input.fogVisibility"],
      ["range", "$input.fogVisibility.cameraDepthM"],
      ["range", "$input.fogVisibility.transmittance"],
      ["range", "$input.fogVisibility.transmittance"],
      ["range", "$input.fogVisibility"],
    ],
  );
}
