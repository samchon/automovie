import type { IAutoMovieMaterialAssembly, IAutoMovieMaterialLayer, IAutoMovieMaterialSubstance } from "@automovie/interface";
import { type IAutoMovieResolvedAssembly, type IAutoMovieResolvedLayer, resolveAutoMovieMaterialAssembly } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { assembly, layer, substance } from "../internal/materialFixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/**
 * A wet wall stated once and measured on the host's own line.
 *
 * Render, blockwork, a cavity, a zero-thickness membrane and a board contribute one ordered thickness sum. Reversing the stacking sense from a nonzero offset changes signed coordinates while preserving that sum.
 *
 * Scenarios:
 *
 * 1. Positive sense from a zero offset places every layer at its running sum (0 /
 *    0.02 / 0.12 / 0.17 / 0.17 m) and totals 0.1825 m.
 * 2. A zero-thickness membrane occupies a plane, not a span: its start, end, and
 *    centre are one coordinate, and it advances the cursor by nothing.
 * 3. Negative sense from offset 0.25 m mirrors every span, so the extent runs
 *    0.0675 to 0.25 m while the total is unchanged.
 * 4. A declared host thickness equal to the summed layers resolves.
 * 5. A host thickness one millimetre off is refused with the assembly name,
 *    layers path and host-sum rule: the negative twin of scenario 4.
 * 6. Substance references resolve against a supplied table, and an unknown one is
 *    refused: the negative twin of the resolving run.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves actual ordered layer spans and observes identities, signed coordinates, total thickness and the first refusal, catching wrong prefix sums, mirrored extents, membrane advancement and missing host/substance admission.
 * @evidence contracts/testing.md#independent-expectations The manually added thicknesses 0.02 + 0.1 + 0.05 + 0 + 0.0125 give 0.1825 metres; explicit start/end/centre arrays and subtraction from 0.25 define the two coordinate directions independently of the resolver. Authored ids determine reference membership; these schematic layers are not a measured material assembly.
 * @evidence contracts/testing.md#distinguishing-cases Retains positive and negative stacking, an interior zero-thickness membrane, matching and one-millimetre-mismatched host thickness, and complete versus missing substance tables. The companion assembly-defects test owns malformed fields, finish/wrap policies and invalid host domains.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_material_assembly_dimension entry owns every local case and invokes portable engine resolution through shared fixtures, without a native build, process, browser, GPU or dynamic registration.
 */
export function test_architecture_material_assembly_dimension(): void {
  const layers: () => IAutoMovieMaterialLayer[] = () : IAutoMovieMaterialLayer[] => [
    layer("render", 0.02, { finish: true, wrapsOpening: true }),
    layer("block", 0.1),
    layer("cavity", 0.05, { substance: "cavity", material: null }),
    layer("barrier", 0, { substance: "membrane" }),
    layer("board", 0.0125, { finish: true, wrapsOpening: true }),
  ];
  const wet: IAutoMovieMaterialAssembly = assembly(layers(), {
    id: "wet-wall",
    faces: { first: "exposed", last: "exposed" },
  });
  const resolved: IAutoMovieResolvedAssembly = resolveAutoMovieMaterialAssembly({ assembly: wet });

  TestValidator.equals(
    "the build-up keeps its authored layers, roles, and identity",
    {
      id: resolved.id,
      axis: resolved.axis,
      layers: resolved.layers.map((one: IAutoMovieResolvedLayer) : string => one.id),
      substances: resolved.layers.map((one: IAutoMovieResolvedLayer) : "solid" | "cavity" | "membrane" => one.substance),
      materials: resolved.layers.map((one: IAutoMovieResolvedLayer) : string | null => one.material),
    },
    {
      id: "wet-wall",
      axis: "z",
      layers: ["render", "block", "cavity", "barrier", "board"],
      substances: ["solid", "solid", "cavity", "membrane", "solid"],
      materials: [
        "render-substance",
        "block-substance",
        null,
        "barrier-substance",
        "board-substance",
      ],
    },
  );

  TestValidator.equals(
    "every layer sits at the running sum of the layers before it",
    namedFacts([
      ["total", () : boolean => nclose(resolved.total, 0.1825, 1e-12)],
      ["start", () : boolean => nclose(resolved.start, 0, 1e-12)],
      ["end", () : boolean => nclose(resolved.end, 0.1825, 1e-12)],
      ["extentMin", () : boolean => nclose(resolved.extent.min, 0, 1e-12)],
      ["extentMax", () : boolean => nclose(resolved.extent.max, 0.1825, 1e-12)],
      [
        "starts",
        () : boolean =>
          [0, 0.02, 0.12, 0.17, 0.17].every((expected: number, index: number) : boolean =>
            nclose(resolved.layers[index]!.start, expected, 1e-12),
          ),
      ],
      [
        "ends",
        () : boolean =>
          [0.02, 0.12, 0.17, 0.17, 0.1825].every((expected: number, index: number) : boolean =>
            nclose(resolved.layers[index]!.end, expected, 1e-12),
          ),
      ],
      [
        "centers",
        () : boolean =>
          [0.01, 0.07, 0.145, 0.17, 0.17625].every((expected: number, index: number) : boolean =>
            nclose(resolved.layers[index]!.center, expected, 1e-12),
          ),
      ],
    ]),
    {
      total: true,
      start: true,
      end: true,
      extentMin: true,
      extentMax: true,
      starts: true,
      ends: true,
      centers: true,
    },
  );

  const membrane: IAutoMovieResolvedLayer = resolved.layers[3]!;
  TestValidator.equals(
    "a zero-thickness membrane occupies a plane and advances nothing",
    namedFacts([
      ["thickness", () : boolean => nclose(membrane.thickness, 0, 0)],
      ["collapsed", () : boolean => nclose(membrane.start, membrane.end, 0)],
      ["center", () : boolean => nclose(membrane.center, membrane.start, 0)],
      ["cursor", () : boolean => nclose(resolved.layers[4]!.start, membrane.end, 0)],
    ]),
    { thickness: true, collapsed: true, center: true, cursor: true },
  );

  const mirrored: IAutoMovieResolvedAssembly = resolveAutoMovieMaterialAssembly({
    assembly: assembly(layers(), {
      id: "wet-wall-mirrored",
      axis: "x",
      sense: "negative",
      offset: 0.25,
      faces: { first: "exposed", last: "exposed" },
    }),
  });
  TestValidator.equals(
    "the negative sense mirrors every span without changing the total",
    namedFacts([
      ["axis", () : boolean => mirrored.axis === "x"],
      ["total", () : boolean => nclose(mirrored.total, 0.1825, 1e-12)],
      ["start", () : boolean => nclose(mirrored.start, 0.25, 1e-12)],
      ["end", () : boolean => nclose(mirrored.end, 0.0675, 1e-12)],
      ["extentMin", () : boolean => nclose(mirrored.extent.min, 0.0675, 1e-12)],
      ["extentMax", () : boolean => nclose(mirrored.extent.max, 0.25, 1e-12)],
      [
        "starts",
        () : boolean =>
          [0.25, 0.23, 0.13, 0.08, 0.08].every((expected: number, index: number) : boolean =>
            nclose(mirrored.layers[index]!.start, expected, 1e-12),
          ),
      ],
      [
        "ends",
        () : boolean =>
          [0.23, 0.13, 0.08, 0.08, 0.0675].every((expected: number, index: number) : boolean =>
            nclose(mirrored.layers[index]!.end, expected, 1e-12),
          ),
      ],
    ]),
    {
      axis: true,
      total: true,
      start: true,
      end: true,
      extentMin: true,
      extentMax: true,
      starts: true,
      ends: true,
    },
  );

  TestValidator.equals(
    "a host drawn at the summed thickness resolves, one millimetre off does not",
    namedFacts([
      [
        "matches",
        () : boolean =>
          nclose(
            resolveAutoMovieMaterialAssembly({
              assembly: wet,
              host: { thickness: 0.1825 },
            }).total,
            0.1825,
            1e-12,
          ),
      ],
      [
        "refuses",
        () : boolean =>
          throwsError(
            () : IAutoMovieResolvedAssembly =>
              resolveAutoMovieMaterialAssembly({
                assembly: wet,
                host: { thickness: 0.1835 },
              }),
            ["wet-wall", "$input.layers", "must sum to the host thickness"],
          ),
      ],
    ]),
    { matches: true, refuses: true },
  );

  const table: IAutoMovieMaterialSubstance[] = [
    substance("render-substance", { classification: "mortar" }),
    substance("block-substance", { classification: "masonry" }),
    substance("barrier-substance", { classification: "sheet" }),
    substance("board-substance", { classification: "board" }),
  ];
  TestValidator.equals(
    "cited substances must resolve against the supplied table",
    namedFacts([
      [
        "resolves",
        () : boolean =>
          resolveAutoMovieMaterialAssembly({
            assembly: wet,
            substances: table,
          }).layers.length === 5,
      ],
      [
        "refusesUnknown",
        () : boolean =>
          throwsError(
            () : IAutoMovieResolvedAssembly =>
              resolveAutoMovieMaterialAssembly({
                assembly: wet,
                substances: table.slice(1),
              }),
            [
              "$input.layers[0].material",
              'substance "render-substance" does not resolve',
            ],
          ),
      ],
    ]),
    { resolves: true, refusesUnknown: true },
  );
}
