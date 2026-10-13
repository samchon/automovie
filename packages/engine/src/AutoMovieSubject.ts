import type { IAutoMovieShotBuildContext } from "@automovie/interface";

import { IAutoMovieSubjectContribution } from "./IAutoMovieSubjectContribution";

/**
 *
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
 * @evidence contracts/common.md#principled-implementation An abstract class with one abstract property and two abstract methods, so TypeScript's abstract-member check forces every authored subject to supply `id`, `design` and `render`; the byte-identical `design` premise is a subclass duty the base never verifies.
 * @evidence contracts/common.md#clear-and-simple-design Holds no state and declares no constructor, leaving construction-time validation to each subclass and composition to `AutoMovieSubjectGroup`; the type parameter only types what `design` returns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no behavior that could special-case a subject, fixture or consumer; the determinism and one-owner rules in the prose are authoring conventions that no engine code enforces at runtime.
 * @evidence contracts/common.md#meaningful-documentation States the four obligations a subject owns, that `design` is the only path into the compile sandbox, the byte-identical reconstruction requirement, why utilities delegate to engine functions, and that the base enforces none of it.
 * @evidenceExclude contracts/performance.md#cost-and-resources An abstract declaration with no method bodies, so every cost belongs to the subclass's `design` and `render` implementations. The base memoizes neither `design` nor `render`; whether a subclass keeps its record is that subclass's choice, so there is no shared result here to key. Owns no field beyond the abstract `id` string, so retained state is whatever a subclass instance holds while the author's source references it.
 */
export abstract class AutoMovieSubject<TDesign> {
  /** Stable identity this subject is cited by. */
  public abstract readonly id: string;

  /**
   *
   * The tracked record the builder reads, derived rather than transcribed.
   *
   * Every call must return a record byte-identical to the previous call for the
   * same constructor inputs, because the compiled design is what the frames are
   * derived from. The base class neither checks this nor caches or freezes the
   * result.
   *
   * @evidence contracts/common.md#principled-implementation A zero-argument abstract method rather than a stored field, so a subclass derives the record from its validated constructor inputs on each call instead of exposing a mutable copy.
   * @evidence contracts/common.md#clear-and-simple-design Typed by the class parameter `TDesign`, so each subject returns its own interface record (a model recipe, a formation design) without a shared union in the base.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Declares no default body; a subclass returning different records across calls would break the reproducibility premise, and only that subclass can prevent it.
   * @evidence contracts/common.md#meaningful-documentation States that the record is derived, must repeat byte for byte across calls, and is neither checked, cached nor frozen by the base.
   * @evidenceExclude contracts/performance.md#cost-and-resources Abstract with no body; building the record costs whatever the subclass's literal or derived fields cost. The base keeps nothing between calls, so a caller needing the record twice either calls again or holds the first result; there is no memo to invalidate. Returns a fresh or subclass-owned record and keeps no reference to it, so the caller decides how long it lives.
   */
  public abstract design(): TDesign;

  /**
   *
   * What this subject puts into a shot.
   *
   * The context carries the builder-owned runtime facts a source cannot infer,
   * so a subject reads its model, skeleton, or formation runtime from there
   * rather than restating them. The returned arrays are read by
   * `mergeAutoMovieSubjectContributions`, which copies their elements into
   * new arrays rather than keeping the subject's arrays.
   *
   * @evidence contracts/common.md#principled-implementation Returns only the sections this subject owns as an `IAutoMovieSubjectContribution`, so a shot program is the ordered merge of many partial records instead of one subject building the whole program.
   * @evidence contracts/common.md#clear-and-simple-design Takes the frozen `IAutoMovieShotBuildContext` as its single input, so model recipes, formation runtimes and world design come from one builder-owned record instead of being restated by each subject.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Abstract, with no fallback contribution; a subject reading facts outside the context would break the frozen-input premise, and nothing here detects that.
   * @evidence contracts/common.md#meaningful-documentation States what the context carries, that runtime facts are read from it rather than restated, and how the merge treats the returned arrays.
   * @evidenceExclude contracts/performance.md#cost-and-resources Abstract; the work and allocation of a contribution are the subclass's, and a formation's member expansion happens later in the engine, not here. Each call receives one shot's context and is not memoized, because different shots pass different contexts and the base has no identity on which to key a stored contribution. Holds no state across calls; the returned contribution belongs to the caller that merges it into a shot program.
   */
  public abstract render(
    context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution;
}
