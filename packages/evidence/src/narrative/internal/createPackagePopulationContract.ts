import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";

import { PRODUCTION_CONTRACTS } from "../../internal/PRODUCTION_CONTRACTS";
import type { AuthoredLayer } from "../AuthoredLayer";
import type { AutoMovieEvidenceProductionStage } from "../AutoMovieEvidenceProductionStage";
import type { IPackagePopulationContractProps } from "../IPackagePopulationContractProps";
import { BODY_ROOT } from "./utilities/BODY_ROOT";
import { createEvidenceFiles } from "./utilities/createEvidenceFiles";
import { createUnitFiles } from "./utilities/createUnitFiles";
import { workContractAddress } from "./workContractAddress";

/*
 * Creates one population obligation claim per selected layer.
 *
 * The layer's own documents answer each duty once, at file level, through
 * detached construction evidence. Each duty has exactly one answering document.
 * A duty is never repeated per H2, because a population question restated on
 * every unit is no longer one comparison.
 */
export function createPackagePopulationContract(
  props: IPackagePopulationContractProps,
): IEvidenceClaim[] {
  const address = workContractAddress(props.document);
  if (address.family !== "obligations")
    throw new Error(
      `${props.document}: a population obligation must be one exact work/obligations/...md document.`,
    );

  const layers: [string, AutoMovieEvidenceProductionStage][] = Object.entries(
    props.layers,
  );
  if (layers.length === 0)
    throw new Error(
      "A population contract requires at least one owning layer.",
    );
  if (
    props.inapplicable === true &&
    props.narrativeScope.mode !== "first-part-pilot"
  )
    throw new Error(
      "A population contract is inapplicable only while a first-part pilot defers a complete-work obligation.",
    );

  return layers.map(
    ([layer, stage]: [string, AutoMovieEvidenceProductionStage]): {
      disabled: boolean;
      reference: IEvidenceMarkdownReference;
      evidenceFiles: string[];
      name: string;
      type: "markdown";
      root: string;
      files: string[];
      symbol: "file";
    } => {
      const obligation: IEvidenceMarkdownReference = {
        type: "markdown",
        root: PRODUCTION_CONTRACTS,
        files: [address.path],
        symbol: "h2",
        noEvidenceExclude: true,
        uniqueEvidence: true,
      };
      const files: string[] = createUnitFiles(
        layer as AuthoredLayer,
        props.narrativeScope,
      );
      return {
        name: `${layer} documents ${props.reason}`,
        type: "markdown",
        root: BODY_ROOT,
        files,
        symbol: "file",
        evidenceFiles: createEvidenceFiles("file", files),
        disabled: stage === "disabled" || props.inapplicable === true,
        reference: obligation,
      };
    },
  );
}
