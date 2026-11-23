/**
 * What a schedule counts.
 *
 * - `space`: every logical space, one row each, located by an
 *   {@link IAutoMovieDrawingSpacePlace}.
 * - `opening`: every opening, grouped into type rows, located by an
 *   {@link IAutoMovieDrawingOpeningPlace}.
 * - `connector`: every connector, grouped into type rows, located by an
 *   {@link IAutoMovieDrawingConnectorPlace}.
 *
 * Rooms are not grouped because two rooms of one kind and size are still two
 * places a reviewer visits; doors and stairs are, so a tower's schedule stays
 * the size of its type list.
 */
export type AutoMovieDrawingScheduleSubject = "space" | "opening" | "connector";
