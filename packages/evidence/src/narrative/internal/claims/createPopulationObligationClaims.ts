import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import { constructionStage } from "../constructionStage";
import { createLocalContractReference } from "../references/createLocalContractReference";
import { createSharedReference } from "../references/createSharedReference";
import { layerFiles } from "../references/layerFiles";
import { BODY_ROOT } from "../utilities/BODY_ROOT";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { hasStoryContract } from "../utilities/hasStoryContract";

/**
 * Creates the population obligation claims for a complete layer.
 *
 * An obligation asks one question about the whole layer, so the layer's own
 * authored documents answer it once, at file level, through their detached
 * construction evidence. Each item has exactly one answering document.
 * An obligation is never a per-H2 checklist, because
 * repeating a population question on every unit turns one comparison into a
 * restatement per unit.
 *
 * Screenplay expression is answered here alongside the other screenplay duties.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Each enabled layer selects one file respondent per bundled or language population item. Bundled items come from the skills tree and language items from the production contracts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One factory selects shared and local obligations by layer, including screenplay expression. Each item has one respondent.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Common, narrative and final screenplay obligations stay selected when missing so the compiler reports the broken tree. Other layer files and the realized supplement remain optional.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains whole-layer respondents, unique evidence and screenplay coverage; the helper comment identifies optional-file compatibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four candidates per directory and scope are filtered and mapped, with a bounded number of synchronous existence probes and selector constructions; this factory never scans the manuscript population.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared/language selection reuses layerFiles and reference builders; optional installed files are observed per config build, so changes in the contract tree invalidate naturally without a retained cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Intermediate and returned arrays have a fixed family bound; returned claim/reference objects belong to the config owner and existence probes retain no exposed handles.
 */
export function createPopulationObligationClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  const directory: string = "obligations";
  const disabled: boolean = constructionStage(props, layer) === "disabled";

  // Older trees can omit supplements and earlier layers' own obligations.
  const optional: (file: string) => boolean = (file: string): boolean =>
    file === "realized.md" ||
    (layer !== "screenplay" && file === `${layer}.md`);
  const shared: IEvidenceClaim[] = layerFiles(layer)
    .filter(
      (file: string): boolean =>
        !optional(file) || hasStoryContract(props, `${directory}/${file}`),
    )
    .map(
      (file: string): IEvidenceClaim =>
        claim({
          disabled,
          layer,
          scope: props.narrativeScope,
          reference: createSharedReference({
            contracts: props,
            file: `${directory}/${file}`,
            checklist: false,
            exclusion: false,
          }),
        }),
    );

  const language: IEvidenceClaim[] = layerFiles(layer).flatMap(
    (file: string): IEvidenceClaim[] => {
      const reference: IEvidenceMarkdownReference | undefined =
        createLocalContractReference({
          location: props.location,
          scope: "language",
          file: `${directory}/${file}`,
          checklist: false,
          exclusion: false,
        });
      return reference === undefined
        ? []
        : [claim({ disabled, layer, scope: props.narrativeScope, reference })];
    },
  );

  return [...shared, ...language];
}

/** Creates one claim whose layer documents answer each item exactly once. */
function claim(props: {
  disabled: boolean;
  layer: AuthoredLayer;
  reference: IEvidenceMarkdownReference;
  scope: IProductionConfigProps["narrativeScope"];
}): IEvidenceClaim {
  return {
    name: `${props.layer} documents answer each ${props.reference.files[0]} item once`,
    type: "markdown",
    root: BODY_ROOT,
    files: createUnitFiles(props.layer, props.scope),
    symbol: "file",
    disabled: props.disabled,
    reference: { ...props.reference, uniqueEvidence: true },
  };
}
