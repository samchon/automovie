import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * The surface target a body document's `anatomy` states at a request path, in metres, or undefined when it states none there. An observed measurement at the path is not a target and reads as undefined; admission refuses it before a document carrying it is committed.
 *
 * The path is supplied by the package's authored surface-target catalogue; this reader does not admit arbitrary paths or finite-value ranges.
 *
 * @evidence contracts/common.md#principled-implementation Dotted catalogue paths traverse the anatomy tree and only a target-kind numeric leaf becomes an authored metre target; observed measurements and absent branches remain undefined.
 * @evidence contracts/common.md#clear-and-simple-design This reader extracts a stated target for display while path catalogue ownership and full document admission stay with Human.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing and observed leaves do not receive guessed target values, and numeric extraction is explicitly not finite-range admission.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies metres, target versus observation, absent result and the authored-path premise.
 * @evidence contracts/performance.md#efficient-algorithms Splitting a path of l characters and visiting p segments costs O(l+p) time and segment storage, with constant property work at each traversed object.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous leaf reader retains no cross-document cache and reads each supplied current document directly.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a number or undefined escapes, and temporary path segments acquire no live handles.
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
  const leaf: Record<string, unknown> = node as Record<string, unknown>;
  return leaf.kind === "target" && typeof leaf.metres === "number"
    ? leaf.metres
    : undefined;
}
