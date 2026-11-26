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
 * construction evidence. Each item has exactly one answering document. An
 * obligation is never a per-H2 checklist, because repeating a population
 * question on every unit turns one comparison into a restatement per unit.
 *
 * Screenplay expression is answered here alongside the other screenplay duties.
 */
export function createPopulationObligationClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  const directory: string = "obligations";
  const disabled: boolean = constructionStage(props, layer) === "disabled";

  // Older trees can omit supplements and earlier layers' own obligations.
  function optional(file: string): boolean {
    return (
      file === "realized.md" ||
      (layer !== "screenplay" && file === `${layer}.md`)
    );
  }
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
