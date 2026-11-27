import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanFieldThrow,
  IAutoMovieMotionHumanJoints,
} from "@automovie/interface";

import { ExerciseKey } from "../../exercise/internal/ExerciseKey";

/*
 * Build an event's keys on a body.
 * Parameter body: The body.
 * Parameter event: The throw.
 * Parameter side: The throwing hand.
 * Returns: The keys.
 */
export function fieldThrowKeys(
  body: IAutoMovieMotionHumanBody,
  event: IAutoMovieMotionHumanFieldThrow.Event,
  side: AutoMovieHumanSide,
): fieldThrowKeys.IKeys {
  const arm = (
    throwing: IAutoMovieMotionHumanExerciseKey.ILimb,
    free: IAutoMovieMotionHumanExerciseKey.ILimb,
  ): [
    IAutoMovieMotionHumanExerciseKey.ILimb,
    IAutoMovieMotionHumanExerciseKey.ILimb,
  ] => (side === "left" ? [throwing, free] : [free, throwing]);
  const wind: IAutoMovieMotionHumanExerciseKey.IKey =
    event === "shot"
      ? ExerciseKey.from(
          body,
          { pitch: 20 },
          { knee: 35, hip: 40, ankle: 15 },
          ...arm(
            { shoulder: 40, raise: 70, elbow: 140 },
            { shoulder: 90, raise: 20, elbow: 20 },
          ),
        )
      : event === "javelin"
        ? ExerciseKey.from(
            body,
            { pitch: -5 },
            { knee: 15, hip: 15, ankle: 5 },
            ...arm(
              { shoulder: -30, raise: 60, elbow: 10 },
              { shoulder: 90, raise: 10, elbow: 20 },
            ),
          )
        : ExerciseKey.from(
            body,
            { pitch: 10 },
            { knee: 25, hip: 25, ankle: 10 },
            ...arm(
              event === "hammer"
                ? { shoulder: 60, raise: 20, elbow: 5 }
                : { shoulder: 0, raise: 90, elbow: 5 },
              event === "hammer"
                ? { shoulder: 60, raise: 20, elbow: 5 }
                : { shoulder: 0, raise: 90, elbow: 10 },
            ),
          );
  const release: IAutoMovieMotionHumanExerciseKey.IKey = ExerciseKey.from(
    body,
    { pitch: 10 },
    { knee: 10, hip: 10, ankle: 0 },
    ...arm(
      event === "hammer"
        ? { shoulder: 120, raise: 20, elbow: 5 }
        : { shoulder: 120, raise: 30, elbow: 5 },
      { shoulder: 20, raise: 30, elbow: 30 },
    ),
  );
  return { wind, release, stand: ExerciseKey.standing(body) };
}

/*
 * The keyed postures of a field throw (`fieldThrow`): the wind the body turns
 * in, the release and standing. Angles are provisional, read from the events'
 * descriptions (the shot held at the neck, the discus and the hammer swung at
 * the arms' length, the javelin drawn back).
 */
export namespace fieldThrowKeys {
  /*
   * A throw's three keys.
   */
  export interface IKeys {
    /*
     * The posture the body turns in, the implement wound back.
     */
    wind: IAutoMovieMotionHumanExerciseKey.IKey;

    /*
     * The posture at the release, the throwing arm reaching out and up.
     */
    release: IAutoMovieMotionHumanExerciseKey.IKey;

    /*
     * Relaxed standing.
     */
    stand: IAutoMovieMotionHumanExerciseKey.IKey;
  }

  /*
   * Blend two keys.
   * Parameter a: The key at progress 0.
   * Parameter b: The key at progress 1.
   * Parameter u: The progress, in [0, 1].
   * Returns: The blended key: each angle and the tilt and lift linearly, a
   * joint one key leaves out taken as zero.
   */
  export function blend(
    a: IAutoMovieMotionHumanExerciseKey.IKey,
    b: IAutoMovieMotionHumanExerciseKey.IKey,
    u: number,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    const joints: IAutoMovieMotionHumanJoints.Angles = {};
    const bones: Set<AutoMovieHumanoidBone> = new Set([
      ...(Object.keys(a.joints) as AutoMovieHumanoidBone[]),
      ...(Object.keys(b.joints) as AutoMovieHumanoidBone[]),
    ]);
    for (const bone of bones) {
      const x: readonly [number, number, number] = a.joints[bone] ?? [0, 0, 0];
      const y: readonly [number, number, number] = b.joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        x[0] + (y[0] - x[0]) * u,
        x[1] + (y[1] - x[1]) * u,
        x[2] + (y[2] - x[2]) * u,
      ];
    }
    return {
      pitch: a.pitch + (b.pitch - a.pitch) * u,
      roll: a.roll + (b.roll - a.roll) * u,
      yaw: a.yaw + (b.yaw - a.yaw) * u,
      lift: a.lift + (b.lift - a.lift) * u,
      joints,
    };
  }
}
