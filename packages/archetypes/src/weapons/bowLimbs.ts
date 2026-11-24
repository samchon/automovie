import { AutoMovieArchetypeRefusal, AutoMovieArchetypeUnits } from "../core";
import { createBow } from "./createBow";

/**
 * Each limb's turn against the string's travel: the table a bow's `upperLimb`
 * and `lowerLimb` follow, and what `createBow.limbs` gives.
 *
 * @param half The finite positive limb-tip height from the grip, half the
 *   length nock to nock, metres.
 * @param brace The finite positive braced-string distance behind the grip,
 *   metres.
 * @param travel Finite nonnegative full string travel, metres, admitting the
 *   fixed limb/string triangle.
 * @returns Rows of string travel, metres, and limb turn, degrees, from brace to
 *   full draw; a zero stroke has just the neutral row.
 * @throws {AutoMovieArchetypeRefusal} For invalid or impossible geometry,
 *   unrepresentable intermediate geometry or insufficient binary64 travel
 *   resolution.
 */
export function bowLimbs(
  half: number,
  brace: number,
  travel: number,
): [number, number][] {
  for (const [axis, value] of [
    ["half", half],
    ["brace", brace],
  ] as const)
    if (!(value > 0))
      refuse(
        axis,
        value,
        "a bow's limb and brace dimensions need finite positive lengths",
      );
  if (!(travel >= 0))
    refuse("travel", travel, "a string draw needs finite nonnegative travel");
  const reach: number = Math.hypot(half, brace);
  const nock: number = brace + travel;
  if (travel > 0 && !(nock > brace))
    refuse(
      "geometry",
      travel,
      "the positive draw is below the drawn nock's representable resolution",
    );
  if (!(nock - reach <= half))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "bow",
      axis: "travel",
      value: travel,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: reach - brace + half,
        unit: "m",
      },
      reason:
        "the drawn nock must form a triangle with the fixed limb and string half",
      fix: "keep the travel nonnegative and within the limb/string triangle",
    });
  if (travel === 0) return [[0, 0]];
  const alpha: number = Math.atan2(brace, half);
  const turn: (x: number) => number = (x: number): number => {
    const n: number = brace + x;
    const ratio: number = (n / reach + (brace / n) * (brace / reach)) / 2;
    const result: number =
      (Math.asin(ratio) - alpha) / AutoMovieArchetypeUnits.DEGREE;
    if (!(Math.abs(ratio) <= 1))
      refuse(
        "geometry",
        x,
        "the limb's turn has no finite inverse-trigonometric value",
      );
    return result;
  };

  // The string's half length read between rows from the linearly read turn.
  const gap: (x: number, turned: number) => number = (
    x: number,
    turned: number,
  ): number => {
    const phi: number = turned * AutoMovieArchetypeUnits.DEGREE;
    const y: number = reach * Math.cos(alpha + phi);
    const z: number = reach * Math.sin(alpha + phi);
    const result: number = Math.abs(Math.hypot(y, z - (brace + x)) - half);
    return result;
  };
  const rows: [number, number][] = [[0, 0]];
  const fill: (a: number, b: number) => void = (a: number, b: number): void => {
    const middle: number = a + (b - a) / 2;
    const ta: number = turn(a);
    const tb: number = turn(b);
    if (gap(middle, (ta + tb) / 2) > createBow.STRING) {
      if (middle === a || middle === b)
        refuse(
          "geometry",
          middle,
          "binary64 travel resolution cannot satisfy the string midpoint criterion",
        );
      fill(a, middle);
      fill(middle, b);
    } else rows.push([b, tb]);
  };
  fill(0, travel);
  return rows;

  /**
   * Refuse unsupported geometry before a NaN table or nonterminating
   * subdivision escapes.
   */
  function refuse(axis: string, value: number, reason: string): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "bow",
      axis,
      value,
      reason,
      feasible: null,
      fix: "give positive finite limb and brace lengths with a representable feasible draw",
    });
  }
}
