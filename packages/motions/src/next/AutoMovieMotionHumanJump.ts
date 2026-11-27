import { jump as jumpLaw } from "../actions/jump";
import { HumanAirborneShape as HumanAirborneShapeSource } from "../lexicon/HumanAirborneShape";
import { AutoMovieMotionHumanHighJump as highJumpLaw } from "../sport/AutoMovieMotionHumanHighJump";
import { horizontalJump as horizontalJumpLaw } from "../sport/horizontalJump";
import { hurdleClear as hurdleClearLaw } from "../sport/hurdleClear";
import { AutoMovieMotionHumanPoleVault as poleVaultLaw } from "../sport/AutoMovieMotionHumanPoleVault";

/**
 * The flight laws: a push-off, a flight under gravity and a landing. A flight
 * lasts `sqrt(8 apex / g)` at gravity 9.80665 m/s2 for a level jump
 * (`jump.plan`); push-off, absorption and rise are provisional and scale with
 * `manner.pace`, and the flight does not.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `jump`: A jump to a floor point: a push-off from a planted foot, a ballistic
 *   flight and a two-footed landing that absorbs and rises to standing.
 * - `horizontalJump`: A long jump out of a run: the run is cut at the take-off
 *   foot's footfall on the board (`AthleticsRunUp`), and the jump's own
 *   push-off, ballistic flight and two-footed landing (`jump`) carry the body
 *   into the sand with the heels at the authored distance from the take-off
 *   line.
 * - `highJump`: A high jump in the Fosbury flop: a one-foot take-off, a half turn
 *   that puts the back to the bar, a backward lay-out over it with the back
 *   arched, the legs lifted after the hips pass, and a landing on the back.
 * - `poleVault`: A pole vault: out of a run, the hand that holds the pole plants
 *   its end on the floor ahead at the take-off, the body swings over the
 *   planted end with the pole, lets go as the pole stands upright, and flies on
 *   to come down lying on the landing surface.
 * - `hurdleClear`: A hurdle clearance out of a run.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanAirborneShape`: The body shapes held in flight: tuck, pike, layout,
 *   straddle and the twisting arm sets, each a layer laid over a jump's flight
 *   window, so the flight pass (`HumanPerformanceFlight`) reads the composed
 *   shape and turns the body by it: a tuck turns faster than a layout by the
 *   ratio of their moments about the somersault axis.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanJump} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanJump {
  /**
   * A jump to a floor point: a push-off from a planted foot, a ballistic flight
   * and a two-footed landing that absorbs and rises to standing.
   *
   * The push starts from the entry's position, velocity and acceleration on a
   * quintic Hermite root path. It uses the leading planted foot in the entered
   * body's frame, lowering a heel rocker before rising about the metatarsal
   * joint. The requested heel rise is 40 degrees; the actual pitch follows the
   * body's ankle/reach rule and can be steeper. The declared floor contact is
   * the heel during that rocker, then the metatarsal joint. The free ankle
   * withdraws to 0.3 hip heights while the shoulders rise to 60 degrees, the
   * arm action that contributes to takeoff velocity (Ashby and Heegaard 2002,
   * "Role of arm motion in the standing long jump", J. Biomech. 35).
   *
   * The push's carried entry rates and acceleration use the existing engine
   * bases and available floor room (`jumpPush`). Its pure terminal writer is
   * shared with endpoint preparation: lowering and ordinary canonical fitting
   * supply the actual root, feet, knee planes and toes to flight, instead of
   * reconstructing a nominal 40-degree pose. Shared endpoint values do not
   * establish world COM or angular C1 across takeoff.
   *
   * Flight is ballistic in the centre of mass, the one point gravity alone
   * moves while airborne: from the apex height `apex` above take-off (0.06 hip
   * heights plus a tenth of the jump's length when absent, provisional), the
   * vertical take-off speed is `sqrt(2 g apex)`, the flight time solves the
   * centre's landing height, and the horizontal speed covers its distance in
   * that time, the closed form of a drag-free projectile (`v = d / T - g T /
   * 2`, as the engine's ballistic solvers). At each airborne instant the root
   * is placed so the body's centre of mass, read by the engine's mass model
   * from the posture there, lies on that parabola, so moving the limbs in
   * flight shifts the trunk the way it would. The free legs travel between
   * achieved endpoints with the existing sine arch of a tenth of hip height;
   * original planted and landing targets remain unchanged. Requested turns
   * follow the performance's staged authored-turn clock by default. Explicit
   * physical mode instead derives rotation from the composed body's angular
   * momentum; that conservation claim does not apply to staged rotation. Both
   * policies retain the same ballistic COM and limb goals. Both feet land flat
   * on footprints at the destination and at its height (a box's top, a step;
   * the flight's default apex then also clears that rise, and an apex that does
   * not is refused), at the body's rest separation, turned out by the stance
   * angle; the root lands 0.03 hip heights low with the flight's velocity,
   * absorbs toward 0.12 hip heights low on a quintic path that brings that
   * velocity to rest over `ABSORB` seconds, then rises to the upright stand
   * ({@link standUpright}) over `RISE` seconds, both scaled by the manner's
   * tempo as the push is. Planted legs are kept reachable by the shared
   * `lowerHumanPosture` rule. The push-off is drawn by `jumpPush`, the
   * landing's places by `jumpLanding` and the paths by `jumpPath`. A fractional
   * twist may finish upright on level floor with both footprints facing the
   * terminal heading. The signed winding still belongs to flight, which must
   * hand back a touchdown inside the continuity budget. The turned absorption
   * follows the measured depth available to both planted feet.
   *
   * The phase boundaries separate ground propulsion, airborne shape and impact.
   * [Bobbert and van Ingen Schenau
   * (1988)](https://pubmed.ncbi.nlm.nih.gov/3379084/) describe push-off in
   * terms of the energy transferred to the centre of mass. The [MIT Cheetah
   * jump
   * planner](https://dspace.mit.edu/entities/publication/8cfc87cf-d85a-466e-9471-66ca6923035d)
   * likewise prepares distinct approach and push-off phases.
   */
  export import jump = jumpLaw;

  /**
   * A long jump out of a run: the run is cut at the take-off foot's footfall on
   * the board (`AthleticsRunUp`), and the jump's own push-off, ballistic flight
   * and two-footed landing (`jump`) carry the body into the sand with the heels
   * at the authored distance from the take-off line.
   *
   * The take-off angle is `ANGLE`. With the take-off and landing centres at one
   * height, a flight of horizontal length `D` at that angle needs the
   * horizontal speed `sqrt(g D / (2 tan ANGLE))` and peaks `D tan(ANGLE) / 4`
   * above the take-off, the apex the jump is given. The run brings at most its
   * own speed into the take-off (a plant trades horizontal speed for lift, Hay,
   * Miller and Canterna 1986, J Biomech 19:855), so a distance that asks for
   * more is refused with the distance the run reaches. The take-off foot's toe
   * may not pass the take-off line, the board's far edge: that jump is a foul
   * (World Athletics TR30.1) and is refused.
   *
   * First pass: the landing is the jump's upright two-footed absorption,
   * without the legs thrown forward or the fall forward out of the sand; the
   * flight keeps the jump's posture (no hang or hitch-kick).
   *
   * Events: the jump's, `takeoff` and `touchdown` among them.
   */
  export import horizontalJump = horizontalJumpLaw;

  /**
   * A high jump in the Fosbury flop: a one-foot take-off, a half turn that puts
   * the back to the bar, a backward lay-out over it with the back arched, the
   * legs lifted after the hips pass, and a landing on the back. The author may
   * name the final support foot of an incoming approach (World Athletics TR27).
   * The foot must already be planted.
   *
   * The take-off is the jump's push-off (`GymnasticsTakeoff`), aimed so the
   * centre of mass peaks at the bar axis plus the authored reserve. It comes
   * down at the landing place at the height it has lying on its back there. The
   * flight is ballistic in the centre of mass (`GymnasticsFlight`), and its
   * rotation runs through the whole flight from the take-off, as the angular
   * momentum a flop builds during the take-off (Dapena 1980, "Mechanics of
   * rotation in the Fosbury-flop", Med Sci Sports Exerc 12:45-53: most of the
   * somersault's angular momentum is made on the ground) is kept in the air:
   * the half turn about the vertical eased over the whole rise, so the back is
   * to the bar at the apex, and the backward somersault about the body's left
   * axis eased in over the first half of the rise and then at a constant rate,
   * level at the apex and kept to the touchdown. The two overlap from the
   * take-off on; turning them one after the other, each in a fraction of the
   * rise, spun the body upright to inverted in a frame or two. The arch is
   * keyed: the joints go from the take-off's to `arched` at the apex and to
   * `piked`, the legs lifted, after it. The body comes down when the lowest of
   * its shapes reaches the landing surface, and lies on its back there
   * (`GymnasticsMat`).
   *
   * The bar is the scene's high jump, a prop whose `bar` affordance is the
   * crossbar (`createHighJump`'s). Its axis is read where the prop stands at
   * the action's start. The requested apex must exceed the take-off centre and
   * fit within the vertical take-off speed bound `RISE`. The horizontal
   * take-off speed is not stated: it follows from the landing place the author
   * gives, which world-class finalists reach leaving the floor at 4.14 ± 0.37
   * m/s (the same table of Nicholson et al. 2022).
   *
   * A run-up is a `run`, curved by its `via` points, cut at the take-off foot's
   * footfall (`accepts`). The take-off foot is then the one the run has
   * planted, it must be the foot farther from the bar (`highJumpBar.admit`),
   * and the landing place may ask for no more horizontal take-off speed than
   * the run-up brings: a plant trades run-up speed for lift.
   *
   * First pass: no lean into the curve or the take-off; the arms do not lead;
   * the angular momentum appears at the take-off instead of being built over
   * the push; the apex falls where the landing place puts it, the crossbar's
   * plane can be reached before or after that apex. The `barCrossing` event
   * records the centre's passage within the physical span, when present. The
   * push-off's own flight, which aims the take-off, leaves 20 to 24 mm from its
   * take-off pose, so the flight starts from that pose's centre with the
   * vertical speed for the requested apex, and the body does not step at the
   * take-off.
   *
   * Events: `takeoff`, `apex`, optional `barCrossing`, `touchdown`, `settled`,
   * `relax`.
   */
  export import highJump = highJumpLaw;

  /**
   * A pole vault: out of a run, the hand that holds the pole plants its end on
   * the floor ahead at the take-off, the body swings over the planted end with
   * the pole, lets go as the pole stands upright, and flies on to come down
   * lying on the landing surface.
   *
   * The pole is a held prop (`AutoMovieMotionHumanHeld`): taken up before, in
   * one hand or two (a vaulter's top hand and lower hand), and rigid in them.
   * Its planted end is the prop's `tip` affordance, or the one named.
   *
   * 1. Take-off: the jump's push-off (`GymnasticsTakeoff`) at the run's speed,
   *    kept, rising at `ANGLE`. Over it the hands carry the pole on from the
   *    run's drop (`plants`, `walkPoleCarriage`) to the plant: the top arm
   *    straight, raised until its forearm meets the pole at the grip's own
   *    neutral angle (`walkPoleFrame.plant`), no higher than lets the pole lean
   *    `LEAN` from upright, and the pole's end slides along the planting line,
   *    from where the run left it to the planted point on the floor ahead along
   *    the run, at the pole's length from that grip, each hand placed by its
   *    hold (`walkPoleFrame`): the end comes down onto the plant from above and
   *    never passes through the floor, as a vaulter's tip falls onto the box as
   *    the top hand rises overhead (Coaches Insider, "Pole carry and drop").
   * 2. Swing, about one axis, the body's left one through the planted end: body
   *    and pole turn as one rigid pendulum. At the plant the centre's velocity
   *    across the pendulum's radius is kept, as the angular momentum about the
   *    planted end is, and the part along the radius is lost to the plant; the
   *    turn then follows the energy of a point mass on a rigid massless pole,
   *    ω² = ω₀² + (2g/R)(cos θ₀ − cos θ), integrated once into a table of time
   *    by angle. The hand lets go when the pole stands upright. A run too slow
   *    to bring it upright is refused with the speed needed.
   * 3. Flight: the centre on the parabola of its velocity at the release, the body
   *    keeping the swing's rate, until its lowest shape meets the landing
   *    surface; then it lies there (`GymnasticsMat`), on its back or its front
   *    as its turn brought it.
   *
   * First pass: the pole does not bend and the body does not swing about the
   * hands, so there is no inversion, no pull and turn and no push off the pole,
   * which a bending pole and a body that rocks back over its hands give a
   * vaulter (a multi-axis flight is not planned); the pole's own mass and the
   * body's inertia about its centre are left out of the pendulum; a hand that
   * does not hold the pole keeps the jump's arm swing; the released pole flies
   * from the velocity of its origin in the swing (`launches`) rather than
   * pivoting on in the box.
   *
   * Events: `takeoff` (the plant), `release`, `touchdown`, `settled`, `relax`.
   */
  export import poleVault = poleVaultLaw;

  /**
   * A hurdle clearance out of a run. The run is cut at the take-off foot's
   * footfall (`AthleticsRunUp`); that foot pushes off about its toes' joint
   * over the rest of the run's own stance, while the root goes on a cubic
   * Hermite path from the entry to the root the run planned at that toe-off, a
   * reach the run's legs already meet; the root then flies the drag-free
   * parabola that lands the lead foot `LANDING` metres beyond the bar at the
   * run's horizontal speed. The lead leg swings from where the run left it over
   * the bar to its landing, the trail leg from the take-off over the bar out to
   * its side and forward for the next stride (`AthleticsSwing`), each passing
   * `CLEAR` over the bar at its swing's middle, and the trunk dips forward by
   * `DIP` at the crossing. The lead foot lands flat and bears; a run cut there
   * takes the stride on.
   *
   * Refused: a take-off outside `TAKEOFF` metres before the bar (an unsuitable
   * approach), and a flight whose hips pass the bar's plane lower than its top
   * plus `CLEAR`.
   *
   * First pass: the root stands in for the centre of mass on the parabola; the
   * arms keep the run's entry angles; the lead foot lands flat, not on its
   * forefoot as a run's stance does, because the run that takes the stride on
   * starts from its entry feet flattened; the take-off foot keeps the run's own
   * stance placement, not a measured push.
   *
   * Events: `takeoff`, `clear` (the hips over the bar's plane), `touchdown`.
   */
  export import hurdleClear = hurdleClearLaw;

  /**
   * The body shapes held in flight: tuck, pike, layout, straddle and the
   * twisting arm sets, each a layer laid over a jump's flight window, so the
   * flight pass (`HumanPerformanceFlight`) reads the composed shape and turns
   * the body by it: a tuck turns faster than a layout by the ratio of their
   * moments about the somersault axis.
   *
   * Each shape holds clinical joint angles for the channels it claims, set over
   * what the flight holds there; a goal the flight holds on a limb the shape
   * claims is moved to where the shape's joints put that limb's end joint,
   * since a held tuck is a joint shape and not a foot placed somewhere, and a
   * layer's weight moves a goal both postures hold but keeps one only the base
   * holds until the full weight drops it at once, which would snap the limb
   * mid-air. The positions are the gymnastic and diving position names (tuck:
   * hips and knees bent; pike: hips bent, knees straight; layout: straight;
   * straddle: legs apart), with angles that are provisional: no rulebook or
   * kinematic study was read for them.
   *
   * Schedule a shape over the flight as a windowed layer, from the jump's
   * `takeoff` to its `touchdown`.
   */
  export import HumanAirborneShape = HumanAirborneShapeSource;
}
