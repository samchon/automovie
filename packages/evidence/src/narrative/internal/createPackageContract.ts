import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../AuthoredLayer";
import type { IPackageContractProps } from "../IPackageContractProps";
import type { AutoMovieEvidenceProductionStage } from "../AutoMovieEvidenceProductionStage";
import { createPackageChecklistClaim } from "./createPackageChecklistClaim";
import { createUnitFiles } from "./utilities/createUnitFiles";

/*
 * Creates one adopted contract's claims, one per layer that answers it.
 *
 * A work rule usually binds several layers in the same terms, and writing that
 * out is the same claim four times with only the layer's name, stage, and file
 * glob changing. State the layers instead, and the wiring follows from them.
 */
export function createPackageContract(
  props: IPackageContractProps,
): IEvidenceClaim[] {
  const layers: [string, AutoMovieEvidenceProductionStage][] = Object.entries(
    props.layers,
  );
  if (layers.length === 0)
    throw new Error("A package contract requires at least one owning layer.");

  return layers.map(
    (
      [layer, stage]: [string, AutoMovieEvidenceProductionStage],
    ): IEvidenceClaim =>
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
