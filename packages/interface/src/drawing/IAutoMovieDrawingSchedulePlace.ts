import { IAutoMovieDrawingConnectorPlace } from "./IAutoMovieDrawingConnectorPlace";
import { IAutoMovieDrawingOpeningPlace } from "./IAutoMovieDrawingOpeningPlace";
import { IAutoMovieDrawingSpacePlace } from "./IAutoMovieDrawingSpacePlace";

/**
 * Where a scheduled occurrence stands, discriminated by `kind` to match the
 * schedule's subject.
 *
 * Every variant reads its answer from the declarations that own it, never from
 * the shape of an id: an element and a population each name the one space
 * they occupy, an opening names its host boundary, and a connector names its
 * stops.
 *
 * Review state is not part of a place. A schedule is a pure reading of one
 * design revision, while whether somebody has looked at a zone is a fact about
 * a review, which belongs to the review record and joins to this by id.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind` lets `deriveAutoMovieDrawingSchedule` build the variant its subject owns and lets a reader narrow with one comparison; each variant's fields come from `builtEnvironment*` queries or the record's own references.
 * @evidence contracts/common.md#clear-and-simple-design Three variants keep fields that only mean something for one subject, such as a room's boxes or an opening's host boundary, off the other two, instead of one wide record of mostly `null` fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Membership and location come only from declared references; no variant matches id prefixes, and none carries review progress that would make the same design schedule to different bytes.
 * @evidence contracts/common.md#meaningful-documentation States the discriminant and its tie to the subject, where each variant's answers come from, and why review state is excluded.
 * @author Samchon
 */
export type IAutoMovieDrawingSchedulePlace =
  | IAutoMovieDrawingSpacePlace
  | IAutoMovieDrawingOpeningPlace
  | IAutoMovieDrawingConnectorPlace;
