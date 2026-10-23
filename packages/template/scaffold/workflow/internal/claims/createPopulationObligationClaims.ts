import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { NarrativeScope } from "../../NarrativeScope";
import type { ProductionStage } from "../../ProductionStage";
import { createLocalContractReference } from "../references/createLocalContractReference";
import { createSharedReference } from "../references/createSharedReference";
import { layerFiles } from "../references/layerFiles";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";
import { resolveConstruction } from "../utilities/resolveConstruction";

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
 */
export function createPopulationObligationClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  return family(
    props,
    layer,
    resolveConstruction(props.construction[layer])[0],
  );
}

/** Creates the obligation claims for one layer's shared and language duties. */
function family(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
  stage: ProductionStage,
): IEvidenceClaim[] {
  const directory: string = "obligations";
  const disabled: boolean = stage === "disabled";
  // The shared tree ships `common.md`, and every non-settings layer its
  // `narratives.md`, so a missing one is a broken tree that must still be
  // selected for the compiler to say so. Only the optional documents are
  // filtered: `realized.md`, which older trees predate, and the layer file,
  // which exists only where that layer owes a duty of its own.
  const optional: (file: string) => boolean = (file: string): boolean =>
    file === "realized.md" || file === `${layer}.md`;
  const shared: IEvidenceClaim[] = layerFiles(layer)
    .filter(
      (file: string): boolean =>
        !optional(file) ||
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
