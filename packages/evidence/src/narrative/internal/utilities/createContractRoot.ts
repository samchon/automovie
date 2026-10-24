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
 *
 * @evidence contracts/common.md#principled-implementation The local .agents/skills/contracts/story path is expressed relative to the supplied production location with portable separators, preserving shared/language/work family identity in every citation.
 * @evidence contracts/common.md#clear-and-simple-design One lexical root adapter is reused by shared references while contract Markdown remains owned by the production rather than mirrored into configuration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The literal local contract tree is the installed layout contract; no fallback remote root, fixture path or copied contract bytes are introduced.
 * @evidence contracts/common.md#meaningful-documentation The prose explains family-qualified addresses, local Markdown ownership and the absence of a separate document mirror.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of path/string normalization operations costs O(p) time and transient text space for location length p, without reading directories or file bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All shared-reference factories reuse this root rule; the scalar derived path has no effectful work or cross-request cache requiring invalidation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned relative string belongs to the caller; normalization temporaries expire after return and no handle, task or persistent collection is acquired.
 */
export function createContractRoot(location: string): string {
  return path
    .relative(
      location,
      path.join(location, ".agents", "skills", "contracts", "story"),
    )
    .replaceAll("\\", "/");
}
