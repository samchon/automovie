import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { createDiscoveryReferences } from "../references/createDiscoveryReferences";

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
 *
 * @evidence contracts/common.md#principled-implementation Open-world duties target shared/language discovery H2s while their hosts are work-contract files, with negative findings centralized on one discovery carrier and stage activation derived from construction.
 * @evidence contracts/common.md#clear-and-simple-design The claim factory owns this contract-to-contract relation rather than asking manuscript units to testify about whether their contract was discovered.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The one negative-results carrier is the declared discovery workflow, and settings omits narrative-layer questions through the shared reference factory rather than a consumer exception.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies adopted-rule hosts, truthful negative findings, the single negative carrier and why manuscript hosts cannot answer this relation.
 * @evidence contracts/performance.md#efficient-algorithms The factory constructs one claim and a fixed-size discovery-reference list; its one optional language-file existence probe and path operations dominate fixed population work, independent of manuscript length.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared and language discovery reference builders own their selection rules; the optional language contract is probed on each config construction so installation changes are not hidden behind a cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned claim and references are caller-owned, with a fixed family count; the synchronous existence probe exposes no retained handle or background task.
 */
export function createDiscoveryClaim(
  props: IProductionConfigProps,
  layer: "settings" | "treatments" | "scripts" | "screenplay",
): IEvidenceClaim {
  const stage: ProductionStage = props.construction[layer];
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
