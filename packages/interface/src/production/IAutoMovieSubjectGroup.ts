import type { IAutoMovieShotBuildContext } from "./IAutoMovieShotBuildContext";
import type { IAutoMovieSubject } from "./IAutoMovieSubject";
import type { IAutoMovieSubjectContribution } from "./IAutoMovieSubjectContribution";

/**
 * A subject that is a collection of subjects.
 *
 * A cluster holds figures, a group holds clusters, a village holds buildings, a
 * map holds everything standing on it. The shape is the same at every level,
 * which is what makes a line battle authorable: a group advancing is one call
 * rather than two thousand.
 *
 * `render` composes its members by default, so a group states what it holds and
 * how it is arranged, not how to draw it. A group that needs to add something
 * of its own (a banner, a dust cue, a shared route) overrides `render` and
 * merges its own contribution with `super.render`, rather than replacing what
 * its members said.
 *
 * Membership is not checked for cycles: a group that lists itself, directly or
 * through a member, recurses in `render` until the call stack overflows.
 *
 * @evidence contracts/development/design.md#principled-representation The composite pattern over `AutoMovieSubject`: a group is itself a subject whose default `render` merges its members' contributions, so clusters, units and maps nest to any depth behind one interface; it relies on membership being acyclic, which it does not check.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only `members()` and a default `render` to the base, so a subclass states membership and arrangement and overrides `render` only to merge an extra contribution of its own with `super.render`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Names no member kind or layout and bounds members only by `AutoMovieSubject<unknown>`; an unchecked membership cycle overflows the stack, as documented, rather than being caught and retried.
 * @evidence contracts/development/common.md#meaningful-documentation States the nesting levels it models, that `render` composes members by default, how an override keeps its members' output, and the unchecked membership cycle.
 */
export interface IAutoMovieSubjectGroup<
  TDesign,
  TMember extends IAutoMovieSubject<unknown>,
> extends IAutoMovieSubject<TDesign> {
  /**
   * The subjects this group holds, in a stable order.
   *
   * Called on every `render`, so this order is the merge order and therefore
   * fixes the bytes of the shot program; returning another order on a later
   * call changes the output.
   */
  members(): readonly TMember[];

  /**
   * Merge every member's authored contribution in stable member order.
   *
   * Each call renders every member again with the same context and merges the
   * results. Nothing is cached, so a nested group re-renders its whole subtree
   * on every call.
   */
  render(context: IAutoMovieShotBuildContext): IAutoMovieSubjectContribution;
}
