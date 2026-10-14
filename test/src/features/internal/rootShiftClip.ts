import type { IAutoMovieKeyframe, IAutoMovieMotion, IAutoMovieVector3 } from "@automovie/interface";

/** Build the existing root-only clip at the supplied times, retaining its duration-one convention and original sparse rest joints. */
export const rootShiftClip: (skeleton: string, shift: IAutoMovieVector3, times?: readonly number[]) => IAutoMovieMotion = (
  skeleton: string,
  shift: IAutoMovieVector3,
  times: readonly number[] = [0, 1],
): IAutoMovieMotion => ({
  id: "root-shift",
  skeleton,
  duration: 1,
  loop: false,
  keyframes: times.map((time: number, index: number): IAutoMovieKeyframe => ({
    time,
    pose: {
      skeleton,
      root:
        index === 0
          ? null
          : {
              translation: shift,
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
      joints: [],
    },
    expression: null,
    easing: "linear" as const,
    bezier: null,
  })),
});
