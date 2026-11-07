import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { Blocking } from "../defense/Blocking";
import type { Fighter } from "../fighter/Fighter";
import type { FighterBody } from "../fighter/FighterBody";
import { Aftermath } from "../reactions/Aftermath";
import { FilmVector as Vec3 } from "../rig/FilmVector";

/**
 * The referee's spoken cues, gestures, gaze and post-knockout positions.
 *
 * @evidence contracts/common.md#implementation-and-ownership One table of film seconds drives his mouth, arms and gaze, and the soundtrack's speech and count cues use the same seconds (see FilmEvents), so voice and gesture cannot drift apart. Arm gestures are clinical channels blended by smooth envelopes.
 * @evidence contracts/common.md#authoring-interface Film seconds; degrees for joints; world metres for positions.
 */
export namespace RefereeCues {
  /** Seconds after which the knockout positions apply. */
  export const knockdownStart: number = 150.2;

  /** Spoken phrases: [onset, duration, id]. */
  export const speech: readonly (readonly [
    number,
    number,
    "fight" | "down" | "neutral" | "decision",
  ])[] = [
    [0.4, 0.8, "fight"],
    [150.55, 0.65, "down"],
    [152.0, 1.7, "neutral"],
    [167.6, 2.3, "decision"],
  ];

  /** Spoken count onsets, one through ten. */
  export const counts: readonly number[] = [
    158, 159, 160, 161, 162, 163, 164, 165, 166, 167,
  ];

  /**
   * Mouth opening in millimetres at a second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Rectified sine syllables inside each phrase and a single open-close per count.
   * @evidence contracts/common.md#authoring-interface Millimetres of jaw opening.
   */
  export function mouth(t: number): number {
    let open: number = 0;
    for (const [onset, duration] of speech)
      if (t >= onset && t <= onset + duration)
        open = Math.max(
          open,
          14 *
            Math.abs(Math.sin((t - onset) * 14)) *
            Ease.plateau(
              t,
              onset,
              onset + 0.05,
              onset + duration - 0.05,
              onset + duration,
            ),
        );
    for (const onset of counts)
      if (t >= onset && t <= onset + 0.55)
        open = Math.max(open, 16 * Math.sin(((t - onset) / 0.55) * Math.PI));
    return open;
  }

  /**
   * Where he stands after the knockdown.
   *
   * @evidence contracts/common.md#implementation-and-ownership Unhurried walk from his bout position to a watch point beside B's chest on the far side, facing B.
   * @evidence contracts/common.md#authoring-interface `start` is his bout position at the knockdown second; world metres.
   */
  export function stance(
    t: number,
    scene: Scene,
    start: readonly [number, number],
  ): Fighter.Stance {
    // Watch point: beside B's chest, on the far side from the camera, clear of A's route.
    const hips: readonly [number, number] = scene.fallenHips;
    const head: readonly [number, number] = scene.fallenHead;
    const chest: readonly [number, number] = [
      (hips[0] + head[0]) / 2,
      (hips[1] + head[1]) / 2,
    ];
    const side: Vec3.Value = Vec3.normalize(
      Vec3.rotateY([head[0] - hips[0], 0, head[1] - hips[1]], Math.PI / 2),
    );
    const camera: readonly number[] = scene.camera;
    const away = (sign: number): number =>
      Math.hypot(
        chest[0] + side[0] * sign - camera[0]!,
        chest[1] + side[2] * sign - camera[2]!,
      );
    const sign: number = away(1) >= away(-1) ? 1 : -1;
    const watch: readonly [number, number] = [
      chest[0] + side[0] * 1.05 * sign,
      chest[1] + side[2] * 1.05 * sign,
    ];
    const u: number = Ease.smooth((t - 152.2) / 3.9);
    const origin: readonly [number, number] = [
      Ease.lerp(start[0], watch[0], u),
      Ease.lerp(start[1], watch[1], u),
    ];
    return {
      origin,
      heading: Vec3.heading([chest[0] - origin[0], 0, chest[1] - origin[1]]),
      walk: 1,
    };
  }

  /**
   * World point the referee looks at.
   *
   * @evidence contracts/common.md#implementation-and-ownership Bout: the pair centre. After the knockout: B's head, turning to A's corner at the named moments.
   * @evidence contracts/common.md#authoring-interface World metres.
   */
  export function gaze(t: number, scene: Scene): Vec3.Value {
    if (t < knockdownStart) {
      const pair: Blocking.Pair = Blocking.pair(t);
      return [pair.centre[0], 1.5, pair.centre[1]];
    }
    const b: Vec3.Value = [scene.fallenHead[0], 0.2, scene.fallenHead[1]];
    const a: Vec3.Value = scene.a(t);

    // Between counts his attention alternates between B and A's corner.
    const toA: number =
      Ease.plateau(t, 152.0, 152.4, 153.6, 154.2) +
      Ease.plateau(t, 156.2, 156.6, 157.1, 157.5) +
      Ease.plateau(t, 164.0, 164.3, 164.7, 165.0) +
      Ease.plateau(t, 168.0, 168.3, 168.9, 169.2);
    return Vec3.lerp(b, a, Math.min(1, toA));
  }

  /**
   * Add the gesture of the moment to his frame.
   *
   * @evidence contracts/common.md#implementation-and-ownership Blends authored arm channels for the start signal, knockdown point, corner point, counting beats with finger counts, wave-off, indication and crouch.
   * @evidence contracts/common.md#authoring-interface Mutates his frame; degrees.
   */
  export function gesture(
    frame: FighterBody.Frame,
    t: number,
    scene: Scene,
  ): void {
    const right = frame.arms.right!;
    const left = frame.arms.left!;
    const set = (
      arm: typeof right,
      weight: number,
      flexion: number,
      abduction: number,
      rotation: number,
      elbow: number,
    ): void => {
      if (weight <= 0) return;
      arm.shoulder = {
        flexion: Ease.lerp(arm.shoulder?.flexion ?? 0, flexion, weight),
        abduction: Ease.lerp(arm.shoulder?.abduction ?? 0, abduction, weight),
        rotation: Ease.lerp(arm.shoulder?.rotation ?? 0, rotation, weight),
      };
      arm.elbow = {
        flexion: Ease.lerp(arm.elbow?.flexion ?? 0, elbow, weight),
      };
    };

    // Opening: right palm rises beside the shoulder, then sweeps down on "Fight!".
    const raise: number = Ease.plateau(t, -0.4, 0.1, 0.4, 0.9);
    set(right, raise, Ease.lerp(95, 20, Ease.ramp(t, 0.4, 0.75)), 30, -10, 40);
    open(right, raise);

    // Knockdown: points down at B, then toward the neutral corner.
    set(right, Ease.plateau(t, 150.35, 150.6, 151.2, 151.6), 55, 10, 0, 8);
    const corner: number = Ease.plateau(t, 151.8, 152.1, 153.3, 153.8);
    if (corner > 0) {
      const toCorner: number = Vec3.heading([
        scene.corner[0] - frame.origin[0],
        0,
        scene.corner[1] - frame.origin[1],
      ]);
      let delta: number = ((frame.heading - toCorner) * 180) / Math.PI;
      delta = (((delta % 360) + 540) % 360) - 180;
      set(right, corner, 88, Math.max(-30, Math.min(110, delta)), 0, 5);
      open(right, corner);
    }

    // Count: counting hand raised at 157, a downward beat per number, fingers showing it.
    const counting: number = Ease.plateau(t, 156.8, 157.1, 167.3, 167.6);
    if (counting > 0) {
      let beat: number = 0;
      let shown: number = 0;
      for (let n: number = 0; n < counts.length; n++)
        if (t >= counts[n]! - 0.35) {
          shown = n + 1;
          beat = Ease.pulse(
            t,
            counts[n]! - 0.35,
            counts[n]!,
            counts[n]! + 0.45,
          );
        }
      set(right, counting, 115 - 45 * beat, 25, 0, 70 - 30 * beat);
      fingers(right, Math.min(5, shown));
      const second: number =
        counting * Ease.ramp(t, counts[5]! - 0.8, counts[5]! - 0.35);
      set(left, second, 100 - 40 * (shown > 5 ? beat : 0), 20, 0, 60);
      if (shown > 5) {
        fingers(left, 5);
        fingers(right, shown - 5);
      }
      frame.thoracic.flexion +=
        10 * Ease.plateau(t, 164.6, 165.0, 165.6, 166.0);
    }

    // Decision: both hands sweep across the front, then he indicates A.
    const wave: number = Ease.plateau(t, 167.6, 167.8, 168.3, 168.5);
    const sweep: number = Math.sin((t - 167.6) * 2 * Math.PI * 1.6);
    set(right, wave, 75, -10 + 35 * sweep, 0, 15);
    set(left, wave, 75, -10 - 35 * sweep, 0, 15);
    open(right, wave);
    open(left, wave);
    const indicate: number = Ease.plateau(t, 168.5, 168.8, 169.0, 169.4);
    if (indicate > 0) {
      const a: Vec3.Value = scene.a(t);
      const toA: number = Vec3.heading([
        a[0] - frame.origin[0],
        0,
        a[2] - frame.origin[1],
      ]);
      let delta: number = ((frame.heading - toA) * 180) / Math.PI;
      delta = (((delta % 360) + 540) % 360) - 180;
      set(right, indicate, 85, Math.max(-30, Math.min(110, delta)), 0, 10);
      open(right, indicate);
    }

    // Attends to B in a shallow supported crouch.
    const crouch: number = Ease.ramp(t, 169.0, 169.9);
    frame.drop += 0.32 * crouch;
    frame.thoracic.flexion += 14 * crouch;
    frame.lumbar.flexion += 10 * crouch;
    frame.shift[0] += 0.08 * crouch;
    set(left, crouch, 35, 15, 0, 60);
    set(right, crouch, 30, 10, 0, 55);
  }

  /**
   * Landmarks the cues need.
   *
   * @evidence contracts/common.md#implementation-and-ownership Landmarks resolved once by the aftermath.
   * @evidence contracts/common.md#authoring-interface World X/Z metres; `a` returns A's head in world metres.
   */
  export interface Scene {
    /** B's hips at rest, world X/Z. */
    fallenHips: readonly [number, number];
    /** B's head at rest, world X/Z. */
    fallenHead: readonly [number, number];
    /** A's corner point, world X/Z. */
    corner: readonly [number, number];
    /**
     * A's head at a second, world metres.
     *
     * @evidence contracts/common.md#implementation-and-ownership Called per frame for gaze and indication.
     * @evidence contracts/common.md#authoring-interface Film second in; world metres out.
     */
    a: (t: number) => Vec3.Value;

    /** Wide camera position after the knockout, world metres; he stands on B's far side from it. */
    camera: Vec3.Value;
  }

  /**
   * Default landmarks from the aftermath.
   *
   * @evidence contracts/common.md#implementation-and-ownership Packs the aftermath landmarks with the caller's head function.
   * @evidence contracts/common.md#authoring-interface Returns a fresh scene.
   */
  export function scene(a: (t: number) => Vec3.Value): Scene {
    return {
      fallenHips: Aftermath.fallenHips,
      fallenHead: Aftermath.fallenHead,
      corner: Aftermath.corner,
      a,
      camera: Aftermath.wideCamera.position,
    };
  }

  /** Open the palm as the gesture weight rises. */
  function open(
    arm: NonNullable<FighterBody.Frame["arms"]["left"]>,
    weight: number,
  ): void {
    if (weight <= 0 || !arm.hand) return;
    for (const finger of ["index", "middle", "ring", "little"] as const) {
      const f = arm.hand[finger]!;
      arm.hand[finger] = {
        mcpFlexion: Ease.lerp(f.mcpFlexion ?? 0, 0, weight),
        pipFlexion: Ease.lerp(f.pipFlexion ?? 0, 0, weight),
        dipFlexion: Ease.lerp(f.dipFlexion ?? 0, 0, weight),
      };
    }
  }

  /** Show n extended fingers (thumb last), the rest folded. */
  function fingers(
    arm: NonNullable<FighterBody.Frame["arms"]["left"]>,
    n: number,
  ): void {
    const order = ["index", "middle", "ring", "little"] as const;
    const hand = (arm.hand ??= {});
    order.forEach((finger, i): void => {
      const extended: boolean = i < n;
      hand[finger] = extended
        ? { mcpFlexion: 0, pipFlexion: 0, dipFlexion: 0 }
        : { mcpFlexion: 80, pipFlexion: 90, dipFlexion: 50 };
    });
    hand.thumb =
      n >= 5
        ? { mcpFlexion: 0, ipFlexion: 0, cmcAbduction: 40 }
        : { mcpFlexion: 40, ipFlexion: 50 };
  }
}
