import path from "node:path";

import type { IProductionGateKey } from "../../IProductionGateKey";
import { passId } from "../../passId";
import { authoredBoundary } from "./authoredBoundary";
import { authoredPathOwner } from "./authoredPathOwner";
import { ownedDirectories } from "./ownedDirectories";
import { sharedBody } from "./sharedBody";

/** Resolves declared selector ownership even when its source population is empty. */
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
