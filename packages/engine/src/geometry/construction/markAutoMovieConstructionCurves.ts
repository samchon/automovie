import type { IAutoMovieMark } from "../IAutoMovieMark";
import type { IAutoMovieConstructionCurve } from "./IAutoMovieConstructionCurve";

/**
 * Turn the construction curves of one built form into inspection marks that follow the scene object the form was built into.
 *
 * Each curve becomes one polyline mark, closed for a section ring, of kind `curve/section`, `curve/guide` or `curve/axis`. Its path is `anchor` followed by the curve's `id`, such as `hero/torso/section/3`, so a pattern that selects the form's object selects its curves, and one pattern can name one ring. The curve's points are the form at rest in the object's local frame, which is why the object is the anchor. A curve the sampler flagged stays flagged.
 *
 * | Kind | Label | Colour |
 * | --- | --- | --- |
 * | `curve/section` | `section curve` | Blue `59a0f4` |
 * | `curve/guide` | `guide curve` | Green `59cb89` |
 * | `curve/axis` | `axis curve` | Cyan `00e5ff` |
 *
 * ```ts
 * const marks = markAutoMovieConstructionCurves(
 *   sampleAutoMovieConstructionCurves(realization),
 *   "hero",
 * );
 * ```
 *
 * @param curves The curves of one form, as `sampleAutoMovieConstructionCurves` returns them.
 * @param anchor Path of the scene object the form was built into, or the empty string for the scene root.
 * @returns One mark per curve, in the curves' order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each curve becomes, the kind, path, frame and flag rules, tabulates each kind's label and colour, and shows the call beside the sampler.
 * @evidence contracts/development/implementation.md#principled-implementation The sampler reads a realization in its object's frame at rest, so each curve keeps its points untouched and names that object as its anchor; the curve's id already carries its part and ordinal, so the path is the anchor's path followed by the id.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the curves with one fixed table of the three kinds' legend entries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colours are the hues the inspection has always drawn these kinds in, one per kind so none can be mistaken for another, and no part or chain name is read.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the curves; each mark shares its curve's point array instead of copying it.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of its arguments that coordinates nothing across calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The marks borrow the curves' point arrays, so a caller that changes a curve changes its mark; nothing else is kept.
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

/** Legend text and colour of each curve kind, keyed so the compiler refuses a kind without one. */
const LEGEND: Readonly<
  Record<IAutoMovieConstructionCurve.Kind, { label: string; color: number }>
> = {
  section: { label: "section curve", color: 0x59a0f4 },
  guide: { label: "guide curve", color: 0x59cb89 },
  axis: { label: "axis curve", color: 0x00e5ff },
};
