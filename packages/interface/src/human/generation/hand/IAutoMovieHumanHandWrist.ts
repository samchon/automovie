/**
 * What the hand reads from the arm it grows out of, for one side in the left
 * frame: the forearm's wrist and the centre of its section at the wrist
 * crease, and the tape the forearm's tube measures there. The arm's own
 * piece publishes more; the hand takes only this, so the arm can change
 * without the hand's pieces following.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation What the hand reads from the arm it grows out of, for one side in the left frame: the forearm's wrist and the centre of its section at the wrist crease, and the tape the forearm's tube measures there.
 * @evidence contracts/development/design.md#principled-representation `wrist`: The hand form's origin, world millimetres. `elbow`: The elbow, where the walk turns from the upper arm onto the forearm. `crease`: Centre of the section at the wrist crease.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHandFingers.digitsOf, AutoMovieHumanHandJoints.jointsOf, AutoMovieHumanHandSkinTargets.skinTargets.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `wrist`, `elbow`, `crease`; callers supply the complete record.
 */
export interface IAutoMovieHumanHandWrist {
  /** The hand form's origin, world millimetres. */
  wrist: [number, number, number];

  /** The elbow, where the walk turns from the upper arm onto the forearm. */
  elbow: [number, number, number];

  /** Centre of the section at the wrist crease. */
  crease: [number, number, number];

  /**
   * Hull perimeter of the forearm's tube cut by a plane through a point, mm;
   * the plane's normal faces the shoulder, as the tube's sections do.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Hull perimeter of the forearm's tube cut by a plane through a point, mm; the plane's normal faces the shoulder, as the tube's sections do.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanArmLaw and AutoMovieHumanHandSolve and the callback provider must satisfy the documented girth contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanArmLaw and AutoMovieHumanHandSolve and its callback provider own the cost of each girth invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanArmLaw and AutoMovieHumanHandSolve and the callback provider determine when the inputs to girth describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanArmLaw and AutoMovieHumanHandSolve and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanHandWrist.girth callable contract, without an implementation body. AutoMovieHumanArmLaw and AutoMovieHumanHandSolve and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanHandWrist.girth declares only the invocation boundary; decomposition belongs to AutoMovieHumanArmLaw and AutoMovieHumanHandSolve and the callback provider.
   */
  girth(
    point: [number, number, number],
    normal: [number, number, number],
  ): number;
}
