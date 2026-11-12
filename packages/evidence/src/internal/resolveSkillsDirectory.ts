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
 * @param contracts The production location and optional shared tree; read, not retained.
 * @returns The absolute shared skills directory.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Node's `path.resolve` anchors a relative value at the absolute production location, and `path.join` builds the default from the scaffold's `.agents/skills` layout.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns both the default and the resolution rule, so the configuration entry, the narrative assertion and every shared contract lookup agree on the shared tree.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A relative value is resolved against the production, never the working directory; no workspace layout is inferred from the filesystem.
 * @evidence contracts/development/implementation.md#efficient-algorithms One path resolution or join, linear in the path length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure path computation coordinates no work across requests.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string outlives the call.
 * @evidence contracts/development/common.md#meaningful-documentation States the standalone default, how a relative value resolves, and the parameter and result.
 */
export function resolveSkillsDirectory(contracts: IContractLocation): string {
  if (contracts.skills === undefined)
    return path.join(contracts.location, ...SKILLS_ROOT.split("/"));
  return path.resolve(contracts.location, contracts.skills);
}
