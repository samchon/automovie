import { HumanForceExchange as HumanForceExchangeLaw } from "../grappling/HumanForceExchange";
import { HumanForceResponse as HumanForceResponseLaw } from "../grappling/HumanForceResponse";
import { HumanForceThrow as HumanForceThrowLaw } from "../grappling/HumanForceThrow";
import { HumanForceTrunk as HumanForceTrunkLaw } from "../grappling/HumanForceTrunk";
import { clinch as clinchLaw } from "../grappling/internal/clinch";
import { grapple as grappleLaw } from "../grappling/internal/grapple";
import { kuzushi as kuzushiLaw } from "../grappling/internal/kuzushi";
import { armWrestle as armWrestleLaw } from "../touch/internal/armWrestle";
import { lungeGrab as lungeGrabLaw } from "../touch/internal/lungeGrab";
import { HUMAN_GRAPPLE_JUDO_GRIP } from "./presets/HUMAN_GRAPPLE_JUDO_GRIP";

/**
 * Holds, throws, clinches and arm wrestling between two bodies. The grappling
 * law reads no skill: its scene lengths are authored.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `clinch`: Taking a clinch grip on a partner standing within reach and holding
 *   it: the two-handed neck tie of Muay Thai (`plum`), or judo's collar and
 *   sleeve grip (`collarSleeve`, kumikata).
 * - `grapple`: One role of a scripted judo, wrestling or mat grappling scene.
 * - `kuzushi`: A broken base (kuzushi): the receiver of a judo throw drawn off
 *   balance forward, the whole body tipped about the ankles over the toes while
 *   the feet stay on the floor, the stage before a throw carries the body
 *   over.
 * - `lungeGrab`: A lunge that closes both hands on a victim
 *   (`IAutoMovieMotionHumanLungeGrab`), as a shambler breaks from its walk.
 * - `armWrestle`: Arm wrestling, one role of it: the elbow planted on a table's
 *   top, the hand clasped with the partner's above it, the struggle and the
 *   pin.
 * - `forceResponse`: A partner's response to a pull through grips, the outcomes
 *   of `perturb` a sustained force decides: `resist`, `yield` and `thrown`.
 * - `forceExchange`: The mechanics of a force exchanged through grips: a pull
 *   that draws a partner off balance (kuzushi), the counter-lean that resists
 *   it, and a throw's rotation about the thrower's fulcrum.
 * - `forceThrow`: The throw of a pulled body whose base has broken: the swing
 *   over the thrower's fulcrum, the release where the centre comes level with
 *   it and the flight to the landing, for `HumanForceResponse`'s `thrown`.
 * - `forceTrunk`: How far a torque through the arm bends a trunk that resists it:
 *   the share of the trunk's side-bending range at which its stiffness holds
 *   the torque, the share `HumanTrunkTurn.turned` takes.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `JUDO_GRIP`: The judo grip preset: judo's grip (kumikata) for a throw, the
 *   right hand on the partner's left collar and the left on the right sleeve,
 *   held two seconds (provisional).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanGrapple} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanGrapple {
  /**
   * Taking a clinch grip on a partner standing within reach and holding it: the
   * two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve grip
   * (`collarSleeve`, kumikata).
   *
   * The goals are the partner's regions, read on the partner's displayed body
   * at every second, so the grip follows the partner. In the plum both palms
   * lie on the back of the partner's neck (the `nape`), one each side of it
   * (`SPREAD` of the half shoulder width, provisional); in the collar and
   * sleeve grip the right hand closes on the partner's left collar (`neckLeft`)
   * and the left hand on the partner's right sleeve at the elbow
   * (`elbowRight`), mirrored for a left-handed grip. Each hand reaches its
   * region in the aimed movement time to a 5 cm grip (McIntosh et al. 2018),
   * holds `hold` seconds and lets go. The feet stay planted. Events: the
   * phrase's `ready` (`grip`, both hands closed), `strokeStart`, `stroke`,
   * `strokeEnd`, `relax` (`release`).
   *
   * With `under` the clinch is a throw's entry (tsukuri): the body lowers and
   * moves across the floor through the reach until its fulcrum region stands at
   * the partner's region that lies on it, the contact the throw turns over, and
   * at the height of the partner's centre of mass, so the fulcrum is under the
   * body it turns; the throw itself is the partner's `perturb` under the pull.
   *
   * Not yet: pummelling, underhooks and overhooks, and the turn-in's own
   * footwork (Koshida et al. 2016).
   */
  export import clinch = clinchLaw;

  /**
   * One role of a scripted judo, wrestling or mat grappling scene. The actors
   * share an authored clock and outcome. The floor solver moves each actor
   * through changing supports and the initiator's hand goals follow the
   * displayed receiver during the declared grip window. The receiver's pose is
   * authored independently, which keeps the two performers' reads acyclic.
   * Scene events identify staging beats for cuts, camera and referee cues.
   */
  export import grapple = grappleLaw;

  /**
   * A broken base (kuzushi): the receiver of a judo throw drawn off balance
   * forward, the whole body tipped about the ankles over the toes while the
   * feet stay on the floor, the stage before a throw carries the body over.
   *
   * The body turns as one about the midpoint of its two ankles by `depth`
   * degrees forward over `TIP` seconds, holds there for `hold` seconds and
   * comes back over `TIP` seconds; the feet keep their planted goals, so the
   * ankles bend and the centre of mass passes ahead of the toes. A balanced
   * person leans from the hips and moves them back (`gestureBow.bowed`); a
   * broken base is the lean that does not, which is what the partner's pull and
   * the thrower's entry produce.
   *
   * What follows, the body carried over the thrower's hip and its fall, is set
   * by the forces of the throw and is the force-determined follow-up, not
   * staged here; nor are the receiver's grips and the breakfall.
   *
   * Events: `broken` when the lean is full, `relax` when it starts back.
   */
  export import kuzushi = kuzushiLaw;

  /**
   * A lunge that closes both hands on a victim
   * (`IAutoMovieMotionHumanLungeGrab`), as a shambler breaks from its walk. The
   * grab is the stage-fight grab, both palms squeezing the victim's regions
   * (`touch`), planned from where the lunge leaves the body: the leading foot
   * steps long toward the victim over one step period (`step.period`) while the
   * rear foot stays planted, and the root travels the length the arms lack on
   * one minimum-jerk profile, ending between the feet, so the hands reach as
   * the body arrives. The lunge's length is what the arms lack to reach the
   * regions from where the body stands; a victim further than the longest lunge
   * is refused with the distance named.
   */
  export import lungeGrab = lungeGrabLaw;

  /**
   * Arm wrestling, one role of it: the elbow planted on a table's top, the hand
   * clasped with the partner's above it, the struggle and the pin.
   *
   * Both roles read one geometry from the table's point and the two bodies, so
   * neither waits on the other. The clasp stands over the table's point at 0.85
   * of the shorter forearm (provisional), the two wrists `GAP` apart across the
   * table; each elbow lies on the table's top where its own forearm reaches its
   * wrist from, toward its own side. The trunk leans from the hips until the
   * shoulder is an upper arm from the elbow, so the elbow, which is no hand
   * surface, is put where it must be by the arm's own lengths: the hand's goal
   * is the wrist and the elbow's hint is its place on the table. A table too
   * low or too far for the lean to close is refused.
   *
   * The forearms turn about the line through the two elbows: upright from
   * `set`, swaying `SWAY` degrees through the struggle from `go`, then down to
   * the pin's angle (`PIN` degrees when none is asked) toward the winner's left
   * by `pin`, and back up to leave from `relax`. An angle past what the arm
   * holds with its elbow in place (the fitted elbow within `HELD` of its place,
   * as far as upright) is refused with the angle it holds. The winner's trunk
   * holds its lean; the loser's bends toward the pin as the pin comes, by the
   * force exchanged (`HumanForceTrunk`): its shoulder resists at its eccentric
   * internal-rotation peak per body mass (Tasiopoulos et al. 2018, provisional
   * beyond men at 60 degrees a second) and its trunk holds that torque at the
   * side-bending share its stiffness gives (Watt, Callaway and Williams 2022),
   * but no further than keeps its elbow on the pad, which the sport's rules
   * hold down throughout (World Armwrestling Federation rules: lifting the
   * elbow off the pad is a foul): the shoulder stays an upper arm, within
   * `HELD`, from the elbow's place. The author declares the winner
   * (outcome-first rule).
   *
   * First pass: the elbow's bearing on the table is not declared as a contact
   * window, the fingers are left as they were and do not clasp, and the free
   * hand hangs.
   */
  export import armWrestle = armWrestleLaw;

  /**
   * A partner's response to a pull through grips, the outcomes of `perturb` a
   * sustained force decides: `resist`, `yield` and `thrown`.
   *
   * The pull is the horizontal sum of the sustained forces on the performer
   * open at the action's start (`IHumanActionContext.forces`), lasting until
   * the first of them ends; when none is open at the start, the first to open
   * within the action is answered from its onset, the body standing until then,
   * as a pull through grips begins only once they close (the grip, kumikata,
   * comes before kuzushi, tsukuri and kake: Kano, Kodokan Judo, Kodansha 1986).
   * Its mechanics are `HumanForceExchange`'s:
   *
   * - **resist**: the body leans away from the pull about the ankles until its
   *   centre has moved back by the moment balance's shift, over the body's own
   *   time constant `1 / ω` on a minimum-jerk profile, and holds for the pull.
   *   A pull whose shift passes the base behind is refused with the force range
   *   that can be resisted.
   * - **yield**: the body tips along the pull about the ankles as its centre
   *   travels by the linear inverted pendulum under the pull, until its
   *   extrapolated centre leaves the base (`kuzushi`, the plan's end). A pull
   *   that ends first is refused with the force that breaks the base within
   *   it.
   * - **thrown**: the yield to `kuzushi`, then the body, frozen in that pose,
   *   turns about the thrower's fulcrum (`fulcrum`, a region of `by`) by the
   *   swing's law from the momentum the pull left, leaves it at `release` where
   *   its centre comes level with the fulcrum, and flies, its centre on the
   *   parabola from the release and its orientation from the conserved angular
   *   momentum (`integrateAirborneRotation`), until its lowest joint reaches
   *   the floor (`land`). A throw with no fulcrum, or whose swing stops before
   *   the vertical, is refused. The composition cuts into the fall or the
   *   breakfall at `land`.
   *
   * The centre moves as standing balance moves it with the feet side by side
   * (Winter 1995): along the facing by the whole body's tip about the ankles,
   * across it by the pelvis carried sideways over the planted legs.
   *
   * First pass: the grip sites are not held to the puller's hands by a root
   * solve while the body tips, and the body is rigid through the swing and the
   * flight.
   */
  export import forceResponse = HumanForceResponseLaw;

  /**
   * The mechanics of a force exchanged through grips: a pull that draws a
   * partner off balance (kuzushi), the counter-lean that resists it, and a
   * throw's rotation about the thrower's fulcrum.
   *
   * - **Off-balancing.** The partner is a linear inverted pendulum of its own
   *   mass `M` and length `l` (`resolveAutoMovieCenterOfMass.pendulum`), with
   *   eigenfrequency `ω = sqrt(g / l)` (Hof, Gazendam and Sinke 2005). A
   *   constant horizontal pull `F` at rest gives `x'' = ω² x + F / M`, so the
   *   centre moves `x(t) = (F / M ω²)(cosh ωt - 1)` along the pull and its
   *   extrapolated centre `x + x' / ω` is `(F / M ω²)(e^{ωt} - 1)`. It leaves
   *   the base where the base ends along the pull, `e` from the centre, at `T =
   *   ln(1 + e M ω² / F) / ω`; the pull that breaks the base at a declared `T`
   *   is `F = e M ω² / (e^{ωT} - 1)`.
   * - **Resistance.** A partner who resists keeps its centre over the base by
   *   leaning against the pull until the moments about the base balance: the
   *   pull at grip height `h` against the weight shifts the centre of pressure
   *   `F h / (M g)` toward the pull (static moment balance, the form of
   *   `HumanLoad.lean`), and the resistance holds while that shift stays within
   *   the base's extent along the pull.
   * - **Throw.** Once the base is broken the thrower's fulcrum carries the
   *   partner, who turns about it as a rigid body: `I φ'' = M g r sin φ + τ`,
   *   with `φ` the angle of the centre from the vertical through the fulcrum,
   *   `r` its distance, `I = I_c + M r²` (parallel axes) and `τ` the pull's
   *   moment about the fulcrum while the pull lasts: a horizontal pull `F` at a
   *   grip `h` above the fulcrum turns the body by `F h`. It starts from the
   *   momentum the pull left, `φ'(0) = v_t / r`, the centre's speed across the
   *   fulcrum line, and is released where the centre comes level with the
   *   fulcrum on its far side, `φ = π / 2`. A swing whose rate falls to zero
   *   before the vertical cannot carry the partner over, so the throw is not
   *   produced.
   *
   * The phases' timing (kuzushi, tsukuri, kake) is not taken from a study of
   * seoi-nage: the instants are the mechanics' own, from the forces and the
   * bodies.
   */
  export import forceExchange = HumanForceExchangeLaw;

  /**
   * The judo grip preset: judo's grip (kumikata) for a throw, the right hand on
   * the partner's left collar and the left on the right sleeve, held two
   * seconds (provisional). Spread into `clinch`'s parameters beside the
   * partner; each value means what the clinch's member of the same name does.
   * The `judoGrip` row of `HumanPartner` fixes these values.
   */
  export const JUDO_GRIP: typeof HUMAN_GRAPPLE_JUDO_GRIP =
    HUMAN_GRAPPLE_JUDO_GRIP;

  /**
   * The throw of a pulled body whose base has broken: the swing over the
   * thrower's fulcrum, the release where the centre comes level with it and the
   * flight to the landing, for `HumanForceResponse`'s `thrown`.
   *
   * First pass: the body is rigid in the pose it had when its base broke,
   * through the swing and the flight; the swing's fulcrum is fixed at the
   * thrower's placed region at that instant.
   */
  export import forceThrow = HumanForceThrowLaw;

  /**
   * How far a torque through the arm bends a trunk that resists it: the share
   * of the trunk's side-bending range at which its stiffness holds the torque,
   * the share `HumanTrunkTurn.turned` takes.
   *
   * The trunk's lateral bending stiffness rises through its range; the pooled
   * values by quarter of the range are Watt, Callaway and Williams 2022 (Med
   * Biol Eng Comput 60(8):2133-2157, "In vivo through-range passive stiffness
   * of the lumbar spine: a meta-analysis", Table 6): 0.32, 0.83, 2.03 and 5.03
   * N m per degree. The moment a bend of share `s` holds is the stiffness
   * integrated over the angle, `R Σ k_q overlap(s, q)` with `R` the spine's and
   * the chest's side-bending range together; the share that holds a torque
   * solves that piecewise-linear equation, the whole range when the torque
   * passes what the range holds.
   *
   * The torque an arm wrestler's shoulder resists with is its internal rotation
   * strength, 0.65 N m per kilogram of body mass at its eccentric peak
   * (Tasiopoulos et al. 2018, "Isokinetic characteristics of amateur boxer
   * athletes", Front Physiol 9:1597, Table 2, the male non-athlete controls at
   * 60 degrees a second). It is provisional for women and for other speeds,
   * which that study did not measure.
   *
   * First pass: the stiffness is the passive trunk's, so the bend is the most a
   * relaxed trunk would give, not one braced by its muscles.
   */
  export import forceTrunk = HumanForceTrunkLaw;
}
