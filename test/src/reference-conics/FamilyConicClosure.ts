/**
 * The closure of a part's section round its course, across an opening a neighbour fills.
 *
 * A part fitted on its own side of a dividing surface has sections that are open where the surface cuts them. The fit reads a closed
 * section, so each opening is closed by a wall that is no observation: two conic arcs from the kept skin's two ends through a far
 * point in the opening's middle direction from the course point, each leaving the skin along the skin's own direction.
 *
 * That wall is part of the section the family has to represent, so it is held to the family's own admissibility: each arc's tangent
 * lines meet at least the fit's margin of its chord from both its ends, as every fitted arc's must
 * (`FamilyConicFit.ADMISSIBLE_MARGIN`). The far point starts at a share of the kept skin's mean radius and is carried outward until both
 * arcs are admissible. Accepted as soon as the tangents merely met ahead, a far point 2 to 3 mm past a parting plane that passes at
 * about the mean radius gave tangents that met a millimetre from the skin's end, and the closure turned 80 to 90 degrees there: every
 * refused seed of f1's toes, of its middle finger and of its thumb's ray had its arc under the margin at that corner
 * (`packages/human/docs/techniques/joints-one-shot.md`, The correction).
 */
export namespace FamilyConicClosure {
  /** A point or a direction of a section's chart, mm. */
  export type P = [number, number];

  /**
   * A closure's far point with the two arcs' corners.
   *
   * @evidence contracts/development/design.md#principled-representation The far point, the two control corners of the arcs either side of it, the share it stands at and each arc's least meeting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the fit tool's section closing or by the made case.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The meetings are reported as measured, not rounded to the margin.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units.
   */
  export interface IFar {
    /** The far point, mm. */
    point: P;

    /** The far point's tangent, a unit direction square to its radius, in the sense from the exit to the entry. */
    tangent: P;

    /** The corner of the arc from the exit to the far point: where their tangent lines meet, mm. */
    first: P;

    /** The corner of the arc from the far point to the entry, mm. */
    second: P;

    /** The far point's distance from the course point, as a share of the kept skin's mean radius. */
    share: number;

    /** Each arc's lesser tangent-meeting distance, as a share of its chord. */
    meetings: [number, number];
  }

  /** The step the far point is carried outward by, as a share of the mean radius. */
  export const STEP: number = 0.05;

  /**
   * The far point of a closure round the course, or null where no share up to `most` gives two admissible arcs.
   *
   * @param exit Where the kept skin leaves, mm from the course point.
   * @param leaving The skin's unit direction there.
   * @param entry Where the kept skin comes back.
   * @param arriving The skin's unit direction there.
   * @param mean The kept skin's mean radius, mm.
   * @param from The share the far point starts at.
   * @param most The greatest share it is carried to.
   * @param margin The least tangent meeting an arc is admitted with, as a share of its chord.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The far point lies on the opening's middle direction with its tangent square to its radius; each arc's corner is the meeting of its two end tangent lines, and its meeting is the lesser of the two distances from its ends to that corner over its chord, the measure the fit holds every arc to.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over shares, two line meetings, one test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No margin of its own and no part named; a closure that cannot be admissible is refused by null.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most `(most - from) / STEP` steps of constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller builds the arcs once from the returned corners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers.
   * @evidence contracts/development/common.md#meaningful-documentation States each argument's unit and the refusal.
   */
  export function far(exit: P, leaving: P, entry: P, arriving: P, mean: number, from: number, most: number, margin: number): IFar | null {
    const start: number = Math.atan2(exit[1], exit[0]);
    const gap: number = (((Math.atan2(entry[1], entry[0]) - start) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const middle: number = start + gap / 2;
    const tangent: P = [-Math.sin(middle), Math.cos(middle)];
    const meet = (p: P, d: P, q: P, e: P): { a: number; b: number; X: P } => {
      const den: number = d[0] * e[1] - d[1] * e[0];
      const w: P = [q[0] - p[0], q[1] - p[1]];
      const a: number = (w[0] * e[1] - w[1] * e[0]) / den;
      return { a, b: (w[0] * d[1] - w[1] * d[0]) / den, X: [p[0] + a * d[0], p[1] + a * d[1]] };
    };
    for (let share: number = from; share <= most + 1e-9; share += STEP) {
      const point: P = [share * mean * Math.cos(middle), share * mean * Math.sin(middle)];
      const [one, two] = [meet(exit, leaving, point, [-tangent[0], -tangent[1]]), meet(point, tangent, entry, [-arriving[0], -arriving[1]])];
      if (!(one.a > 0 && one.b > 0 && two.a > 0 && two.b > 0)) continue;
      const meetings: [number, number] = [Math.min(one.a, one.b) / Math.hypot(point[0] - exit[0], point[1] - exit[1]), Math.min(two.a, two.b) / Math.hypot(entry[0] - point[0], entry[1] - point[1])];
      if (meetings[0] >= margin && meetings[1] >= margin) return { point, tangent, first: one.X, second: two.X, share, meetings };
    }
    return null;
  }
}
