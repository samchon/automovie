import { HumanInspectionPattern } from "./HumanInspectionPattern";
import type { IHumanInspectionDocument } from "./IHumanInspectionDocument";

/** Exact reference labels and aliases; native body stays body rather than a pack region. */
const ALIASES: Readonly<Record<string, string>> = {
  body: "body",
  trunk: "trunk",
  head: "head",
  arm_l: "arm.left",
  arm_r: "arm.right",
  hand_l: "hand.left",
  hand_r: "hand.right",
  leg_l: "leg.left",
  leg_r: "leg.right",
  foot_l: "foot.left",
  foot_r: "foot.right",
};

/** Margin about a part's box within which the reference is drawn for it, mm. */
const MARGIN: number = 15;

/**
 * Which points of the reference the comparison draws, from the `referencePart` globs.
 *
 * A glob that names a region of the pack (`trunk`, `head`, `arm.left`, `hand.right`, `leg.left`,
 * `foot.right`, or the pack's own label such as `leg_l`) draws that region whole. A glob that names
 * a compared part (`nose`, `breast.left`, `lid.*`) draws every region's skin within that part's box:
 * the box of its displayed source curves, including source edges whose loft sections failed, in person millimetres, widened by
 * {@link MARGIN} mm. Native `body` selects only that exact mesh; pack `trunk` does not rename it.
 * `*` draws the whole reference.
 *
 * @param patterns The `referencePart` globs.
 * @param curves The person's displayed view curves in metres, before visibility selection.
 * @returns Whether a point of a region, pack mm, is drawn.
 *
 * @evidence contracts/common.md#principled-implementation Region names select whole private regions; compared-part names select their actual displayed source-curve bounds, so section rejection cannot remove a valid original outline's reference crop.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the curve producer's coordinates instead of evaluating or reconstructing a second outline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds only the existing 15 mm display margin and no generated shape, missing curve or fitted source coordinate.
 * @evidence contracts/common.md#meaningful-documentation States metre input, millimetre crop space, source ownership and whole-region aliases.
 * @evidence contracts/performance.md#efficient-algorithms One O(P) pass groups P curve points by part; each returned predicate call tests at most B selected part boxes after the whole-region set lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Borrows the already drawn source coordinates and calculates each selected part's box once for this request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains only whole-region names and O(B) fresh boxes, not source curves, lofts, file records or renderer resources.
 */
export function HumanInspectionReferencePieces(
  patterns: readonly string[],
  curves: readonly IHumanInspectionDocument.ICurve[],
): (region: string, x: number, y: number, z: number) => boolean {
  const whole: Set<string> = new Set(
    Object.entries(ALIASES)
      .filter(
        ([label, alias]: [string, string]): boolean =>
          HumanInspectionPattern.matches(label, patterns, "") ||
          HumanInspectionPattern.matches(alias, patterns, ""),
      )
      .map(([label]: [string, string]): string => label),
  );
  const grouped: Map<string, [number[], number[]]> = new Map();
  const prefix: string = "human.construction.view.";
  for (const curve of curves) {
    if (!curve.id.startsWith(prefix)) continue;
    const name: string = curve.id.slice(
      prefix.length,
      curve.id.lastIndexOf("/"),
    );
    if (!HumanInspectionPattern.matches(name, patterns, "")) continue;
    const [low, high]: [number[], number[]] = grouped.get(name) ?? [
      [Infinity, Infinity, Infinity],
      [-Infinity, -Infinity, -Infinity],
    ];
    for (const point of curve.points)
      for (let c: number = 0; c < 3; c++) {
        const value: number = point[c]! * 1000;
        low[c] = Math.min(low[c]!, value);
        high[c] = Math.max(high[c]!, value);
      }
    if (low.every(Number.isFinite) && high.every(Number.isFinite))
      grouped.set(name, [low, high]);
  }
  const boxes: [number[], number[]][] = [...grouped.values()].map(
    ([low, high]: [number[], number[]]): [number[], number[]] => [
      low.map((v: number): number => v - MARGIN),
      high.map((v: number): number => v + MARGIN),
    ],
  );
  return (region: string, x: number, y: number, z: number): boolean =>
    whole.has(region) ||
    boxes.some(
      ([low, high]: [number[], number[]]): boolean =>
        x >= low[0]! &&
        x <= high[0]! &&
        y >= low[1]! &&
        y <= high[1]! &&
        z >= low[2]! &&
        z <= high[2]!,
    );
}
