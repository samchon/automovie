import type { IAutoMovieSource } from "./IAutoMovieSource";
import type { IAutoMovieViewSection } from "./IAutoMovieViewSection";

/** Data and callback contracts shared by the ViewSectionRange operations. */
export namespace IAutoMovieViewSectionRange {
  /**
     * One synchronous candidate's unchanged measured source and fault observation.
     *
     * @evidence contracts/development/design.md#principled-representation Carries actual native arclength and original finite/curvature/support admission for exactly one shoulder.
     * @evidence contracts/development/design.md#minimal-and-owned-surface A source and nullable refusal remain distinct from target convergence.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A refused candidate remains refused and never supplies a successful residual.
     * @evidence contracts/development/common.md#meaningful-documentation Source lengths use the supplied box unit; null means this finite source observation passed, not a continuous certificate.
     */
    export interface ITrial {
      /** Actual native source before unused display observations. */
      source: IAutoMovieSource;
  
      /** Original candidate fault, or null after the existing admission. */
      fault: string | null;
    }

  /**
     * An accepted candidate or actual local bracket, with call-owned numeric trials for one target solve.
     *
     * @evidence contracts/development/design.md#principled-representation An ellipse candidate can be accepted only after its actual native fault and original target residual pass; otherwise a local interval exists only after two admitted source readings surround the target girth.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Without an accepted candidate, null range requests the unchanged complete-reach owner; at retains the selected actual candidate.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores only numeric native geometry, never public algebra callbacks, another input or fabricated successful data.
     * @evidence contracts/development/common.md#meaningful-documentation Separates a measured residual-satisfying candidate, a target bracket and an unresolved request; neither candidate nor bracket supplies whole finite reach or anatomical acceptance.
     */
    export interface IFamily {
      /** Actual local target bracket; null also permits a separately accepted original candidate. */
      range: IAutoMovieViewSection.IRange | null;
  
      /** Actual ellipse candidate already within the unchanged native target tolerance, without another probe. */
      accepted?: IAutoMovieViewSectionRange.ITrial;
  
      /**
       * Same-shoulder actual source/admission; original preparation exceptions propagate.
       *
       * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Same-shoulder actual source/admission; original preparation exceptions propagate.
       * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Same-shoulder actual source/admission; original preparation exceptions propagate.
       * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
       * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
       * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
       * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
       * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
       */
      at(shoulder: number): IAutoMovieViewSectionRange.ITrial;
    }
}
