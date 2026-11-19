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
 * Creates the scripts population expression claims.
 *
 * A population question about expression, such as which sentence frames recur
 * or how endings converge, is about the language of the finished layer.
 * Scripts settle that language in construction, so the script population
 * answers once at file level under the scripts construction stage. The
 * screenplay settles its speech in construction too, under its realized-speech
 * principles, and owes no separate expression family.
 *
 * The contract files sit under `naturalness/obligations`, a folder the unit
 * checklists never select, so a population duty cannot leak into a per-unit
 * checklist. A package whose contract predates the folder has no such claim.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Scripts construction selects each installed expression obligation from the bundled skills or local language contracts. Each item has one file respondent across the script population.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Expression population questions have their own file-level family under scripts construction without leaking whole-population duties into unit checklists.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent optional obligation document produces no claim under the supported older-contract layout; every other layer finishes its language in its own construction questions.
 * @evidence contracts/development/common.md#meaningful-documentation The prose identifies the scripts respondents, file-level population semantics, construction activation and optional older contract families.
 * @evidence contracts/development/implementation.md#efficient-algorithms layerFiles supplies at most four candidate documents per scope; a bounded number of synchronous existence probes and path constructions dominate, and returned claims/references are fixed in count.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both scopes reuse layerFiles and shared reference constructors; existence is refreshed for each config build because installed contract files can change between builds.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only bounded claim arrays and reference objects survive under caller ownership; fs.existsSync calls retain no exposed descriptor and there is no process-wide family cache.
 */
export function createExpressionObligationClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  if (layer !== "scripts") return [];
  const disabled: boolean = constructionStage(props, layer) === "disabled";
  const directory: string = "naturalness/obligations";

  const shared: IEvidenceClaim[] = layerFiles(layer)
    .filter((file: string): boolean =>
      hasStoryContract(props, `${directory}/${file}`),
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
        : [
            claim({
              disabled,
              layer,
              scope: props.narrativeScope,
              reference,
            }),
          ];
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
