import type { IEvidenceClaim } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { AutoMovieEvidenceProductionStage } from "../../AutoMovieEvidenceProductionStage";
import { constructionStage } from "../constructionStage";
import { BODY_ROOT } from "../utilities/BODY_ROOT";
import { PACKAGE_DOCS_ROOT } from "../utilities/PACKAGE_DOCS_ROOT";
import { createUnitFiles } from "../utilities/createUnitFiles";

/*
 * Tracks instruction adoption in long work's settings, and realization in
 * treatments or a short's screenplay. Each layer covers the targets
 * independently through its own construction hosts and stage. Settings accounts
 * for every adopted requirement; treatments can exclude requirements outside
 * its selected narrative population. On a short, the brief defines subjects and
 * the screenplay accounts for every instruction. Instructions remain targets
 * only. No instructions folder means no claim.
 */
export function createInstructionCoverageClaim(
  props: IProductionConfigProps,
  layer: "settings" | "treatments" | "screenplay",
): IEvidenceClaim | undefined {
  const stage: AutoMovieEvidenceProductionStage = constructionStage(props, layer);
  const directory: string = path.join(
    props.location,
    PACKAGE_DOCS_ROOT,
    "instructions",
  );
  if (!fs.existsSync(directory)) return undefined;
  return {
    name: `the ${layer} canon realizes every user instruction`,
    type: "markdown",
    root: BODY_ROOT,
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
