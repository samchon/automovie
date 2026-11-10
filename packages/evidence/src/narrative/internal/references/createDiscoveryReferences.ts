import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import type { IContractLocation } from "../../../internal/IContractLocation";
import type { AuthoredLayer } from "../../AuthoredLayer";
import { isCanonLayer } from "../isCanonLayer";
import { createLanguageDiscoveryReferences } from "./createLanguageDiscoveryReferences";
import { createSharedReference } from "./createSharedReference";

/**
 * Creates the open-world discovery duties one layer's population covers.
 *
 * Canon, settings or a short's brief, searches its own directives, promise, and subject, and backcasts the
 * planned narrative to find what those layers would otherwise have to invent.
 * That backcast is how settings anticipates the cross-layer narrative contract,
 * so `discovery/narratives.md` is not selected here: it is the duty each
 * narrative layer answers when it rechecks that contract against what it
 * actually authored.
 *
 * Exclusion is permitted throughout the family. A duty that requires a search
 * must be able to record that the search found nothing, which is what makes
 * requiring it honest.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A fixed shared discovery family selects common and layer duties, adds narrative duties only for inheriting layers, and appends installed language calibration; shared duties resolve in the shared skills tree and language calibration in the production's own `docs/contracts`, each through its own reference root, and discovery permits exclusions for truthful negative searches.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The relation builder centralizes discovery target selection independently of the work-contract hosts created by createDiscoveryClaim.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Canon layers omit narrative discovery because their backcast owns anticipation rather than rechecking authored inherited units; this is the declared layer responsibility.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains settings backcast, narrative-layer recheck and why negative search findings remain admissible.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two or three shared references and at most one language reference are built; the optional language-file existence probe and fixed-count path operations dominate independent of manuscript size.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work createSharedReference and the language-discovery selector share address/flag rules; optional language installation is checked each build rather than memoized across changed contract trees.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The bounded reference array is returned to the claim owner; only temporary path strings are discarded and no filesystem handles or tasks remain retained.
 */
export function createDiscoveryReferences(
  contracts: IContractLocation,
  layer: AuthoredLayer,
): IEvidenceReference[] {
  return [
    ...[
      "common.md",
      ...(isCanonLayer(layer) ? [] : ["narratives.md"]),
      `${layer}.md`,
    ].map(
      (file: string): IEvidenceMarkdownReference =>
        createSharedReference({
          contracts,
          file: `discovery/${file}`,
          checklist: false,
          exclusion: true,
        }),
    ),
    ...createLanguageDiscoveryReferences(contracts.location),
  ];
}
