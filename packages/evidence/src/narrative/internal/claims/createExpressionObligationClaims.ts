import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { REALIZED_LAYERS } from "../REALIZED_LAYERS";
import { hasNaturalness } from "../hasNaturalness";
import { createLocalContractReference } from "../references/createLocalContractReference";
import { createSharedReference } from "../references/createSharedReference";
import { layerFiles } from "../references/layerFiles";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";

/**
 * Creates population expression claims for the edition that settles its language.
 *
 * A population question about expression, such as which sentence frames recur
 * or how endings converge, is about the language of the finished layer.
 * Scripts settles that language in construction; final screenplay settles it
 * in naturalness. The finished population answers once at file level under
 * the same stage as its unit expression questions.
 *
 * The contract files sit under `naturalness/obligations`, a folder the unit
 * checklists never select, so a population duty cannot leak into a per-unit
 * checklist. A package whose contract predates the folder has no such claim.
 *
 * @evidence contracts/common.md#principled-implementation Only expression-bearing layers receive file-level obligation claims in their finished edition; installed shared and language files are selected separately, each requiring exactly one respondent for every population item.
 * @evidence contracts/common.md#clear-and-simple-design Expression population questions have their own file-level family; scripts use construction and screenplay uses naturalness without leaking whole-population duties into unit checklists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent optional obligation document produces no claim under the supported older-contract layout; settings/treatments have no independent naturalness stage by contract.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies finished-text respondents, file-level population semantics, layer-specific activation and optional older contract families.
 * @evidence contracts/performance.md#efficient-algorithms layerFiles supplies at most four candidate documents per scope; a bounded number of synchronous existence probes and path constructions dominate, and returned claims/references are fixed in count.
 * @evidence contracts/performance.md#reuse-equivalent-work Both scopes reuse layerFiles and shared reference constructors; existence is refreshed for each config build because installed contract files can change between builds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only bounded claim arrays and reference objects survive under caller ownership; fs.existsSync calls retain no exposed descriptor and there is no process-wide family cache.
 */
export function createExpressionObligationClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  if (!REALIZED_LAYERS.has(layer)) return [];
  const revised: boolean = hasNaturalness(layer);
  const stage: ProductionStage = revised
    ? props.naturalness.screenplay
    : props.construction[layer];
  const disabled: boolean = stage === "disabled";
  const directory: string = "naturalness/obligations";

  const shared: IEvidenceClaim[] = layerFiles(layer)
    .filter((file: string): boolean =>
      exists(props.location, "shared", `${directory}/${file}`),
    )
    .map(
      (file: string): IEvidenceClaim =>
        claim({
          disabled,
          revised,
          layer,
          scope: props.narrativeScope,
          reference: createSharedReference({
            location: props.location,
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
              revised,
              layer,
              scope: props.narrativeScope,
              reference,
            }),
          ];
    },
  );

  return [...shared, ...language];
}

/** Creates one claim whose finished documents answer each item exactly once. */
function claim(props: {
  disabled: boolean;
  revised: boolean;
  layer: AuthoredLayer;
  reference: IEvidenceMarkdownReference;
  scope: IProductionConfigProps["narrativeScope"];
}): IEvidenceClaim {
  return {
    name: `${props.layer} ${props.revised ? "final" : "draft"} documents answer each ${props.reference.files[0]} item once`,
    type: "markdown",
    root: passRoot(props.revised ? "final" : "draft"),
    files: createUnitFiles(props.layer, props.scope),
    symbol: "file",
    disabled: props.disabled,
    reference: { ...props.reference, uniqueEvidence: true },
  };
}

/** Reports whether one optional contract-family document is installed. */
function exists(
  location: string,
  scope: "shared" | "language",
  file: string,
): boolean {
  return fs.existsSync(
    path.join(
      location,
      ".agents",
      "skills",
      "contracts",
      "story",
      scope,
      ...file.split("/"),
    ),
  );
}
