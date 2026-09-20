import { IAutoMovieDrawingConnectorPlace } from "./IAutoMovieDrawingConnectorPlace";
import { IAutoMovieDrawingOpeningPlace } from "./IAutoMovieDrawingOpeningPlace";
import { IAutoMovieDrawingSpacePlace } from "./IAutoMovieDrawingSpacePlace";

/**
 * Where a scheduled occurrence stands, and what stands with it.
 *
 * This is the part of a room schedule a door schedule never needed. A reviewer
 * asking "what zones exist, what is each one, what is in it" has to get the
 * membership answer from the declaration that owns it — an element and a
 * population each name the one space they occupy — because matching an id
 * prefix against a model answers a different question and answers it wrong: in
 * the `#1902` experiment that draft undercounted a hall of 312 staged things as
 * 204 and produced five consecutive false "this is missing" reports.
 *
 * {@link declared} and {@link content} are deliberately two boxes. The first is
 * how far the zone reaches, the second is where its contents actually are, and
 * reading the first as the second is what put three of four review cameras of
 * `stair-ground` outside the stair tower they were aimed at.
 *
 * Review state is **not** here. A schedule is a pure reading of one design
 * revision — the same environment schedules the same bytes twice — and whether
 * somebody has looked at a zone is a fact about a review, not about the
 * building. It belongs to the review record and joins to this by zone id.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `IAutoMovieDrawingSchedulePlace` as the location, membership and relation the schedule requirement asks a room row to provide.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingSchedulePlace` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export type IAutoMovieDrawingSchedulePlace =
  | IAutoMovieDrawingSpacePlace
  | IAutoMovieDrawingOpeningPlace
  | IAutoMovieDrawingConnectorPlace;
