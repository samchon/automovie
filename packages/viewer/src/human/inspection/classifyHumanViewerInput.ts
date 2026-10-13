/**
 * Which numerical domain a hand-written document belongs to.
 *
 * A person carries paired `face` and `body` documents. Otherwise a face
 * carries an `expression` map and a body never does. The caller admits the
 * selected schema and verifies its published or candidate basis identities;
 * classification alone does not establish validity. A non-object refuses.
 *
 * @evidence contracts/common.md#principled-implementation Structural face/body discriminants choose the existing numerical domain; classification leaves schema and basis admission to its owner.
 * @evidence contracts/common.md#clear-and-simple-design One classifier handles the paired person case before the separate face/body cases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selects by document shape without named-subject exceptions or treating a classified object as validated geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines each domain's discriminator and explicitly separates classification from numerical validity.
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
