import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IContractLocation } from "../../../internal/IContractLocation";
import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { NarrativeScope } from "../../NarrativeScope";
import type { ProductionStage } from "../../ProductionStage";
import { constructionStage } from "../constructionStage";
import { createLocalContractReference } from "../references/createLocalContractReference";
import { createSharedReference } from "../references/createSharedReference";
import { layerFiles } from "../references/layerFiles";
import { createContractDirectory } from "../utilities/createContractDirectory";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";

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
 * Unit duties use checklists. Naturalness population comparisons have separate
 * expression obligation claims rather than repeating their question per unit.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Construction stage controls whole-layer file-level obligation coverage, with one answering document per shared/language population item and no per-H2 repetition of the same comparison; createContractDirectory probes shared documents in the shared skills tree and language documents in the production's own `docs/contracts`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The exported factory delegates one family build while keeping population scope distinct from principle checklists and expression obligations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Required shared common/narrative files stay selected even when missing so the compiler reports a broken tree; only realized and layer-specific optional documents are conditionally selected.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains whole-layer respondents, unique evidence and the boundary with per-unit and naturalness families; the helper comment identifies optional-file compatibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four candidates per scope are filtered and mapped, with a bounded number of synchronous existence probes and selector constructions; this factory never scans the manuscript population.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared/language selection reuses layerFiles and reference builders; optional installed files are observed per config build, so changes in the contract tree invalidate naturally without a retained cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Intermediate and returned arrays have a fixed family bound; returned claim/reference objects belong to the config owner and existence probes retain no exposed handles.
 */
export function createPopulationObligationClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  return family(props, layer, constructionStage(props, layer));
}

/** Creates the obligation claims for one layer's shared and language duties. */
function family(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
  stage: ProductionStage,
): IEvidenceClaim[] {
  const directory: string = "obligations";
  const disabled: boolean = stage !== "evidence";
  // The shared tree ships `common.md`, and every non-canon layer its
  // `narratives.md`, so a missing one is a broken tree that must still be
  // selected for the compiler to say so. Only the optional documents are
  // filtered: `realized.md`, which older trees predate, and the layer file,
  // which exists only where that layer owes a duty of its own.
  const optional: (file: string) => boolean = (file: string): boolean =>
    file === "realized.md" || file === `${layer}.md`;
  const shared: IEvidenceClaim[] = layerFiles(layer)
    .filter(
      (file: string): boolean =>
        !optional(file) || exists(props, "shared", `${directory}/${file}`),
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
  scope: NarrativeScope;
}): IEvidenceClaim {
  return {
    name: `${props.layer} documents answer each ${props.reference.files[0]} item once`,
    type: "markdown",
    root: passRoot("draft"),
    files: createUnitFiles(props.layer, props.scope),
    symbol: "file",
    disabled: props.disabled,
    reference: { ...props.reference, uniqueEvidence: true },
  };
}

/** Reports whether one optional contract-family document is installed. */
function exists(
  contracts: IContractLocation,
  scope: "shared" | "language",
  file: string,
): boolean {
  return fs.existsSync(
    path.join(
      createContractDirectory(contracts, scope),
      scope,
      ...file.split("/"),
    ),
  );
}
