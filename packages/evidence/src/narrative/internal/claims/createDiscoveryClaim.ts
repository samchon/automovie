import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import { constructionStage } from "../constructionStage";
import { productionLayers } from "../productionLayers";
import { createDiscoveryReferences } from "../references/createDiscoveryReferences";
import { createContractRoot } from "../utilities/createContractRoot";

/**
 * Creates the open-world discovery claim for one layer.
 *
 * Discovery asks what this work needs that no shared contract states, so the
 * answer is a work-specific contract rather than a passage of the production. Its
 * hosts are the documents under the production's `docs/contracts/work`: a duty
 * that found something is answered by the file that states the adopted rule,
 * and a duty that found nothing is excluded on `work/discovery/results.md`,
 * naming the risks examined and the shared owners that already cover them.
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
 * Every layer's claim shares those hosts, and a citation resolves only to a
 * contract some active claim selects. A finished layer turned back to
 * `disabled` would therefore leave its recorded findings unresolvable for the
 * layers still running. The claim stays active while its layer or any later
 * layer of the route is in `evidence`: the route closes its layers in order,
 * so an earlier layer's findings are written and stay checked, while a layer
 * not yet reached owes none.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Open-world duties target shared/language discovery H2s while their hosts are the production's own work-contract files, rooted by createContractRoot at its own `docs/contracts` even when a workspace keeps the shared targets elsewhere, with negative findings centralized on one discovery carrier; the claim is active while its layer or a later layer of the route is in evidence, so a closed earlier layer's findings keep resolving.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The claim factory owns this contract-to-contract relation rather than asking manuscript units to testify about whether their contract was discovered.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The one negative-results carrier is the declared discovery workflow, and canon layers omit narrative-layer questions through the shared reference factory rather than a consumer exception.
 * @evidence contracts/development/common.md#meaningful-documentation The prose identifies adopted-rule hosts, truthful negative findings, the single negative carrier, why manuscript hosts cannot answer this relation and why a closed earlier layer's claim stays active.
 * @evidence contracts/development/implementation.md#efficient-algorithms The factory scans at most four route stages and constructs one claim and a fixed-size discovery-reference list; its one optional language-file existence probe and path operations dominate fixed population work, independent of manuscript length.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared and language discovery reference builders own their selection rules; the optional language contract is probed on each config construction so installation changes are not hidden behind a cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned claim and references are caller-owned, with a fixed family count; the synchronous existence probe exposes no retained handle or background task.
 */
export function createDiscoveryClaim(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim {
  const route: readonly AuthoredLayer[] = productionLayers(props);
  const disabled: boolean = route
    .slice(route.indexOf(layer))
    .every(
      (later: AuthoredLayer): boolean =>
        constructionStage(props, later) === "disabled",
    );
  return {
    name: `the ${layer} work-specific contract accounts for its open-world discovery duties`,
    type: "markdown",
    root: createContractRoot(props, "work"),
    files: ["work/**/*.md"],
    evidenceExcludeCarriers: ["work/discovery/results.md"],
    symbol: "file",
    disabled,
    reference: createDiscoveryReferences(props, layer),
  };
}
