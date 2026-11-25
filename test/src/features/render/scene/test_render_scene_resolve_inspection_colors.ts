import type { IAutoMovieMark } from "@automovie/interface";
import { resolveAutoMovieInspectionColors } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `resolveAutoMovieInspectionColors` settles the legend entry of each mark
 * kind.
 *
 * Scenarios:
 *
 * 1. Each kind takes the label and colour its marks carry, and a request colour
 *    whose pattern matches the kind replaces it, the last match winning.
 * 2. A kind given two different legend entries is refused.
 * 3. A kind whose colour is a reserved one is refused.
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
    resolveAutoMovieInspectionColors({
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
    resolveAutoMovieInspectionColors({
      marks: [mark("curve", "Curve", 0x00ff00), mark("curve", "Bend", 0x00ff00)],
      reserved: [],
      recolor: [],
    });
  });
  TestValidator.error("reserved colour", (): void => {
    resolveAutoMovieInspectionColors({
      marks: [mark("curve", "Curve", 0xff00ff)],
      reserved: [{ use: "the flag", color: 0xff00ff }],
      recolor: [],
    });
  });
}