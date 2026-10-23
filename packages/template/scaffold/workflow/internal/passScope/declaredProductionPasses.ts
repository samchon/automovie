import path from "node:path";

import type { IProductionGateKey } from "../../IProductionGateKey";
import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";
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
    const prefix: string = canonical(
      path.resolve(
        root,
        selectedRoot?.replaceAll("\\", "/") ?? "",
        portable.slice(0, end),
      ),
    );
    const owner: IProductionGateKey | undefined = authoredPathOwner(
      root,
      prefix,
    );
    if (owner !== undefined) found.add(passId(owner));
    else if (authoredBoundary(prefix) && !sharedBody(root, prefix))
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
            canonical(directory).startsWith(prefix),
        );
      })
    )
      issue(
        `An empty authored selection has unresolved pass ownership at ${prefix}.`,
      );
  }
  return found;
}
