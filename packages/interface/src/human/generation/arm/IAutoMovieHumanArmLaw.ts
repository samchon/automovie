import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * The arm's sections for one side, in the left frame: a one-parameter family
 * of planes from the hand's branch (low parameter) through the heel, the
 * forearm and the upper arm to the level shoulder ring (high parameter). The
 * hand's solve reads its wrist, crease and girth; the chain reads its layers,
 * planes and points.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The arm's sections for one side, in the left frame: a one-parameter family of planes from the hand's branch (low parameter) through the heel, the forearm and the upper arm to the level shoulder ring (high parameter).
 * @evidence contracts/development/design.md#principled-representation `wrist`: Hand origin, mm. `elbow`: Elbow centre, mm. `crease`: Centre of the section at the wrist crease, mm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmConstruction.remember, AutoMovieHumanArmLaw.of. Read by AutoMovieHumanArmConstruction.remember, AutoMovieHumanArmLayers.of. Also types AutoMovieHumanArmConstruction.BUILT, AutoMovieHumanArmConstruction.laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `wrist`, `elbow`, `crease`, `layers`; callers supply the complete record.
 */
export interface IAutoMovieHumanArmLaw {
  /** Hand origin, mm. */
  wrist: AutoMovieVector3Tuple;

  /** Elbow centre, mm. */
  elbow: AutoMovieVector3Tuple;

  /** Centre of the section at the wrist crease, mm. */
  crease: AutoMovieVector3Tuple;

  /** Layer parameters from the bottom. */
  layers: number[];

  /**
   * Normal of the section plane at a parameter, toward the shoulder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Normal of the section plane at a parameter, toward the shoulder.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanArmLaw and the callback provider must satisfy the documented normal contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanArmLaw and its callback provider own the cost of each normal invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanArmLaw and the callback provider determine when the inputs to normal describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanArmLaw and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanArmLaw.normal callable contract, without an implementation body. AutoMovieHumanArmLaw and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanArmLaw.normal declares only the invocation boundary; decomposition belongs to AutoMovieHumanArmLaw and the callback provider.
   */
  normal(q: number): AutoMovieVector3Tuple;

  /**
   * A point the section plane passes through.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A point the section plane passes through.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanArmLaw and the callback provider must satisfy the documented anchor contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanArmLaw and its callback provider own the cost of each anchor invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanArmLaw and the callback provider determine when the inputs to anchor describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanArmLaw and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanArmLaw.anchor callable contract, without an implementation body. AutoMovieHumanArmLaw and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanArmLaw.anchor declares only the invocation boundary; decomposition belongs to AutoMovieHumanArmLaw and the callback provider.
   */
  anchor(q: number): AutoMovieVector3Tuple;

  /**
   * Point of the section at a parameter and phase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Point of the section at a parameter and phase.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanArmLaw and the callback provider must satisfy the documented point contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanArmLaw and its callback provider own the cost of each point invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanArmLaw and the callback provider determine when the inputs to point describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanArmLaw and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanArmLaw.point callable contract, without an implementation body. AutoMovieHumanArmLaw and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanArmLaw.point declares only the invocation boundary; decomposition belongs to AutoMovieHumanArmLaw and the callback provider.
   */
  point(q: number, t: number): AutoMovieVector3Tuple;

  /**
   * Hull perimeter of the forearm's tube cut by a plane through a point, mm;
   * the plane's normal faces the shoulder, as the tube's sections do.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Hull perimeter of the forearm's tube cut by a plane through a point, mm; the plane's normal faces the shoulder, as the tube's sections do.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanArmLaw and the callback provider must satisfy the documented girth contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanArmLaw and its callback provider own the cost of each girth invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanArmLaw and the callback provider determine when the inputs to girth describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanArmLaw and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanArmLaw.girth callable contract, without an implementation body. AutoMovieHumanArmLaw and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanArmLaw.girth declares only the invocation boundary; decomposition belongs to AutoMovieHumanArmLaw and the callback provider.
   */
  girth(point: AutoMovieVector3Tuple, normal: AutoMovieVector3Tuple): number;
}
