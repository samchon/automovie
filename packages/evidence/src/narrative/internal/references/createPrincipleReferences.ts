import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import type { IContractLocation } from "../../../internal/IContractLocation";
import type { AuthoredLayer } from "../../AuthoredLayer";
import { hasStoryContract } from "../utilities/hasStoryContract";
import { createSharedReference } from "./createSharedReference";
import { layerFiles } from "./layerFiles";

/*
 * Creates the principle checklists every unit of one layer answers for itself.
 *
 * Each unit answers its layer's principles. Only the screenplay selects an
 * installed realized-text supplement. Every selected H2 answers its items.
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
