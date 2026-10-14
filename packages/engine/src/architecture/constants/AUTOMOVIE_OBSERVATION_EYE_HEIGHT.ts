/**
 * Standing eye height, in metres, an interior observation is taken from.
 *
 * A room is judged from the height its user reads it at, and a camera dropped
 * to the floor or lifted to the slab reports proportions nobody experiences. A
 * room shorter than twice this height is observed from its own mid-height
 * instead, so a crawl space is not observed from inside its ceiling.
 */
export const AUTOMOVIE_OBSERVATION_EYE_HEIGHT: number = 1.6;
