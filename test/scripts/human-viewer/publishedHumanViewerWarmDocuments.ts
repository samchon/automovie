/**
 * The automatic warm population promised by the viewer: published faces and
 * standard body states. Hand-written inputs and assembled people remain
 * explicit consumer requests; registering them does not authorize background
 * work that delays every interactive request behind their first build.
 *
 * @evidence contracts/common.md#principled-implementation Domain and local-input identity select the published face/body population without recognizing individual documents.
 * @evidence contracts/common.md#clear-and-simple-design One population selector is shared by startup warming and its admission test.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Excludes whole unrequested content categories rather than special-casing a slow person or file.
 * @evidence contracts/common.md#meaningful-documentation States which registered inputs remain explicitly requested work and why registration is not automatic warm authorization.
 */
export function publishedHumanViewerWarmDocuments<
  Document extends { id: string; domain: "face" | "body" | "person" },
>(documents: readonly Document[]): Document[] {
  return documents.filter((entry) => entry.domain !== "person" && !entry.id.startsWith("file:"));
}
