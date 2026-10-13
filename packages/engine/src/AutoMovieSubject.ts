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
   */
  public abstract design(): TDesign;

  /**
   * What this subject puts into a shot.
   *
   * The context carries the builder-owned runtime facts a source cannot infer,
   * so a subject reads its model, skeleton, or formation runtime from there
   * rather than restating them. The returned arrays are read by
   * `mergeAutoMovieSubjectContributions`, which copies their elements into
   * new arrays rather than keeping the subject's arrays.
   */
  public abstract render(
    context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution;
}
