import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionConstructionStageMixin } from "../../ProductionConstructionStageMixin";
import { createDiscoveryReferences } from "../references/createDiscoveryReferences";
import { resolveConstruction } from "../utilities/resolveConstruction";

/**
 * Creates the open-world discovery claim for one layer.
 *
 * Discovery asks what this work needs that no shared contract states, so the
 * answer is a work-specific contract rather than a passage of the production. Its
 * hosts are the documents under `contract/work`: a duty that found something is
 * answered by the file that states the adopted rule, and a duty that found
 * nothing is excluded on `work/discovery/results.md`, naming the risks examined and
 * the shared owners that already cover them.
 *
 * Putting these on authored units instead would ask a settings owner or a
 * narrative unit to testify about the contract rather than about the work,
 * which is how an adopted rule ends up recorded in screenplay and never enforced.
 *
 * `evidenceExcludeCarriers` gathers negatives on one discovery carrier rather than
 * leaving them wherever a contract file happens to sit. An exclusion is the one
 * acknowledgement that discharges a duty with nothing built, so reading every
 * one a work declared has to be possible in a single file; scattered through
 * the contracts it means reading the contracts to find out what was skipped.
 */
export function createDiscoveryClaim(
  props: IProductionConfigProps,
  layer: "settings" | "treatments" | "scripts" | "screenplay",
): IEvidenceClaim {
  const [stage]: ProductionConstructionStageMixin = resolveConstruction(
    props.construction[layer],
  );
  return {
    name: `the ${layer} work-specific contract accounts for its open-world discovery duties`,
    type: "markdown",
    root: ".agents/skills/contracts/story",
    files: ["work/**/*.md"],
    evidenceExcludeCarriers: ["work/discovery/results.md"],
    symbol: "file",
    disabled: stage === "disabled",
    reference: createDiscoveryReferences(props.location, layer),
  };
}
