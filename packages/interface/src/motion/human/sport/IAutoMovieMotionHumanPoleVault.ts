/**
 * A pole vault: out of a run, the hand that holds the pole plants its end on
 * the floor ahead at the take-off, the body swings over the planted end on the
 * bending pole, lets go as the pole recoils straight, and flies on to come down
 * lying on the landing surface.
 *
 * No duration is authored: the swing follows Linthorne's flexible-pole model
 * from the run's speed (at least 1 m/s, `poleVault.RUN`; the take-off rising at
 * the angle Linthorne and Weetman 2012 read from the run-up speed) and the
 * flight is the ballistic fall under gravity 9.80665 m/s2 to the landing
 * surface.
 *
 * The pole is a held prop (`AutoMovieMotionHumanHeld`): taken up before,
 * typically by a pick up with a use. Its planted end is the prop's `tip`
 * affordance, or the one named; it bends on its hinges (a vaulting pole's
 * chain), and a pole with none is refused.
 *
 * 1. Take-off: the jump's push-off (`GymnasticsTakeoff`) at the run's speed, kept.
 *    Over it the holding hand carries the pole from the entry to the plant: the
 *    hand as high above the shoulder as the arm reaches, unless the pole is too
 *    short to reach the floor from there leaning `LEAN` or more, then lower,
 *    and the pole's end on the floor ahead along the run.
 * 2. Swing, in the vault's plane: the vaulter a point mass at the top hand's grip
 *    on a massless pole planted at its tip (Linthorne 2000), the plant's loss
 *    taken and the pole pushing along its chord until it recoils to its length,
 *    where the hand lets go; the pole as stiff as its `rating`. The pole shows
 *    the elastica of the swing's chord, the body turns with the chord and the
 *    hands hold the pole where its bend puts them. A run too slow to swing the
 *    pole upright is refused.
 * 3. Flight: the centre on the parabola of its velocity at the release, the body
 *    keeping the chord's rate, until its lowest shape meets the landing
 *    surface; then it lies there (`GymnasticsMat`), on its back or its front as
 *    its turn brought it.
 *
 * First pass: the vaulter is passive on the pole, so there is no inversion, no
 * pull and turn and no push off the pole (a multi-axis flight is not planned);
 * the pole's own mass is left out; the other hand keeps the jump's arm swing.
 *
 * Events: `takeoff` (the plant), `release`, `touchdown`, `settled`, `relax`.
 */
export namespace IAutoMovieMotionHumanPoleVault {
  /** Parameters. */
  export interface IParams {
    /** The pole, its subject id; a hand holds it at the entry. */
    pole: string;

    /** The pole's affordance planted on the floor; `tip` when absent. */
    end?: string;

    /**
     * The prop landed on, its subject id, whose `surface` is the landing's
     * height; the floor when absent.
     */
    on?: string;

    /**
     * The pole's stiffness rating, kilograms: the vaulter's weight it is made
     * for (a vaulting pole's `rating`). Absent, the vaulter's own mass, the
     * least rating a vaulter may use (NFHS Track and Field Rule 7-5-3: the
     * vaulter's weight at or below the pole's rating).
     */
    rating?: number;
  }
}
