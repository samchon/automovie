
import { type IAutoMovieNamedState, type IAutoMovieShotEventContract, type IAutoMovieShotPredicate, IAutoMovieShotContract } from "@automovie/interface";

/**
 * Detect landmark addresses in position and distance shot predicates.
 *
 * @evidence contracts/common.md#principled-implementation The typed predicate union identifies landmark position subjects or distance endpoints across opening, closing and events; other predicate families do not count.
 * @evidence contracts/common.md#clear-and-simple-design A single projection is shared by world-reference refusal without geometry evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot ID or visual observation overrides the authored landmark addresses.
 * @evidence contracts/common.md#meaningful-documentation True is an authored dependency indicator, not proof that the landmark exists or a shot passes.
 * @evidence contracts/performance.md#efficient-algorithms All P predicates are materialized before some short-circuits, so allocation remains O(P) even for an early match.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the current shot on each query; no retained dependency snapshot is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Flattened arrays release on return; only one boolean escapes.
 */
export function productionProjectShotUsesLandmark(shot: IAutoMovieShotContract): boolean {
    return [
        ...shot.opening.flatMap((state: IAutoMovieNamedState): IAutoMovieShotPredicate[] => state.predicates),
        ...shot.closing.flatMap((state: IAutoMovieNamedState): IAutoMovieShotPredicate[] => state.predicates),
        ...shot.events.flatMap((event: IAutoMovieShotEventContract): IAutoMovieShotPredicate[] => event.predicates),
    ].some((predicate: IAutoMovieShotPredicate): boolean => predicate.kind === "position"
        ? predicate.subject.kind === "landmark"
        : predicate.kind === "distance" &&
            (predicate.from.kind === "landmark" ||
                predicate.to.kind === "landmark"));
}
