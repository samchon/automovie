import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * The surface target a body document's `anatomy` states at a request path, in
 * metres, or undefined when it states none there. An observed measurement at
 * the path is not a target and reads as undefined; admission refuses it
 * before a document carrying it is committed.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reads the anatomical target the committed body document states, so the row shows it.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Shows a row's stated value from the document, not from a second copy.
 * @author Samchon
 */
export function readConnectedBodyAnatomyTarget(
  document: IAutoMovieHumanBodyBasisDocument,
  path: string,
): number | undefined {
  let node: unknown = document.anatomy;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  if (typeof node !== "object" || node === null) return undefined;
  const leaf = node as Record<string, unknown>;
  return leaf.kind === "target" && typeof leaf.metres === "number"
    ? leaf.metres
    : undefined;
}
