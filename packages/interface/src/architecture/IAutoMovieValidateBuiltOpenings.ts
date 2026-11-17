import type { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/** Read-only boundary lookup used while validating opening references and face containment. */
export namespace IAutoMovieValidateBuiltOpenings {
  /**
   * Read-only boundary lookup used while validating opening references and face containment.
   *
   * A missing face means containment cannot be checked. A usable opening hull
   * can still be returned in that case; earlier boundary diagnostics and the
   * shared collector determine whether the complete building is admitted.
   *
   * @evidence contracts/development/design.md#principled-representation ids resolves every boundary declaration; faces provides only individually admitted boundary faces with local outline metres and their world placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface validateBuiltOpenings borrows the boundary index produced by validateBuiltBoundaries through validateBuiltEnvironment and never mutates its containers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing face skips the containment comparison rather than preventing a valid opening hull from being returned; the collector owns earlier boundary errors and overall admission.
   * @evidence contracts/development/common.md#meaningful-documentation Read-only boundary lookup used while validating opening references and face containment. ids resolves every boundary declaration; faces provides only individually admitted boundary faces with local outline metres and their world placement.
   */
  export type IBoundaries = {
      /** Borrowed declared boundary ids, including declarations whose face was rejected. */
      ids: ReadonlySet<string>;

      /** Borrowed admitted faces by boundary id; an absent entry skips containment, while usable opening hulls can still be returned. */
      faces: ReadonlyMap<string, IAutoMovieBoundaryFace>;
    };
}
