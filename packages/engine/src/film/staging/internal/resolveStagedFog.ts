import type {
  IAutoMovieFog,
  IAutoMovieStage,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { overflowsBinary64 } from "../../../math/internal/overflowsBinary64";
import { validateColor } from "../../../validation/internal/validateColor";
import { validateFogPlacement } from "./validateFogPlacement";

/**
 * Admit the authored fog forms and produce the one canonical scene fog.
 *
 * Direct fog retains its object identity. A visibility reference solves the
 * FogExp2 equation with density = sqrt(-ln(transmittance)) / cameraDepthM. This
 * is a camera-axis cue for the renderer's squared-depth law.
 * {@link https://www.weather.gov/media/epz/mesonet/CWOP-WMO8.pdf | WMO Guide No. 8, Chapter 9}
 * also defines optical range using a transmission reference, but its physical
 * measurement does not follow the FogExp2 law.
 */
export function resolveStagedFog(
  fog: IAutoMovieStage["fog"],
  reference: IAutoMovieStage["fogVisibility"],
  out: IAutoMovieViolationCollector,
): IAutoMovieFog | undefined {
  if (fog !== undefined) validateFogPlacement(fog, "$input.fog", out);
  if (reference === undefined) return fog;

  const path: string = "$input.fogVisibility";
  if (fog !== undefined)
    out.push("type", path, "author either fog or fogVisibility", reference);

  const before: number = out.items.length;
  const {
    cameraDepthM,
    transmittance,
    color,
  }: NonNullable<IAutoMovieStage["fogVisibility"]> = reference;
  out.range(
    `${path}.cameraDepthM`,
    cameraDepthM,
    Number.MIN_VALUE,
    Number.MAX_VALUE,
    "cameraDepthM",
  );
  out.range(
    `${path}.transmittance`,
    transmittance,
    Number.MIN_VALUE,
    1,
    "transmittance",
  );
  validateColor(color, `${path}.color`, out);
  if (out.items.length !== before) return undefined;

  const density: number =
    transmittance === 1
      ? 0
      : Math.sqrt(-Math.log(transmittance)) / cameraDepthM;

  // A depth near the smallest positive double overflows the quotient.
  if (overflowsBinary64(density)) {
    out.push(
      "range",
      path,
      "depth and transmittance must produce a finite fog density",
      reference,
    );
    return undefined;
  }
  return fog === undefined ? { density, color } : undefined;
}
