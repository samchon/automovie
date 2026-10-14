/**
 * Reject blank or repeated identities before a body basis relationship is resolved. A channel, corrective, surface, material or region ID is a stable address into the immutable revision; silently accepting two owners for one name would make shape rows, material partitions and downstream edits depend on insertion order instead of authored anatomy. These IDs also address ordinary JavaScript records of morph targets, landmark positions and document edits. An inherited Object key would be read as data when its own row is absent, so every identifier must be a safe record key.
 *
 * @evidence contracts/common.md#principled-implementation Nonblank IDs, set cardinality and own Object-prototype-key rejection admit stable record-safe names before relationship resolution.
 * @evidence contracts/common.md#clear-and-simple-design One shared identity guard serves channels, landmarks, materials and regions without repeating record-key rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate owners and inherited record keys cannot acquire insertion-order-dependent meaning or masquerade as authored source data.
 * @evidence contracts/common.md#meaningful-documentation The prose explains immutable identity ownership, duplicate ambiguity and ordinary-record prototype collision risk.
 * @evidence contracts/performance.md#efficient-algorithms For N identifiers, bounded string scans plus a set require O(N) entries and O(N) temporary storage; all IDs must be checked before keyed consumers run.
 * @evidence contracts/performance.md#reuse-equivalent-work One guard centralizes ID admission, but differing populations are checked independently rather than sharing a mutable admitted-set cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary set expires after synchronous success or failure and input IDs remain unchanged without retained handles.
 */
export const assertHumanBodyUniqueIds: (ids: string[], what: string) => void = (
  ids: string[],
  what: string,
): void => {
  if (
    ids.some((id: string): boolean => id.trim() === "") ||
    new Set(ids).size !== ids.length
  )
    throw new Error("Body basis " + what + " must be nonempty and unique.");
  if (ids.some((id: string): boolean => Object.hasOwn(Object.prototype, id)))
    throw new Error(
      "Body basis " + what + " cannot use inherited Object record keys.",
    );
};
