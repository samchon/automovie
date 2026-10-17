import type { IAutoMovieHumanIdentity } from "@automovie/human";

/**
 * Compare the viewer's already admitted, resolved identity independently of object key order.
 *
 * Admission must precede this call. Object keys are sorted recursively while array order and JSON scalar values remain significant. The result is an equality key, not a digest, schema check or replacement for identity admission.
 *
 * @evidence contracts/common.md#principled-implementation Canonical JSON sorts keys of the validated resolved identity while preserving array order and scalar values; only the successful identity admission branch calls it.
 * @evidence contracts/common.md#clear-and-simple-design One synchronous key serves Human instance reuse without rebuilding geometry or adding an asynchronous document digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity field is discarded and no unchecked input is normalized into an admitted identity; the caller owns actual validation.
 * @evidence contracts/common.md#meaningful-documentation States the admitted-input precondition, equality semantics and distinction from validation and hashing.
 * @evidence contracts/performance.md#efficient-algorithms Visits N JSON nodes and sorts each object's keys, using O(N) output storage plus key sorting; identity documents are small relative to model generation.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal admitted documents produce the same key across insertion orders; changed scalar values or array order remain different, and the page additionally compares generator choice.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no input or native resources; the page owns the returned key with its current accepted person.
 */
export function keyHumanViewerIdentity(
  identity: IAutoMovieHumanIdentity,
): string {
  return JSON.stringify(ordered(identity));
}

/** Copy the admitted JSON tree with sorted object keys and unchanged array order. */
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .map((key: string): [string, unknown] => [
          key,
          ordered((value as Record<string, unknown>)[key]),
        ]),
    );
  return value;
}
