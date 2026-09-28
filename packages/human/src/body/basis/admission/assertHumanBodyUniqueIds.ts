/**
 * Reject blank or repeated identities before a body basis relationship is
 * resolved. A channel, corrective, surface, material or region ID is a stable
 * address into the immutable revision; silently accepting two owners for one
 * name would make shape rows, material partitions and downstream edits depend
 * on insertion order instead of authored anatomy. These IDs also address
 * ordinary JavaScript records of morph targets, landmark positions and
 * document edits. An inherited Object key would be read as data when its
 * own row is absent, so every identifier must be a safe record key.
 */
export const assertHumanBodyUniqueIds = (ids: string[], what: string): void => {
  if (ids.some((id) => id.trim() === "") || new Set(ids).size !== ids.length)
    throw new Error("Body basis " + what + " must be nonempty and unique.");
  if (ids.some((id) => Object.hasOwn(Object.prototype, id)))
    throw new Error(
      "Body basis " + what + " cannot use inherited Object record keys.",
    );
};
