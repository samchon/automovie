import path from "node:path";

import type { IContractLocation } from "../../../internal/IContractLocation";
import { PRODUCTION_CONTRACTS } from "../../../internal/PRODUCTION_CONTRACTS";
import { STORY_CONTRACTS } from "../../../internal/STORY_CONTRACTS";
import { resolveSkillsDirectory } from "../../../internal/resolveSkillsDirectory";

/**
 * Resolves the absolute contract tree that owns one contract family.
 *
 * Ownership decides the tree. The `shared` family ships with the bundled
 * skills, so it resolves under the shared skills tree's `contracts/story`,
 * which a workspace places at its root and a standalone production under its
 * own `.agents/skills`. The `work` and `language` families are contracts the
 * production itself adopts, so they always resolve under its own
 * `docs/contracts`, whichever tree holds the shared ones.
 *
 * @param contracts The production location and optional shared tree; read, not retained.
 * @param scope The contract family whose owner is wanted.
 * @returns The absolute tree holding that family's folder; the family folder is not appended.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The scaffold's ownership rule, bundled shared contracts in the skills tree's `contracts/story` and adopted work/language contracts in the production's `docs/contracts`, maps each family to one tree, joined from the layout constants by `path.join`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns the family-to-owner decision for every existence probe and, through createContractRoot, every contract reference root, so no caller rebuilds either tree from the location.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No family falls back to another tree when a file is missing, and the retired `.agents/skills/contracts/story/{work,language}` location is never consulted; a missing contract stays missing where its owner keeps it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One branch and one path join, linear in the path length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure path computation coordinates no work across requests.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string outlives the call.
 * @evidence contracts/development/common.md#meaningful-documentation States which tree owns each family in workspace and standalone layouts, and that the result stops above the family folder.
 */
export function createContractDirectory(
  contracts: IContractLocation,
  scope: "shared" | "language" | "work",
): string {
  return scope === "shared"
    ? path.join(
        resolveSkillsDirectory(contracts),
        ...STORY_CONTRACTS.split("/"),
      )
    : path.join(contracts.location, ...PRODUCTION_CONTRACTS.split("/"));
}
