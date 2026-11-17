/**
 * A gait the stepping plan runs: its speed, its step and swing, its pelvis
 * and its arms, and how it keeps time.
 *
 * Speed and step are given for any body: the speed as a Froude number,
 * `v² / (g l)` with `l` the hip height (Alexander 1984), and every length in
 * hip heights. A walk, a run and a named style of either are each one of
 * these, read by `walk.locomote`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a gait is, the units that make it fit any body and who reads it.
 * @evidence contracts/development/design.md#principled-representation Dimensionless speed and lengths, degrees for the arms and the lean, shares for the swing and the timing variation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the stepping plan reads; the walk's paces, the run's and the named gaits are its values.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body and no named style is special-cased: a drill's kept time is two plain members.
 */
export interface IAutoMovieMotionHumanWalkGait {
  /** Froude number, `v² / (g l)`. */
  froude: number;

  /**
   * The longest step in hip heights for the Froude number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkGait.step: The longest step in hip heights for the Froude number.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkGait.step is used through packages/motions/src/actions/run.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkGait.step is used through packages/motions/src/actions/run.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkGait.step is used through packages/motions/src/actions/run.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkGait.step is used through packages/motions/src/actions/run.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkGait.step is used through packages/motions/src/actions/run.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkGait.step is used through packages/motions/src/actions/run.ts.
   */
  step(froude: number): number;

  /** Swing duration in step periods. */
  swing: number;

  /** Vertical oscillation lowest at mid-stance, hip heights; a walk's own when absent. A gait with a flight rides its spring-mass stance's instead (`runStance`). */
  bob?: {
    /** Mean pelvis displacement in hip-height units. */
    mean: number;
    /** Vertical oscillation amplitude in hip-height units. */
    amplitude: number;
  };

  /** Mid-swing ankle lift, hip heights. */
  lift: number;

  /** Shoulder swing amplitude, elbow flexion and its swing, degrees. */
  arms: {
    /** Shoulder swing amplitude in clinical degrees. */
    shoulder: number;
    /** Mean elbow flexion in clinical degrees. */
    elbow: number;
    /** Elbow flexion swing amplitude in clinical degrees. */
    swing: number;
  };

  /** The trunk's forward inclination from the upright alignment, degrees, shared between the pelvis and the spine by the lumbopelvic rhythm (`HumanTrunk.incline`) and tipped about the hips. */
  lean: number;

  /** How much of a walk's step-to-step variation in time the gait keeps, as a share; 1 when absent, less for a gait that keeps time, as a drill does. */
  unevenness?: number;

  /** Whether the cadence is called from outside, as a drill's count is: the take's step period is then the planned one, with no draw of its own. Absent, a take's tempo is drawn about the planned one. */
  called?: boolean;

  /** How far the heels are held off the floor through every stance, degrees about the toes' joint: a walk on the balls of the feet, with no heel strike. Flat, heel first, when absent. */
  heels?: number;

  /** A leg kept straight, whose foot swings with `walkFoot.STIFF` of the gait's lift, barely clearing the floor: a stiff-knee gait. Both knees fold when absent. */
  stiff?: "left" | "right";

  /** A limp: the leg spared, and the share by which each step standing on it is cut short and each step standing on the other drawn out, as a painful leg is stood on briefly (the antalgic gait of Perry and Burnfield's Gait Analysis). */
  limp?: {
    /** Leg whose stance is shortened to spare it. */
    side: "left" | "right";
    /** Dimensionless fraction removed from stance on the spared leg and added to stance on the other leg. */
    share: number;
  };
}
