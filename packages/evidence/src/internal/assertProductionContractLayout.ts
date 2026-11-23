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
 * legacy directory therefore stops configuration, and the error names each one
 * with its new home. Nothing is read from the old location.
 *
 * @param location Absolute production directory; read, not retained.
 * @throws Error naming every legacy directory found and where it moves.
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
