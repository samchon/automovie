import { type IAutoMoviePatternPlacement, type IAutoMoviePatternPoint, type IAutoMovieSurfacePattern, type IAutoMovieSurfacePatternResult, generateAutoMovieSurfacePattern } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { pattern, rectangle, zone } from "../internal/patternFixtures";
import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * A module program laid over a real region, in a fixed order, twice.
 *
 * The authored lattice must include modules intersecting the region, omit zero-area neighbors and retain row-major occurrence order. The test compares two numerical records in this process; it does not compare operating systems.
 *
 * A 2 by 1 metre field admits eight half-metre squares. Narrowing its width to 1.75 metres retains the last two modules as halves rather than dropping them.
 *
 * Scenarios:
 *
 * 1. Eight modules are laid in row-major cell order, and their occurrence ids
 *    carry both the zone and the generator's own module id.
 * 2. Every module is whole: coverage one, area 0.25 m², cut `none`, and the zone's
 *    material rides along on each occurrence.
 * 3. Cells whose modules fall entirely outside the region contribute nothing, even
 *    though the lattice was enumerated over them.
 * 4. Re-running the same declaration preserves structure and numeric components.
 * 5. Narrowing the region to 1.75 m cuts the last module of every course to half,
 *    marks it `boundary`, and leaves the whole ones untouched.
 * 6. A generator that lays nothing produces no occurrences, no waste ratio, and no
 *    findings, rather than a run that divides by zero.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual pattern generation and observes ordered occurrence ids, whole/cut classification, material, outlines, centres, coverage/take-off and repeated structural/numeric output. It catches under-enumeration, outside zero-area pieces, lost cuts and nonfinite empty-generation quantities.
 * @evidence contracts/testing.md#independent-expectations Four columns by two rows of 0.5 metre squares independently give eight pieces, 0.25 square metres each and two square metres total. Removing 0.25 metre width cuts two pieces in half, giving 1.75 covered, two consumed and 0.25 wasted square metres; authored lattice centres and ids supply the order oracle rather than a saved layout.
 * @evidence contracts/testing.md#distinguishing-cases Retains whole tiling, outside-neighbor omission, same-input repetition, half-cut boundary pieces and an empty generator whose uncovered region remains joint area. Exclusion holes, invalid generators, joint defects and arbitrary geometry are owned by companion pattern entries; same-process repetition alone proves no cross-platform identity.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_surface_pattern_courses entry owns all cases and calls portable generation with shared authored rectangle/module fixtures; it installs no consumer, builds no artifact and starts no process, browser or GPU.
 */
export function test_architecture_surface_pattern_courses(): void {
  const field: IAutoMovieSurfacePattern = pattern();
  const laid: IAutoMovieSurfacePatternResult = generateAutoMovieSurfacePattern({ pattern: field });

  TestValidator.equals(
    "modules are laid in row-major cell order under a zone-scoped identity",
    laid.placements.map((one: IAutoMoviePatternPlacement) : string => one.id),
    [
      "field/t-0-0",
      "field/t-1-0",
      "field/t-2-0",
      "field/t-3-0",
      "field/t-0-1",
      "field/t-1-1",
      "field/t-2-1",
      "field/t-3-1",
    ],
  );

  TestValidator.equals(
    "every module of an exactly divisible field is whole",
    namedFacts([
      ["count", () : boolean => laid.placements.length === 8],
      ["cuts", () : boolean => laid.placements.every((one: IAutoMoviePatternPlacement) : boolean => one.cut === "none")],
      [
        "coverage",
        () : boolean => laid.placements.every((one: IAutoMoviePatternPlacement) : boolean => nclose(one.coverage, 1, 1e-12)),
      ],
      [
        "areas",
        () : boolean => laid.placements.every((one: IAutoMoviePatternPlacement) : boolean => nclose(one.area, 0.25, 1e-12)),
      ],
      [
        "material",
        () : boolean => laid.placements.every((one: IAutoMoviePatternPlacement) : boolean => one.material === "tile-surface"),
      ],
      [
        "zone",
        () : boolean =>
          laid.placements.every(
            (one: IAutoMoviePatternPlacement) : boolean => one.zone === "field" && one.module.startsWith("t-"),
          ),
      ],
      [
        "outlines",
        () : boolean => laid.placements.every((one: IAutoMoviePatternPlacement) : boolean => one.outline.length === 4),
      ],
      [
        "untouched",
        () : boolean => laid.placements.every((one: IAutoMoviePatternPlacement) : boolean => nclose(one.punchedArea, 0, 0)),
      ],
      [
        "firstCentre",
        () : boolean =>
          nclose(laid.placements[0]!.center.u, 0.25, 1e-12) &&
          nclose(laid.placements[0]!.center.v, 0.25, 1e-12),
      ],
      [
        "lastCentre",
        () : boolean =>
          nclose(laid.placements[7]!.center.u, 1.75, 1e-12) &&
          nclose(laid.placements[7]!.center.v, 0.75, 1e-12),
      ],
    ]),
    {
      count: true,
      cuts: true,
      coverage: true,
      areas: true,
      material: true,
      zone: true,
      outlines: true,
      untouched: true,
      firstCentre: true,
      lastCentre: true,
    },
  );

  TestValidator.equals(
    "the take-off of an exactly divisible field wastes nothing",
    namedFacts([
      ["modules", () : boolean => laid.quantities.modules === 8],
      ["whole", () : boolean => laid.quantities.whole === 8],
      ["cut", () : boolean => laid.quantities.cut === 0],
      ["covered", () : boolean => nclose(laid.quantities.coveredArea, 2, 1e-12)],
      ["consumed", () : boolean => nclose(laid.quantities.consumedArea, 2, 1e-12)],
      ["waste", () : boolean => nclose(laid.quantities.wasteArea, 0, 1e-12)],
      ["ratio", () : boolean => nclose(laid.quantities.wasteRatio, 0, 1e-12)],
      ["net", () : boolean => nclose(laid.quantities.netRegionArea, 2, 1e-12)],
      ["jointArea", () : boolean => nclose(laid.quantities.jointArea, 0, 1e-12)],
      ["jointLength", () : boolean => nclose(laid.quantities.jointLength, 0, 0)],
      ["findings", () : boolean => laid.findings.length === 0],
    ]),
    {
      modules: true,
      whole: true,
      cut: true,
      covered: true,
      consumed: true,
      waste: true,
      ratio: true,
      net: true,
      jointArea: true,
      jointLength: true,
      findings: true,
    },
  );

  TestValidator.predicate(
    "the same declaration laid twice preserves structure and numeric components",
    test12ValuesClose(generateAutoMovieSurfacePattern({ pattern: field }), laid),
  );

  const narrow: IAutoMovieSurfacePatternResult = generateAutoMovieSurfacePattern({
    pattern: pattern({
      zones: [zone({ region: rectangle(0, 0, 1.75, 1) })],
      minimumPiece: 0.4,
    }),
  });
  TestValidator.equals(
    "a region that does not divide cuts the last module of every course",
    namedFacts([
      ["count", () : boolean => narrow.placements.length === 8],
      [
        "kinds",
        () : boolean =>
          narrow.placements.map((one: IAutoMoviePatternPlacement) : "none" | "boundary" | "exclusion" | "both" => one.cut).join() ===
          "none,none,none,boundary,none,none,none,boundary",
      ],
      [
        "coverage",
        () : boolean =>
          nclose(narrow.placements[3]!.coverage, 0.5, 1e-12) &&
          nclose(narrow.placements[7]!.coverage, 0.5, 1e-12),
      ],
      ["area", () : boolean => nclose(narrow.placements[3]!.area, 0.125, 1e-12)],
      ["covered", () : boolean => nclose(narrow.quantities.coveredArea, 1.75, 1e-12)],
      ["consumed", () : boolean => nclose(narrow.quantities.consumedArea, 2, 1e-12)],
      ["waste", () : boolean => nclose(narrow.quantities.wasteArea, 0.25, 1e-12)],
      ["ratio", () : boolean => nclose(narrow.quantities.wasteRatio, 0.125, 1e-12)],
      ["net", () : boolean => nclose(narrow.quantities.netRegionArea, 1.75, 1e-12)],
      ["whole", () : boolean => narrow.quantities.whole === 6],
      ["cutCount", () : boolean => narrow.quantities.cut === 2],
      [
        "outlineTrimmed",
        () : boolean =>
          narrow.placements[3]!.outline.every(
            (point: IAutoMoviePatternPoint) : boolean => point.u <= 1.75 + 1e-12,
          ),
      ],
    ]),
    {
      count: true,
      kinds: true,
      coverage: true,
      area: true,
      covered: true,
      consumed: true,
      waste: true,
      ratio: true,
      net: true,
      whole: true,
      cutCount: true,
      outlineTrimmed: true,
    },
  );

  const barren: IAutoMovieSurfacePatternResult = generateAutoMovieSurfacePattern({
    pattern: pattern({ zones: [zone({ generate: () : never[] => [] })] }),
  });
  TestValidator.equals(
    "an empty program retains region accounting with zero consumption and waste ratio",
    namedFacts([
      ["placements", () : boolean => barren.placements.length === 0],
      ["modules", () : boolean => barren.quantities.modules === 0],
      ["consumed", () : boolean => nclose(barren.quantities.consumedArea, 0, 0)],
      ["ratio", () : boolean => nclose(barren.quantities.wasteRatio, 0, 0)],
      ["net", () : boolean => nclose(barren.quantities.netRegionArea, 2, 1e-12)],
      ["jointArea", () : boolean => nclose(barren.quantities.jointArea, 2, 1e-12)],
      ["findings", () : boolean => barren.findings.length === 0],
      ["zones", () : boolean => barren.quantities.zones.length === 1],
    ]),
    {
      placements: true,
      modules: true,
      consumed: true,
      ratio: true,
      net: true,
      jointArea: true,
      findings: true,
      zones: true,
    },
  );
}
