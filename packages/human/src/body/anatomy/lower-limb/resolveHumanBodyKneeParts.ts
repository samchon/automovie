import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's patella with the current knee generator's unavailable reports.
 *
 * No qualified patellar landmark generator is registered here; this function does not inspect the basis to determine whether a patella or knee site exists. Each request receives `missing-bone-landmark`, or `acquisition-not-registered` for an observed request. Femoral condyles and tibial plateau retain thigh and leg ownership rather than being duplicated here.
 *
 * @evidence contracts/common.md#principled-implementation Bilateral patella requests use the common unavailable helper and retain acquisition-first report semantics.
 * @evidence contracts/common.md#clear-and-simple-design The knee resolver owns only two patella reports; condyles and plateau stay with thigh/leg.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The current missing-landmark reason does not certify that a source mesh lacks a patella.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes report registry qualification from basis inspection and explains neighboring bone ownership.
 * @evidence contracts/performance.md#efficient-algorithms Two patella reports have fixed enumeration cost plus their recursive observation detection.
 * @evidence contracts/performance.md#reuse-equivalent-work No patellar computation is repeated across requests; mutable target records are evaluated on every call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The knee function returns two records without retaining source joints, buffers or asynchronous tasks.
 */
export function resolveHumanBodyKneeParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  return [
    humanBodyUnavailablePart(
      "leftPatella",
      input.targets?.leftLowerLimb?.knee?.patella,
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "rightPatella",
      input.targets?.rightLowerLimb?.knee?.patella,
      "missing-bone-landmark",
    ),
  ];
}
