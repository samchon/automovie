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
 * detached construction evidence. Each duty has exactly one answering
 * document. A duty is never repeated per H2, because a population question
 * restated on every unit is no longer one comparison.
 *
 * @evidence contracts/development/implementation.md#principled-implementation An exact work/obligations path yields one unique-evidence file-level duty reference per owning layer; pilot-only inapplicability is checked before constructing claims. The reference roots at the production's own `docs/contracts`, because the work obligation is production-owned even when a workspace keeps the shared contracts elsewhere.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The factory keeps once-per-population ownership separate from per-H2 checklist expansion and delegates manuscript selectors to createUnitFiles.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pilot-only deferral follows the explicit scope contract; complete-work obligations cannot be suppressed through the inapplicable flag.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies detached evidence, file-level answering and exactly one answering document per duty; props state ownership and deferral.
 * @evidence contracts/development/implementation.md#efficient-algorithms The document path is scanned once, then l layer entries each produce selector strings and one reference. Time and allocation scale with path bytes plus layer/selector output; typed workloads have only the authored layer set.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Claims remain distinct per layer with their own selectors and stages; this stateless factory coordinates no reusable requests or mutable shared result.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Local path and entry arrays expire on return or throw; the returned claims own their reference and selector arrays and acquire no file handles or tasks.
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
