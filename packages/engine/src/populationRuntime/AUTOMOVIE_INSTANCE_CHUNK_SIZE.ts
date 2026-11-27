/**
 * Slots per independently regenerated general-instance runtime chunk.
 *
 * A separate constant from the formation chunk size even though both are 1,024:
 * a compiled instance set's chunk list is part of its own digest, so the two
 * populations can change their range size without renumbering each other.
 */
export const AUTOMOVIE_INSTANCE_CHUNK_SIZE = 1_024;
