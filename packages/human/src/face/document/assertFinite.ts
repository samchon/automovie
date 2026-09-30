/**
 * Refuse a face document that holds a non-finite number or a cyclic reference,
 * walking every nested object.
 *
 * Shared by `parseHumanFaceDocument` (load) and `serializeHumanFaceDocument`
 * (save), so a document that cannot be saved cannot be loaded either.
 * `ancestors` is the path of objects being walked, so an object reached twice
 * without being its own ancestor (a shared but acyclic reference) is accepted.
 *
 * @author Samchon
 */
export function assertFinite(
  value: unknown,
  ancestors = new Set<object>(),
): void {
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
