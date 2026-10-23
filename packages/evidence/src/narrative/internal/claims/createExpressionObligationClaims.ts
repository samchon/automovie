import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { hasNaturalness } from "../hasNaturalness";
import { createLocalContractReference } from "../references/createLocalContractReference";
import { createSharedReference } from "../references/createSharedReference";
import { layerFiles } from "../references/layerFiles";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";

/**
 * Creates the population claims that only the revised text can answer.
 *
 * A population question about expression, such as which sentence frames recur
 * or how endings converge, is about the language of the finished layer. The
 * draft leaves that language unfinished on purpose and the revision settles
 * it, so the draft documents answering these questions would describe text the
 * reader never sees. The layer's final documents answer them instead, once and
 * at file level, under the layer's naturalness stage.
 *
 * The contract files sit under `naturalness/obligations`, a folder the unit
 * checklists never select, so a population duty cannot leak into a per-unit
 * checklist. A package whose contract predates the folder has no such claim.
 *
 * @evidence contracts/common.md#principled-implementation Only expression-bearing layers receive final file-level obligation claims; installed shared and language files are selected separately, each requiring exactly one respondent for every population item.
 * @evidence contracts/common.md#clear-and-simple-design Expression population questions have their own family and stage, preventing them from leaking into draft unit checklists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent optional obligation document produces no claim under the supported older-contract layout; settings/treatments have no independent naturalness stage by contract.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies final-text respondents, file-level population semantics, naturalness activation and optional older contract families.
 * @evidence contracts/performance.md#efficient-algorithms layerFiles supplies at most four candidate documents per scope; a bounded number of synchronous existence probes and path constructions dominate, and returned claims/references are fixed in count.
 * @evidence contracts/performance.md#reuse-equivalent-work Both scopes reuse layerFiles and shared reference constructors; existence is refreshed for each config build because installed contract files can change between builds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only bounded claim arrays and reference objects survive under caller ownership; fs.existsSync calls retain no exposed descriptor and there is no process-wide family cache.
 */
export function createExpressionObligationClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  if (!hasNaturalness(layer)) return [];
  const stage: ProductionStage = props.naturalness[layer];
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
        : [claim({ disabled, layer, scope: props.narrativeScope, reference })];
    },
  );

  return [...shared, ...language];
}

/** Creates one claim whose final documents answer each item exactly once. */
function claim(props: {
  disabled: boolean;
  layer: AuthoredLayer;
  reference: IEvidenceMarkdownReference;
  scope: IProductionConfigProps["narrativeScope"];
}): IEvidenceClaim {
  return {
    name: `${props.layer} final documents answer each ${props.reference.files[0]} item once`,
    type: "markdown",
    root: passRoot("final"),
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
