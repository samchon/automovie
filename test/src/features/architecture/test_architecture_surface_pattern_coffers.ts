import type { IAutoMovieExplicitInstanceTransform } from "@automovie/interface";
import {
  type IAutoMoviePatternFinding, type IAutoMoviePatternInstancing, type IAutoMoviePatternPlacement, type IAutoMoviePatternZoneQuantities, type IAutoMovieSurfacePatternResult,
  type IAutoMoviePatternPoint,
  type IAutoMovieSurfacePatternZone,
  Quaternion,
  autoMoviePatternInstanceTransforms,
  generateAutoMovieSurfacePattern,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { pattern, rectangle, zone } from "../internal/patternFixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

/** The ceiling face: local U runs east, local V runs north, the normal is down. */
const CEILING: { origin: { x: number; y: number; z: number; }; u: { x: number; y: number; z: number; }; v: { x: number; y: number; z: number; }; } = {
  origin: { x: 0, y: 3, z: 0 },
  u: { x: 1, y: 0, z: 0 },
  v: { x: 0, y: 0, z: 1 },
};

/** One coffer per lattice cell, on the 0.5 m grid the whole ceiling shares. */
const coffers: (id: string, region: IAutoMoviePatternPoint[], material: string) => IAutoMovieSurfacePatternZone = (
  id: string,
  region: IAutoMoviePatternPoint[],
  material: string,
): IAutoMovieSurfacePatternZone =>
  zone({
    id,
    region,
    origin: { u: 0.25, v: 0.25 },
    period: { u: 0.5, v: 0.5 },
    reach: { u: 0.5, v: 0.5 },
    material,
    generate: ({ column, row, origin }: { column: number; row: number; origin: IAutoMoviePatternPoint; period: { u: number; v: number; }; }) : { id: string; center: { u: number; v: number; }; size: { u: number; v: number; }; rotationDeg: number; grainDeg: number; mirror: false; }[] => [
      {
        id: `c${column},${row}`,
        center: { u: origin.u + 0.25, v: origin.v + 0.25 },
        size: { u: 0.5, v: 0.5 },
        rotationDeg: 0,
        grainDeg: 0,
        mirror: false,
      },
    ],
  });

/** One mitred length of moulding, cut to its own trapezoid of the border. */
const moulding: (id: string, region: IAutoMoviePatternPoint[], center: IAutoMoviePatternPoint, length: number, rotationDeg: number) => IAutoMovieSurfacePatternZone = (
  id: string,
  region: IAutoMoviePatternPoint[],
  center: IAutoMoviePatternPoint,
  length: number,
  rotationDeg: number,
): IAutoMovieSurfacePatternZone =>
  zone({
    id,
    region,
    origin: { u: 0, v: 0 },
    period: { u: 10, v: 10 },
    reach: { u: 3.1, v: 2.1 },
    material: "moulding",
    generate: ({ column, row }: { column: number; row: number; origin: IAutoMoviePatternPoint; period: { u: number; v: number; }; }) : { id: string; center: IAutoMoviePatternPoint; size: { u: number; v: number; }; rotationDeg: number; grainDeg: number; mirror: false; }[] =>
      column !== 0 || row !== 0
        ? []
        : [
            {
              id: "trim",
              center,
              size: { u: length, v: 0.25 },
              rotationDeg,
              grainDeg: rotationDeg,
              mirror: false,
            },
          ],
  });

const ceiling: (minimumPiece: number) => IAutoMovieSurfacePatternResult = (minimumPiece: number) : IAutoMovieSurfacePatternResult =>
  generateAutoMovieSurfacePattern({
    pattern: pattern({
      id: "coffered-ceiling",
      zones: [
        moulding(
          "border-south",
          [
            { u: 0, v: 0 },
            { u: 3, v: 0 },
            { u: 2.75, v: 0.25 },
            { u: 0.25, v: 0.25 },
          ],
          { u: 1.5, v: 0.125 },
          3,
          0,
        ),
        moulding(
          "border-east",
          [
            { u: 3, v: 0 },
            { u: 3, v: 2 },
            { u: 2.75, v: 1.75 },
            { u: 2.75, v: 0.25 },
          ],
          { u: 2.875, v: 1 },
          2,
          90,
        ),
        moulding(
          "border-north",
          [
            { u: 0, v: 2 },
            { u: 0.25, v: 1.75 },
            { u: 2.75, v: 1.75 },
            { u: 3, v: 2 },
          ],
          { u: 1.5, v: 1.875 },
          3,
          0,
        ),
        moulding(
          "border-west",
          [
            { u: 0, v: 0 },
            { u: 0.25, v: 0.25 },
            { u: 0.25, v: 1.75 },
            { u: 0, v: 2 },
          ],
          { u: 0.125, v: 1 },
          2,
          90,
        ),
        coffers("field-west", rectangle(0.25, 0.25, 1.25, 1.75), "coffer"),
        coffers("field-east", rectangle(1.75, 0.25, 2.75, 1.75), "coffer"),
        coffers("field-south", rectangle(1.25, 0.25, 1.75, 0.75), "coffer"),
        coffers("field-north", rectangle(1.25, 1.25, 1.75, 1.75), "coffer"),
        coffers("inlay", rectangle(1.25, 0.75, 1.75, 1.25), "rosette"),
      ],
      minimumPiece,
    }),
  });

/**
 * Lay nine authored ceiling regions as mitred borders, square field modules and a distinct centre material.
 *
 * Four trapezoid border regions surround four field regions and one inlay. Every piece is input to the general pattern generator; the test observes clipped quantities and ordinary instance transforms without adding a product catalogue or judging appearance.
 *
 * A 3 by 2 metre ceiling with a 0.25 metre border leaves a 2.5 by 1.5 metre field, comprising fifteen half-metre squares including the inlay.
 *
 * Scenarios:
 *
 * 1. Nineteen pieces are laid: four mouldings the mitre cuts and fifteen whole
 *    coffers, the middle one of them carrying the inlay's own material.
 * 2. The nine regions cover the ceiling exactly: 6 m² laid out of 6.25 m² of
 *    material, a quarter of a square metre of offcut, and no joint area left
 *    over at a zero joint.
 * 3. Every zone is reported apart, in declaration order, with its own share.
 * 4. Nothing overlaps and no joint deviates: the mitres meet, the coffers meet
 *    each other across all five field regions, and the field meets the border.
 * 5. Mitred mouldings retain seven eighths or eleven twelfths of their original
 *    area, so a minimum piece of nine tenths turns the two short ones into
 *    slivers while the two long ones stay: the boundary either side of the
 *    rule.
 * 6. The fifteen coffers become fifteen instance slots hanging from the ceiling
 *    frame, and the four cut mouldings are named instead of being scaled into
 *    the wrong shape.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates the actual nine-zone pattern and its instance transforms, observing occurrence/material identities, zone order, covered/consumed/waste areas, absence of overlap/joint findings, threshold-sensitive slivers and refusal to instance clipped mouldings as full rectangles.
 * @evidence contracts/testing.md#independent-expectations Authored trapezoids have areas 0.6875 for each long border and 0.4375 for each short border; fifteen 0.25 square metre squares complete six covered square metres from 6.25 consumed. Short mitres retain 7/8 and long mitres 11/12, placing only the short pair below 0.9. The literal ceiling frame supplies metre positions and downward normal independently of generated transforms.
 * @evidence contracts/testing.md#distinguishing-cases Retains four clipped borders, fourteen field pieces plus one distinct inlay, per-zone take-off, minimum-piece values 0.8 and 0.9, fifteen whole instance slots and four separately named cut pieces. Arbitrary invalid patterns and GPU appearance are outside this entry; quaternion-vector observation uses the shared math reader rather than independently verifying that reader.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_surface_pattern_coffers entry owns local generators and assertions over portable engine functions; it starts no process, browser or GPU, builds no artifact and dynamically registers no case.
 */
export function test_architecture_surface_pattern_coffers(): void {
  const laid: IAutoMovieSurfacePatternResult = ceiling(0.8);

  TestValidator.equals(
    "the border is cut by its own mitre and every coffer is laid whole",
    laid.placements.map((one: IAutoMoviePatternPlacement) : string => `${one.id}:${one.cut}`),
    [
      "border-south/trim:boundary",
      "border-east/trim:boundary",
      "border-north/trim:boundary",
      "border-west/trim:boundary",
      "field-west/c0,0:none",
      "field-west/c1,0:none",
      "field-west/c0,1:none",
      "field-west/c1,1:none",
      "field-west/c0,2:none",
      "field-west/c1,2:none",
      "field-east/c3,0:none",
      "field-east/c4,0:none",
      "field-east/c3,1:none",
      "field-east/c4,1:none",
      "field-east/c3,2:none",
      "field-east/c4,2:none",
      "field-south/c2,0:none",
      "field-north/c2,2:none",
      "inlay/c2,1:none",
    ],
  );

  TestValidator.equals(
    "the nine regions cover the ceiling exactly once and say what it cost",
    namedFacts([
      ["modules", () : boolean => laid.quantities.modules === 19],
      ["whole", () : boolean => laid.quantities.whole === 15],
      ["cut", () : boolean => laid.quantities.cut === 4],
      ["covered", () : boolean => nclose(laid.quantities.coveredArea, 6, 1e-12)],
      ["net", () : boolean => nclose(laid.quantities.netRegionArea, 6, 1e-12)],
      ["consumed", () : boolean => nclose(laid.quantities.consumedArea, 6.25, 1e-12)],
      ["waste", () : boolean => nclose(laid.quantities.wasteArea, 0.25, 1e-12)],
      ["ratio", () : boolean => nclose(laid.quantities.wasteRatio, 0.04, 1e-12)],
      ["jointArea", () : boolean => nclose(laid.quantities.jointArea, 0, 1e-12)],
      ["jointLength", () : boolean => nclose(laid.quantities.jointLength, 0, 0)],
      [
        "inlayMaterial",
        () : boolean =>
          laid.placements.filter((one: IAutoMoviePatternPlacement) : boolean => one.material === "rosette").length ===
          1,
      ],
      [
        "coffered",
        () : boolean =>
          laid.placements.filter((one: IAutoMoviePatternPlacement) : boolean => one.material === "coffer").length ===
          14,
      ],
    ]),
    {
      modules: true,
      whole: true,
      cut: true,
      covered: true,
      net: true,
      consumed: true,
      waste: true,
      ratio: true,
      jointArea: true,
      jointLength: true,
      inlayMaterial: true,
      coffered: true,
    },
  );

  TestValidator.equals(
    "every zone is reported apart, in declaration order",
    laid.quantities.zones.map((one: IAutoMoviePatternZoneQuantities) : string => `${one.zone}:${one.modules}`),
    [
      "border-south:1",
      "border-east:1",
      "border-north:1",
      "border-west:1",
      "field-west:6",
      "field-east:6",
      "field-south:1",
      "field-north:1",
      "inlay:1",
    ],
  );
  TestValidator.equals(
    "each border length keeps the area its own mitre left it",
    namedFacts([
      [
        "long",
        () : boolean =>
          nclose(laid.quantities.zones[0]!.coveredArea, 0.6875, 1e-12) &&
          nclose(laid.quantities.zones[2]!.coveredArea, 0.6875, 1e-12),
      ],
      [
        "short",
        () : boolean =>
          nclose(laid.quantities.zones[1]!.coveredArea, 0.4375, 1e-12) &&
          nclose(laid.quantities.zones[3]!.coveredArea, 0.4375, 1e-12),
      ],
      [
        "field",
        () : boolean =>
          nclose(laid.quantities.zones[4]!.coveredArea, 1.5, 1e-12) &&
          nclose(laid.quantities.zones[5]!.coveredArea, 1.5, 1e-12),
      ],
      [
        "inlay",
        () : boolean => nclose(laid.quantities.zones[8]!.coveredArea, 0.25, 1e-12),
      ],
    ]),
    { long: true, short: true, field: true, inlay: true },
  );

  TestValidator.equals(
    "the mitres meet, the coffers meet, and the field meets the border",
    laid.findings.length,
    0,
  );

  TestValidator.equals(
    "a mitre leaves the short lengths just under nine tenths and the long ones over",
    ceiling(0.9).findings.map((one: IAutoMoviePatternFinding) : string => `${one.kind}:${one.occurrences.join()}`),
    ["sliver:border-east/trim", "sliver:border-west/trim"],
  );

  const hung: IAutoMoviePatternInstancing = autoMoviePatternInstanceTransforms({
    result: laid,
    frame: CEILING,
    thickness: 0.08,
  });
  TestValidator.equals(
    "the coffers hang from the ceiling and the cut mouldings are named",
    namedFacts([
      ["slots", () : boolean => hung.transforms.length === 15],
      [
        "cut",
        () : boolean =>
          hung.cut.join() ===
          [
            "border-south/trim",
            "border-east/trim",
            "border-north/trim",
            "border-west/trim",
          ].join(),
      ],
      [
        "first",
        () : boolean => vclose(hung.transforms[0]!.translation, { x: 0.5, y: 3, z: 0.5 }),
      ],
      [
        "inlay",
        () : boolean =>
          hung.transforms[14]!.id === "inlay/c2,1" &&
          vclose(hung.transforms[14]!.translation, { x: 1.5, y: 3, z: 1 }),
      ],
      [
        "downward",
        () : boolean =>
          hung.transforms.every((one: IAutoMovieExplicitInstanceTransform) : boolean =>
            vclose(
              Quaternion.rotateVector(one.rotation, { x: 0, y: 0, z: 1 }),
              { x: 0, y: -1, z: 0 },
            ),
          ),
      ],
      [
        "depth",
        () : boolean =>
          hung.transforms.every(
            (one: IAutoMovieExplicitInstanceTransform) : boolean =>
              nclose(one.scale.x, 0.5, 1e-12) &&
              nclose(one.scale.y, 0.5, 1e-12) &&
              nclose(one.scale.z, 0.08, 1e-12),
          ),
      ],
    ]),
    {
      slots: true,
      cut: true,
      first: true,
      inlay: true,
      downward: true,
      depth: true,
    },
  );
}
