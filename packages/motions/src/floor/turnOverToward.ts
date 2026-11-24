import type { AutoMovieHumanSide } from "@automovie/interface";

/**
 * The target turn nearest the current one, a half turn going over the named
 * side.
 *
 * @param current The current turn, degrees.
 * @param named The turn named, degrees.
 * @param via The side a half turn goes over.
 * @returns The target turn, degrees.
 */
export function turnOverToward(
  current: number,
  named: number,
  via: AutoMovieHumanSide,
): number {
  const options: number[] = [-2, -1, 0, 1, 2].map(
    (k: number): number => named + 360 * k,
  );
  const nearest: number = options.reduce((a: number, b: number): number =>
    Math.abs(b - current) < Math.abs(a - current) - 1e-6 ? b : a,
  );
  if (Math.abs(Math.abs(nearest - current) - 180) > 1e-6) return nearest;
  return via === "left" ? current + 180 : current - 180;
}
