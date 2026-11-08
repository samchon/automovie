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
 *
 * @evidence contracts/development/design.md#principled-representation `deriveAutoMovieDrawingSchedule` branches on this value once, reading `environment.spaces`, `environment.openings` or `environment.connectors`, and keys rows by the space id for `space` and by kind, model, size and basis otherwise, so the subject alone decides which records are counted and how they group.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed union of the three record families the derivation can count lets a caller switch exhaustively on `IAutoMovieDrawingSchedule.subject` and on the matching place variant, instead of the engine and the record each keeping their own spelling.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The union lists exactly the families the schedule derivation implements, with no reserved member for a family it cannot count yet; the gaps each schedule declares name what a subject leaves out.
 * @evidence contracts/development/common.md#meaningful-documentation States which records each subject counts, whether it groups into type rows, which place variant locates its rows, and why rooms alone stay ungrouped.
 */
export type AutoMovieDrawingScheduleSubject = "space" | "opening" | "connector";
