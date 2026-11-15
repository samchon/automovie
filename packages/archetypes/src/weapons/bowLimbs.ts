import { ArchetypeUnits } from "../core";
import { createBow } from "./createBow";

/**
 * Each limb's turn against the string's travel: the table a bow's `upperLimb` and `lowerLimb` follow, and what `createBow.limbs` gives.
 *
 * @param half The limb's tip's height from the grip, half the length nock to nock, metres.
 * @param brace The braced string's distance behind the grip, metres.
 * @param travel The string's full travel, metres.
 * @returns Rows of the string's travel, metres, and the limb's turn, degrees, from brace to full draw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the rows and their units.
 * @evidence contracts/development/implementation.md#principled-implementation A tip at `R` from the grip, `R` fixed, and the string's half `S` fixed: with the nock at `n` behind the grip, the tip's reach toward it is `c = (R^2 + n^2 - S^2) / (2 n)`, so the turn is `asin(c / R) - alpha`, `alpha` the braced tip's angle; rows are bisected until the half read between them stays within the string's radius `createBow.STRING` of its length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One exact turn, then a recursive bisection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limb is stiff about the grip; its bending is not modelled.
 * @evidence contracts/development/implementation.md#efficient-algorithms A handful of rows: the bisection stops where linear reading is already inside the string's radius.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function bowLimbs(
  half: number,
  brace: number,
  travel: number,
): [number, number][] {
  const reach: number = Math.hypot(half, brace);
  const alpha: number = Math.atan2(brace, half);
  const turn = (x: number): number => {
    const n: number = brace + x;
    const c: number = (reach * reach + n * n - half * half) / (2 * n);
    return (Math.asin(c / reach) - alpha) / ArchetypeUnits.DEGREE;
  };

  // The string's half length read at a travel between two rows, from the linearly read turn.
  const gap = (x: number, turned: number): number => {
    const phi: number = turned * ArchetypeUnits.DEGREE;
    const y: number = reach * Math.cos(alpha + phi);
    const z: number = reach * Math.sin(alpha + phi);
    return Math.abs(Math.hypot(y, z - (brace + x)) - half);
  };
  const rows: [number, number][] = [[0, 0]];
  const fill = (a: number, b: number): void => {
    const middle: number = (a + b) / 2;
    const ta: number = turn(a);
    const tb: number = turn(b);
    if (gap(middle, (ta + tb) / 2) > createBow.STRING) {
      fill(a, middle);
      fill(middle, b);
    } else rows.push([b, tb]);
  };
  fill(0, travel);
  return rows;
}
