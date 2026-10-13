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
 * @evidence contracts/common.md#principled-implementation A union discriminated by `kind` (`space`, `opening`, `connector`), so a consumer narrows with one switch, and each variant is produced only by the schedule deriver for the subject of the same name.
 * @evidence contracts/common.md#clear-and-simple-design Separate variants rather than one record of optional fields, because a room carries boxes, contents and fidelity that an opening or connector place never has; review state stays out and joins by zone id.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Membership is read from what elements and populations declare through `builtEnvironmentSpaceNodes`, never from id prefixes, which the prose records as the cause of the undercount in experiment #1902.
 * @evidence contracts/common.md#meaningful-documentation Explains where membership comes from, why declared and content extents are two boxes, and why review state is not a field here.
 * @author Samchon
 */
export type IAutoMovieDrawingSchedulePlace =
  | IAutoMovieDrawingSpacePlace
  | IAutoMovieDrawingOpeningPlace
  | IAutoMovieDrawingConnectorPlace;
