/**
 * What a schedule counts.
 *
 * `space` is the room schedule the deliverable requirement names first, and it
 * groups differently from the other two on purpose: a door schedule collapses
 * three hundred identical doors into one type row, while a room schedule lists
 * rooms, because "which zones exist and what is each one" is the question a
 * reviewer asks of a building and a type row cannot answer it.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Lets an authored schedule select the resolved room, opening or connector population it must reconcile with the design.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Closes the derivation input to the three occurrence collections for which canonical grouping and measurement are defined.
 */
export type AutoMovieDrawingScheduleSubject = "space" | "opening" | "connector";
