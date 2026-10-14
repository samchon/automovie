/**
 * How many entries one mask may carry.
 *
 * The mask is bounded evidence, and this is the bound. It is generous enough
 * for a whole multi-storey building with its openings and props, and small
 * enough that the palette can never run out of colours: with at most this many
 * claims in a space of {@link AUTOMOVIE_SEMANTIC_MASK_COLORS}, a free colour
 * always exists, so the allocator has no failure path to hide a defect in.
 */
export const AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES = 65536;
