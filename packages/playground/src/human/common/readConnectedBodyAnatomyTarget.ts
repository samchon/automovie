import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * The surface target a body document's `anatomy` states at a request path, in
 * metres, or undefined when it states none there. An observed measurement at
 * the path is not a target and reads as undefined; admission refuses it
 * before a document carrying it is committed.
 *
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
