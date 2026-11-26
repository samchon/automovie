import { positiveModulo } from "./positiveModulo";

/**
 * An angle in degrees wrapped to the half-open interval [-180, 180): the signed
 * shortest turn equivalent to it, so the difference of two headings passed
 * through it is the shortest arc between them.
 *
 * @param degrees A finite angle, degrees.
 * @returns The equivalent angle in [-180, 180).
 */
export function wrapDegrees(degrees: number): number {
  return positiveModulo(degrees + 180, 360) - 180;
}
