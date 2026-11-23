import type { IAutoMovieDrawingConnectorPlace } from "./IAutoMovieDrawingConnectorPlace";
import type { IAutoMovieDrawingOpeningPlace } from "./IAutoMovieDrawingOpeningPlace";
import type { IAutoMovieDrawingSpacePlace } from "./IAutoMovieDrawingSpacePlace";

/**
 * Where a scheduled occurrence stands, discriminated by `kind` to match the
 * schedule's subject.
 *
 * Every variant reads its answer from the declarations that own it, never from
 * the shape of an id: an element and a population each name the one space they
 * occupy, an opening names its host boundary, and a connector names its stops.
 *
 * Review state is not part of a place. A schedule is a pure reading of one
 * design revision, while whether somebody has looked at a zone is a fact about
 * a review, which belongs to the review record and joins to this by id.
 */
export type IAutoMovieDrawingSchedulePlace =
  | IAutoMovieDrawingSpacePlace
  | IAutoMovieDrawingOpeningPlace
  | IAutoMovieDrawingConnectorPlace;
