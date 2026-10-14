import type { IAutoMovieShotBuildContext } from "@automovie/interface";

import { IAutoMovieSubjectContribution } from "./IAutoMovieSubjectContribution";

/**
 * One thing in a production: a performer, a prop, a place, or a population.
 *
 * A subject owns four obligations. Its constraints are checked where it is
 * built rather than asserted in a comment; its motions are methods rather than
 * strings in a `capabilities` array; its utilities answer questions about it
 * rather than living as free functions the caller has to locate; and its
 * `render` states what it puts into a shot.
 *
 * `design` is the wire. A class is an authoring surface and never reaches the
 * compile sandbox, so everything the builder stores and validates leaves
 * through this one method as the plain record it already understands. Two
 * constructions with the same inputs must produce byte-identical records, which
 * is what keeps the same design compiling to the same frames.
 *
 * Utilities delegate to the engine functions that already compute their
 * answers. Reimplementing that arithmetic here would produce a second answer
 * that can disagree with the first, which is the failure mode the whole
 * one-owner rule exists to prevent.
 *
 * The base class declares these obligations and enforces none of them at
 * runtime: construction checks, determinism of `design` and the contents of
 * `render` are each subclass's to keep. Authored sources and
 * `AutoMovieSubjectGroup` are its subclasses; nothing else in the engine
 * extends it.
 *
 * @evidence contracts/common.md#principled-implementation An abstract class is the TypeScript idiom for a contract with no shared state: `id`, `design` and `render` are abstract, so the compiler refuses a concrete subject that omits one, and the premise that `design` is deterministic rests on the subclass because the base runs no code.
 * @evidence contracts/common.md#clear-and-simple-design Three abstract members and no fields or constructor; composition lives in the one subclass `AutoMovieSubjectGroup`, and merging lives in `mergeAutoMovieSubjectContributions`, so this class only names the obligations an authored source answers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no subject kind, production or fixture and patches nothing; the unenforced determinism of `design` is stated as the subclass's obligation instead of being simulated by a cache or freeze in the base.
 * @evidence contracts/common.md#meaningful-documentation States the four obligations a subject owns, that `design` is the only path to the builder and must be byte-identical for equal inputs, that utilities delegate to engine functions, and that the base enforces none of this at runtime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The abstract base has no method body, so it chooses no algorithm; the cost of building a design or a contribution is each subclass's own.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No base-class operation coordinates work across calls; whether a subclass memoizes `design` is left to that subclass and the base keeps no shared result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declares no instance fields and acquires no handle or task, so whatever a subject retains is declared and released by its subclass.
 */
export abstract class AutoMovieSubject<TDesign> {
  /** Stable identity this subject is cited by. */
  public abstract readonly id: string;

  /**
   * The tracked record the builder reads, derived rather than transcribed.
   *
   * Every call must return a record byte-identical to the previous call for the
   * same constructor inputs, because the compiled design is what the frames are
   * derived from. The base class neither checks this nor caches or freezes the
   * result.
   *
   * @evidence contracts/common.md#principled-implementation An abstract method returning the plain `TDesign` record, so a subject's tracked value is computed from its constructor inputs on demand and equal inputs give equal records, which is the determinism premise the frames rely on.
   * @evidence contracts/common.md#clear-and-simple-design A method rather than a stored field, so a subclass derives the record from the members it already holds instead of keeping a second transcribed copy that could drift.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Has no base body to special-case anything; the byte-identity requirement is a stated subclass obligation, with no base-level freeze or cache masking a non-deterministic override.
   * @evidence contracts/common.md#meaningful-documentation States that the result is the record the builder reads, that every call must be byte-identical for the same constructor inputs, and that the base neither checks, caches nor freezes it.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Abstract with no body; the time to derive a design record is the overriding subclass's cost and is answered on that override.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The base memoizes no design record, because a cached record could be mutated by a caller; a subclass may cache when its record is immutable.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh record to the caller, who owns it; the base retains nothing between calls.
   */
  public abstract design(): TDesign;

  /**
   * What this subject puts into a shot.
   *
   * The context carries the builder-owned facts a source cannot infer, so a
   * subject reads its model groups, world, and formation or
   * instance-set runtimes from there rather than restating them. The returned
   * arrays are read by `mergeAutoMovieSubjectContributions`, which copies their
   * elements into new arrays rather than keeping the subject's arrays.
   *
   * @evidence contracts/common.md#principled-implementation Returns only the contribution fields this subject owns, a partial record the shot merges, so a shot program is assembled by concatenation in subject order rather than by any subject knowing the whole shot.
   * @evidence contracts/common.md#clear-and-simple-design One context parameter carries every builder-owned runtime fact, so a subject reads model groups, world and formation runtimes from one place instead of taking each as its own argument.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Abstract here, so the base adds no fix-up to a subject's output; collisions between subjects pass through the merge to the builder's own uniqueness checks.
   * @evidence contracts/common.md#meaningful-documentation States which builder-owned facts the context supplies and that the merge copies the returned elements into new arrays rather than keeping the subject's arrays.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Abstract with no body; how a subject builds its contribution, and at what cost, is answered on each override such as `AutoMovieSubjectGroup.render`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The base shares no contribution between calls, since the context differs per shot; any per-shot reuse belongs to the overriding subject.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds nothing after returning; the caller owns the returned contribution and the merge keeps only element references, not the subject's arrays.
   */
  public abstract render(
    context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution;
}
