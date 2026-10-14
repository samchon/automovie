import {
  type IAutoMovieSurfacePattern,
  type IAutoMovieSurfacePatternResult,
  generateAutoMovieSurfacePattern,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { assertPatternGeneratedModuleRefusals } from "../internal/assertPatternGeneratedModuleRefusals";
import { pattern, rectangle, zone } from "../internal/patternFixtures";
import { namedFacts, throwsError } from "../internal/predicates";

const refuses: (
  overrides: Partial<IAutoMovieSurfacePattern>,
  message: string | readonly string[],
) => boolean = (
  overrides: Partial<IAutoMovieSurfacePattern>,
  message: string | readonly string[],
): boolean =>
  throwsError(
    (): IAutoMovieSurfacePatternResult =>
      generateAutoMovieSurfacePattern({ pattern: pattern(overrides) }),
    message,
  );

/**
 * Representative invalid pattern declarations and their scalar/overlap
 * boundary controls are refused through the public pattern run.
 *
 * Invalid scalars and identities, non-convex corner sets, overlapping zones or
 * exclusions, and modules exceeding declared reach must fail with the named
 * cause instead of yielding a silently adjusted take-off.
 *
 * Scenarios:
 *
 * 1. Envelope scalars are refused one at a time: blank id, no zones, negative
 *    joint, nonfinite joint tolerance, negative adjacency, a minimum piece outside
 *    `(0, 1]`, a negative grain tolerance, a seed that is not a non-negative
 *    safe integer, and a variant count below one.
 * 2. Zone identity and lattice are refused: a blank id, a duplicate id, a
 *    non-finite origin, a non-positive period, and a non-positive reach.
 * 3. Regions are refused: a non-finite corner, three collinear points that enclose
 *    no area, and a polygon with a reflex corner.
 * 4. Two zones covering the same area are refused, and two zones sharing only an
 *    edge are not.
 * 5. Exclusions are refused: a blank id, a duplicate id, a non-convex polygon, and
 *    two exclusions that overlap. Two exclusions that only touch are not.
 * 6. Generated modules are refused: a blank id, an id repeated across cells, a
 *    non-finite centre, a non-positive size, a non-finite rotation or grain,
 *    and a module reaching further from its cell origin than the zone
 *    declared.
 * 7. A lattice larger than the cell limit is refused before it is walked.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls generateAutoMovieSurfacePattern on malformed scalar, zone, polygon, exclusion, generated-candidate, reach, and lattice declarations, requiring specific Error fragments and checking admitted scalar/touching controls.
 * @evidence contracts/testing.md#independent-expectations Authored invalid fields determine the named refusal causes; a two-by-one metre region with half-metre square modules independently yields eight surviving placements. Explicit overlapping versus edge-touching rectangles distinguish positive shared area from contact, and the existing generated-candidate helper overrides authored inputs rather than laid output.
 * @evidence contracts/testing.md#distinguishing-cases Individual scalar failures share one otherwise valid pattern, while boundary scalars and touching zones/exclusions remain accepted. Blank/duplicate ids, nonfinite coordinates, collinear/reflex outlines, seven candidate-field overrides, reach overflow, and an oversized lattice require their own located messages.
 * @evidence contracts/testing.md#execution-ownership Uses synchronous local pattern records and authored generator callbacks through the product seam, with existing Error and named-fact predicates; no renderer, resources, clocks, global replacement, or separate test host is involved. The cell-cap case observes its refusal message without profiling enumeration or memory use.
 */
export function test_architecture_surface_pattern_refusals(): void {
  TestValidator.equals(
    "envelope scalars are refused one at a time",
    namedFacts([
      [
        "id",
        (): boolean => refuses({ id: " " }, "pattern id must be non-empty"),
      ],
      [
        "zones",
        (): boolean =>
          refuses({ zones: [] }, "a surface pattern needs at least one zone"),
      ],
      [
        "joint",
        (): boolean =>
          refuses(
            { joint: -1e-9 },
            "pattern joint must be a finite number >= 0",
          ),
      ],
      [
        "tolerance",
        (): boolean =>
          refuses(
            { jointTolerance: Number.NaN },
            "pattern joint tolerance must be a finite number >= 0",
          ),
      ],
      [
        "adjacency",
        (): boolean =>
          refuses(
            { adjacency: -1 },
            "pattern adjacency must be a finite number >= 0",
          ),
      ],
      [
        "minimumZero",
        (): boolean =>
          refuses(
            { minimumPiece: 0 },
            "pattern minimum piece must be a finite number in (0, 1]",
          ),
      ],
      [
        "minimumAbove",
        (): boolean =>
          refuses(
            { minimumPiece: 1 + 1e-9 },
            "pattern minimum piece must be a finite number in (0, 1]",
          ),
      ],
      [
        "minimumNonFinite",
        (): boolean =>
          refuses(
            { minimumPiece: Number.NaN },
            "pattern minimum piece must be a finite number in (0, 1]",
          ),
      ],
      [
        "grain",
        (): boolean =>
          refuses(
            { grainToleranceDeg: -1e-9 },
            "pattern grain tolerance must be a finite number >= 0",
          ),
      ],
      [
        "seedNegative",
        (): boolean =>
          refuses({ seed: -1 }, "pattern seed must be a safe integer >= 0"),
      ],
      [
        "seedFractional",
        (): boolean =>
          refuses({ seed: 1.5 }, "pattern seed must be a safe integer >= 0"),
      ],
      [
        "variantsZero",
        (): boolean =>
          refuses(
            { variants: 0 },
            "pattern variants must be a safe integer >= 1",
          ),
      ],
      [
        "variantsFractional",
        (): boolean =>
          refuses(
            { variants: 2.5 },
            "pattern variants must be a safe integer >= 1",
          ),
      ],
      [
        "boundaryValues",
        (): boolean =>
          generateAutoMovieSurfacePattern({
            pattern: pattern({
              joint: 0,
              jointTolerance: 0,
              adjacency: 0,
              minimumPiece: 1,
              grainToleranceDeg: 0,
              seed: 0,
              variants: 1,
            }),
          }).placements.length === 8,
      ],
    ]),
    {
      id: true,
      zones: true,
      joint: true,
      tolerance: true,
      adjacency: true,
      minimumZero: true,
      minimumAbove: true,
      minimumNonFinite: true,
      grain: true,
      seedNegative: true,
      seedFractional: true,
      variantsZero: true,
      variantsFractional: true,
      boundaryValues: true,
    },
  );

  TestValidator.equals(
    "zone identity and lattice are refused on their own message",
    namedFacts([
      [
        "blankId",
        (): boolean =>
          refuses(
            { zones: [zone({ id: "  " })] },
            "pattern zone[0] id must be non-empty",
          ),
      ],
      [
        "duplicateId",
        (): boolean =>
          refuses(
            {
              zones: [
                zone({ region: rectangle(0, 0, 1, 1) }),
                zone({ region: rectangle(1, 0, 2, 1), origin: { u: 1, v: 0 } }),
              ],
            },
            'pattern zone id "field" must be unique',
          ),
      ],
      [
        "origin",
        (): boolean =>
          refuses(
            { zones: [zone({ origin: { u: Number.NaN, v: 0 } })] },
            'pattern zone "field" origin must be finite',
          ),
      ],
      [
        "periodU",
        (): boolean =>
          refuses(
            { zones: [zone({ period: { u: 0, v: 0.5 } })] },
            'pattern zone "field" period u must be a finite number > 0',
          ),
      ],
      [
        "periodV",
        (): boolean =>
          refuses(
            { zones: [zone({ period: { u: 0.5, v: -1 } })] },
            'pattern zone "field" period v must be a finite number > 0',
          ),
      ],
      [
        "reachU",
        (): boolean =>
          refuses(
            { zones: [zone({ reach: { u: 0, v: 0.5 } })] },
            'pattern zone "field" reach u must be a finite number > 0',
          ),
      ],
      [
        "reachV",
        (): boolean =>
          refuses(
            { zones: [zone({ reach: { u: 0.5, v: Number.NaN } })] },
            'pattern zone "field" reach v must be a finite number > 0',
          ),
      ],
    ]),
    {
      blankId: true,
      duplicateId: true,
      origin: true,
      periodU: true,
      periodV: true,
      reachU: true,
      reachV: true,
    },
  );

  TestValidator.equals(
    "a region must be a finite, area-bearing, convex outline",
    namedFacts([
      [
        "nonFinite",
        (): boolean =>
          refuses(
            {
              zones: [
                zone({
                  region: [
                    { u: 0, v: 0 },
                    { u: Number.NaN, v: 0 },
                    { u: 1, v: 1 },
                  ],
                }),
              ],
            },
            "pattern zone[0] region[1] must be finite",
          ),
      ],
      [
        "collinear",
        (): boolean =>
          refuses(
            {
              zones: [
                zone({
                  region: [
                    { u: 0, v: 0 },
                    { u: 1, v: 0 },
                    { u: 2, v: 0 },
                  ],
                }),
              ],
            },
            "pattern zone[0] region needs at least three non-collinear points",
          ),
      ],
      [
        "reflex",
        (): boolean =>
          refuses(
            {
              zones: [
                zone({
                  region: [
                    { u: 0, v: 0 },
                    { u: 2, v: 0 },
                    { u: 1, v: 0.5 },
                    { u: 2, v: 1 },
                    { u: 0, v: 1 },
                  ],
                }),
              ],
            },
            "pattern zone[0] region must be convex and contain no interior points",
          ),
      ],
    ]),
    { nonFinite: true, collinear: true, reflex: true },
  );

  TestValidator.equals(
    "zones may share an edge but not an area",
    namedFacts([
      [
        "overlapping",
        (): boolean =>
          refuses(
            {
              zones: [
                zone({ id: "a", region: rectangle(0, 0, 1.2, 1) }),
                zone({
                  id: "b",
                  region: rectangle(1, 0, 2, 1),
                  origin: { u: 1, v: 0 },
                }),
              ],
            },
            'pattern zones "a" and "b" overlap',
          ),
      ],
      [
        "touching",
        (): boolean =>
          generateAutoMovieSurfacePattern({
            pattern: pattern({
              zones: [
                zone({ id: "a", region: rectangle(0, 0, 1, 1) }),
                zone({
                  id: "b",
                  region: rectangle(1, 0, 2, 1),
                  origin: { u: 1, v: 0 },
                }),
              ],
            }),
          }).placements.length === 8,
      ],
    ]),
    { overlapping: true, touching: true },
  );

  TestValidator.equals(
    "exclusions must be identified, convex, and disjoint",
    namedFacts([
      [
        "blankId",
        (): boolean =>
          refuses(
            {
              exclusions: [{ id: "", polygon: rectangle(0.1, 0.1, 0.2, 0.2) }],
            },
            "pattern exclusion[0] id must be non-empty",
          ),
      ],
      [
        "duplicateId",
        (): boolean =>
          refuses(
            {
              exclusions: [
                { id: "hole", polygon: rectangle(0.1, 0.1, 0.2, 0.2) },
                { id: "hole", polygon: rectangle(0.5, 0.1, 0.6, 0.2) },
              ],
            },
            'pattern exclusion id "hole" must be unique',
          ),
      ],
      [
        "nonConvex",
        (): boolean =>
          refuses(
            {
              exclusions: [
                {
                  id: "hole",
                  polygon: [
                    { u: 0, v: 0 },
                    { u: 1, v: 0 },
                    { u: 0.5, v: 0.25 },
                    { u: 1, v: 0.5 },
                    { u: 0, v: 0.5 },
                  ],
                },
              ],
            },
            'pattern exclusion "hole" polygon must be convex and contain no interior points',
          ),
      ],
      [
        "overlapping",
        (): boolean =>
          refuses(
            {
              exclusions: [
                { id: "left", polygon: rectangle(0.1, 0.1, 0.4, 0.4) },
                { id: "right", polygon: rectangle(0.3, 0.1, 0.6, 0.4) },
              ],
            },
            'pattern exclusions "left" and "right" overlap',
          ),
      ],
      [
        "touching",
        (): boolean =>
          generateAutoMovieSurfacePattern({
            pattern: pattern({
              exclusions: [
                { id: "left", polygon: rectangle(0.1, 0.1, 0.3, 0.4) },
                { id: "right", polygon: rectangle(0.3, 0.1, 0.6, 0.4) },
              ],
            }),
          }).quantities.modules === 8,
      ],
    ]),
    {
      blankId: true,
      duplicateId: true,
      nonConvex: true,
      overlapping: true,
      touching: true,
    },
  );

  assertPatternGeneratedModuleRefusals(refuses);

  TestValidator.equals(
    "a lattice above the cell limit is refused before it is walked",
    refuses(
      {
        zones: [
          zone({
            region: rectangle(0, 0, 1000, 1000),
            period: { u: 0.001, v: 0.001 },
            reach: { u: 0.001, v: 0.001 },
          }),
        ],
      },
      ["lattice cells, above the", "cell limit"],
    ),
    true,
  );
}
