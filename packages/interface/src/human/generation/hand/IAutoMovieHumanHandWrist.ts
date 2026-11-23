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
   */
  girth(
    point: [number, number, number],
    normal: [number, number, number],
  ): number;
}
