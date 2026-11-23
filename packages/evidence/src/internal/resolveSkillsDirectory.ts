import path from "node:path";

import type { IContractLocation } from "./IContractLocation";
import { SKILLS_ROOT } from "./SKILLS_ROOT";

/**
 * Resolves the absolute shared skills tree holding the bundled contracts.
 *
 * An omitted `skills` is the standalone layout, the production's own
 * `.agents/skills`. A relative one resolves against `location`, never against
 * the working directory, so a workspace production can write
 * `"../../../.agents/skills"` and get the same tree from any process.
 *
 * @param contracts The production location and optional shared tree; read, not
 *   retained.
 * @returns The absolute shared skills directory.
 */
export function resolveSkillsDirectory(contracts: IContractLocation): string {
  if (contracts.skills === undefined)
    return path.join(contracts.location, ...SKILLS_ROOT.split("/"));
  return path.resolve(contracts.location, contracts.skills);
}
