import type { IEvidenceReference } from "@wrtnlabs/evidence";

import type { IContractLocation } from "../../../internal/IContractLocation";
import type { NarrativeLayer } from "../../NarrativeLayer";
import { createSharedReference } from "./createSharedReference";

/**
 * Creates the upstream-revision duty every unit of one narrative layer answers.
 *
 * Settings has no layer above it and never selects this family. It is a
 * checklist because whether writing this unit exposed an upstream defect is a
 * question about that unit, and ordinary coverage would let one unit answer for
 * every other. Exclusion is permitted, and the pairing is the point: a unit
 * whose parents answered every question it asked records what it tested, while
 * refusing the negative would make every unit claim a repair it never made.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Every narrative unit answers its own upstream-revision checklist, with exclusions permitted when the tested parents need no repair; settings is excluded by the typed narrative-layer input, and the shared upstream document resolves in the shared skills tree through createSharedReference.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the upstream-family relation and reuses the shared builder for citation addressing and flag assembly.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The exclusion represents a supported negative search finding rather than excusing an unexamined upstream defect; no consumer or expected answer changes the relation.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains per-unit rather than population ownership, the settings boundary and what a truthful no-repair result means.
 * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-size shared reference is constructed; path/string work scales with location, skills and layer text and does not scan manuscript units.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared reference builder centralizes root/checklist/exclusion semantics; fresh result objects prevent a caller from altering another upstream relation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reference belongs to the claim owner with one selector; no filesystem handle, background task or persistent registry is acquired.
 */
export function createUpstreamReference(
  contracts: IContractLocation,
  layer: NarrativeLayer,
): IEvidenceReference {
  return createSharedReference({
    contracts,
    file: `upstream/${layer}.md`,
    checklist: true,
    exclusion: true,
  });
}
