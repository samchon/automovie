import { isRecord } from "../../validation/isRecord";

/**
 * Whether a staged value is an object whose `x`, `y` and `z` are all finite
 * numbers.
 *
 * It checks without repairing, so the caller reports the authored value as
 * written. The value is `unknown` because `stage` is reachable in-process
 * without the transport's structural gate, so a `null` or array where a vector
 * belongs answers `false` instead of throwing a `TypeError`. Positions are in
 * metres; light directions are unitless and may have any non-zero length, which
 * this test does not judge.
 *
 * @param vector A staged position, target or direction, as authored.
 * @returns `true` only for a non-array object whose three components are
 *   finite.
 */
export function isFiniteStageVector3(vector: unknown): boolean {
  return (
    isRecord(vector) &&
    Number.isFinite(vector.x) &&
    Number.isFinite(vector.y) &&
    Number.isFinite(vector.z)
  );
}
