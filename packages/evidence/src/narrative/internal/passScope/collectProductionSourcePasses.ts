import {
  type IEvidenceInventory,
  type IEvidenceSourceAddress,
} from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionGateKey } from "../../IProductionGateKey";
import { passId } from "../../passId";
import { authoredBoundary } from "./authoredBoundary";
import { authoredPathOwner } from "./authoredPathOwner";
import { bodyPathLayer } from "./bodyPathLayer";
import { ownedDirectories } from "./ownedDirectories";
import { sharedBody } from "./sharedBody";

/**
 * Resolves captured source ownership and rejects ambiguous authored boundaries.
 *
 * @evidence contracts/common.md#principled-implementation Captured physical paths, logical aliases, declared source owners and empty dependencies are reconciled into pass IDs; conflicting layers/passes and foreign authored boundaries are reported through issue instead of discarded.
 * @evidence contracts/common.md#clear-and-simple-design One local owner Set per source separates alias reconciliation from the final pass Set; empty inventories retain dependency ownership rather than losing their prerequisites.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The only alternate branch handles inventories with no captured sources, where dependencies are the remaining evidence; no observed ambiguity is repaired or hidden.
 * @evidence contracts/common.md#meaningful-documentation The comment states rejection of ambiguous ownership; diagnostics distinguish foreign, layer, pass and unresolved empty-dependency cases.
 * @evidence contracts/performance.md#efficient-algorithms For a addresses, d empty dependencies and fixed pass count k, directory checks cost O(a + d*k) path operations; nested local owner comparisons are bounded by k, and source/address temporary storage follows input size.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller-provided sourceOwners map and canonicalizer reuse ownership established for the same captured analysis; this function adds no independent persistent cache or filesystem observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner and body Sets are bounded by the fixed layer/pass vocabulary and released per source; the result has at most k IDs, and the caller owns issue storage.
 */
export function collectProductionSourcePasses(
  inventory: IEvidenceInventory,
  root: string,
  keys: Map<string, IProductionGateKey>,
  sourceOwners: Map<string, Set<string>>,
  issue: (message: string) => void,
  canonical: (filename: string, logicalRoot?: string) => string,
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
      const layer: AuthoredLayer | undefined = bodyPathLayer(
        root,
        address,
        canonical,
      );
      if (layer !== undefined) body.add(layer);
      const owner: IProductionGateKey | undefined = authoredPathOwner(
        root,
        address,
        canonical,
      );
      if (owner !== undefined) local.add(passId(owner));
      else if (
        (authoredBoundary(address) || authoredBoundary(canonical(address))) &&
        !sharedBody(root, address, canonical)
      )
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
        canonical,
      );
      if (owner !== undefined) found.add(passId(owner));
      else if (
        (authoredBoundary(dependency.path) ||
          authoredBoundary(canonical(dependency.path))) &&
        !sharedBody(root, dependency.path, canonical)
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
              ) ||
              canonical(directory, root).startsWith(
                `${canonical(dependency.path, root).replace(/\/+$/u, "")}/`,
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
