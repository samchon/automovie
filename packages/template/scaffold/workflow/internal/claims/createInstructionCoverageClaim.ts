import type { IEvidenceClaim } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionConstructionStageMixin } from "../../ProductionConstructionStageMixin";
import { PACKAGE_DOCS_ROOT } from "../utilities/PACKAGE_DOCS_ROOT";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";
import { resolveConstruction } from "../utilities/resolveConstruction";

/**
 * Tracks instruction adoption in settings and realization in treatments.
 * Each layer covers the targets independently through its own construction
 * hosts and stage. Settings accounts for every adopted requirement; treatments
 * can exclude requirements outside its selected narrative population.
 * Instructions remain targets only. No instructions folder means no claim.
 */
export function createInstructionCoverageClaim(
  props: IProductionConfigProps,
  layer: "settings" | "treatments" | "screenplay",
): IEvidenceClaim | undefined {
  const [stage]: ProductionConstructionStageMixin = resolveConstruction(
    props.construction[layer],
  );
  const directory: string = path.join(
    props.location,
    PACKAGE_DOCS_ROOT,
    "instructions",
  );
  if (!fs.existsSync(directory)) return undefined;
  return {
    name: `the ${layer} canon realizes every user instruction`,
    type: "markdown",
    root: passRoot("draft"),
    files: createUnitFiles(layer, props.narrativeScope),
    symbol: "h2",
    disabled: stage === "disabled",
    reference: {
      type: "markdown",
      root: PACKAGE_DOCS_ROOT,
      files: ["instructions/*.md"],
      symbol: "h2",
      noEvidenceExclude: layer !== "treatments",
    },
  };
}
