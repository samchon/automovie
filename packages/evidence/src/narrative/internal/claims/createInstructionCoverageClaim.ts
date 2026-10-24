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
 *
 * @evidence contracts/common.md#principled-implementation When docs/instructions exists, selected draft H2 hosts independently cover every instruction H2; treatments may exclude out-of-population requirements while settings or short screenplay may not.
 * @evidence contracts/common.md#clear-and-simple-design The optional instruction input stays a reference population rather than becoming another authored host tree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The treatments exclusion difference follows narrative-population scope; an absent instruction directory returns undefined rather than manufacturing an input requirement.
 * @evidence contracts/common.md#meaningful-documentation The prose states adoption versus realization, independent stage ownership, target-only instructions and the absent-directory result.
 * @evidence contracts/performance.md#efficient-algorithms One synchronous directory existence probe and a fixed-size claim construction precede selector generation; no instruction or manuscript files are read by this factory.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared unit-selector and stage-normalization helpers are reused; the directory is observed on every build so a cached absence cannot suppress newly supplied instructions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The optional returned claim owns a constant-count selector/reference structure; existence probing creates no retained handle, and no task or global cache is started.
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
