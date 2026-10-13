/**
 * What a schedule counts.
 *
 * `space` is the room schedule the deliverable requirement names first, and it
 * groups differently from the other two on purpose: a door schedule collapses
 * three hundred identical doors into one type row, while a room schedule lists
 * rooms, because "which zones exist and what is each one" is the question a
 * reviewer asks of a building and a type row cannot answer it.
 *
 * `space` schedules logical spaces one row each, `opening` schedules doors,
 * windows and other openings grouped into type rows, and `connector`
 * schedules stairs, ramps, lifts and other connectors grouped the same way.
 */
export type AutoMovieDrawingScheduleSubject = "space" | "opening" | "connector";
