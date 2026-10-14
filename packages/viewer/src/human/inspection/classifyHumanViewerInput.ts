/**
 * Which numerical domain a hand-written document belongs to.
 *
 * A person carries paired `face` and `body` documents. Otherwise a face carries an `expression` map and a body never does. The caller admits the selected schema and verifies its published or candidate basis identities; classification alone does not establish validity. A non-object refuses.
 *
 * @evidence contracts/common.md#principled-implementation JSON object shape chooses person when paired face/body fields exist, otherwise face when expression exists and body for the remaining object case; numerical owner admission follows classification.
 * @evidence contracts/common.md#clear-and-simple-design A fixed structural discriminator keeps discovery separate from complete domain schema and basis validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Classification neither admits malformed domain data nor recognizes named fixtures; non-object and array inputs refuse before dispatch.
 * @evidence contracts/common.md#meaningful-documentation The prose defines field precedence and explicitly limits classification authority before owner/schema/basis checks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fixed-count property-presence checks choose no traversal or allocation strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless classification stores no document cache and cannot certify source/basis equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The classifier borrows unknown input, returns a closed domain tag and retains no parsed document or numerical owner.
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
