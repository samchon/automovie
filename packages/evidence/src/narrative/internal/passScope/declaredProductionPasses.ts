import path from "node:path";

import type { IProductionGateKey } from "../../IProductionGateKey";
import { passId } from "../../passId";
import { authoredBoundary } from "./authoredBoundary";
import { authoredPathOwner } from "./authoredPathOwner";
import { ownedDirectories } from "./ownedDirectories";
import { sharedBody } from "./sharedBody";

/**
 * Resolves declared selector ownership even when its source population is empty.
 *
 * @evidence contracts/common.md#principled-implementation Positive glob prefixes are resolved against captured authored boundaries even for empty inventories; foreign boundaries and empty selections spanning unresolved pass trees emit issues.
 * @evidence contracts/common.md#clear-and-simple-design Declared selector ownership is separated from source ownership so missing files cannot erase a required authoring pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An all-negative selection falls back to its selected root because no positive prefix narrows it; this conservatively exposes ambiguous empty authored scopes rather than excusing them.
 * @evidence contracts/common.md#meaningful-documentation The comment states empty-population ownership, and issue messages identify the offending canonical selector prefix.
 * @evidence contracts/performance.md#efficient-algorithms For s selectors of total text length p and fixed supported-pass count k, prefix parsing and ownership checks cost O(p + s*k) path operations; Sets retain at most k owners and temporary selectors scale with s.
 * @evidence contracts/performance.md#reuse-equivalent-work The same supplied captured canonicalizer is used for physical and logical comparisons; no later filesystem scan or cross-analysis prefix cache changes the declared meaning.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Filtered selector arrays and path strings are call-local, the result Set is bounded by supported passes, and diagnostic retention belongs to the issue callback.
 */
export function declaredProductionPasses(
  root: string,
  selectedRoot: string | undefined,
  files: string[] | undefined,
  empty: boolean,
  keys: Map<string, IProductionGateKey>,
  issue: (message: string) => void,
  canonical: (filename: string, logicalRoot?: string) => string,
): Set<string> {
  const found: Set<string> = new Set<string>();
  if (files === undefined) return found;
  const selectors: string[] = files.filter(
    (file: string): boolean => !file.startsWith("!"),
  );
  for (const selector of selectors.length > 0 ? selectors : [""]) {
    const portable: string = selector.replaceAll("\\", "/");
    const end: number = Math.min(
      ...["*", "?", "[", "{", "("].map((symbol: string): number => {
        const index: number = portable.indexOf(symbol);
        return index < 0 ? portable.length : index;
      }),
    );
    const declared: string = path.resolve(
      root,
      selectedRoot?.replaceAll("\\", "/") ?? "",
      portable.slice(0, end),
    );
    const prefix: string = canonical(declared);
    const owner: IProductionGateKey | undefined = authoredPathOwner(
      root,
      declared,
      canonical,
    );
    if (owner !== undefined) found.add(passId(owner));
    else if (
      (authoredBoundary(declared) || authoredBoundary(prefix)) &&
      !sharedBody(root, declared, canonical)
    )
      issue(
        `A declared selection crosses an unaudited authored package boundary at ${prefix}.`,
      );
    else if (
      empty &&
      [...keys.values()].some((key: IProductionGateKey): boolean => {
        const edition: "draft" | "final" =
          key.pass === "construction" ? "draft" : "final";
        return ownedDirectories(root, key, edition).some(
          (directory: string): boolean =>
            canonical(directory).startsWith(prefix) ||
            canonical(directory, root).startsWith(canonical(declared, root)),
        );
      })
    )
      issue(
        `An empty authored selection has unresolved pass ownership at ${prefix}.`,
      );
  }
  return found;
}
