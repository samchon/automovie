import type { IEvidenceClaim } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { constructionStage } from "../constructionStage";
import { BODY_ROOT } from "../utilities/BODY_ROOT";
import { PACKAGE_DOCS_ROOT } from "../utilities/PACKAGE_DOCS_ROOT";
import { createUnitFiles } from "../utilities/createUnitFiles";

/**
 * Tracks instruction adoption in long work's settings, and realization in treatments or a short's screenplay.
 * Each layer covers the targets independently through its own construction
 * hosts and stage. Settings accounts for every adopted requirement; treatments
 * can exclude requirements outside its selected narrative population. A
 * short's brief holds only what the commission leaves open, so it owes no
 * instruction citation and its screenplay realizes every requirement.
 * Instructions remain targets only. No instructions folder means no claim.
 *
 * @evidence contracts/development/implementation.md#principled-implementation When docs/instructions exists, selected body H2 hosts independently cover every instruction H2; treatments may exclude out-of-population requirements while settings or short screenplay may not.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The optional instruction input stays a reference population rather than becoming another authored host tree.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The treatments exclusion difference follows narrative-population scope; an absent instruction directory returns undefined rather than manufacturing an input requirement.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states adoption versus realization, independent stage ownership, target-only instructions and the absent-directory result.
 * @evidence contracts/development/implementation.md#efficient-algorithms One synchronous directory existence probe and a fixed-size claim construction precede selector generation; no instruction or manuscript files are read by this factory.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared unit-selector and stage-normalization helpers are reused; the directory is observed on every build so a cached absence cannot suppress newly supplied instructions.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The optional returned claim owns a constant-count selector/reference structure; existence probing creates no retained handle, and no task or global cache is started.
 */
export function createInstructionCoverageClaim(
  props: IProductionConfigProps,
  layer: "settings" | "treatments" | "screenplay",
): IEvidenceClaim | undefined {
  const stage: ProductionStage = constructionStage(props, layer);
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
