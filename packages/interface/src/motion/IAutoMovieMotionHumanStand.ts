/**
 * Quiet standing: both feet planted where they are (or under the hips when
 * entered from the air), the pelvis settling over them, the column upright on
 * the plumb line and inclined slightly forward at the ankles (`standUpright`),
 * arms hanging relaxed, and the body swaying slightly.
 *
 * The feet keep their entry plants so a stop never slides them; a foot that was
 * not planted lands at its rest place beside the other. The root moves from its
 * entry position to the midpoint of the feet over the first 0.5 s on a
 * minimum-jerk profile and sits 5 mm below full extension so the knees are not
 * locked. Each foot turns out 7° from the heading, the mean adult foot
 * progression angle (Perry and Burnfield, Gait Analysis, 2nd ed.). Arms hang
 * relaxed (`relaxed`): 12° of elbow flexion, the hand in its position of rest
 * (`HumanHand.shape`, relaxed), and the least shoulder abduction that hangs the
 * hand beside the thigh, its digits clear of the body. Postural sway moves the
 * root on two seeded smooth signals below 1 Hz, side to side and front to back
 * in the body's frame, with an RMS of 3 mm for an elite and 4.8 mm for a
 * novice: quiet-stance centre-of-pressure sway of healthy adults is a few
 * millimetres RMS (Prieto et al. 1996), and experts sway less (Perrin et al.
 * 2002, provisional factor 1.6); a given `sway` replaces that RMS, and 0 stands
 * still. The window of the noise keeps the start and the end of the stand
 * exact. A law acting with one side that stands on this law's body passes that
 * side (`plan`'s `side`): the side-to-side draw is signed in that side's frame,
 * so a left action's sway is the mirror of a right one's for every seed, its
 * statistics unchanged.
 *
 * Standing yields its head, both arms, both hands and the trunk's turn to an
 * overlay.
 */
export namespace IAutoMovieMotionHumanStand {
  /** Parameters. */
  export interface IParams {
    /**
     * How long to stand, seconds, positive; 1.5 when absent (provisional,
     * `stand.SECONDS`): a beat between actions, not a held pose.
     */
    hold?: number;

    /**
     * The postural sway's RMS on each floor axis, metres, at least 0; the
     * performer's own when absent (3 mm times the skill's sway factor, 1.0 to
     * 1.6), and 0 for a stance that keeps exactly still, such as a reference
     * scene a mirror or a difference is read against.
     */
    sway?: number;

    /**
     * A moving support stood on: a cart's bed, a deck. The stance is planned
     * where the body stands at the entry and carried by the prop's motion from
     * there, its feet planted on the prop. When absent, a prop already under
     * both planted entry feet is continued; otherwise the feet retain their
     * declared entry support frames.
     */
    on?: {
      /** Scene subject id of the prop used as the standing support. */
      prop: string;
    };
  }
}
