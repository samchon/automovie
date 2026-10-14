/**
 * Slots per independently regenerated and culled formation runtime chunk.
 *
 * A compiled formation stores one bounds, centroid and anonymous count per
 * chunk rather than one scene node per member, so this is the range a viewer
 * regenerates, culls and selects a tier for. Changing it changes the chunk list
 * and therefore the digest of every compiled formation.
 */
export const AUTOMOVIE_FORMATION_CHUNK_SIZE = 1_024;
