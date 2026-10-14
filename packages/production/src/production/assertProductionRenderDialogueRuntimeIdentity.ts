import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Narrow unknown values by the shared SHA-256 syntax owner. Two operand checks borrow strings and retain no result or resource; syntax proves no byte origin or equivalence by itself.
 */
function isContentDigest(value: unknown): value is string {
  return typeof value === "string" && SHA256_DIGEST_PATTERN.test(value);
}

/**
 * Require one supplied capture dialogue identity to equal its supplied planned identity.
 *
 * @evidence contracts/common.md#principled-implementation Nonblank context and canonical digest-or-null values are admitted before exact equality; null/null explicitly represents silence and missing is never silence. The caller owns obtaining truthful final-byte identities.
 * @evidence contracts/common.md#clear-and-simple-design One comparison owns ordered contextual refusals; the repository currently exports this capability but has no application invocation beyond its owning unit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid observed strings are refused without printing them; mismatching admitted digest/null values remain diagnostic. No byte observation, capture execution or phase-wide enforcement is fabricated here.
 * @evidence contracts/common.md#meaningful-documentation Defines boundary context, digest/null meaning, missing/malformed/mismatch order and the same observed value returned on success, without claiming a live render-pipeline caller.
 * @evidence contracts/performance.md#efficient-algorithms Boundary trim scans its text, at most two syntax tests scan supplied values and equality compares admitted fixed-size identities; no frame or byte population is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Both values use one shared engine digest pattern and one equality comparison; no comparison cache reuses a prior capture observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Strings remain borrowed and only the observed value or Error escapes; no byte buffer, descriptor, task or persistent capture record is retained.
 */
export function assertProductionRenderDialogueRuntimeIdentity(props: {
  /** Human-readable render boundary, slot, frame, layer or preview context. */
  boundary: string;

  /** Supplied planned final-byte identity; null explicitly means silence. */
  expected: unknown;

  /** Supplied capture final-byte identity; undefined means omission. */
  observed: unknown;
}): string | null {
  if (props.boundary.trim().length === 0)
    throw new Error("Dialogue runtime comparison boundary is invalid.");
  if (props.expected !== null && isContentDigest(props.expected) === false)
    throw new Error(`Planned dialogue runtime identity is missing or invalid at ${props.boundary}. Replan before rendering.`);
  if (props.observed === undefined)
    throw new Error(`Capture omitted its dialogue runtime identity at ${props.boundary}. Replan and capture again.`);
  if (props.observed !== null && isContentDigest(props.observed) === false)
    throw new Error(`Capture returned an invalid dialogue runtime identity at ${props.boundary}. Rebuild the dialogue runtime and capture again.`);
  if (props.observed !== props.expected)
    throw new Error(`Capture dialogue runtime identity differs from the render plan at ${props.boundary}: expected ${props.expected ?? "null"}, observed ${props.observed ?? "null"}. Replan before rendering.`);
  return props.observed;
}
