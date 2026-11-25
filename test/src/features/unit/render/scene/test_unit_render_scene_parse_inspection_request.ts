import type { IAutoMovieInspectionRequest } from "@automovie/interface";
import { parseAutoMovieInspectionRequest } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `parseAutoMovieInspectionRequest` reads an inspection request from named
 * text values.
 *
 * Scenarios:
 *
 * 1. With no key present the request is the beauty shade, surface on, x-ray
 *    off, stroke 3, reach 1 s and 5 ticks, with no pattern, sliver or section.
 * 2. Present keys are read: comma lists, a shade, a switch off with `0`, a
 *    switch on with the empty string, numbers and a colour assignment.
 * 3. An unknown shade, a zero stroke and a switch that is neither on nor off
 *    are refused.
 */
export function test_unit_render_scene_parse_inspection_request(): void {
  const read = (entries: [string, string][]): IAutoMovieInspectionRequest => {
    const values: Map<string, string> = new Map<string, string>(entries);
    return parseAutoMovieInspectionRequest((key: string): string | undefined =>
      values.get(key),
    );
  };

  const absent: IAutoMovieInspectionRequest = read([]);
  TestValidator.equals(
    "absent",
    {
      parts: absent.parts,
      hide: absent.hide,
      shade: absent.shade,
      surface: absent.surface,
      marks: absent.marks,
      sliver: absent.sliver,
      section: absent.section,
      xray: absent.xray,
      stroke: absent.stroke,
      reach: absent.reach,
      ticks: absent.ticks,
    },
    {
      parts: [],
      hide: [],
      shade: "beauty",
      surface: true,
      marks: [],
      sliver: null,
      section: null,
      xray: false,
      stroke: 3,
      reach: 1,
      ticks: 5,
    },
  );

  const given: IAutoMovieInspectionRequest = read([
    ["parts", "hero,lamp"],
    ["shade", "depth"],
    ["surface", "0"],
    ["xray", ""],
    ["stroke", "4"],
    ["color", "hero=ff8800"],
    ["reach", "2"],
  ]);
  TestValidator.equals(
    "given",
    {
      parts: given.parts,
      shade: given.shade,
      surface: given.surface,
      xray: given.xray,
      stroke: given.stroke,
      color: given.color,
      reach: given.reach,
    },
    {
      parts: ["hero", "lamp"],
      shade: "depth",
      surface: false,
      xray: true,
      stroke: 4,
      color: [{ pattern: "hero", color: 0xff8800 }],
      reach: 2,
    },
  );

  for (const bad of [
    ["shade", "shiny"],
    ["stroke", "0"],
    ["xray", "maybe"],
  ] satisfies [string, string][])
    TestValidator.error(JSON.stringify(bad), (): void => {
      read([bad]);
    });
}