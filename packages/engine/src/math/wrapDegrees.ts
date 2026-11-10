import { positiveModulo } from "./positiveModulo";

/**
 * An angle in degrees wrapped to the half-open interval [-180, 180): the
 * signed shortest turn equivalent to it, so the difference of two headings
 * passed through it is the shortest arc between them.
 *
 * @param degrees A finite angle, degrees.
 * @returns The equivalent angle in [-180, 180).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the interval, its closed and open ends and the shortest-arc use.
 * @evidence contracts/development/implementation.md#principled-implementation Shifts by half a turn, reduces modulo one turn with `positiveModulo` and shifts back, the standard reduction of an angle to a centred interval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of degree wrapping; the cyclic remainder stays with `positiveModulo`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No loop of repeated additions and no tolerance; a finite input is the caller's premise, as for `positiveModulo`.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one remainder and two additions.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A scalar pure function; there is nothing to share between calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and allocates nothing.
 */
export function wrapDegrees(degrees: number): number {
  return positiveModulo(degrees + 180, 360) - 180;
}
