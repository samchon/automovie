import { IAutoMovieGetBeatEndRequest } from "./IAutoMovieGetBeatEndRequest";
import { IAutoMovieGetNotesRequest } from "./IAutoMovieGetNotesRequest";
import { IAutoMovieGetReachRequest } from "./IAutoMovieGetReachRequest";
import { IAutoMovieGetResolvedPoseRequest } from "./IAutoMovieGetResolvedPoseRequest";
import { IAutoMovieGetSceneRequest } from "./IAutoMovieGetSceneRequest";
import { IAutoMovieGetScriptRequest } from "./IAutoMovieGetScriptRequest";
import { IAutoMovieGetShotRequest } from "./IAutoMovieGetShotRequest";
import { IAutoMovieMeasureDistanceRequest } from "./IAutoMovieMeasureDistanceRequest";

/**
 * A query the agent makes instead of writing, answered by the engine. Two
 * families share the union, discriminated on `type`:
 *
 * - Stored context ({@link IAutoMovieGetScriptRequest},
 *   {@link IAutoMovieGetSceneRequest}, {@link IAutoMovieGetShotRequest},
 *   {@link IAutoMovieGetNotesRequest}, {@link IAutoMovieGetBeatEndRequest})
 *   pulls a slice of the production state (the script, the staged scene, a
 *   sibling shot, the open review notes, where a prior beat left everyone)
 *   rather than guessing it.
 * - Engine queries ({@link IAutoMovieGetReachRequest},
 *   {@link IAutoMovieGetResolvedPoseRequest},
 *   {@link IAutoMovieMeasureDistanceRequest}) ask about resolved geometry, such
 *   as whether an actor can reach a target before a strike is staged, or where
 *   a hand ends up before the next action is chained onto it.
 *
 * Only the stored family has a resolver in this repository: the engine's
 * `readSlateContext` answers it from the slate, through the narrower
 * `IAutoMovieStoredContextRequest` type. No source answers the three engine
 * queries yet, and no tool surface in this repository exposes the union to a
 * model.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `type`, so `readSlateContext` answers each stored request with an exhaustive switch over the slate and the engine's `Extract` narrows the union to the stored family at the type level.
 * @evidence contracts/common.md#clear-and-simple-design One union names every read the agent may make, split into stored slices and geometry questions by what their answer needs, with each request's parameters in its own record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The geometry queries are excluded from the stored resolver by type rather than answered with a guess, and the documentation states that nothing answers them yet instead of implying a working tool.
 * @evidence contracts/common.md#meaningful-documentation States the two families with their members and purpose, the discriminator, the one resolver and its narrowed input, and the unanswered queries and missing tool surface.
 * @author Samchon
 */
export type IAutoMovieContextRequest =
  | IAutoMovieGetScriptRequest
  | IAutoMovieGetSceneRequest
  | IAutoMovieGetShotRequest
  | IAutoMovieGetNotesRequest
  | IAutoMovieGetReachRequest
  | IAutoMovieGetResolvedPoseRequest
  | IAutoMovieMeasureDistanceRequest
  | IAutoMovieGetBeatEndRequest;
