import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSwimStroke,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * The swimming strokes written as keyed postures on the water plane : the
 * breaststroke, the backstroke and floating on the back.
 *
 * The hip joints travel half a chest's depth under the declared plane through
 * the stroke's joint-space keys. Surface backstroke and floating use a
 * shallower pin when the mouth needs air. Breaststroke travels face down.
 * Backstroke travels head first with the face up (U.S. Masters Swimming,
 * Backstroke Body Position and Rotation,
 * https://www.usms.org/fitness-and-training/guides/backstroke/body-position).
 *
 * - Breaststroke: glide (arms ahead, legs long), pull (the arms swept out and
 *   back to the shoulders' line with the head lifted to breathe), recovery (the
 *   hands under the chin, the heels drawn to the seat), kick (the arms shot
 *   ahead as the legs whip out and close). The order and the one breath a
 *   stroke are the stroke's rule (World Aquatics, Swimming Rules, the
 *   breaststroke: one arm stroke and one leg kick a cycle, in that order); the
 *   angles and the times are provisional.
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
export namespace SwimStroke {
  /*
   * The hip joints, which the plane carries.
   */
  const HIPS: readonly AutoMovieHumanoidBone[] = [
    "leftUpperLeg",
    "rightUpperLeg",
  ];
  /*
   * The pin mean reads only the two hip origins after full canonical admission.
   */
  const HIP_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set(HIPS);

  /*
   * A backstroke key: one arm's shoulder flexion and abduction, the other's,
   * and which leg is up.
   */
  function back(
    body: IAutoMovieMotionHumanBody,
    right: readonly [number, number],
    left: readonly [number, number],
    kick: number,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    return ExerciseKey.from(
      body,
      { pitch: -90, neck: 10 },
      { ankle: -40, elbow: 5 },
      { shoulder: left[0], raise: left[1], hip: 10 * kick, knee: 10 },
      { shoulder: right[0], raise: right[1], hip: -10 * kick, knee: 10 },
    );
  }

  /*
   * The strokes on a body (provisional angles, seconds and speeds).
   * Parameter body: The body.
   * Returns: Each stroke.
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
      breaststroke: keyed(body, "breaststroke"),
      backstroke: keyed(body, "backstroke"),
      float: keyed(body, "float"),
    };
  }

  /*
   * Build only the selected stroke's keys; the public table requests each row
   * explicitly.
   */
  function keyed(
    body: IAutoMovieMotionHumanBody,
    name: IAutoMovieMotionHumanSwimStroke.Name,
  ): IAutoMovieMotionHumanSwimStroke.IStroke {
    if (name === "breaststroke")
      return {
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
    if (name === "backstroke")
      return {
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

  /*
   * Plan a keyed stroke.
   * Parameter props: The body, entry posture, stroke, water height, cycles and
   * tempo.
   * Parameter supineClearance: Minimum mouth height above the plane in metres for a
   * surface backstroke or float. Absent when a buoyancy model places the
   * body.
   * Returns: The plan.
   */
  export function plan(
    props: IAutoMovieMotionHumanSwimStroke.IPlanProps,
    supineClearance?: number,
  ): IAutoMovieMotionHumanActionPlan {
    const stroke: IAutoMovieMotionHumanSwimStroke.IStroke = keyed(
      props.body,
      props.stroke,
    );
    const spans: readonly number[] = stroke.keys.map(
      ([, seconds]: readonly [
        IAutoMovieMotionHumanExerciseKey.IKey,
        number,
      ]): number => seconds * props.tempo,
    );
    const blends: ((share: number) => IAutoMovieMotionHumanExerciseKey.IKey)[] =
      stroke.keys.map(
        (
          [to]: readonly [IAutoMovieMotionHumanExerciseKey.IKey, number],
          i: number,
        ): ((share: number) => IAutoMovieMotionHumanExerciseKey.IKey) =>
          ExerciseKey.prepareBlend(
            stroke.keys[(i + stroke.keys.length - 1) % stroke.keys.length]![0],
            to,
          ),
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
    const usualDepth: number = props.body.measure.chestDepth / 2;
    let depth: number = usualDepth;
    if (stroke.supine && supineClearance !== undefined) {
      // Head and hip heights relative to the pin stay fixed across these keys.
      const level: IAutoMovieMotionHumanPosture = ExerciseKey.pinned(
        props.body,
        stroke.keys[0]![0],
        props.entry.yaw,
        HIPS,
        { x: 0, y: 0, z: 0 },
        HIP_BONES,
      );
      const mouth: number = HumanTrunk.region(props.body, level, "mouth").point
        .y;
      depth = Math.min(usualDepth, mouth - supineClearance);
    }

    // The stroke's tempo stretches its keys, so it stretches the glide the
    // keys drive as well: the hips cover a cycle's distance in its time, as
    // the crawl's do (`swim`).
    const speed: number =
      props.stationary === true ? 0 : stroke.speed / props.tempo;
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
    /*
     * The actual time determines both the cyclic shape and the moving pin.
     */
    const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
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
      const u: number = AutoMovieEngineMotionSampling.minimumJerkShare(within);
      return ExerciseKey.pinned(
        props.body,
        blends[index]!(u),
        props.entry.yaw,
        HIPS,
        {
          x: props.entry.root.x + along.x * speed * t,
          y: props.water - depth,
          z: props.entry.root.z + along.z * speed * t,
        },
        HIP_BONES,
        resolution,
        projection,
      );
    };
    const result: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts: [],
      posture,
    };

    // Cycle selection uses the exact local second, including the final return
    // to the first key. Playback retains the one period already owned here.
    HumanPreparedPlayback.attach(result, props.body, {
      mode: "posture",
      phases: [
        {
          from: 0,
          to: duration,
          sample: (
            ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
          ): IAutoMovieMotionHumanPlayback.ISample => ({
            posture: posture(...args),
          }),
        },
      ],
    });
    return result;
  }
}
