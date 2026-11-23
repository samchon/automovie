import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";

import { PRODUCTION_CONTRACTS } from "../internal/PRODUCTION_CONTRACTS";
import type { AuthoredLayer } from "./AuthoredLayer";
import type { IPackagePopulationContractProps } from "./IPackagePopulationContractProps";
import type { ProductionStage } from "./ProductionStage";
import { BODY_ROOT } from "./internal/utilities/BODY_ROOT";
import { createEvidenceFiles } from "./internal/utilities/createEvidenceFiles";
import { createUnitFiles } from "./internal/utilities/createUnitFiles";

/**
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
  const normalizedDocument: string = props.document.replaceAll("\\", "/");
  if (
    !normalizedDocument.startsWith("work/obligations/") ||
    normalizedDocument
      .split("/")
      .some(
        (part: string): boolean => part === "" || part === "." || part === "..",
      ) ||
    /[[\]*?#]/u.test(normalizedDocument) ||
    !normalizedDocument.endsWith(".md") ||
    normalizedDocument.toLowerCase().endsWith("/skill.md")
  )
    throw new Error(
      `${props.document}: a population obligation must be one exact work/obligations/...md document.`,
    );

  const layers: [string, ProductionStage][] = Object.entries(props.layers);
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
    ([layer, stage]: [string, ProductionStage]): {
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
        files: [normalizedDocument],
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
