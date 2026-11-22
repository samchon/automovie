/**
 * A pole vault (#3377): out of a run, the hand that holds the pole plants
 * its end on the floor ahead at the take-off, the body swings over the
 * planted end with the pole, lets go as the pole stands upright, and flies
 * on to come down lying on the landing surface.
 *
 * No duration is authored: the swing follows the energy of a pendulum from
 * the run's speed (at least 1 m/s, `poleVault.RUN`; the take-off rises at 20
 * degrees, `poleVault.ANGLE`, Linthorne and Weetman 2012) and the flight is
 * the ballistic fall under gravity 9.80665 m/s2 to the landing surface.
 *
 * The pole is a held prop (`AutoMovieMotionHumanHeld`): taken up before,
 * typically by a pick up with a use, and rigid in the hand. Its planted end
 * is the prop's `tip` affordance, or the one named.
 *
 * 1. Take-off: the jump's push-off (`GymnasticsTakeoff`) at the run's speed,
 *    kept, rising at `ANGLE`. Over it the holding hand carries the pole from
 *    the entry to the plant: the hand as high above the shoulder as the arm
 *    reaches, unless the pole is too short to reach the floor from there
 *    leaning `LEAN` or more, then lower, and the pole's end on the floor
 *    ahead along the run.
 * 2. Swing, about one axis, the body's left one through the planted end:
 *    body and pole turn as one rigid pendulum. At the plant the centre's
 *    velocity across the pendulum's radius is kept, as the angular momentum
 *    about the planted end is, and the part along the radius is lost to the
 *    plant; the turn then follows the energy of a point mass on a rigid
 *    massless pole, ω² = ω₀² + (2g/R)(cos θ₀ − cos θ), integrated once into a
 *    table of time by angle. The hand lets go when the pole stands upright.
 *    A run too slow to bring it upright is refused with the speed needed.
 * 3. Flight: the centre on the parabola of its velocity at the release, the
 *    body keeping the swing's rate, until its lowest shape meets the
 *    landing surface; then it lies there (`GymnasticsMat`), on its back or
 *    its front as its turn brought it.
 *
 * First pass: the pole does not bend and the body does not swing about the
 * hands, so there is no inversion, no pull and turn and no push off the
 * pole, which a bending pole and a body that rocks back over its hands
 * give a vaulter (the multi-axis case is #3416); the pole's own mass and
 * the body's inertia about its centre are left out of the pendulum; the
 * other hand keeps the jump's arm swing; the released pole is not planned.
 *
 * Events: `takeoff` (the plant), `release`, `touchdown`, `settled`, `relax`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation end: The pole's affordance planted on the floor; `tip` when absent. on: The prop landed on, its subject id, whose `surface` is the landing's height; the floor when absent.
 * @evidence contracts/development/design.md#principled-representation end: The pole's affordance planted on the floor; `tip` when absent. on: The prop landed on, its subject id, whose `surface` is the landing's height; the floor when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/poleVault.ts (poleVault.plan, context); sport/poleVault.ts (poleVault.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in poleVault.plan.
 */
export namespace IAutoMovieMotionHumanPoleVault {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The pole and its planted end, and the landing surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Subject and affordance ids.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The pole, its subject id; a hand holds it at the entry. */
    pole: string;

    /** The pole's affordance planted on the floor; `tip` when absent. */
    end?: string;

    /** The prop landed on, its subject id, whose `surface` is the landing's height; the floor when absent. */
    on?: string;
  }
}
