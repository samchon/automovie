/**
 * Which numerical domain a hand-written document belongs to.
 *
 * A person carries paired `face` and `body` documents. Otherwise a face
 * carries an `expression` map and a body never does. The caller admits the
 * selected schema and verifies its published or candidate basis identities;
 * classification alone does not establish validity. A non-object refuses.
 */
export function classifyHumanViewerInput(
  document: unknown,
): "face" | "body" | "person" {
  if (
    typeof document !== "object" ||
    document === null ||
    Array.isArray(document)
  )
    throw new Error("A document must be a JSON object");
  if ("face" in document && "body" in document) return "person";
  return "expression" in document ? "face" : "body";
}
