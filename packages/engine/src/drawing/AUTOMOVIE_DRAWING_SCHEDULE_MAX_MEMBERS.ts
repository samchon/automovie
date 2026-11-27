/**
 * How many occurrence ids one schedule row may list.
 *
 * A schedule row's job is to say what the type is and how many there are; the
 * ids are there to find one, not to enumerate a tower. Bounding the list is
 * what keeps a schedule over five thousand windows the same size as a schedule
 * over five, and the omitted count is stated so the bound is never mistaken for
 * the total.
 */
export const AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS = 8;
