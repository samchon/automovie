import type { IAutoMovieMark } from "@automovie/interface";
import { AutoMovieRenderInspectionMaterial } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `resolveInspectionColors` settles the legend entry of each mark
 * kind.
 *
 * Scenarios:
 *
 * 1. Each kind takes the label and colour its marks carry, and a request colour
 *    whose pattern matches the kind replaces it, the last match winning.
 * 2. A kind given two different legend entries is refused.
 * 3. A kind whose colour is a reserved one is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe recorded legend facts, ordered override rules, conflicting entries and reserved colors.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that a kind retains its legend entry with the last matching color override, and refuses conflicting or reserved entries.
 * @evidence contracts/development/testing.md#independent-expectations Uses fixed marks and a specified set of color patterns to write the final legend entries independently.
 */
export function test_render_scene_resolve_inspection_colors(): void {
  const mark = (kind: string, label: string, color: number): IAutoMovieMark => ({
    path: `${kind}/0`,
    kind,
    label,
    color,
    shape: { type: "points", points: [0, 0, 0] },
    flagged: false,
    anchor: null,
  });
  const resolved: Map<string, { label: string; color: number }> =
    AutoMovieRenderInspectionMaterial.resolveColors({
      marks: [mark("curve", "Curve", 0x00ff00), mark("joint", "Joint", 0x0000ff)],
      reserved: [{ use: "the flag", color: 0xff00ff }],
      recolor: [
        { pattern: "curve", color: 0x111111 },
        { pattern: "curve", color: 0x222222 },
      ],
    });
  TestValidator.equals("settled", [...resolved], [
    ["curve", { label: "Curve", color: 0x222222 }],
    ["joint", { label: "Joint", color: 0x0000ff }],
  ]);
  TestValidator.error("two entries", (): void => {
    AutoMovieRenderInspectionMaterial.resolveColors({
      marks: [mark("curve", "Curve", 0x00ff00), mark("curve", "Bend", 0x00ff00)],
      reserved: [],
      recolor: [],
    });
  });
  TestValidator.error("reserved colour", (): void => {
    AutoMovieRenderInspectionMaterial.resolveColors({
      marks: [mark("curve", "Curve", 0xff00ff)],
      reserved: [{ use: "the flag", color: 0xff00ff }],
      recolor: [],
    });
  });
}