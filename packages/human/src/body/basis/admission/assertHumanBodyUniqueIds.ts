/**
 * Reject blank or repeated identities before a body basis relationship is
 * resolved. A channel, corrective, surface, material or region ID is a stable
 * address into the immutable revision; silently accepting two owners for one
 * name would make shape rows, material partitions and downstream edits depend
 * on insertion order instead of authored anatomy.
 */
export const assertHumanBodyUniqueIds = (ids: string[], what: string): void => {
  if (ids.some((id) => id.trim() === "") || new Set(ids).size !== ids.length)
    throw new Error("Body basis " + what + " must be nonempty and unique.");
};
