import path from "node:path";

import type { IContractLocation } from "../../../internal/IContractLocation";
import { PRODUCTION_CONTRACTS } from "../../../internal/PRODUCTION_CONTRACTS";
import { STORY_CONTRACTS } from "../../../internal/STORY_CONTRACTS";
import { resolveSkillsDirectory } from "../../../internal/resolveSkillsDirectory";

/*
 * Resolves the absolute contract tree that owns one contract family.
 *
 * Ownership decides the tree. The `shared` family ships with the bundled
 * skills, so it resolves under the shared skills tree's `contracts/story`,
 * which a workspace places at its root and a standalone production under its
 * own `.agents/skills`. The `work` and `language` families are contracts the
 * production itself adopts, so they always resolve under its own
 * `docs/contracts`, whichever tree holds the shared ones.
 * Parameter contracts: The production location and optional shared tree; read, not
 * retained.
 * Parameter scope: The contract family whose owner is wanted.
 * Returns: The absolute tree holding that family's folder; the family folder is
 * not appended.
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
