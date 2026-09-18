/**
 * How many occurrence ids one schedule row may list.
 *
 * A schedule row's job is to say what the type is and how many there are; the
 * ids are there to find one, not to enumerate a tower. Bounding the list is
 * what keeps a schedule over five thousand windows the same size as a schedule
 * over five, and the omitted count is stated so the bound is never mistaken for
 * the total.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Keeps a schedule row readable by listing only a bounded occurrence sample while still reporting its full count and omitted remainder.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Fixes the canonical row member sample at eight identities before the residual population is recorded in `omittedMembers`.
 */
export const AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS = 8;
