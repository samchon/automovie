import path from "node:path";

import type { IContractLocation } from "./IContractLocation";
import { SKILLS_ROOT } from "./SKILLS_ROOT";

/**
 * Resolves the absolute shared skills tree holding the bundled contracts.
 *
 * An omitted `skills` is the standalone layout, the production's own
 * `.agents/skills`. A supplied one must be absolute like `location`, because a
 * relative directory would resolve against whichever process reads the
 * configuration rather than against the production.
 *
 * @param contracts The production location and optional shared tree; read, not retained.
 * @returns The absolute shared skills directory.
 * @throws Error when a supplied `skills` is not absolute.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Node's `path.isAbsolute` decides absoluteness for the host platform, and `path.join` builds the default from the scaffold's `.agents/skills` layout under the absolute production location.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns both the default and the absolute-path rule, so the configuration entry, the narrative assertion and every shared contract lookup agree on the shared tree.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A relative value is refused rather than resolved against the working directory; no workspace layout is inferred from the filesystem.
 * @evidence contracts/development/implementation.md#efficient-algorithms One absoluteness test or one path join, linear in the path length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure path computation coordinates no work across requests.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string outlives the call.
 * @evidence contracts/development/common.md#meaningful-documentation States the standalone default, why a relative value is refused, and the parameter, result and failure.
 */
export function resolveSkillsDirectory(contracts: IContractLocation): string {
  if (contracts.skills === undefined)
    return path.join(contracts.location, ...SKILLS_ROOT.split("/"));
  if (!path.isAbsolute(contracts.skills))
    throw new Error("Evidence skills must be an absolute directory.");
  return contracts.skills;
}
