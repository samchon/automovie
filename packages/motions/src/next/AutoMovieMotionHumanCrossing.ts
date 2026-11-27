import { stepOver as stepOverLaw } from "../everyday/internal/stepOver";
import { HumanTraversal as HumanTraversalSource } from "../lexicon/HumanTraversal";
import { HumanWallRun as HumanWallRunSource } from "../lexicon/HumanWallRun";
import { squatVault as squatVaultLaw } from "../sport/internal/squatVault";
import { vault as vaultLaw } from "../sport/internal/vault";
import { stepVaultSupport as stepVaultSupportLaw } from "../terrain/internal/stepVaultSupport";

/**
 * Crossing an obstacle: stepping over it and the vaults.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `stepOver`: Stepping over a low obstacle placed in the scene, a kerb or a
 *   hurdle (`HumanObstacle`), from standing in front of it: the lead foot lifts
 *   over it and lands beyond, then the trail foot follows and lands beside it,
 *   both feet clearing the obstacle's top.
 * - `vault`: A handspring vault: a front handspring whose hands land on a prop's
 *   top, a vaulting table, a box or a plyometric box, and fly from it to the
 *   floor or named landing mat beyond.
 * - `squatVault`: A squat vault over a box: the hands set on the near edge of the
 *   box's top, the body tucked over them, a push-off into a flight over the box
 *   and a landing on both feet beyond its far edge.
 * - `stepVaultSupport`: Compose the supports for a grounded step vault through
 *   `HumanChain.support`.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanTraversal`: Crossing named stage geometry: a step over, a
 *   hand-supported vault or a jump over an obstacle, or a jump across the gap
 *   between two decks, each planned by the existing step, support or jump law
 *   against the named props' shapes and surfaces (`planNamedCrossing`).
 * - `HumanWallRun`: Using a wall's face as a brief foot support: a wall step, or
 *   a run up the face to a cat hang from its top (`planWallRun`).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanCrossing} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanCrossing {
  /**
   * Stepping over a low obstacle placed in the scene, a kerb or a hurdle
   * (`HumanObstacle`), from standing in front of it: the lead foot lifts over
   * it and lands beyond, then the trail foot follows and lands beside it, both
   * feet clearing the obstacle's top.
   *
   * The goals are footprints and clearance: each swinging foot takes the
   * shortest path from its footprint to its landing that keeps every sole point
   * over the obstacle at least `MARGIN` above its top and every other one on or
   * above the floor, the taut string over the obstacle
   * (`AutoMovieMotionHumanClearance`), travelled on minimum-jerk progress.
   * Patla and Rietdyk (1993, Gait Posture 1:45) found that the lead toe clears
   * an obstacle by a roughly constant margin whatever its height, so the lift
   * grows with the obstacle and the margin does not; 0.1 m is the margin used
   * for the lead foot (provisional, of the order they report); the trail foot
   * clears it by 146 mm, the trailing toe's mean clearance whatever the
   * obstacle's height (Chou and Draganich 1997, J Biomech 30:331). The lead
   * foot lifts its toes by up to `TOE_UP` as they pass over the near side and
   * is level again once its heel does, so the toe clears the edge with the
   * ankle and the knee lower than a level foot would need; where the ankle
   * cannot take the planned pitch and the toes droop, the ankle is raised until
   * every sole point clears. The lead toes extend through the pitch the
   * unloaded ankle cannot supply. The trailing ankle clears the measured sole
   * radius and its foot turns forward in mid-swing. The lead foot lands so the
   * obstacle's middle falls at mid-swing, at least one tenth of a foot length
   * beyond the far side and no farther than the legs' stride allows; the trail
   * foot lands beside it at the body's rest separation, stepping down onto its
   * ball where its unloaded ankle cannot hold it level under the shank, and its
   * plant sets the heel down about that ball over a walk's settle
   * (`walkFoot.RISE`).
   *
   * While the lead foot swings, the trail foot rises on its ball by `PUSH`, the
   * forefoot rocker of a stance foot the body passes over (Perry and
   * Burnfield), and the pelvis rises with it as far as it lifts that ankle, so
   * the lead hip stands higher over the obstacle; the trail foot later leaves
   * from that pitch and levels by the time its toe reaches the near side. The
   * pelvis stays back over the trail foot until the lead foot is crossing,
   * moves halfway between the feet by the double support and over the landed
   * feet while the trail foot swings, each leg on a minimum-jerk path. The
   * supporting lead heel rises with the trailing ankle's clearance so the
   * folded trailing knee keeps its range. The pelvis is lowered wherever a
   * planted leg could not reach its foot, and over the second half of each
   * swing toward where the swinging leg will reach its landing, so it has come
   * down when the foot lands instead of dropping at the contact; over the first
   * half the swinging leg lets go of the lowering it asked where it left, so
   * the pelvis does not rise at the toe-off.
   *
   * Time scales with leg length by dynamic similarity (Alexander 1984): the
   * whole action takes `2.4 sqrt(l / walkRoot.REFERENCE_HIP)` seconds for a hip
   * height `l` (provisional: a deliberate two-step crossing near 1 s a step for
   * an adult) times the manner's tempo, the lead swinging over 8 to 42 % and
   * the trail over 50 to 82 %, the pelvis transferring over the supporting lead
   * leg by trail mid-swing so the trailing hip and knee can flex through
   * clearance (Chou and Draganich 1997, J Biomech 30:331).
   *
   * The obstacle lies ahead along the performer's heading; its near side must
   * lie past both toes as entered and within one leg length of the feet, and
   * its height at most 0.55 of the hip height (provisional, near the hip
   * flexion a standing step can use), otherwise the step is refused with the
   * limits. Events: `leadToeOff`, `leadContact`, `trailToeOff`,
   * `trailContact`.
   */
  export import stepOver = stepOverLaw;

  /**
   * A handspring vault: a front handspring whose hands land on a prop's top, a
   * vaulting table, a box or a plyometric box, and fly from it to the floor or
   * named landing mat beyond. The post-table flight is timed from its release
   * to the landing surface's height, a separate phase in the vault observations
   * of Chen et al. (2026, PMC13350820).
   *
   * The motion is the handspring's (`handspring.over`) with the hands bearing
   * on the prop's `surface` affordance, read where the prop stands as the
   * action starts. The hands come down where the lunge brings them, so a
   * surface that is not there is refused: the hands' middle must lie inside the
   * top's declared `width` and `depth`; a top that declares neither is taken as
   * wide as it needs to be. The higher hands give the flight a longer fall, so
   * the rate that lands it is lower than on the floor.
   *
   * First pass: no run-up, hurdle, springboard or flight onto the table; the
   * body is entered standing before the prop and lunges onto it, and whether
   * the legs clear the prop's edge is not checked.
   */
  export import vault = vaultLaw;

  /**
   * A squat vault over a box: the hands set on the near edge of the box's top,
   * the body tucked over them, a push-off into a flight over the box and a
   * landing on both feet beyond its far edge.
   *
   * The support phase is the support planner's (`support`): from standing the
   * palms are laid on the top at its near edge, then the body tucks over the
   * hands alone in the floor laws' squat (`getUp.POSES`). The flight is
   * ballistic in the root from the push-off under standard gravity
   * (`AutoMovieGravity.STANDARD`), on the least-speed arc from the tucked root
   * to the landing's (the push that reaches it with the least effort), the
   * joints blended from the tuck to the landing on minimum-jerk shares; the
   * flight is declared without turns, so the flight pass gives the whole body's
   * rotation from the angular momentum of none (`IHumanActionPlan.IFlight`,
   * `HumanPerformanceFlight`). The landing is the stand law's quiet stance
   * (`stand.posture`, its joints `getUp.quiet`) with the heels a foot's length
   * past the far edge (provisional), held for `seconds`.
   *
   * The box is the prop's own `surface` affordance: its point the top's middle
   * and its declared `depth` along the prop's own Z, the far edge the end of
   * that depth farther along the heading. A landing that lies no farther ahead
   * than the push-off is refused: no flight carries the body over the box to
   * it. Events: `handsDown`, `tucked` (the push-off), `touchdown`.
   */
  export import squatVault = squatVaultLaw;

  /**
   * Crossing named stage geometry: a step over, a hand-supported vault or a
   * jump over an obstacle, or a jump across the gap between two decks, each
   * planned by the existing step, support or jump law against the named props'
   * shapes and surfaces (`planNamedCrossing`). Register
   * `HumanTraversal.crossObstacle` to use it.
   */
  export import HumanTraversal = HumanTraversalSource;

  /**
   * Using a wall's face as a brief foot support: a wall step, or a run up the
   * face to a cat hang from its top (`planWallRun`). A tic-tac composes a wall
   * step and a `jump` to the redirected landing, and a wall flip a wall step
   * and a `jump` with a backward somersault. Register `HumanWallRun.wallRun` to
   * use it.
   */
  export import HumanWallRun = HumanWallRunSource;

  /**
   * Compose the supports for a grounded step vault through
   * `HumanChain.support`. The palm plants first. The opposite foot joins it on
   * the obstacle, the other foot passes between them, and the supporting foot
   * follows to settle on the exit before the hand lets go. London Parkour
   * teaches the same crossing as a ground step vault before introducing a
   * raised obstacle. The base support planner fits the contacts and supplies
   * the ordinary swing over each step. This draft is for a ground drill or low
   * staging within that swing's available clearance. Obstacle collision is
   * outside this fit.
   *
   * @param route The side and the authored locations of the six foot and hand
   *   contacts.
   * @returns Four stances for the canonical support action.
   * @see https://londonparkour.com/tutorials/ground-step-vaults/
   * @see https://londonparkour.com/tutorials/step-vault-02/
   */
  export const stepVaultSupport: typeof stepVaultSupportLaw =
    stepVaultSupportLaw;
}
