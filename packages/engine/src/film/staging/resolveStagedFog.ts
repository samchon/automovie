import type {
  IAutoMovieFog,
  IAutoMovieStage,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { isRecord } from "../../validation/isRecord";
import { validateColor } from "../../validation/validateColor";
import { validateFogPlacement } from "./validateFogPlacement";

/**
 * Admit the authored fog forms and produce the one canonical scene fog.
 *
 * Direct fog retains its object identity. A visibility reference solves the
 * FogExp2 equation with density = sqrt(-ln(transmittance)) / cameraDepthM.
 * This is a camera-axis cue for the renderer's squared-depth law. {@link https://www.weather.gov/media/epz/mesonet/CWOP-WMO8.pdf | WMO Guide No. 8, Chapter 9}
 * also defines optical range using a transmission reference,
 * but its physical measurement does not follow the FogExp2 law.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Inverts the canonical FogExp2 transmittance law at the admitted positive axial depth. The unit-transmittance endpoint is canonical zero density. Located validation rejects an unrepresentably large density or coincident declarations.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns authored form selection and inverse FogExp2 calibration. The direct density gate and canonical color gate remain with their shared validators.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the authored depth, transmittance and color without a visibility threshold, default weather, or silent conflict resolution.
 * @evidence contracts/development/common.md#meaningful-documentation Describes form selection, object identity, inverse law, camera-depth convention and difference from meteorological measurement.
 * @evidence contracts/development/implementation.md#efficient-algorithms Checks a fixed-size set of scalar and color fields and evaluates at most one logarithm, square root and division. Refusals may format authored values through the shared validators.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One stage declaration is resolved per call, with no cache over mutable authoring records.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A valid reference produces one fog record sharing the supplied color object. Declared direct fog is returned by reference. Findings belong to the caller's collector.
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
  if (!isRecord(reference)) {
    out.push("type", path, "fogVisibility must be a JSON object", reference);
    return undefined;
  }

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
  if (!Number.isFinite(density)) {
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
