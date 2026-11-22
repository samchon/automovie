import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanExerciseKey } from "../exercise/IAutoMovieMotionHumanExerciseKey";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * The swimming strokes written as keyed postures on the water plane
 * (#3378): the breaststroke, the backstroke and floating on the back.
 *
 * There is no fluid, as in the crawl: the hip joints are kept half a chest's
 * depth under the plane the author declares and carried along at the
 * stroke's speed, and the body passes through the stroke's keys in joint
 * space, a cycle after a cycle. The breaststroke is prone and travels the
 * way the swimmer faced; the backstroke and the float are supine, the head
 * where the back of the standing body was, so the backstroke travels that
 * way, head first.
 *
 * - Breaststroke: glide (arms ahead, legs long), pull (the arms swept out
 *   and back to the shoulders' line with the head lifted to breathe),
 *   recovery (the hands under the chin, the heels drawn to the seat), kick
 *   (the arms shot ahead as the legs whip out and close). The order and the
 *   one breath a stroke are the stroke's rule (World Aquatics, Swimming
 *   Rules, the breaststroke: one arm stroke and one leg kick a cycle, in
 *   that order); the angles and the times are provisional.
 * - Backstroke: the arms alternate half a cycle apart, each recovering
 *   straight over the water and pulling out to the side and down to the
 *   hip, with one leg beat an arm (provisional; a six-beat kick is not
 *   written).
 * - Floating: one posture held, the arms and the legs a little apart.
 *
 * Events: `stroke{i}` at each cycle's start, and `relax`.
 *
 * First pass: no body roll in the backstroke, no undulation, no glide
 * speed that falls between kicks (the hips travel at a constant speed), no
 * start, turn or finish, and the mouth's clearance for the breaststroke's
 * breath is the key's head lift, not solved against the plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation keys: The keys of one cycle and the seconds to reach each. speed: The hips' speed, metres a second, along the way the stroke travels (provisional). body: Borrowed swimmer body measurements and constraints.
 * @evidence contracts/development/design.md#principled-representation keys: The keys of one cycle and the seconds to reach each. speed: The hips' speed, metres a second, along the way the stroke travels (provisional). body: Borrowed swimmer body measurements and constraints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/SwimStroke.ts (SwimStroke.strokes, return); sport/SwimStroke.ts (SwimStroke.plan, props); sport/SwimStroke.ts (SwimStroke.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanExerciseKey.IKey, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSwimStroke {
  /**
   * The strokes on a body (provisional angles, seconds and speeds). A keyed stroke's name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The strokes on a body (provisional angles, seconds and speeds). A keyed stroke's name.
   * @evidence contracts/development/design.md#principled-representation Closed choices "breaststroke", "backstroke", "float" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/SwimStroke.ts (SwimStroke.strokes, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in SwimStroke.strokes.
   */
  export type Name = "breaststroke" | "backstroke" | "float";

  /**
   * One stroke: its keys with the seconds taken to reach each from the one before, the first reached from the last, and its speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation keys: The keys of one cycle and the seconds to reach each. speed: The hips' speed, metres a second, along the way the stroke travels (provisional).
   * @evidence contracts/development/design.md#principled-representation keys: The keys of one cycle and the seconds to reach each. speed: The hips' speed, metres a second, along the way the stroke travels (provisional).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/SwimStroke.ts (SwimStroke.strokes, return); sport/SwimStroke.ts (SwimStroke.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanExerciseKey.IKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IStroke {
    /** The keys of one cycle and the seconds to reach each. */
    keys: readonly (readonly [IAutoMovieMotionHumanExerciseKey.IKey, number])[];

    /** The hips' speed, metres a second, along the way the stroke travels (provisional): 0.9 for the breaststroke, 1 for the backstroke, 0 for floating ({@link SwimStroke.strokes}); the front crawl glides at 1 m/s ({@link swim}). Skill does not change it. */
    speed: number;

    /** Whether the swimmer lies on the back and so travels head first, the way the back faced. */
    supine: boolean;
  }

  /**
   * Plan a keyed stroke using the body's entry, water height, cycle count and tempo. The hip target may be held for an external translation model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The named keys and tempo prescribe joint movement, while the water level and stationary choice set the moving or fixed hip target.
   * @evidence contracts/development/design.md#principled-representation The stationary flag holds the original staged hip target without supplying an alternative arbitrary speed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/SwimStroke.ts (SwimStroke.plan, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSwimStroke.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IPlanProps = {
    /** Borrowed swimmer body measurements and constraints. */
    body: IAutoMovieMotionHumanBody;
    /** Posture at the stroke sequence's entry. */
    entry: IAutoMovieMotionHumanPosture;
    /** Named swimming stroke whose arm and leg cycle is planned. */
    stroke: IAutoMovieMotionHumanSwimStroke.Name;
    /** Water-surface height on world +Y, metres. */
    water: number;
    /** Number of stroke cycles in the sequence. */
    cycles: number;
    /** Hold the hip target horizontally while using the same keyed motion. */
    stationary?: boolean;
    /** Dimensionless multiplier applied to every authored stroke-key duration. */
    tempo: number;
  };
}
