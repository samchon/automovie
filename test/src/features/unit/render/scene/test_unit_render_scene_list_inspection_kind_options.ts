import { listAutoMovieInspectionKindOptions } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `listAutoMovieInspectionKindOptions` lists the mark kinds an inspection may
 * ask for, with their colours.
 *
 * Scenarios:
 *
 * 1. A mark's own kind comes first with the colour the mark carries, ahead of
 *    the measured kinds the palette lists.
 * 2. The sliver defect is listed only when a sliver limit is requested, and
 *    trail kinds only when a trail is requested.
 * 3. A declared kind that is not already listed is added without a colour.
 */
export function test_unit_render_scene_list_inspection_kind_options(): void {
  const mark = {
    path: "curve/0",
    kind: "curve/section",
    label: "Section",
    color: 0x123456,
    shape: { type: "points" as const, points: [0, 0, 0] },
    flagged: false,
    anchor: null,
  };
  const plain = listAutoMovieInspectionKindOptions(
    { request: { sliver: null, trail: [] }, marks: [mark] },
    ["custom"],
  );
  const kinds: string[] = [...plain.keys()];
  TestValidator.equals("first", kinds[0], "curve/section");
  TestValidator.equals("colour", plain.get("curve/section"), 0x123456);
  TestValidator.equals("declared", plain.get("custom"), undefined);
  TestValidator.equals("declared is listed", kinds.includes("custom"), true);
  TestValidator.equals("sliver off", kinds.includes("defect/sliver"), false);
  TestValidator.equals(
    "trail off",
    kinds.some((kind: string): boolean => kind.startsWith("trail")),
    false,
  );
  const asked = listAutoMovieInspectionKindOptions({
    request: { sliver: 10, trail: ["hero"] },
    marks: [],
  });
  TestValidator.equals("sliver on", asked.has("defect/sliver"), true);
  TestValidator.equals(
    "trail on",
    [...asked.keys()].some((kind: string): boolean => kind.startsWith("trail")),
    true,
  );
}