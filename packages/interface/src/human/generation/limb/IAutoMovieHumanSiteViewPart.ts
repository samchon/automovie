/**
 * Operation-local lazy-source factory, dependency identity and retained reader
 * contracts.
 *
 * The interface package owns these declarations; AutoMovieHumanSiteViewPart in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanSiteViewPart {
  /**
   * The factory argument of AutoMovieHumanSiteViewPart.lazy. Retain one
   * call-owned prepared source until its explicit generating owner changes. No
   * geometry or cache is global; child sources are invalidated when a coupled
   * parent is replaced.
   */
  export type LazyFactory<T> = () => T;

  /**
   * The current dependency identity for AutoMovieHumanSiteViewPart.lazy. Strict
   * inequality against the previous identity invalidates the retained value.
   * Callers must replace this identity whenever the factory's dependencies
   * change; mutating a stable object does not invalidate it. The default owner
   * returns undefined and keeps the first successful value for the lifetime of
   * the returned reader.
   */
  export type LazyOwner = () => unknown;

  /**
   * Result of AutoMovieHumanSiteViewPart.lazy. Retain one call-owned prepared
   * source until its explicit generating owner changes. No geometry or cache is
   * global; child sources are invalidated when a coupled parent is replaced.
   */
  export type LazyResult<T> = () => T;
}
