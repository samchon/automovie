import path from "node:path";

import type { IProductionGateKey } from "../../IProductionGateKey";

/**
 * Names the authored input directories belonging to one layer and validation pass.
 *
 * @evidence contracts/common.md#principled-implementation One pass maps to its declared body, revision, detached file/unit evidence and review trees, with the working tree included only for naturalness.
 * @evidence contracts/common.md#clear-and-simple-design The fixed directory list lets empty-dependency checks reason about authored boundaries without enumerating their filesystem contents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The body and revision trees are deliberately shared across passes while review edition is supplied by the caller; these are layout rules rather than fixture exceptions.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the paths are authored inputs of one layer/pass; the edition parameter selects the review subtree.
 * @evidence contracts/performance.md#efficient-algorithms A fixed five or six path constructions cost O(p) in combined path-text length and allocate only a constant-count array.
 * @evidence contracts/performance.md#reuse-equivalent-work The helper centralizes the same directory vocabulary for declared and captured empty-scope checks; fresh path arrays avoid shared mutable state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned path array belongs to the caller, with at most six strings; no directory handle, task or persistent cache is acquired.
 */
export function ownedDirectories(
  root: string,
  key: IProductionGateKey,
  edition: string,
): string[] {
  return [
    path.resolve(root, "docs/body", key.layer),
    path.resolve(root, "docs/revision", key.layer),
    ...(key.pass === "naturalness"
      ? [path.resolve(root, "docs/naturalness", key.layer)]
      : []),
    ...["files", "units"].map((carrier: string): string =>
      path.resolve(root, "docs/evidence", key.pass, carrier, key.layer),
    ),
    path.resolve(root, "docs/review", edition, key.layer),
  ];
}
