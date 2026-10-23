import {
  type IEvidenceInventory,
  type IEvidenceSourceAddress,
} from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionGateKey } from "../../IProductionGateKey";
import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";
import { passId } from "../../passId";
import { authoredBoundary } from "./authoredBoundary";
import { authoredPathOwner } from "./authoredPathOwner";
import { bodyPathLayer } from "./bodyPathLayer";
import { ownedDirectories } from "./ownedDirectories";
import { sharedBody } from "./sharedBody";

/** Resolves captured source ownership and rejects ambiguous authored boundaries. */
export function collectProductionSourcePasses(
  inventory: IEvidenceInventory,
  root: string,
  keys: Map<string, IProductionGateKey>,
  sourceOwners: Map<string, Set<string>>,
  issue: (message: string) => void,
): Set<string> {
  const found: Set<string> = new Set<string>();
  for (const source of inventory.sources) {
    const local: Set<string> = new Set<string>();
    const body: Set<string> = new Set<string>();
    for (const address of [
      source.physicalPath,
      ...source.addresses.map(
        (address: IEvidenceSourceAddress): string => address.absolute,
      ),
    ]) {
      const layer: AuthoredLayer | undefined = bodyPathLayer(root, address);
      if (layer !== undefined) body.add(layer);
      const owner: IProductionGateKey | undefined = authoredPathOwner(
        root,
        address,
      );
      if (owner !== undefined) local.add(passId(owner));
      else if (authoredBoundary(address) && !sharedBody(root, address))
        issue(
          `Source ${source.id} crosses an unaudited authored package boundary.`,
        );
    }
    for (const owner of sourceOwners.get(source.id) ?? []) local.add(owner);
    if (
      body.size > 1 ||
      [...body].some((layer: string): boolean =>
        [...local].some(
          (owner: string): boolean => keys.get(owner)!.layer !== layer,
        ),
      )
    )
      issue(`Source ${source.id} has ambiguous authored layer ownership.`);
    if (local.size > 1)
      issue(`Source ${source.id} has ambiguous authored pass ownership.`);
    for (const owner of local) found.add(owner);
  }
  // Missing files still retain captured directory/file dependencies.
  if (inventory.sources.length === 0)
    for (const dependency of inventory.dependencies) {
      const owner: IProductionGateKey | undefined = authoredPathOwner(
        root,
        dependency.path,
      );
      if (owner !== undefined) found.add(passId(owner));
      else if (
        authoredBoundary(dependency.path) &&
        !sharedBody(root, dependency.path)
      )
        issue(
          `An empty dependency crosses an unaudited authored package boundary at ${dependency.path}.`,
        );
      else if (
        dependency.recursive &&
        [...keys.values()].some((key: IProductionGateKey): boolean => {
          const edition: "draft" | "final" =
            key.pass === "construction" ? "draft" : "final";
          return ownedDirectories(root, key, edition).some(
            (directory: string): boolean =>
              canonical(directory).startsWith(
                `${canonical(dependency.path).replace(/\/+$/u, "")}/`,
              ),
          );
        })
      )
        issue(
          `An empty dependency has unresolved pass ownership at ${dependency.path}.`,
        );
    }
  return found;
}
