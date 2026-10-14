import type { IAutoMovieShotBuildContext } from "@automovie/interface";

import { AutoMovieSubject } from "./AutoMovieSubject";
import { IAutoMovieSubjectContribution } from "./IAutoMovieSubjectContribution";
import { mergeAutoMovieSubjectContributions } from "./mergeAutoMovieSubjectContributions";

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
 * @evidence contracts/common.md#principled-implementation The composite pattern over `AutoMovieSubject`: a group is itself a subject whose default `render` merges its members' contributions, so clusters, units and maps nest to any depth behind one interface; it relies on membership being acyclic, which it does not check.
 * @evidence contracts/common.md#clear-and-simple-design Adds only `members()` and a default `render` to the base, so a subclass states membership and arrangement and overrides `render` only to merge an extra contribution of its own with `super.render`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no member kind or layout and bounds members only by `AutoMovieSubject<unknown>`; an unchecked membership cycle overflows the stack, as documented, rather than being caught and retried.
 * @evidence contracts/common.md#meaningful-documentation States the nesting levels it models, that `render` composes members by default, how an override keeps its members' output, and the unchecked membership cycle.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The class adds no algorithm beyond its `render` method, whose subtree traversal cost is answered on that method.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Keeps no class-level store of member contributions; the per-call recomputation and why it is not shared is answered on `render`.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declares no fields; members are held by the subclass that returns them from `members()`, for as long as that group instance lives.
 */
export abstract class AutoMovieSubjectGroup<
  TDesign,
  TMember extends AutoMovieSubject<unknown>,
> extends AutoMovieSubject<TDesign> {
  /**
   * The subjects this group holds, in a stable order.
   *
   * Called on every `render`, so this order is the merge order and therefore
   * fixes the bytes of the shot program; returning another order on a later
   * call changes the output.
   *
   * @evidence contracts/common.md#principled-implementation The order is the group's contract with `mergeAutoMovieSubjectContributions`, which concatenates in the order given, so a deterministic member order yields a deterministic shot program.
   * @evidence contracts/common.md#clear-and-simple-design A method rather than a constructor argument, so a subclass may derive members from its own design, such as a formation's count or a village's lots, instead of storing a second list.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The base checks neither order stability nor duplicates; a member listed twice contributes twice, and the builder's id checks report the resulting collision.
   * @evidence contracts/common.md#meaningful-documentation States that the order is the merge order and fixes the output bytes, and that the method runs on every render.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Abstract with no body; whether the member list is built per call or returned from a field is the subclass's cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Not memoized by the base; a subclass that builds members per call pays that on each `render` and may keep its own list instead.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a read-only array the subclass owns; the base drops its reference once `render` has mapped it.
   */
  public abstract members(): readonly TMember[];

  /**
   * Merge every member's authored contribution in stable member order.
   *
   * Each call renders every member again with the same context and merges the
   * results. Nothing is cached, so a nested group re-renders its whole subtree
   * on every call.
   *
   * @evidence contracts/common.md#principled-implementation Maps `members()` through each member's `render` with the caller's context and hands the list to `mergeAutoMovieSubjectContributions`, which concatenates each field in member order without deduplication.
   * @evidence contracts/common.md#clear-and-simple-design Default composition lives here so a subclass states only what it holds, and an override that adds a banner or route calls `super.render` and merges, keeping the members' fields intact.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies no per-member filter or fix-up; ids colliding across members pass through to the builder's uniqueness checks instead of being collapsed here.
   * @evidence contracts/common.md#meaningful-documentation States the stable member order, the absence of caching, and that a nested group re-renders its whole subtree on every call.
   * @evidence contracts/performance.md#efficient-algorithms Time and space are linear in the entries contributed across the whole subtree plus one array of member contributions per nesting level; the full walk is needed because every entry is copied into the merged record.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares nothing between calls or between groups: the shot context is an input and no identity keys a stored contribution, so a member reachable through two groups is rendered once per path.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates the member-contribution list and the merged arrays per call and keeps neither; the caller owns the returned record, and the recursion depth is the nesting depth.
   */
  public render(
    context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution {
    return mergeAutoMovieSubjectContributions(
      this.members().map(
        (member: TMember): IAutoMovieSubjectContribution =>
          member.render(context),
      ),
    );
  }
}
