import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The body-frame sensitivities of an isotropic body of moment 2 turning about X
 * at 1.5 rad/s per unit of world momentum along X, Y and Z, in closed form: the
 * integral of R^T / 2 over [0, t].
 *
 * @param t The time, seconds.
 * @returns The three columns, for world momentum X, Y and Z.
 */
export const airborneSensitivity: (t: number) => IAutoMovieVector3[] = (
  t: number,
): IAutoMovieVector3[] => {
  const angle: number = 1.5 * t;
  return [
    { x: t / 2, y: 0, z: 0 },
    { x: 0, y: Math.sin(angle) / 3, z: -(1 - Math.cos(angle)) / 3 },
    { x: 0, y: (1 - Math.cos(angle)) / 3, z: Math.sin(angle) / 3 },
  ];
};
