import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanJointCentres } from "./IAutoMovieHumanJointCentres";

/**
 * What every piece of the neutral posture reads of a body's bind skeleton.
 *
 * States what each reader returns, its frame and unit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation What every piece of the neutral posture reads of a body's bind skeleton.
 * @evidence contracts/development/design.md#principled-representation `byBone`: The bind joints by bone, calibration millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeutralTurn.body. Read by AutoMovieHumanNeutralAnkle.derive, AutoMovieHumanNeutralForearm.derive, AutoMovieHumanNeutralHip.derive. Also types AutoMovieHumanNeutral.body.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `byBone`; callers supply the complete record.
 */
export interface IAutoMovieHumanNeutralBody {
  /** The bind joints by bone, calibration millimetres. */
  byBone: ReadonlyMap<string, IAutoMovieHumanJointCentres.IJoint>;

  /**
   * A bone's unit direction at the bind, from its joint toward its end. The bone must exist in byBone and have a nonzero segment; the reader does not admit arbitrary names or degenerate segments.
   *
   * @param bone The Human joint.
   * @returns The unit vector in the registered frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A bone's unit direction at the bind, from its joint toward its end. The bone must exist in byBone and have a nonzero segment; the reader does not admit arbitrary names or degenerate segments.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanNeutralTurn and the neutral-posture solvers and the callback provider must satisfy the documented direction contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanNeutralTurn and the neutral-posture solvers and its callback provider own the cost of each direction invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanNeutralTurn and the neutral-posture solvers and the callback provider determine when the inputs to direction describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanNeutralTurn and the neutral-posture solvers and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanNeutralBody.direction callable contract, without an implementation body. AutoMovieHumanNeutralTurn and the neutral-posture solvers and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanNeutralBody.direction declares only the invocation boundary; decomposition belongs to AutoMovieHumanNeutralTurn and the neutral-posture solvers and the callback provider.
   */
  direction(bone: string): AutoMovieVector3Tuple;

  /**
   * The vector between two joints at the bind. Both names must exist in byBone; this internal reader does not resolve missing joints.
   *
   * @param from The first joint.
   * @param to The second joint.
   * @returns `to` less `from`, calibration millimetres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The vector between two joints at the bind. Both names must exist in byBone; this internal reader does not resolve missing joints.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanNeutralTurn and the neutral-posture solvers and the callback provider must satisfy the documented between contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanNeutralTurn and the neutral-posture solvers and its callback provider own the cost of each between invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanNeutralTurn and the neutral-posture solvers and the callback provider determine when the inputs to between describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanNeutralTurn and the neutral-posture solvers and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanNeutralBody.between callable contract, without an implementation body. AutoMovieHumanNeutralTurn and the neutral-posture solvers and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanNeutralBody.between declares only the invocation boundary; decomposition belongs to AutoMovieHumanNeutralTurn and the neutral-posture solvers and the callback provider.
   */
  between(from: string, to: string): AutoMovieVector3Tuple;
}
