/**
 * Which numerical domain a hand-written document belongs to.
 *
 * A face document carries an `expression` map and a body document never does,
 * so the field decides; the basis identity is then checked against that
 * domain's basis by the caller. A value that is not an object refuses. Pure.
 */
export function classifyHumanViewerInput(document: unknown): "face" | "body" {
  if (typeof document !== "object" || document === null || Array.isArray(document))
    throw new Error("A document must be a JSON object");
  return "expression" in document ? "face" : "body";
}
