/**
 * Shared by parseHumanFaceDocument, serializeHumanFaceDocument, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Loads the complete independent face document without a measurement runtime.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Refuses unsupported schema versions and unknown nested fields rather than silently dropping them.
 * @author Samchon
 */
export function assertFinite(value: unknown, ancestors = new Set<object>()): void {
  if (typeof value === "number" && !Number.isFinite(value))
    throw new Error("Face document numbers must be finite.");
  if (value !== null && typeof value === "object") {
    if (ancestors.has(value))
      throw new Error("Face documents cannot contain cyclic references.");
    ancestors.add(value);
    for (const item of Object.values(value)) assertFinite(item, ancestors);
    ancestors.delete(value);
  }
}
