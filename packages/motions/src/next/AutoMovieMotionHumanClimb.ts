import { climbLadder as climbLadderLaw } from "../climbing/climbLadder";
import { wallClimbSupport as wallClimbSupportLaw } from "../climbing/wallClimbSupport";
import { HumanRope as HumanRopeLaw } from "../lexicon/HumanRope";
import { HumanTreeClimb as HumanTreeClimbLaw } from "../lexicon/HumanTreeClimb";
import { climbStairs as climbStairsLaw } from "../terrain/climbStairs";

/**
 * Climbing with the support law: the ladder, the stairs, the rope, the tree and
 * a wall on fixed holds. One limb at a time takes the body's weight; a beat is
 * 0.8 s on a ladder and 0.6 s on a rope or tree (provisional).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `climbLadder`: Climbing a vertical fixed ladder from the floor before it, in
 *   the four-beat ipsilateral pattern: right hand, right foot, left hand, left
 *   foot, one limb moving at a time, so three limbs always hold the ladder
 *   (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
 * - `climbStairs`: Climbing a flight of stairs up or down from standing before
 *   its first nosing, step over step (one foot per tread) or step by step (both
 *   feet on each tread), ending with both feet on the last tread.
 * - `rope`: Crossings on an anchored rope: a hand-over-hand climb with a foot
 *   lock, a rappel or fast-rope descent, a hanging or monkey-crawl traverse and
 *   a swing to a named landing (`planRope`).
 * - `treeClimb`: Climbing a tree by its lower branches, sitting astride one and
 *   climbing down or dropping from the lowest (`planTreeClimb`).
 * - `wallClimbSupport`: Build the stances for `HumanChain.support` from a route
 *   on fixed wall holds.
 *
 * Use the matching input from `@automovie/interface`:
 * `IAutoMovieMotionHumanClimbLadder.IParams`,
 * `IAutoMovieMotionHumanClimbStairs.IParams`,
 * `IAutoMovieMotionHumanRope.IParams`,
 * `IAutoMovieMotionHumanTreeClimb.IParams`, or
 * `IAutoMovieMotionHumanWallClimb`.
 */
export namespace AutoMovieMotionHumanClimb {
  /**
   * Climbing a vertical fixed ladder from the floor before it, in the four-beat
   * ipsilateral pattern: right hand, right foot, left hand, left foot, one limb
   * moving at a time, so three limbs always hold the ladder (Jensen and Holland
   * 2020, Int J Environ Res Public Health 17:2897).
   *
   * The goals are rungs: the ladder is a prop of the scene, a fixture
   * (`IHumanProp.fixed`) that the hands grip and never carry, and its rungs are
   * its own `rung1` upward (`createLadder`'s affordances), read where the
   * ladder stands at the action's start. The rungs' spacing must lie in OSHA
   * 1910.23(b)(2)'s 25 to 36 cm and their line be upright; the climber stands
   * before the ladder, facing it within `FACING` degrees, the toes within
   * `NEAR` of the rungs and between the rails. A ladder that is no fixture,
   * leans, has too few rungs above the hands, or one the climber stands away
   * from, is refused. Each foot stands with its ball on a rung's top, and each
   * hand grips a rung (Jensen and Holland found rungs used in 59 of 80 tasks)
   * at the rung nearest half an upper arm below the shoulder's height above the
   * feet (`GRIP_DROP`, provisional). Each foot's rungs take the settled
   * stance's heading, while the feet leave the floor from where the entry put
   * them. First both hands reach their rungs, then every beat moves one limb up
   * one rung: a foot on a minimum-jerk arc that clears the rung below by
   * `CLEARANCE`, a hand on a minimum-jerk path. The pelvis stays `BACK` leg
   * lengths behind the rungs and rises with the feet, lowered wherever a
   * planted leg could not reach. Each beat takes `BEAT` seconds (provisional),
   * scaled by the manner's tempo. Events: `handsOn`, then per beat
   * `<limb>Release<n>` and `<limb>Contact<n>`, the limb one of `rightHand`,
   * `rightFoot`, `leftHand`, `leftFoot`.
   *
   * A named `landing` hands the whole floor-to-landing route, up or down, to
   * `planLadderAccess`, which stages it over the shared support law.
   *
   * Not yet: the two-beat patterns, and hanging, traversing, mantling and
   * vaulting (not yet staged).
   */
  export import climbLadder = climbLadderLaw;

  /**
   * Climbing a flight of stairs up or down from standing before its first
   * nosing, step over step (one foot per tread) or step by step (both feet on
   * each tread), ending with both feet on the last tread.
   *
   * The flight lies ahead along the heading: its first nosing `start` metres
   * ahead of the toes, `count` treads of `riser` and `tread` metres, rising for
   * `up` and falling below the floor for `down`. The goals are footprints: each
   * foot lands with the middle of its sole on the middle of its tread, at its
   * standing lateral place; a sole too long to keep `EDGE` from both edges
   * there hangs its heel over the nosing ascending and its toes over the next
   * one descending, as a long foot stands on a short tread, and on the landing
   * stands `EDGE` past the last nosing. A swinging foot takes the shortest path
   * over the flight that keeps every point of its sole above the surface under
   * it and `CLEARANCE` above each edge it passes
   * (`AutoMovieMotionHumanClearance`): ascending it lifts beside the riser and
   * follows the line of the nosings, descending it moves forward and lowers
   * once its heel is past the nosing; it lifts over the floor's contact height
   * before it travels along the flight. The pelvis moves between the stances on
   * minimum-jerk progress over the middle of the two feet, half a step behind
   * them over the floor (`climbStairsPelvis`). Its height at a stance is the
   * highest from which both legs reach their feet, so the lower foot's leg is
   * straight and the upper one's bent; it changes while a foot swings and holds
   * in double support, and is lowered wherever either leg, planted or swinging,
   * could not reach its foot.
   *
   * The trunk inclines forward by `ASCENT_LEAN` going up and by a walk's
   * inclination going down, shared between the pelvis and the spine by the
   * lumbopelvic rhythm and tipped about the hips, since the trunk flexes
   * forward more in stair ascent than in level walking (McFadyen and Winter
   * 1988, J Biomech 21:733).
   *
   * The cadence is 90 steps a minute (Mian, Narici, Minetti and Baltzopoulos
   * 2007, Gait Posture 26:463), scaled by the square root of the hip height
   * (Alexander 1984) and by the manner's tempo; each swing takes 0.8 of a step
   * and the double support the rest (provisional). Risers from 100 to 180 mm
   * and treads from 280 mm are the 2010 ADA ranges (504.2), the defaults 170
   * and 280 mm; a riser above 0.35 of the hip height or a tread shorter than
   * 0.6 of the foot is refused with the body's feasible range (provisional
   * limits). Events: `toeOff<n>` and `treadContact<n>` per step, numbered from
   *
   * 1. A foot on a tread bears on the prop `on` names, or on the fixed floor frame
   *    when no prop is named; a foot on the floor before the flight bears on
   *    the ground. The treads repeat the settled stance's flat feet, while the
   *    feet leave the floor from where the entry put them.
   *
   * An optional handrail names the gripping hand and a bar on the fixed stair
   * prop. The grip bears along that axis, then releases before the final
   * stance. A following walk can turn on the landing.
   */
  export import climbStairs = climbStairsLaw;

  /**
   * Crossings on an anchored rope: a hand-over-hand climb with a foot lock, a
   * rappel or fast-rope descent, a hanging or monkey-crawl traverse and a swing
   * to a named landing (`planRope`). Register `HumanRope.rope` to use it.
   */
  export import rope = HumanRopeLaw;

  /**
   * Climbing a tree by its lower branches, sitting astride one and climbing
   * down or dropping from the lowest (`planTreeClimb`). Register
   * `HumanTreeClimb.climbTree` to use it.
   */
  export import treeClimb = HumanTreeClimbLaw;

  /**
   * Build the stances for `HumanChain.support` from a route on fixed wall
   * holds. Each stance owns at least three distinct holds. Releasing one foot
   * before the other takes its hold stages a swap without sharing a contact
   * point. Hand targets locate the grip socket and foot targets locate the
   * toes. Quaine and Martin measured the change from four contacts to three in
   * _A biomechanical study of equilibrium in sport rock climbing_ (1999, DOI
   * 10.1016/S0966-6362(99)00024-7). The support planner owns contact placement,
   * timing and reach refusals. Finger closure and wall contact forces are
   * outside the point fit.
   *
   * @param route The starting holds and the ordered one-limb changes.
   * @returns The support parameters for the route.
   * @throws {HumanRefusal} If two limbs claim one hold or an explicit release
   *   would leave fewer than three assignments.
   */
  export const wallClimbSupport: typeof wallClimbSupportLaw =
    wallClimbSupportLaw;
}
