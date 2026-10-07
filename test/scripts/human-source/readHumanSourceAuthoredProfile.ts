import path from "node:path";
import type { IHumanSourceAuthoredPacketEntry } from "./structures/IHumanSourceAuthoredPacketEntry.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import { readHumanSourceInput } from "./readHumanSourceInput.ts";

/** Consume the profile explicitly recorded by this admitted provider packet.
 * Its portable repository-bound path and exact digest are the authority;
 * no legacy fixed-name profile substitutes for a generated guide. The same
 * captured bytes enter normal input identity and final mutable verification.
 * This boundary supplies provenance, not anatomical or clinical acceptance.
 * @author Samchon
 */
export function readHumanSourceAuthoredProfile<T>(repository: string,
  entry: IHumanSourceAuthoredPacketEntry, inputs: IHumanSourceGenerationInput[], role: string): T {
  if (!entry.logicalPath || entry.logicalPath.includes("\\") || path.isAbsolute(entry.logicalPath) ||
      !/^[a-f0-9]{64}$/u.test(entry.sha256))
    throw new Error("Authored profile needs its portable repository path and exact digest.");
  const relative = path.relative(path.resolve(repository), path.resolve(repository, entry.logicalPath));
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
    throw new Error("Authored profile path escapes its recorded repository owner.");
  return readHumanSourceInput<T>(inputs, role, repository, entry.logicalPath, null, entry.sha256);
}
