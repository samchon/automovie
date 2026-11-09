import fs from "node:fs";
import path from "node:path";

import { PRODUCTION_CONTRACTS } from "./PRODUCTION_CONTRACTS";
import { SKILLS_ROOT } from "./SKILLS_ROOT";
import { STORY_CONTRACTS } from "./STORY_CONTRACTS";

/**
 * Refuses a production that still keeps its own contracts in the retired tree.
 *
 * A production's `work` and `language` contracts moved from
 * `.agents/skills/contracts/story/{work,language}` to
 * `docs/contracts/{work,language}`. Their duties are admitted only when their
 * files exist where they now belong, so a production left in the old layout
 * would silently lose every language and work duty instead of failing. Either
 * legacy directory therefore stops configuration, and the error names each
 * one with its new home. Nothing is read from the old location.
 *
 * @param location Absolute production directory; read, not retained.
 * @throws Error naming every legacy directory found and where it moves.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Directory existence under the production location is the exact signal of the retired layout, because the old tree held only production-owned families; `fs.existsSync` follows the installed filesystem, and the message is built from the same layout constants the factories use.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One guard owns the migration refusal, called by createEvidenceConfig and by the narrative source assertion, so neither the configuration entry nor any contract factory carries legacy knowledge.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The guard refuses rather than falls back: no reference, probe or root reads the old location, and every legacy family found is reported in one error instead of the first alone.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two existence probes and a message linear in the found directories.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each configuration build observes the filesystem anew; caching would hide a migration made between builds.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Synchronous probes leave no handle, task or retained state.
 * @evidence contracts/development/common.md#meaningful-documentation States the move, why a stale layout must fail loudly, that nothing is read from the old location, and the parameter and failure.
 */
export function assertProductionContractLayout(location: string): void {
  const moves: string[] = (["work", "language"] as const)
    .filter((family: "work" | "language"): boolean =>
      fs.existsSync(
        path.join(
          location,
          ...SKILLS_ROOT.split("/"),
          ...STORY_CONTRACTS.split("/"),
          family,
        ),
      ),
    )
    .map(
      (family: "work" | "language"): string =>
        `${SKILLS_ROOT}/${STORY_CONTRACTS}/${family} -> ${PRODUCTION_CONTRACTS}/${family}`,
    );
  if (moves.length !== 0)
    throw new Error(
      `Production-owned contracts moved to ${PRODUCTION_CONTRACTS}; move ${moves.join(", ")} under ${location}.`,
    );
}
