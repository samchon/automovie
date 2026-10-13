/** Interpolate one scalar the one way every automovie cue interpolates. */
export const lerp = (from: number, to: number, progress: number): number =>
  from * (1 - progress) + to * progress;
