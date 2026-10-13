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
 *
 * @evidence contracts/common.md#principled-implementation A closed string-literal union, so `deriveAutoMovieDrawingSchedule` branches on it exhaustively and an unknown subject fails type checking instead of producing an empty schedule.
 * @evidence contracts/common.md#clear-and-simple-design Three literals, one per record family a schedule counts; the per-occurrence versus per-type grouping is a branch inside the schedule derivation, not a second option beside this one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `space` is the one subject listed per occurrence rather than per type, a requirement-defined difference the prose explains; neither other literal carries special behaviour.
 * @evidence contracts/common.md#meaningful-documentation States what each literal schedules, how rows are grouped for each, and why rooms are listed individually while doors and runs collapse into type rows.
 * @evidenceExclude contracts/performance.md#cost-and-resources A type-level union that compiles away and holds nothing; the grouping cost belongs to `deriveAutoMovieDrawingSchedule`.
 */
export type AutoMovieDrawingScheduleSubject = "space" | "opening" | "connector";
