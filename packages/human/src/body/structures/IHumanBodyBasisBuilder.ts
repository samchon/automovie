import type { IAutoMovieHumanBodyBasisDocument } from "./IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";
import type { IHumanBodyPreparedBuild } from "./IHumanBodyPreparedBuild";

/**
 * Evaluate a complete body, or prepare its exterior for person composition.
 *
 * The callable remains the normal complete body consumer. Person composition
 * prepares the same admitted skin and pose first, forms the joined exterior,
 * then completes the anatomical assembly against that one authority.
 *
 * @evidence contracts/common.md#principled-implementation A callable builds the complete body while preparation exposes the same admitted skin before person composition.
 * @evidence contracts/common.md#clear-and-simple-design Complete, construct and prepare entries keep their distinct acceptance and assembly responsibilities visible.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The inspectable construct result may retain refusal observations and cannot substitute for an accepted editor state.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes normal evaluation, exterior preparation and inspectable construction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The body builder interface declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The body builder interface declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The body builder interface type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IHumanBodyBasisBuilder {
  /** Build the complete body with its own rest exterior authority. */
  (document: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyBuild;

  /**
   * Complete the same construction with original layer refusal observations. This explicitly inspectable result is not an accepted editor state.
   *
   * @evidence contracts/common.md#principled-implementation Complete an admitted document while retaining original layer-refusal observations for inspection.
   * @evidence contracts/common.md#clear-and-simple-design The inspectable constructor entry is separate from the callable builder's accepted-state path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A returned layer refusal cannot be promoted to an accepted editor state by this contract.
   * @evidence contracts/common.md#meaningful-documentation The method explains its completed result and acceptance limitation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The inspectable construction method is an interface signature with no algorithm body.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The inspectable construction method signature implements no cross-call reuse policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The inspectable construction method acquires no handles or retained allocations itself.
   */
  construct(document: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyBuild;

  /**
   * Prepare exterior and pose so a person can determine its complete exterior first.
   *
   * @evidence contracts/common.md#principled-implementation Evaluate an admitted exterior and pose before the person chooses its complete exterior authority.
   * @evidence contracts/common.md#clear-and-simple-design Preparation exposes an explicit intermediate result instead of constructing internal geometry twice.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The prepared skin does not stand in for a complete anatomical body.
   * @evidence contracts/common.md#meaningful-documentation The comment states why person composition needs exterior preparation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The exterior preparation method is an interface signature with no algorithm body.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The exterior preparation method signature implements no cross-call reuse policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The exterior preparation method acquires no handles or retained allocations itself.
   */
  prepare(document: IAutoMovieHumanBodyBasisDocument): IHumanBodyPreparedBuild;
}
