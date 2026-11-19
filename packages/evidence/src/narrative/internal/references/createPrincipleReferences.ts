import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import type { IContractLocation } from "../../../internal/IContractLocation";
import type { AuthoredLayer } from "../../AuthoredLayer";
import { hasStoryContract } from "../utilities/hasStoryContract";
import { createSharedReference } from "./createSharedReference";
import { layerFiles } from "./layerFiles";

/**
 * Creates the principle checklists every unit of one layer answers for itself.
 *
 * Each unit answers its layer's principles. Only the screenplay selects an
 * installed realized-text supplement. Every selected H2 answers its items.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Common, inherited narrative, realized-text and layer-specific files become non-excludable per-unit H2 checklists in the selected principles directory; only declared optional family files are filtered by installation, probed in the shared skills tree that createContractDirectory resolves, where createSharedReference also roots the references.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One layer axis is reused across construction stages, while family admission remains distinct from language modules and population obligations; the owning tree is decided by createContractDirectory, not rebuilt here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Required construction files stay selected when missing so native compilation diagnoses the broken tree; realized supplements are optional.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains who can answer each scope, why literal-text questions apply only to realized layers, and which layer selects realized text.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four layer-file candidates require a bounded number of optional-file probes and fixed-size reference constructions; no manuscript traversal occurs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work layerFiles and createSharedReference centralize scope and address semantics; optional-file existence refreshes per configuration build rather than persisting an old contract population.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Intermediate file lists and returned references have a fixed family bound; config owns the result and synchronous existence checks retain no handle or running task.
 */
export function createPrincipleReferences(props: {
  contracts: IContractLocation;
  layer: AuthoredLayer;
}): IEvidenceReference[] {
  return layerFiles(props.layer)
    .filter(
      (file: string): boolean =>
        file !== "realized.md" ||
        hasStoryContract(props.contracts, `principles/${file}`),
    )
    .map(
      (file: string): IEvidenceMarkdownReference =>
        createSharedReference({
          contracts: props.contracts,
          file: `principles/${file}`,
          checklist: true,
          exclusion: false,
        }),
    );
}
