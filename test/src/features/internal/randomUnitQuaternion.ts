import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Consume three caller-owned [0,1) draws in their original order and map them
 * through the two square-root radii and full-turn sine/cosine pairs. The
 * squared radii sum to one in exact arithmetic; output uses binary64 math.
 *
 * The existing quaternion and joint roundtrip sweeps own their fixed seeds,
 * counts and assertions. This helper does not validate an arbitrary generator,
 * prove unbiased finite sampling of every rotation or observe rendered poses.
 */
export const randomUnitQuaternion: (
  rng: () => number,
) => IAutoMovieQuaternion = (rng: () => number): IAutoMovieQuaternion => {
  const u1: number = rng();
  const u2: number = rng();
  const u3: number = rng();
  const s1: number = Math.sqrt(1 - u1);
  const s2: number = Math.sqrt(u1);
  const t1: number = 2 * Math.PI * u2;
  const t2: number = 2 * Math.PI * u3;
  return {
    x: s1 * Math.sin(t1),
    y: s1 * Math.cos(t1),
    z: s2 * Math.sin(t2),
    w: s2 * Math.cos(t2),
  };
};
