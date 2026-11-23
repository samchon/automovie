/**
 * The fighting stance and its guard as goals measured on the body: a staggered
 * base on separate tracks, both knees soft, the body turned so the lead
 * shoulder faces the line, and each glove placed relative to the performer's
 * own head.
 *
 * Coaching sources (IBA coaching manual pp. 34 to 39; kickboxing and Muay Thai
 * guides summarised in the kickboxing research) give the relations, not the
 * numbers; the numbers are stated readings, each named:
 *
 * - Stance length along the line 1.2 shoulder widths (guides: 1.0 to 1.3);
 * - The feet on their own hip tracks, so the lateral spacing is the hip joint
 *   spacing;
 * - The body turned 30 degrees from the line, lead shoulder forward (IBA p.34
 *   overhead feet), the lead foot pointing 15 degrees off the line toward the
 *   body's heading and the rear foot 45 degrees out (provisional readings of
 *   the same drawing);
 * - Both knees flexed 32 degrees, inside the 25 to 45 degree translated range
 *   (soft knees, ready to lift either leg), by sinking the root;
 * - The rear glove's knuckles beside the rear jaw and the lead glove one forearm
 *   length ahead of the lead cheek at chin height, elbows down by the ribs (IBA
 *   guard; "gloves cover the jaw and temple, elbows near the ribs").
 *
 * Orthodox leads with the left side; southpaw with the right. Every distance
 * reads the body's measure, so the stance fits any stature and proportion.
 *
 * The stance does not set how far apart the fighters stand, and no discipline's
 * fighting distance in metres is defined (provisional, missing): place the
 * fighters with `approach` `at` in metres. A strike whose target is beyond the
 * arm's or the leg's band steps in by up to one stance length (punch) or half a
 * stance (kick), so a fight starting within that gap still lands; the timing of
 * the strikes is in {@link IAutoMovieMotionHumanPunch}.
 */
export namespace IAutoMovieMotionHumanStrikingStance {
  /** A stance: which side leads and the heading of the line to the opponent. */
  export interface IStance {
    /** The leading side: `left` is orthodox, `right` southpaw. */
    lead: "left" | "right";

    /** Heading of the line toward the opponent, degrees about +Y (0 faces +Z). */
    line: number;
  }
}
