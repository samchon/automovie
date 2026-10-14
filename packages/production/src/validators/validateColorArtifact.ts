import { ViolationCollector, validateColor } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Append the engine's complete raw-color findings to artifact admission.
 *
 * Linear RGB and optional alpha use [0,1]; a present hexadecimal display label
 * must match the numeric RGB after sRGB encoding. No field is rewritten.
 *
 * @evidence contracts/common.md#principled-implementation The shared engine owner checks raw shape, finite linear channels and the optional quantized sRGB label, so materials, lights, fog, background and artifact admission use one color meaning.
 * @evidence contracts/common.md#clear-and-simple-design This adapter supplies a collector and transfers findings into the artifact gate's existing sink; all color decisions stay with validateColor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No artifact-specific color normalization or fallback label survives, and every caller reaches the same engine rules.
 * @evidence contracts/common.md#meaningful-documentation States linear channel bounds, display-label agreement and append-only input ownership.
 * @evidence contracts/performance.md#efficient-algorithms The fixed five-field engine check and bounded finding transfer take constant time and transient space per color.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call checks one current mutable record without sharing a stale verdict across observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local collector is released after its bounded findings transfer to the caller-owned array; no state, handle or task is retained.
 */
export function validateColorArtifact(
  color: unknown,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void {
  const collector: ViolationCollector = new ViolationCollector();
  validateColor(color, path, collector);
  violations.push(...collector.items);
}