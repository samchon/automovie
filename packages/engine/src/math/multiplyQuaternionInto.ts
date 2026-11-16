import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Write the original Hamilton product a*b into one caller-owned quaternion.
 * Compute X/Y/Z/W before publishing any field, so target may alias an input.
 * No normalization or unit premise changes the raw product's rounding.
 *
 * @param target Mutable output whose previous components are not read.
 * @param a Outer, later quaternion in the engine's glTF component order.
 * @param b Inner, earlier quaternion; all source reads precede target writes.
 * @evidence contracts/development/common.md#meaningful-documentation States Hamilton/application order, writable-output ownership, source alias safety, original raw arithmetic and absence of normalization.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps Quaternion.multiply's original four scalar Hamilton expressions, including their multiplication/addition/subtraction and component-read order, then writes the completed values to target.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One internal write-target owner serves the fresh public multiply and the actual prepared OnBasis private inner scratch; no second product formula or normalized variant is introduced.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Computes every term without identity, unit, zero, finite, tolerance or caller-specific branches; signed zeros, nonfinite propagation and raw multiplication boundaries remain unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms The same sixteen products and twelve additions/subtractions use four scalar locals and no temporary record. Fresh multiply still creates its required output; a prepared query reuses one private inner record across dynamic factor pairs rather than allocating one per changed pair. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fresh and workspace consumers share one arithmetic owner. Each actual operand pair is recomputed normally unless the existing caller proves its pure factors unchanged; only the caller's private target storage is reused here, with no product or target cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows three quaternion records only during the synchronous call and retains none. The public caller owns fresh output, while OnBasis owns at most one nonescaping dynamic inner target per query; no global workspace, history, handle or task exists.
 */
export function multiplyQuaternionInto(
  target: IAutoMovieQuaternion,
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): void {
  const x: number = a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y;
  const y: number = a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x;
  const z: number = a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w;
  const w: number = a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
  target.x = x;
  target.y = y;
  target.z = z;
  target.w = w;
}
