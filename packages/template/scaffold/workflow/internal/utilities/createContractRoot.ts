import path from "node:path";

/**
 * Resolves the effective contract tree owned by one production package.
 *
 * The root stops at `contracts/story` rather than descending into one family, so a
 * citation address carries the family that owns it: `shared/principles/...`,
 * `language/naturalness/...`, and `work/...` are told apart by the address a
 * host writes, instead of colliding on the same relative file name.
 *
 * The same local Markdown bytes are both pre-draft instructions and later
 * evidence targets. Config constructs the graph but owns no document mirror.
 */
export function createContractRoot(location: string): string {
  return path
    .relative(
      location,
      path.join(location, ".agents", "skills", "contracts", "story"),
    )
    .replaceAll("\\", "/");
}
