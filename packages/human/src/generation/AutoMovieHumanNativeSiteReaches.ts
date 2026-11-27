import type { AutoMovieVector2Tuple } from "@automovie/interface";

/**
 * A measurement site's four reaches about a stated centre, and how tissue and bone move them.
 *
 * A section's size at a site is four numbers, not two: how far the skin reaches forward, backward and to either side of the point where
 * the skeleton crosses the section's plane. A published depth and breadth give their sums; where each is split is a share of the part's
 * own form (a trunk's front share of its depth, a limb's lateral share of its breadth). Written about the skeleton's point, a change of
 * tissue then moves the skin and leaves that point, and a bony breadth, where one is published (the humeral and femoral epicondyles, the
 * styloids, the malleoli, the iliac crests, the acromia), stays out of the tissue's ratio altogether: `reach' = bone + ratio (reach -
 * bone)`.
 *
 * The law moves a section's extremes, never its points one by one. An extreme's own coordinate follows its side's reach; its coordinate
 * across follows the mean of the two reaches across it; shares and shoulders are ratios along one line and are carried as they are (the
 * limb law's rule, here about the centre instead of the course point). The chain rebuilt on the moved extremes is a conic chain like the
 * first, so no crease is drawn where two sides' ratios differ.
 */
export namespace AutoMovieHumanNativeSiteReaches {
  /** A section's four reaches from its centre, mm, each positive. */
  export interface IReaches {
    /** Along `+u`. */
    front: number;

    /** Along `-u`. */
    back: number;

    /** Along `+v`. */
    lateral: number;

    /** Along `-v`. */
    medial: number;
  }

  /** Where a depth and a breadth are split about the centre, each a share in (0, 1). */
  export interface IShares {
    /** The share of the depth that lies along `+u` of the centre. */
    front: number;

    /** The share of the breadth that lies along `+v` of the centre. */
    lateral: number;
  }

  const positive = (what: string, x: number): void => {
    if (!(Number.isFinite(x) && x > 0)) throw new Error("site reaches: " + what + " must be finite and positive");
  };

  /**
   * The four reaches of a published depth and breadth, mm, split by the site's shares.
   *
   * @param depth The section's whole extent along `u`, mm.
   * @param breadth Its whole extent along `v`, mm.
   * @param shares The split about the centre.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A depth is the sum of the front and the back reach and a breadth of the two side reaches, by the calipers' definitions; the split is the stated share. Premise: both extents are measured in the section's own plane.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonpositive extents and shares outside (0, 1) are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States units, the chart's directions and what a share is a share of.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function split(depth: number, breadth: number, shares: IShares): IReaches {
    positive("the depth", depth);
    positive("the breadth", breadth);
    for (const share of [shares.front, shares.lateral]) if (!(share > 0 && share < 1)) throw new Error("site reaches: a share must lie inside (0, 1)");
    return { front: depth * shares.front, back: depth * (1 - shares.front), lateral: breadth * shares.lateral, medial: breadth * (1 - shares.lateral) };
  }

  /**
   * The reaches after a change of tissue: each is its bony part plus the tissue's ratio times the rest.
   *
   * @param reaches The reaches before, mm.
   * @param bone The bony part of each reach, mm, zero where no bony breadth is published and at most the reach.
   * @param ratio The tissue's ratio, 1 for none.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A caliper on a limb reads bone plus the tissue over it; a change of tissue leaves the bone. Premise: the bony part is measured from the same centre along the same direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression a direction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bony part that is negative or past its reach and a nonpositive ratio are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States what zero bone and a ratio of one mean.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function tissue(reaches: IReaches, bone: IReaches, ratio: number): IReaches {
    positive("the tissue's ratio", ratio);
    const one = (name: keyof IReaches): number => {
      positive("the " + name + " reach", reaches[name]);
      if (!(bone[name] >= 0 && bone[name] <= reaches[name])) throw new Error("site reaches: the " + name + " reach's bony part must lie between zero and the reach");
      return bone[name] + ratio * (reaches[name] - bone[name]);
    };
    return { front: one("front"), back: one("back"), lateral: one("lateral"), medial: one("medial") };
  }

  /**
   * An extreme of a section moved from one set of reaches to another about the centre.
   *
   * @param point The extreme, a chart point, mm.
   * @param kind `u` for a front or back extreme, `v` for a side extreme.
   * @param centre The centre the reaches are measured from, a chart point, mm.
   * @param from The reaches the extreme was laid at.
   * @param to The reaches it is carried to.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The extreme's own coordinate, measured from the centre, takes the ratio of the reach on its side; its coordinate across takes the mean ratio of the two reaches across it, so an extreme that stands off the centre line keeps its share of the section's extent there. Premise: the extreme is the layout's `u` or `v` anchor, whose tangent the layout fixes by rule and an axis-aligned map keeps.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two ratios, chosen by the extreme's kind and side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No point of the section but an extreme is moved here, since a map with one ratio a side would crease the outline where the sides meet; nonpositive reaches are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the units and which coordinate takes which ratio.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one point.
   */
  export function extreme(point: AutoMovieVector2Tuple, kind: "u" | "v", centre: AutoMovieVector2Tuple, from: IReaches, to: IReaches): AutoMovieVector2Tuple {
    for (const reaches of [from, to]) for (const name of ["front", "back", "lateral", "medial"] as const) positive("the " + name + " reach", reaches[name]);
    const [du, dv]: [number, number] = [point[0] - centre[0], point[1] - centre[1]];
    const along: number = du >= 0 ? to.front / from.front : to.back / from.back;
    const across: number = dv >= 0 ? to.lateral / from.lateral : to.medial / from.medial;
    const meanAlong: number = (to.front / from.front + to.back / from.back) / 2;
    const meanAcross: number = (to.lateral / from.lateral + to.medial / from.medial) / 2;
    return kind === "u" ? [centre[0] + du * along, centre[1] + dv * meanAcross] : [centre[0] + du * meanAlong, centre[1] + dv * across];
  }
}
