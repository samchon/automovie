import { ViolationCollector, validateColor } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Append the engine's complete raw-color findings to artifact admission.
 *
 * Linear RGB and non-null alpha use [0,1]; alpha and hex each require an explicit null when absent. A non-null hexadecimal display label must match numeric RGB after sRGB encoding. Omission is not a substitute for null and no field is rewritten.
 *
 * @evidence contracts/common.md#principled-implementation The shared engine owner checks raw shape, finite linear channels and the optional quantized sRGB label, so materials, lights, fog, background and artifact admission use one color meaning.
 * @evidence contracts/common.md#clear-and-simple-design This adapter supplies a collector and transfers findings into the artifact gate's existing sink; all color decisions stay with validateColor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No artifact-specific color normalization or fallback label survives, and every caller reaches the same engine rules.
 * @evidence contracts/common.md#meaningful-documentation States linear channel bounds, display-label agreement and append-only input ownership.
 * @evidence contracts/performance.md#efficient-algorithms The engine inspects five fields and transfers a bounded finding count; refusal text scales with paths, labels and value representation. Arbitrary host conversion hooks have no bounded-time guarantee, while admitted numeric channels and six-digit labels use fixed work.
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
