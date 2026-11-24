import { AutoMovieHumanConicSection as S } from "./AutoMovieHumanConicSection";
import {
  AutoMovieHumanNativeGirthClosure as Closure,
} from "./AutoMovieHumanNativeGirthClosure";
import {
  AutoMovieHumanNativeSiteReaches as Reaches,
} from "./AutoMovieHumanNativeSiteReaches";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanNativeSiteSection,
} from "@automovie/interface";

/**
 * One section at a measurement site solved from the site's measures: its extremes carried to the person's four reaches about the
 * site's centre, then its fullness closed on the person's girth.
 *
 * This is the one place the two laws meet, for every family alike: a section's field vector and its layout go in, the same layout's
 * vector comes out. The reaches move the extremes and nothing else (`AutoMovieHumanNativeSiteReaches.extreme`); medians and shoulders
 * are shares and are carried as they are; the girth, where the site has one, then moves those shares together until the section's taut
 * tape measures it (`AutoMovieHumanNativeGirthClosure.solve`). So a girth alone changes fullness and no reach, a breadth or a depth
 * alone changes its reaches and leaves the shares, and a section whose reaches and girth are its own comes back as given.
 *
 * Limit: the layout holds extremes and medians only (`limb`, `bilateral`, `lens` at any depth), which is every family of the body
 * below the head as stored. An inflection's turn and a feature's offset are not carried by an axis-aligned map of the extremes alone;
 * a layout that holds one is refused by name until its anchors have their own law.
 */
export namespace AutoMovieHumanNativeSiteSection {
  /** A site's measures as the section takes them. */
  export type ISite = IAutoMovieHumanNativeSiteSection.ISite;

  /** A section solved at its site. */
  export type ISolved = IAutoMovieHumanNativeSiteSection.ISolved;

  /**
   * The section at a site.
   *
   * @param values The section's field vector as laid at `site.from`.
   * @param layout Its layout: extremes and medians only.
   * @param site The centre, both sets of reaches and the girth.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each `u` or `v` anchor is an extreme whose tangent the layout fixes along a chart axis, which an axis-aligned map about the centre keeps; a median's share and a shoulder are ratios along one line, which such a map keeps too, so the chain rebuilt on the moved extremes is the mapped section's. The girth then has one unknown left, the fullness. Premise: on a layout whose extremes stand on the median line, the centre stands on it as well.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the anchors, then the closure; both laws are imported from their owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No family is named and no anchor is special-cased; a layout with an inflection or a feature anchor, and a centre off the median line of a section that stands on it, are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States what moves under each measure, the units, the chart and what an unchanged site returns.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the anchors, plus the closure's bisection where a girth is given.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A site whose reaches are its own and that has no girth returns the given array.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function solve(values: readonly number[], layout: IAutoMovieHumanConicSection.ILayout, site: ISite): ISolved {
    const odd: IAutoMovieHumanConicSection.IAnchor | undefined = layout.anchors.find((anchor: IAutoMovieHumanConicSection.IAnchor): boolean => anchor.kind === "i" || anchor.kind === "f");
    if (odd !== undefined) throw new Error("site section: a layout with an anchor of kind " + odd.kind + " has no site law yet");
    const median: boolean = layout.mirror || layout.anchors.some((anchor: IAutoMovieHumanConicSection.IAnchor): boolean => anchor.mid === true);
    if (median && site.centre[1] !== 0) throw new Error("site section: a section on its median line takes a centre on that line");

    // A reflected section has one side: its two side reaches must change alike, or the reflection would not be the person's other side.
    if (layout.mirror && site.to.lateral * site.from.medial !== site.to.medial * site.from.lateral)
      throw new Error("site section: a reflected section takes one ratio for both side reaches");

    // The extremes, each carried about the centre; an unchanged site keeps the given numbers.
    const names: readonly (keyof Reaches.IReaches)[] = ["front", "back", "lateral", "medial"];
    const same: boolean = names.every((name: keyof Reaches.IReaches): boolean => site.from[name] === site.to[name]);
    let moved: readonly number[] = values;
    if (!same) {
      const { at }: { at: number[] } = S.offsets(layout);
      const out: number[] = [...values];
      layout.anchors.forEach((anchor: IAutoMovieHumanConicSection.IAnchor, k: number): void => {
        if (anchor.kind !== "u" && anchor.kind !== "v") return;
        const point: AutoMovieVector2Tuple = anchor.mid === true ? [values[at[k]!]!, 0] : [values[at[k]!]!, values[at[k]! + 1]!];
        const carried: AutoMovieVector2Tuple = Reaches.extreme(point, anchor.kind, site.centre, site.from, site.to);
        out[at[k]!] = carried[0];
        if (anchor.mid !== true) out[at[k]! + 1] = carried[1];
      });
      moved = out;
    }
    if (site.girth === undefined) return { values: moved, fullness: 0 };
    const closed: Closure.IClosed = Closure.solve(moved, layout, site.girth);
    return { values: closed.values, fullness: closed.fullness };
  }
}
