import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "./AuthoredLayer";
import type { IPackageContractProps } from "./IPackageContractProps";
import type { ProductionStage } from "./ProductionStage";
import { createPackageChecklistClaim } from "./createPackageChecklistClaim";
import { createUnitFiles } from "./internal/utilities/createUnitFiles";

/**
 * Creates one adopted contract's claims, one per layer that answers it.
 *
 * A work rule usually binds several layers in the same terms, and writing that
 * out is the same claim four times with only the layer's name, stage, and file
 * glob changing. State the layers instead, and the wiring follows from them.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Each declared layer stage becomes one checklist claim with that layer's exact narrative selector, after an empty layer map is rejected.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrapper keeps adopted rule identity and layer ownership together, delegating exact document/host checks to createPackageChecklistClaim.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every authored layer is admitted on the same terms; no special claim name or fixture changes validation.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states that one adopted contract expands to its owning layers; props document granularity, activation and pilot scope.
 * @evidence contracts/development/implementation.md#efficient-algorithms For l owning layers, d document-path characters and f selector output, expansion costs O(l*(d+f)) through delegated validation; l is at most the supported authored layer set for typed callers.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each layer needs a distinct claim and diagnostic name; equivalent shared document paths are inputs, not cached effectful results, and no cross-request coordinator is created.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result owns l claim objects and their delegated arrays; local layer entries are discarded on completion or failure, with no handles or running tasks.
 */
export function createPackageContract(
  props: IPackageContractProps,
): IEvidenceClaim[] {
  const layers: [string, ProductionStage][] = Object.entries(props.layers);
  if (layers.length === 0)
    throw new Error("A package contract requires at least one owning layer.");

  return layers.map(
    ([layer, stage]: [string, ProductionStage]): IEvidenceClaim =>
      createPackageChecklistClaim({
        name: `${layer} units ${props.reason}`,
        document: props.document,
        files: createUnitFiles(layer as AuthoredLayer, props.narrativeScope),
        stage,
        symbol: props.symbol,
        checklist: props.checklist,
        inapplicable: props.inapplicable,
      }),
  );
}
