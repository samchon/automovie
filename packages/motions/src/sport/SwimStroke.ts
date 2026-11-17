import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSwimStroke,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanFrame } from "../posture/HumanFrame";

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
 * @evidence contracts/development/common.md#meaningful-documentation States the model, each stroke's keys with the cited rule, the events and the first pass limits.
 * @evidence contracts/development/design.md#principled-representation A stroke is a cycle of keyed postures pinned by the hip joints on a travelling point, the form the workout's kinds have, so no stroke writes its own limb rows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The strokes' names, their table and the one planner the swim law calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The plane is the author's and the depth the body's; speeds are named provisional.
 */
export namespace SwimStroke {
  /** The hip joints, which the plane carries. */
  const HIPS: readonly AutoMovieHumanoidBone[] = [
    "leftUpperLeg",
    "rightUpperLeg",
  ];

  /** A backstroke key: one arm's shoulder flexion and abduction, the other's, and which leg is up. */
  const back = (
    body: IAutoMovieMotionHumanBody,
    right: readonly [number, number],
    left: readonly [number, number],
    kick: number,
  ): IAutoMovieMotionHumanExerciseKey.IKey =>
    ExerciseKey.from(
      body,
      { pitch: -90, neck: 10 },
      { ankle: -40, elbow: 5 },
      { shoulder: left[0], raise: left[1], hip: 10 * kick, knee: 10 },
      { shoulder: right[0], raise: right[1], hip: -10 * kick, knee: 10 },
    );

  /**
   * The strokes on a body (provisional angles, seconds and speeds).
   *
   * @param body The body.
   * @returns Each stroke.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and that the values are provisional.
   * @evidence contracts/development/implementation.md#principled-implementation Exercise keys on the body (`ExerciseKey.from`), so what a key leaves unstated is the body's own standing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ExerciseKey.from`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function strokes(
    body: IAutoMovieMotionHumanBody,
  ): Readonly<
    Record<
      IAutoMovieMotionHumanSwimStroke.Name,
      IAutoMovieMotionHumanSwimStroke.IStroke
    >
  > {
    return {
      breaststroke: {
        supine: false,
        speed: 0.9,
        keys: [
          [
            ExerciseKey.from(
              body,
              { pitch: 90, neck: -10 },
              { ankle: -40, shoulder: 175, raise: 0, elbow: 3 },
            ),
            0.4,
          ],
          [
            ExerciseKey.from(
              body,
              { pitch: 82, neck: -35 },
              { ankle: -40, shoulder: 95, raise: 70, elbow: 70 },
            ),
            0.35,
          ],
          [
            ExerciseKey.from(
              body,
              { pitch: 84, neck: -25 },
              {
                hip: 45,
                spread: 20,
                knee: 115,
                ankle: 15,
                shoulder: 60,
                raise: 10,
                elbow: 140,
              },
            ),
            0.3,
          ],
          [
            ExerciseKey.from(
              body,
              { pitch: 90, neck: -10 },
              {
                hip: 15,
                spread: 30,
                knee: 30,
                ankle: 10,
                shoulder: 165,
                raise: 0,
                elbow: 10,
              },
            ),
            0.3,
          ],
        ],
      },
      backstroke: {
        supine: true,
        speed: 1,
        keys: [
          [back(body, [178, 5], [0, 5], 1), 0.35],
          [back(body, [20, 85], [90, 5], -1), 0.35],
          [back(body, [0, 5], [178, 5], 1), 0.35],
          [back(body, [90, 5], [20, 85], -1), 0.35],
        ],
      },
      float: {
        supine: true,
        speed: 0,
        keys: [
          [
            ExerciseKey.from(
              body,
              { pitch: -90, neck: 5 },
              { spread: 15, ankle: -30, raise: 70, elbow: 10 },
            ),
            2,
          ],
        ],
      },
    };
  }

  /**
   * Plan a keyed stroke.
   *
   * @param props The body, the entry posture, the stroke, the plane's height, the cycles and the tempo factor.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The second gives the cycle and the place in it; the two keys around that place are blended in joint space on minimum-jerk progress and pinned by the hip joints on the point the plane carries along.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The cycle's times, the travelling point, the posture, the events.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The staged speed is constant; stationary input pins the hips for a caller that owns translation. A stroke of one key is held.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the exercise keys' blend and pin.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the stroke's table row.
   */
  export function plan(
    props: IAutoMovieMotionHumanSwimStroke.IPlanProps,
  ): IAutoMovieMotionHumanActionPlan {
    const stroke: IAutoMovieMotionHumanSwimStroke.IStroke = strokes(props.body)[
      props.stroke
    ];
    const spans: readonly number[] = stroke.keys.map(
      ([, seconds]: readonly [
        IAutoMovieMotionHumanExerciseKey.IKey,
        number,
      ]): number => seconds * props.tempo,
    );
    const period: number = spans.reduce(
      (sum: number, seconds: number): number => sum + seconds,
      0,
    );
    const duration: number = props.cycles * period;
    const along: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: props.entry.yaw },
      { x: 0, y: 0, z: stroke.supine ? -1 : 1 },
    );
    const speed: number = props.stationary === true ? 0 : stroke.speed;
    const depth: number = props.body.measure.chestDepth / 2;
    const events: IAutoMovieMotionEvent[] = [
      ...Array.from(
        { length: props.cycles },
        (_: unknown, i: number): IAutoMovieMotionEvent => ({
          name: `stroke${i + 1}`,
          share: (i * period) / duration,
        }),
      ),
      { name: "relax", share: 1 },
    ];
    return {
      duration,
      events,
      contacts: [],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        let within: number = t - Math.floor(t / period) * period;
        if (t >= duration) within = 0;

        // The key being reached and how far: key 0 is reached last.
        let index: number = 1 % stroke.keys.length;
        for (let k: number = 1; k <= stroke.keys.length; k++) {
          index = k % stroke.keys.length;
          const span: number = spans[index]!;
          if (within <= span || k === stroke.keys.length) {
            within = span > 0 ? Math.min(1, within / span) : 1;
            break;
          }
          within -= span;
        }
        const u: number = minimumJerk(within).s;
        const from: IAutoMovieMotionHumanExerciseKey.IKey =
          stroke.keys[
            (index + stroke.keys.length - 1) % stroke.keys.length
          ]![0];
        return ExerciseKey.pinned(
          props.body,
          ExerciseKey.blend(from, stroke.keys[index]![0], u),
          props.entry.yaw,
          HIPS,
          {
            x: props.entry.root.x + along.x * speed * t,
            y: props.water - depth,
            z: props.entry.root.z + along.z * speed * t,
          },
        );
      },
    };
  }
}
