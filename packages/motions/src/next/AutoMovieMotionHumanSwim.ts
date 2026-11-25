import { HumanFloatBeside as HumanFloatBesideSource } from "../lexicon/HumanFloatBeside";
import { AquaticDistress as AquaticDistressSource } from "../sport/AquaticDistress";
import { SwimStroke as SwimStrokeSource } from "../sport/SwimStroke";
import { aquatic as aquaticLaw } from "../sport/aquatic";
import { swim as swimLaw } from "../sport/swim";
import { swimImmersed as swimImmersedLaw } from "../sport/swimImmersed";

/**
 * Moving and floating in water: the strokes, the immersed float and glide, and
 * the aquatic actions. The crawl cycle is 1.4 s at a 1 m/s glide (provisional);
 * the breaststroke glides at 0.9 m/s, the backstroke at 1 m/s and floating at 0
 * (`SwimStroke.strokes`); skill does not change the glide.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `swim`: Swimming on a declared water plane: treading water and the front
 *   crawl.
 * - `aquatic`: Sequences in a pool or on a small craft.
 * - `swimImmersed`: Register this immersed action with `HumanChain.extend` and
 *   `HumanPerformance`'s `laws`.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `SwimStroke`: The swimming strokes written as keyed postures on the water
 *   plane: the breaststroke, the backstroke and floating on the back.
 * - `AquaticDistress`: The instinctive drowning response (Pia 1974, as summarised
 *   by Vittone and Pia, "It Doesn't Look Like They're Drowning", US Coast Guard
 *   On Scene, Fall 2006): upright in the water, head tilted back with the mouth
 *   at the surface, the arms extended to the sides pressing down on the water,
 *   and no supportive kick.
 * - `HumanFloatBeside`: Slide off a swimming horse to its upstream side and float
 *   beside it, one hand on its mane.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanSwim} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanSwim {
  /**
   * Swimming on a declared water plane: treading water and the front crawl.
   * There is no fluid: the root floats at the plane, a height the author
   * declares, and the limbs cycle by joint angles with their goals released, as
   * a swing arm does (`AutoMovieMotionHumanArm.swing`).
   *
   * - Treading water: upright with the mouth 5 cm above the plane (provisional),
   *   the hands sculling out and in at waist depth and the legs kicking
   *   alternately (a flutter standing in for the eggbeater, whose foot speed
   *   sets the height, Sanders 1999), one cycle a second (provisional).
   * - Front crawl: prone with the hips a chest's half depth under the plane, or
   *   as much higher as the breath needs, gliding ahead at 1 m/s (provisional).
   *   The body rolls 45 degrees (provisional) about its long axis toward each
   *   arm as it recovers, a whole-body rotation about the hips
   *   (`HumanPosture.rotation`) so the pelvis keeps the stroke's own joints.
   *   The shoulder turns one way round: its abduction runs from 180 degrees
   *   overhead to 0 at the hip and back, in front of the trunk for the pull (45
   *   degrees of flexion at its middle, the elbow bent 40) and behind it for
   *   the recovery (20 degrees of extension, the elbow bent 90 and the forearm
   *   turned 45 degrees toward the head, so the hand hangs under the elbow
   *   clear of the plane; all provisional). Each arm pulls from overhead to the
   *   hip over 60 % of the cycle and recovers over the water, elbow high, in
   *   the rest (provisional shares). The arms are apart by the propulsive share
   *   less the index of coordination, which runs from a novice's catch-up to an
   *   elite's near-opposition with the `sequencing` skill (Chollet et al. 2000
   *   as the research reads them; `PROPULSIVE`, `COORDINATION`). Six kicks per
   *   cycle (provisional) and a breath to the right once a cycle, the head
   *   turned 70 degrees (provisional) on the rolled trunk as the right arm
   *   recovers, which brings the mouth 2 cm (provisional) over the plane: there
   *   is no bow wave whose trough a real swimmer breathes in, so the body
   *   floats as high as its own mouth needs. One cycle lasts 1.4 s
   *   (provisional).
   *
   * Events: `entryRight{i}`, `entryLeft{i}` and `breath{i}` per cycle for the
   * crawl, `cycle{i}` for treading.
   *
   * The breaststroke, the backstroke and floating are keyed strokes
   * (`SwimStroke`), planned by their own table on the same plane.
   *
   * Not drafted: the eggbeater proper, entering and leaving the water.
   */
  export import swim = swimLaw;

  /**
   * Sequences in a pool or on a small craft. The planner owns the actor's
   * clock; every moving hull or grip is sampled from the performance at that
   * same second.
   */
  export import aquatic = aquaticLaw;

  /**
   * Register this immersed action with `HumanChain.extend` and
   * `HumanPerformance`'s `laws`. The passive case holds the existing supine
   * key. The opt-in breaststroke uses the existing prone keys and starts at
   * rest. Both start in the water at their first shape's buoyant trim.
   *
   * Nakashima, Satou and Miura (2007), section 2, uses posed segments for
   * buoyancy and drag. Here the shape is held and the water is still, so the
   * engine's quasi-steady segment model reduces to a constant quadratic drag
   * coefficient over the span. Integrating `dv/dt = -k v²` gives `distance =
   * log(1 + k v0 t) / k`. The breaststroke instead integrates the heading
   * component of drag at every moving segment. Its trim and heading are
   * prescribed. The sphere approximation gives quasi-steady isotropic drag and
   * omits added mass, free heave, rotation and water entry.
   *
   * @see https://doi.org/10.1299/jfst.2.56
   */
  export const swimImmersed: typeof swimImmersedLaw = swimImmersedLaw;

  /**
   * The swimming strokes written as keyed postures on the water plane : the
   * breaststroke, the backstroke and floating on the back.
   *
   * There is no fluid, as in the crawl: the hip joints are kept half a chest's
   * depth under the plane the author declares and carried along at the stroke's
   * speed, and the body passes through the stroke's keys in joint space, a
   * cycle after a cycle. The breaststroke is prone and travels the way the
   * swimmer faced; the backstroke and the float are supine, the head where the
   * back of the standing body was, so the backstroke travels that way, head
   * first.
   *
   * - Breaststroke: glide (arms ahead, legs long), pull (the arms swept out and
   *   back to the shoulders' line with the head lifted to breathe), recovery
   *   (the hands under the chin, the heels drawn to the seat), kick (the arms
   *   shot ahead as the legs whip out and close). The order and the one breath
   *   a stroke are the stroke's rule (World Aquatics, Swimming Rules, the
   *   breaststroke: one arm stroke and one leg kick a cycle, in that order);
   *   the angles and the times are provisional.
   * - Backstroke: the arms alternate half a cycle apart, each recovering straight
   *   over the water and pulling out to the side and down to the hip, with one
   *   leg beat an arm (provisional; a six-beat kick is not written).
   * - Floating: one posture held, the arms and the legs a little apart.
   *
   * Events: `stroke{i}` at each cycle's start, and `relax`.
   *
   * First pass: no body roll in the backstroke, no undulation, no glide speed
   * that falls between kicks (the hips travel at a constant speed), no start,
   * turn or finish, and the mouth's clearance for the breaststroke's breath is
   * the key's head lift, not solved against the plane.
   */
  export import SwimStroke = SwimStrokeSource;

  /**
   * The instinctive drowning response (Pia 1974, as summarised by Vittone and
   * Pia, "It Doesn't Look Like They're Drowning", US Coast Guard On Scene, Fall
   * 2006): upright in the water, head tilted back with the mouth at the
   * surface, the arms extended to the sides pressing down on the water, and no
   * supportive kick. The mouth bobs within `BAND` of the surface, going under
   * at each press's low, for the authored seconds; then the head goes under
   * (`submerge`, `under`). The root stays where the swimmer entered.
   */
  export import AquaticDistress = AquaticDistressSource;

  /**
   * Slide off a swimming horse to its upstream side and float beside it, one
   * hand on its mane.
   *
   * A rider crossing water too deep for the horse to wade slides off on the
   * upstream side, keeps hold of the mane and floats prone beside the horse,
   * kicking, while it swims; the current then presses the rider against the
   * horse rather than under it. The float's height is the water's own trim of
   * the posed shape (`HumanWater.float`, the immersed swim's buoyancy), raised
   * until the mouth clears the surface by `CLEAR` where buoyancy alone leaves
   * it under: the held mane carries the rest. The near shoulder keeps
   * `REACH_SHARE` of the arm's length from the held part, `TRAIL` degrees
   * behind its lateral line, so the body follows the horse's actual moving
   * mane; the slide-off blends the seated entry, carried with the horse, into
   * that float over `transition`, its path lifted by `ARC` over the saddle's
   * side.
   *
   * The author gives the total `seconds` and the `transition` into the float; a
   * flutter kick cycle is provisional (missing a measured swimmer's kick
   * rate).
   */
  export const HumanFloatBeside: typeof HumanFloatBesideSource =
    HumanFloatBesideSource;
}
