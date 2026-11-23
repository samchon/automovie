/**
 * A gait the stepping plan runs: its speed, its step and swing, its pelvis and
 * its arms, and how it keeps time.
 *
 * Speed and step are given for any body: the speed as a Froude number, `v² / (g
 * l)` with `l` the hip height (Alexander 1984), and every length in hip
 * heights. A walk, a run and a named style of either are each one of these,
 * read by `walk.locomote`.
 */
export interface IAutoMovieMotionHumanWalkGait {
  /** Froude number, `v² / (g l)`. */
  froude: number;

  /** The longest step in hip heights for the Froude number. */
  step(froude: number): number;

  /**
   * Swing duration in step periods; each foot then stands `1 - swing / 2` of
   * the stride, and both stand `1 - swing` of each step: 0.8 gives a walk's 60
   * % stance and 40 % swing. A frail gait's longer double support is a shorter
   * swing.
   */
  swing: number;

  /**
   * Vertical oscillation lowest at mid-stance, hip heights; a walk's own when
   * absent. A gait with a flight rides its spring-mass stance's instead
   * (`runStance`).
   */
  bob?: {
    /** Mean pelvis displacement in hip-height units. */
    mean: number;
    /** Vertical oscillation amplitude in hip-height units. */
    amplitude: number;
  };

  /** Mid-swing ankle lift, hip heights. */
  lift: number;

  /**
   * The step width, the feet's side-to-side distance in stride, hip heights;
   * `walkSteps.WIDTH` (0.1) when absent. A frail gait walks wider.
   */
  width?: number;

  /**
   * The least clearance of a swinging foot's toe and heel at mid-swing, metres;
   * `walkFoot.CLEARANCE` (15 mm) when absent. A shuffling gait clears less.
   */
  toeClearance?: number;

  /**
   * The share, in (0, 1], of a hip's usable twist one step of a turn in place
   * takes; 1 when absent. A frail gait turns by shorter steps, so a half turn
   * takes more of them.
   */
  turn?: number;

  /** Shoulder swing amplitude, elbow flexion and its swing, degrees. */
  arms: {
    /** Shoulder swing amplitude in clinical degrees. */
    shoulder: number;
    /** Mean elbow flexion in clinical degrees. */
    elbow: number;
    /** Elbow flexion swing amplitude in clinical degrees. */
    swing: number;
  };

  /**
   * The trunk's forward inclination from the upright alignment, degrees, shared
   * between the pelvis and the spine by the lumbopelvic rhythm
   * (`HumanTrunk.incline`) and tipped about the hips.
   */
  lean: number;

  /**
   * How much of a walk's step-to-step variation in time the gait keeps, as a
   * share; 1 when absent, less for a gait that keeps time, as a drill does.
   */
  unevenness?: number;

  /**
   * Whether the cadence is called from outside, as a drill's count is: the
   * take's step period is then the planned one, with no draw of its own.
   * Absent, a take's tempo is drawn about the planned one.
   */
  called?: boolean;

  /**
   * How far the heels are held off the floor through every stance, degrees
   * about the toes' joint: a walk on the balls of the feet, with no heel
   * strike. Flat, heel first, when absent.
   */
  heels?: number;

  /**
   * A leg kept straight, whose foot swings with `walkFoot.STIFF` of the gait's
   * lift, barely clearing the floor: a stiff-knee gait. Both knees fold when
   * absent.
   */
  stiff?: "left" | "right";

  /**
   * A limp: the leg spared, and the share by which each step standing on it is
   * cut short and each step standing on the other drawn out, as a painful leg
   * is stood on briefly (the antalgic gait of Perry and Burnfield's Gait
   * Analysis).
   */
  limp?: {
    /** Leg whose stance is shortened to spare it. */
    side: "left" | "right";
    /**
     * Dimensionless fraction removed from stance on the spared leg and added to
     * stance on the other leg.
     */
    share: number;
  };
}
