import { trampolineBounce as trampolineBounceLaw } from "../exercise/trampolineBounce";
import { HumanGymnastics as HumanGymnasticsSource } from "../lexicon/HumanGymnastics";
import { HumanRoman as HumanRomanLaw } from "../lexicon/HumanRoman";
import { HumanSkydive as HumanSkydiveLaw } from "../lexicon/HumanSkydive";
import { HumanTrick as HumanTrickLaw } from "../lexicon/HumanTrick";
import { GymnasticsFlight as GymnasticsFlightSource } from "../sport/GymnasticsFlight";
import { GymnasticsMat as GymnasticsMatSource } from "../sport/GymnasticsMat";
import { GymnasticsTakeoff as GymnasticsTakeoffSource } from "../sport/GymnasticsTakeoff";
import { GymnasticsWheel as GymnasticsWheelSource } from "../sport/GymnasticsWheel";
import { cartwheel as cartwheelLaw } from "../sport/cartwheel";
import { gymnastics as gymnasticsLaw } from "../sport/gymnastics";
import { handspring as handspringLaw } from "../sport/handspring";
import { roundOff as roundOffLaw } from "../sport/roundOff";
import { salto as saltoLaw } from "../sport/salto";
import { HUMAN_ACROBATICS_ROUND_OFF_LEFT } from "./presets/HUMAN_ACROBATICS_ROUND_OFF_LEFT";
import { HUMAN_ACROBATICS_ROUND_OFF_RIGHT } from "./presets/HUMAN_ACROBATICS_ROUND_OFF_RIGHT";

/**
 * Gymnastic and tumbling skills in flight: the salto, cartwheel, round-off,
 * handspring, trampoline and skydive, and the trick and Roman riding of a
 * performer on horses that move.
 *
 * `AutoMovieMotionHumanAcrobatics.ROUND_OFF_LEFT` and `ROUND_OFF_RIGHT`
 * (`IRoundOffPreset`) are the round-off led with one hand, data spread into
 * `roundOff`'s parameters; a preset adds no method.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `gymnastics`: A handstand kicked up from standing, held and stepped down.
 * - `salto`: A salto: a jump whose flight turns the whole body head over heels
 *   about its centre of mass, forward or backward, a whole number of times, and
 *   lands on the feet (the salti of floor gymnastics, a diver's and a
 *   free-runner's flip).
 * - `cartwheel`: A cartwheel: the body turns once about its front-to-back axis,
 *   sideways, passing from one foot to one hand, the other hand, and the other
 *   foot, and stands again a wheel's roll to the side.
 * - `roundOff`: A round-off: a cartwheel that travels along the way the body
 *   faced, turns half round about the vertical and lands on both feet at once,
 *   facing back where it came from, the entry to a back handspring or a back
 *   salto.
 * - `handspring`: A front handspring: from standing, the body reaches forward
 *   into a lunge, turns head over heels in pitch over its hands, leaves them
 *   and flies to its feet, landing arched and rising to stand.
 * - `trampoline`: Bouncing on a trampoline.
 * - `skydive`: A parachute jump: the exit, the arched freefall, the canopy
 *   steered by its toggles, the flare and the parachute landing fall or a
 *   stand-up landing (`planSkydive`).
 * - `trick`: Trick-riding figures (`IAutoMovieMotionHumanTrick`): each figure is
 *   a key posture in the seat contact's moving frame whose feet and hands are
 *   bound to the trick saddle's own straps, horn and handholds (or a pickup's
 *   prop) read where the carrier has them at each second; keys blend by a
 *   minimum-jerk share over each transfer and are carried by the seat contact.
 * - `roman`: Roman riding (`IAutoMovieMotionHumanRoman`): each foot planted on
 *   its own horse's moving seat, the root standing over their middle at the
 *   hip's height, facing their mean heading; the stand is reached from the
 *   entry over `step` by a minimum-jerk share.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `ROUND_OFF_LEFT`: The round-off led with the left hand: the left hand goes
 *   down first.
 * - `ROUND_OFF_RIGHT`: The round-off led with the right hand: the right hand goes
 *   down first.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanGymnastics`: The airborne acrobatics and jumps of gymnastics and
 *   athletics under their names, each a row of the law that plans it: a
 *   round-off and a handspring that roll over the hands, a handspring vault and
 *   a box vault over a prop's top, the Fosbury flop over a bar and a vault on a
 *   pole.
 * - `GymnasticsFlight`: The airborne kernel of the gymnastic and jumping laws: a
 *   body in flight is a set of joint angles, a heading and a tip, placed where
 *   its centre of mass lies on the drag-free parabola its take-off speed
 *   gives.
 * - `GymnasticsWheel`: The supported phase of a gymnastic turn: the body, a shape
 *   that changes with the angle of its turn, rolls over its spokes (a foot,
 *   both feet, a hand, both hands) as a wheel rolls without slipping, the
 *   lowest spoke bearing at every angle.
 * - `GymnasticsTakeoff`: A take-off at a chosen launch velocity: the jump's own
 *   push-off (`jump`), from the planted foot of the entry, aimed so the centre
 *   of mass leaves the floor at the velocity the law asks for.
 * - `GymnasticsMat`: Coming down lying on a landing surface after a jump over a
 *   bar: the high jump's and the pole vault's landing on the mat.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanAcrobatics} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanAcrobatics {
  /**
   * A handstand kicked up from standing, held and stepped down.
   *
   * The hands are placed on the floor a shoulder width apart, as far ahead of
   * the feet as the standing legs let the hips go with the trunk pitched 120
   * degrees over the hands (provisional). Over the first half of the entry the
   * body folds forward and the hands come down under the shoulders, which stand
   * the arms' reach above the wrists; over the second the trunk swings about
   * the shoulders, which stay where they are, and the legs follow straight
   * until the body stands inverted with the hips over the shoulders and the
   * shoulders over the base of the hands. The exit is the entry reversed: over
   * its first half the legs swing back down about the shoulders while the hands
   * still bear, until the feet stand where they left the floor, and over its
   * second the trunk unfolds over the feet. The entry and the exit take 1.5 s
   * each (provisional) and the hold is the author's. Balance in the hold is by
   * the wrists first (Kerwin and Trewartha 2001); no sway is drafted yet.
   *
   * Events: `handsDown` at the entry's middle, `inverted` (`ready`), `release`
   * at the exit's middle, when the feet bear again and the hands leave the
   * floor, with the phrase instants.
   *
   * Other laws plan the floor rolls, the cartwheel (`cartwheel`), the salto
   * (`salto`), the round-off (`roundOff`), the handspring (`handspring`) and
   * the vault (`vault`). Not drafted: bars and rings, which need swings about a
   * bar support.
   */
  export import gymnastics = gymnasticsLaw;

  /**
   * A salto: a jump whose flight turns the whole body head over heels about its
   * centre of mass, forward or backward, a whole number of times, and lands on
   * the feet (the salti of floor gymnastics, a diver's and a free-runner's
   * flip).
   *
   * A row of `jump`: the jump asked for `turns` somersaults its way, so the
   * performance's flight pass (`HumanPerformanceFlight`) turns the composed
   * body by the angular momentum that lands them, a tuck laid over the flight
   * turning it faster. A request the take-off cannot meet is the pass's
   * refusal.
   *
   * Events: the jump's (`takeoff`, `apex`, `touchdown`, `settled`).
   *
   * The take-off's largest momentum is the flight pass's physical ceiling, and
   * the search must meet its turns within that ceiling. `RATE`, the provisional
   * rate other gymnastics laws still read, is not read here.
   */
  export import salto = saltoLaw;

  /**
   * A cartwheel: the body turns once about its front-to-back axis, sideways,
   * passing from one foot to one hand, the other hand, and the other foot, and
   * stands again a wheel's roll to the side.
   *
   * The body is a wheel of four spokes: the arms raised wide overhead and the
   * legs straddled, held as one rigid shape while it turns. At every angle the
   * spoke that reaches lowest bears, the root's height puts that hand's wrist
   * or that foot's ankle at the height it has when it bears, and the root
   * travels so the bearing joint stays where it came down: a wheel rolling
   * without slipping on its spokes' ends. Nothing is integrated; the turn's
   * angle follows minimum-jerk progress over the cartwheel's seconds. The turn
   * is one axis, the roll, with no pitch and no change of heading.
   *
   * Events: `handsDown` (the first hand bears), `inverted` (half the turn),
   * `feetDown` (the first foot bears again).
   *
   * First pass: the body takes the wheel's shape over the first eighth of the
   * turn and leaves it over the last, while it already bears on a foot, so that
   * foot's joint is kept only as well as the changing shape allows; the hands
   * and the feet are carried by the rigid turn and are not laid flat by a solve
   * while carried, but each limb that bears is laid where it came down
   * (`GymnasticsWheelPlants`); no run-up, no lunge into the first hand and no
   * push off the second are shown. A round-off, a handspring and a vault are
   * not this law: they bend the body between their supports or fly between
   * them.
   */
  export import cartwheel = cartwheelLaw;

  /**
   * A round-off: a cartwheel that travels along the way the body faced, turns
   * half round about the vertical and lands on both feet at once, facing back
   * where it came from, the entry to a back handspring or a back salto.
   *
   * The body rolls as the cartwheel's wheel (`GymnasticsWheel`): the arms
   * raised wide and the legs straddled over the first `cartwheel.SHAPE`
   * degrees, the lowest spoke bearing at every angle. On the way to the hands
   * it turns a quarter about the vertical through what bears, so the wheel
   * rolls along the heading; past the handstand it turns the second quarter
   * about the bearing hand while the legs close, so both feet come down
   * together, knees bent to take the landing. The roll is one axis and each
   * quarter turn is another, about the vertical, and the two run at once while
   * a quarter is being made (over the wheel's first `ENTRY` degrees and over
   * `SNAP` degrees past the handstand): the posture's heading turns and its
   * roll grows in the same instant, composed as heading then roll, not solved
   * as one rotation about a moving axis (is a multi-axis case, not planned
   * here).
   *
   * The angle follows minimum-jerk progress over the seconds; nothing is
   * integrated, and no hurdle step, push off the second hand or flight before
   * the landing is shown, a first pass.
   *
   * Events: `handsDown` (the first hand bears), `inverted` (half the wheel),
   * `feetDown` (the feet bear again), `relax` (the end).
   */
  export import roundOff = roundOffLaw;

  /**
   * A front handspring: from standing, the body reaches forward into a lunge,
   * turns head over heels in pitch over its hands, leaves them and flies to its
   * feet, landing arched and rising to stand.
   *
   * Two phases, each turning about one axis, the body's left one:
   *
   * 1. Supported: the body rolls as a wheel (`GymnasticsWheel`) over its feet, its
   *    leading foot and its two hands, its shape going from standing to the
   *    lunge `lunged` by the angle `REACH` and from there to the arched line
   *    `arched` by `RELEASE`, where the hands leave. The angle grows with
   *    constant angular acceleration from rest, so it arrives at the release
   *    with the rate the flight keeps.
   * 2. Flight: the centre of mass follows the parabola of the velocity the wheel
   *    gave it at the release, and the arched body keeps turning at the
   *    release's rate, its kept angular momentum, until the centre comes down
   *    to the height it has standing arched at `LAND`. That rate is the one
   *    whose turn over that flight time brings the body from `RELEASE` to
   *    `LAND`, found by bisection, since the flight time itself grows with the
   *    rate the wheel throws the centre at.
   *
   * Landing, the feet are planted where they came down, the body absorbs and
   * rises to stand over the jump's `ABSORB` and `RISE` seconds while its tip
   * comes up from `LAND`, the arched landing of the skill, with the root
   * carrying the touchdown velocity out.
   *
   * A rate past the salto's bound (`salto.RATE`) is refused. With the hands on
   * a prop's `surface` the same law is the vault (`vault`).
   *
   * First pass: the body is rigid through the flight (no repulsion from the
   * shoulders, no change of shape), so its pitch rate and its centre's speed
   * are tied by the wheel's radius and the flight is longer and faster than a
   * gymnast's, who shortens the body and pushes off the hands; the hands and
   * feet are carried by the shape and not laid flat by a solve.
   *
   * Events: `handsDown`, `release` (the hands leave), `touchdown`, `settled`
   * and `relax`.
   */
  export import handspring = handspringLaw;

  /**
   * Bouncing on a trampoline.
   *
   * The bed is a non-linear spring, `F = K1 x + K3 x^3` (Jaques, The mechanics
   * of the contact phase in trampolining, 2008, finds the trampoline acts as
   * such a spring; `K1` and `K3` are provisional until that relation is read).
   * At each contact the bed deflects until it has taken the jumper's energy, `m
   * g (h + x) = K1 x^2 / 2 + K3 x^4 / 4` for a fall from `h` above the bed, and
   * returns it less a share (`KEEP` of the energy), the legs adding `PUSH`
   * metres of apex a contact. So the apexes build from a standing push toward
   * the authored apex and hold it; an apex beyond the height the push can
   * sustain, `PUSH / (1 - KEEP)`, is refused with it. The feet ride the bed
   * down and up on a quarter sine each way, matching the touchdown and take-off
   * speeds; the flights are ballistic between. At each apex the body takes the
   * asked shape and opens again by the landing; the arms swing up through the
   * flight. The last landing is killed: the bed absorbs it and the jumper
   * stands at rest.
   *
   * Not yet: the seat, front and back drops, salti between bounces, and the
   * bed's deflection published as an articulation for the renderer.
   *
   * Events: `takeoff{k}`, `apex{k}`, `touchdown{k}`, `relax`.
   */
  export import trampoline = trampolineBounceLaw;

  /**
   * A parachute jump: the exit, the arched freefall, the canopy steered by its
   * toggles, the flare and the parachute landing fall or a stand-up landing
   * (`planSkydive`). Register `HumanSkydive.skydive` to use it.
   */
  export import skydive = HumanSkydiveLaw;

  /**
   * Trick-riding figures (`IAutoMovieMotionHumanTrick`): each figure is a key
   * posture in the seat contact's moving frame whose feet and hands are bound
   * to the trick saddle's own straps, horn and handholds (or a pickup's prop)
   * read where the carrier has them at each second; keys blend by a
   * minimum-jerk share over each transfer and are carried by the seat contact.
   * Every attitude and offset is a provisional stage reading. Register
   * `HumanTrick` to use it.
   */
  export const trick: typeof HumanTrickLaw = HumanTrickLaw;

  /**
   * Roman riding (`IAutoMovieMotionHumanRoman`): each foot planted on its own
   * horse's moving seat, the root standing over their middle at the hip's
   * height, facing their mean heading; the stand is reached from the entry over
   * `step` by a minimum-jerk share. A stance the legs cannot span, wider than
   * both legs or narrower than the hips, is refused at any sampled second of
   * the hold. Register `HumanRoman` to use it.
   */
  export const roman: typeof HumanRomanLaw = HumanRomanLaw;

  /**
   * The airborne acrobatics and jumps of gymnastics and athletics under their
   * names, each a row of the law that plans it: a round-off and a handspring
   * that roll over the hands, a handspring vault and a box vault over a prop's
   * top, the Fosbury flop over a bar and a vault on a pole. The composition
   * gives what the law leaves open: the prop vaulted over, the bar's height and
   * the landing place, the pole the hand holds.
   *
   * The laws own the physics a row inherits: each phase turns the body about
   * one axis, flights are ballistic in the centre of mass with their times from
   * the take-off speed, and a turn in the air is its kept rate times the flight
   * time. The multi-axis case (a twisting salto, a round-off's overlapping
   * twist) is not planned.
   */
  export import HumanGymnastics = HumanGymnasticsSource;

  /**
   * The airborne kernel of the gymnastic and jumping laws: a body in flight is
   * a set of joint angles, a heading and a tip, placed where its centre of mass
   * lies on the drag-free parabola its take-off speed gives.
   *
   * A flight posture is written by its joints alone, with no limb goal, so
   * placing it by its centre moves only its root and the centre read from it is
   * the one the film shows; a posture a law wrote with limb goals is first
   * frozen into the joints its own resolution gives. A rigid turn carries
   * either kind, its world goals going round with its root.
   *
   * The physics is the drag-free projectile's closed form, as the jump's flight
   * uses it: the centre rises and falls under gravity alone, so a take-off's
   * vertical speed fixes the flight time to any height, and a body that keeps
   * its shape turns at the constant mean rate of its kept angular momentum, so
   * a turn's angle is that rate times the time. A turn about the centre of mass
   * leaves that point on its parabola.
   */
  export import GymnasticsFlight = GymnasticsFlightSource;

  /**
   * The supported phase of a gymnastic turn: the body, a shape that changes
   * with the angle of its turn, rolls over its spokes (a foot, both feet, a
   * hand, both hands) as a wheel rolls without slipping, the lowest spoke
   * bearing at every angle.
   *
   * The table is built once per plan, a row every few degrees: the shape at
   * that angle is posed at the origin, the spoke whose joints reach lowest
   * above their bearing height bears, the root's height sets that spoke at its
   * height and the root's place keeps it where it came down. When the bearing
   * spoke changes, both are down, and the new one takes its place from where
   * the old one holds the root, so the root is continuous. A spoke of two
   * joints (both feet, both hands) bears at their middle.
   *
   * This is the cartwheel's rolling rule for any shape, axis and set of spokes,
   * and the cartwheel, the round-off and the handspring all roll on it. Nothing
   * is integrated: how fast the angle grows is the law's.
   */
  export import GymnasticsWheel = GymnasticsWheelSource;

  /**
   * A take-off at a chosen launch velocity: the jump's own push-off (`jump`),
   * from the planted foot of the entry, aimed so the centre of mass leaves the
   * floor at the velocity the law asks for.
   *
   * The jump takes a landing place and an apex, not a velocity: its vertical
   * launch speed is `sqrt(2 g apex)`, and its horizontal one is the distance
   * from its take-off centre to its landing centre over its flight time. The
   * flight time depends only on the apex and the heights, so moving the landing
   * place by the velocity still missing times that time gives the asked
   * velocity on the next plan; the heading moves with the place, so the
   * correction is made three times. The jump's plan is used up to its
   * `takeoff`; what the body does in the air is the caller's.
   */
  export import GymnasticsTakeoff = GymnasticsTakeoffSource;

  /**
   * Coming down lying on a landing surface after a jump over a bar: the high
   * jump's and the pole vault's landing on the mat.
   *
   * From the touchdown, the body turns on to lie over `SETTLE` seconds: its tip
   * goes to the lying tip nearest the one it landed at, on the back or on the
   * front, as its turn in the air brought it, its joints to `lieDown`'s posture
   * for that side, and it keeps resting on the surface, the root's height
   * putting the lowest of its collision shapes on it at every instant. Its
   * centre carries the touchdown's horizontal velocity out over the same
   * seconds and stops. It then lies still.
   *
   * First pass: the surface does not give, so the fall's vertical speed stops
   * at the touchdown (a mat's give over a few tenths of a second is not shown);
   * the body slides on the surface as its centre slows.
   */
  export import GymnasticsMat = GymnasticsMatSource;

  /**
   * The round-off led with the left hand: the left hand goes down first. Spread
   * into `roundOff`'s parameters; the `roundOffLeft` row of `HumanGymnastics`
   * fixes this value.
   */
  export const ROUND_OFF_LEFT: typeof HUMAN_ACROBATICS_ROUND_OFF_LEFT =
    HUMAN_ACROBATICS_ROUND_OFF_LEFT;

  /**
   * The round-off led with the right hand: the right hand goes down first.
   * Spread into `roundOff`'s parameters; the `roundOffRight` row of
   * `HumanGymnastics` fixes this value.
   */
  export const ROUND_OFF_RIGHT: typeof HUMAN_ACROBATICS_ROUND_OFF_RIGHT =
    HUMAN_ACROBATICS_ROUND_OFF_RIGHT;
}
