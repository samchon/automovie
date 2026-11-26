import type {
  IAutoMovieConstructionCurve,
  IAutoMovieMark,
} from "@automovie/interface";

/**
 * Turn the construction curves of one built form into inspection marks that
 * follow the scene object the form was built into.
 *
 * Each curve becomes one polyline mark, closed for a section ring, of kind
 * `curve/section`, `curve/guide` or `curve/axis`. Its path is `anchor` followed
 * by the curve's `id`, such as `hero/torso/section/3`, so a pattern that
 * selects the form's object selects its curves, and one pattern can name one
 * ring. The curve's points are the form at rest in the object's local frame,
 * which is why the object is the anchor. A curve the sampler flagged stays
 * flagged.
 *
 * | Kind            | Label           | Colour         |
 * | --------------- | --------------- | -------------- |
 * | `curve/section` | `section curve` | Blue `59a0f4`  |
 * | `curve/guide`   | `guide curve`   | Green `59cb89` |
 * | `curve/axis`    | `axis curve`    | Cyan `00e5ff`  |
 *
 * ```ts
 * const marks = markAutoMovieConstructionCurves(
 *   sampleAutoMovieConstructionCurves(realization),
 *   "hero",
 * );
 * ```
 *
 * @param curves The curves of one form, as `sampleAutoMovieConstructionCurves`
 *   returns them.
 * @param anchor Path of the scene object the form was built into, or the empty
 *   string for the scene root.
 * @returns One mark per curve, in the curves' order.
 */
export function markAutoMovieConstructionCurves(
  curves: readonly IAutoMovieConstructionCurve[],
  anchor: string,
): IAutoMovieMark[] {
  return curves.map(
    (curve: IAutoMovieConstructionCurve): IAutoMovieMark => ({
      path: anchor === "" ? curve.id : `${anchor}/${curve.id}`,
      kind: `curve/${curve.kind}`,
      label: LEGEND[curve.kind].label,
      color: LEGEND[curve.kind].color,
      shape: { type: "polyline", points: curve.points, closed: curve.closed },
      flagged: curve.flagged,
      anchor,
    }),
  );
}

/**
 * Legend text and colour of each curve kind, keyed so the compiler refuses a
 * kind without one.
 */
const LEGEND: Readonly<
  Record<IAutoMovieConstructionCurve.Kind, { label: string; color: number }>
> = {
  section: { label: "section curve", color: 0x59a0f4 },
  guide: { label: "guide curve", color: 0x59cb89 },
  axis: { label: "axis curve", color: 0x00e5ff },
};
