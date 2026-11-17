import type { IAutoMovieSwivelSeed } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";

/**
 * A sequence of elbow requests one arm makes in time order, inside which
 * `AutoMovieMotionHumanBend.solve` continues each request from the seed of
 * the one before (`AutoMovieMotionHumanBendWalk.next`) in place of sweeping
 * the whole swivel circle cold.
 *
 * An arm planner reads an arm's goal at every instant of its span, and a
 * goal that places its elbow by `solve` (a hand target's natural elbow) used
 * to search every instant cold (154 cold searches in one bimanual carry).
 * The planner reads its goals in time order inside a scope of that arm
 * (`within`), so each elbow follows the one an instant before, the way the
 * knot track of a law does (`AutoMovieMotionHumanBendTrack`); a request of
 * another body or arm, or outside any scope, is solved cold as before.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a scope continues, why, how a planner opens it and what stays cold.
 * @evidence contracts/development/design.md#principled-representation One arm of one body and the seed its last request was chosen at.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The scope record, its opener and the reader `solve` consults.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No elbow or goal is kept: a scope holds only the last seed, the start of the next search.
 */
export namespace AutoMovieMotionHumanBendScope {
  /**
   * One arm's sequence of requests.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The body and arm the scope serves and the last seed, absent before the first request or after one with no allowed place.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by a planner, read and written by `solve`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Requests of another body or arm do not read it.
   */
  export interface IScope {
    /** The body whose arm the scope continues. */
    body: IHumanBody;

    /** The arm. */
    side: AutoMovieMotionHumanBend.Side;

    /** The seed of the last request solved inside the scope. */
    seed?: IAutoMovieSwivelSeed;
  }

  /**
   * Run reads inside a scope, restoring the scope outside it on return or
   * throw.
   *
   * @param scope The arm's scope.
   * @param read The reads.
   * @returns What `read` returns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the dynamic extent and its restoration.
   * @evidence contracts/development/implementation.md#principled-implementation A dynamic scope: the scope is current exactly while `read` runs, nested scopes restore the outer one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Set, run, restore.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The outer scope comes back on a throw too.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is shared but the scope given.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The scope is current only during `read`.
   */
  export function within<T>(scope: IScope, read: () => T): T {
    const outer: IScope | undefined = current;
    current = scope;
    try {
      return read();
    } finally {
      current = outer;
    }
  }

  /**
   * The current scope when it serves this body's arm.
   *
   * @param body The body of a request.
   * @param side Its arm.
   * @returns The scope, or undefined outside one or for another body or arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the match and the absent result.
   * @evidence contracts/development/implementation.md#principled-implementation Identity of the body and equality of the arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Another body's or arm's request is not continued.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(body: IHumanBody, side: AutoMovieMotionHumanBend.Side): IScope | undefined {
    return current !== undefined && current.body === body && current.side === side ? current : undefined;
  }
}

/** The scope current while a planner's reads run (`AutoMovieMotionHumanBendScope.within`). */
let current: AutoMovieMotionHumanBendScope.IScope | undefined;
