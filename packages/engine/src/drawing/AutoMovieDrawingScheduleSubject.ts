/**
 * What a schedule counts.
 *
 * `space` is the room schedule the deliverable requirement names first, and it
 * groups differently from the other two on purpose: a door schedule collapses
 * three hundred identical doors into one type row, while a room schedule lists
 * rooms, because "which zones exist and what is each one" is the question a
 * reviewer asks of a building and a type row cannot answer it.
 */
export type AutoMovieDrawingScheduleSubject = "space" | "opening" | "connector";
