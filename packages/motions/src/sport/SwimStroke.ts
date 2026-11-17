import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { ExerciseKey } from "../exercise/ExerciseKey";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

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
  /** A keyed stroke's name. */
  export type Name = "breaststroke" | "backstroke" | "float";

  /** One stroke: its keys with the seconds taken to reach each from the one before, the first reached from the last, and its speed. */
  export interface IStroke {
    /** The keys of one cycle and the seconds to reach each. */
    keys: readonly (readonly [ExerciseKey.IKey, number])[];

    /** The hips' speed, metres a second, along the way the stroke travels (provisional). */
    speed: number;

    /** Whether the swimmer lies on the back and so travels head first, the way the back faced. */
    supine: boolean;
  }

  /** The hip joints, which the plane carries. */
  const HIPS: readonly AutoMovieHumanoidBone[] = [
    "leftUpperLeg",
    "rightUpperLeg",
  ];
  /** The pin mean reads only the two hip origins after full canonical admission. */
  const HIP_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set(HIPS);

  /** A backstroke key: one arm's shoulder flexion and abduction, the other's, and which leg is up. */
  function back(
    body: IHumanBody,
    right: readonly [number, number],
    left: readonly [number, number],
    kick: number,
  ): ExerciseKey.IKey {
    return ExerciseKey.from(
      body,
      { pitch: -90, neck: 10 },
      { ankle: -40, elbow: 5 },
      { shoulder: left[0], raise: left[1], hip: 10 * kick, knee: 10 },
      { shoulder: right[0], raise: right[1], hip: -10 * kick, knee: 10 },
    );
  }

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
  export function strokes(body: IHumanBody): Readonly<Record<Name, IStroke>> {
    return {
      breaststroke: keyed(body, "breaststroke"),
      backstroke: keyed(body, "backstroke"),
      float: keyed(body, "float"),
    };
  }

  /** Build only the selected stroke's keys; the public table requests each row explicitly. */
  function keyed(body: IHumanBody, name: Name): IStroke {
    if (name === "breaststroke") return {
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
      };
    if (name === "backstroke") return {
        supine: true,
        speed: 1,
        keys: [
          [back(body, [178, 5], [0, 5], 1), 0.35],
          [back(body, [20, 85], [90, 5], -1), 0.35],
          [back(body, [0, 5], [178, 5], 1), 0.35],
          [back(body, [90, 5], [20, 85], -1), 0.35],
        ],
      };
    return {
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
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The speed is constant, stated on the namespace; a stroke of one key is held.
   * @evidence contracts/development/implementation.md#efficient-algorithms Every stroke read, including a stationary single key, performs actual canonical admission and pin FK with only the pin hips' ancestry requested. Fixed key-pair union preparation retains the original interpolation and pin mean.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only fixed key pairs and ordered joint unions are shared; every actual query constructs and pins its current key instead of replaying a completed posture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its selected stroke row and fixed key-pair readers until released, without storing a completed pinned posture or queried-time cache.
   */
  export function plan(props: {
    body: IHumanBody;
    entry: IHumanPosture;
    stroke: Name;
    water: number;
    cycles: number;
    tempo: number;
  }): IHumanActionPlan {
    const stroke: IStroke = keyed(props.body, props.stroke);
    const spans: readonly number[] = stroke.keys.map(
      ([, seconds]: readonly [ExerciseKey.IKey, number]): number =>
        seconds * props.tempo,
    );
    const blends: ((share: number) => ExerciseKey.IKey)[] = stroke.keys.map(
      ([to]: readonly [ExerciseKey.IKey, number], i: number): (share: number) => ExerciseKey.IKey =>
        ExerciseKey.prepareBlend(stroke.keys[(i + stroke.keys.length - 1) % stroke.keys.length]![0], to),
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
      posture: (seconds: number, _channels?: Parameters<IHumanActionPlan["posture"]>[1], resolution?: Parameters<IHumanActionPlan["posture"]>[2], projection?: Parameters<IHumanActionPlan["posture"]>[3]): IHumanPosture => {
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
        const u: number = minimumJerk.share(within);
        return ExerciseKey.pinned(
          props.body,
          blends[index]!(u),
          props.entry.yaw,
          HIPS,
          {
            x: props.entry.root.x + along.x * stroke.speed * t,
            y: props.water - depth,
            z: props.entry.root.z + along.z * stroke.speed * t,
          },
          HIP_BONES,
          resolution,
          projection,
        );
      },
    };
  }
}
