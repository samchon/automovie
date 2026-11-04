import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { HumanDebugViewParts } from "./HumanDebugViewParts";

/** The pack's region labels by the names `referencePart` reads them by. */
const ALIASES: Readonly<Record<string, string>> = {
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
 * the box of its loft's outline edges over all its stations, in person millimetres, widened by
 * {@link MARGIN} mm. `*` draws the whole reference.
 *
 * @param patterns The `referencePart` globs.
 * @param built The person's parts.
 * @returns Whether a point of a region, pack mm, is drawn.
 */
export function HumanDebugReferencePieces(
  patterns: readonly string[],
  built: HumanDebugViewParts.IOutput,
): (region: string, x: number, y: number, z: number) => boolean {
  const whole: Set<string> = new Set(
    Object.entries(ALIASES)
      .filter(([label, alias]: [string, string]): boolean => HumanDebugPattern.matches(label, patterns, "") || HumanDebugPattern.matches(alias, patterns, ""))
      .map(([label]: [string, string]): string => label),
  );
  const boxes: [number[], number[]][] = [];
  for (const p of built.parts) {
    if (!HumanDebugPattern.matches(p.name, patterns, "") || p.loft.sections.length === 0) continue;
    const low: number[] = [Infinity, Infinity, Infinity];
    const high: number[] = [-Infinity, -Infinity, -Infinity];
    for (const s of p.loft.sections) {
      const e: readonly number[] = s.section.box.extents;
      const touches: [readonly number[], number][] = [
        [s.frame.u, e[0]!],
        [s.frame.v, e[1]!],
        [s.frame.u, -e[2]!],
        [s.frame.v, -e[3]!],
      ];
      for (const [d, r] of touches)
        for (let c: number = 0; c < 3; c++) {
          const value: number = (s.frame.origin[c]! + d[c]! * r) * built.scale;
          low[c] = Math.min(low[c]!, value);
          high[c] = Math.max(high[c]!, value);
        }
    }
    boxes.push([low.map((v: number): number => v - MARGIN), high.map((v: number): number => v + MARGIN)]);
  }
  return (region: string, x: number, y: number, z: number): boolean =>
    whole.has(region) ||
    boxes.some(([low, high]: [number[], number[]]): boolean => x >= low[0]! && x <= high[0]! && y >= low[1]! && y <= high[1]! && z >= low[2]! && z <= high[2]!);
}
