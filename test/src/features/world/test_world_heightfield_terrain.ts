import { IAutoMovieWorldSurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { worldGroundHeight, worldGroundSurface, worldHeightfield, worldRamp, worldSurfaceHeight, worldTerrain } from "@automovie/engine";





import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/** A square footprint of a stated half-extent, centred on the origin. */
const square: (half: number) => { x: number; z: number }[] = (
  half: number,
): IAutoMovieWorldSurface["polygon"] => [
  { x: -half, z: -half },
  { x: half, z: -half },
  { x: half, z: half },
  { x: -half, z: half },
];

/**
 * A four-metre hill sampled on a three-by-three lattice over `[-4, 4]`.
 *
 * The sampler is a rule rather than a transcription, so the lattice reads the
 * same hill the prose describes: height climbs with `z` and dips with `|x|`,
 * leaving an explicit row-major pattern; mirrored X samples repeat because the
 * authored rule is symmetric about that axis.
 */
const hill: () => IAutoMovieWorldSurface = (): IAutoMovieWorldSurface =>
  worldHeightfield({
    id: "hill",
    polygon: square(4),
    origin: { x: -4, z: -4 },
    spacing: { x: 4, z: 4 },
    columns: 3,
    rows: 3,
    height: (point: { x: number; z: number }): number =>
      point.z * 0.5 - Math.abs(point.x) * 0.25,
    walkable: true,
  });

/** The rule of {@link hill}, as the oracle every sampled fact is read against. */
const hillHeight: (point: { x: number; z: number }) => number = (point: {
  x: number;
  z: number;
}): number => point.z * 0.5 - Math.abs(point.x) * 0.25;

/**
 * Terrain can rise, and a rise is sampled rather than assumed.
 *
 * `constant` states one number and `plane` states one tilt, so between them
 * they can describe a floor and a ramp and nothing else. A hill, a terraced
 * square, a bank falling to a river: each requires a height rule beyond one
 * affine function. Stored lattice samples allow different local slopes while
 * keeping their bilinear interpolation reproducible.
 *
 * What makes it usable is that it stays exact where it was authored and bounded
 * where it was not: a lattice point reads its own number back, the space
 * between two reads their blend, and a query past the edge reads the edge
 * rather than an extrapolation that would invent terrain. Nothing here consults
 * a clock, a file, or a seed; queries use the stored design without invoking
 * its authoring callback, which is why relief stores
 * numbers instead of retaining the function that made them.
 *
 * Scenarios:
 *
 * 1. Every lattice point reads back exactly the height its sampler authored, so a
 *    member standing on a sample stands where the author put it.
 * 2. A cell midpoint is the mean of that cell's four corners, which is what
 *    bilinear interpolation means and is checked against the corners rather
 *    than against the sampler, since between samples the lattice is the
 *    authority and the function that filled it is not.
 * 3. A query outside the lattice reads its nearest edge sample rather than an
 *    extrapolation, because a sampled relief says nothing about ground it never
 *    covered. The polygon, not the lattice, still bounds where the surface is.
 * 4. The sampler leaves numbers behind and nothing else: the nine heights land in
 *    the documented row-major order, which is the whole of what "relief is
 *    stored" means and the only part of it a case can put at risk — asking a
 *    pure function twice only says that it is one.
 * 5. `constant` and `plane` answer exactly what they answered before, so adding a
 *    third rule changed neither of the two that existed.
 * 6. The ground under a point is the first declared surface containing it, so a
 *    terraced square states its steps in the order it wants them read, and a
 *    point on a footprint edge is on that surface rather than off it.
 * 7. A point over no surface at all has no ground, which is a different answer
 *    from ground at zero and has to stay one: a formation over nothing keeps
 *    the height it was staged at instead of being dropped to the world origin.
 * 8. The builder refuses what it cannot sample deterministically: a degenerate
 *    pitch, a lattice too small to interpolate across, a blank id, and a
 *    sampler that answers with a non-finite height.
 * 9. A malformed field's absent samples read zero instead of `NaN`, while its
 *    available sample remains readable; this is a local fallback rather than
 *    admission of an incomplete lattice.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual world heightfield construction and surface/ground queries read lattice points, cell blends, clamped edges, stored samples and first-containing-surface selection; malformed constructor inputs throw and incomplete samples retain their documented fallback.
 * @evidence contracts/testing.md#independent-expectations The authored hill formula supplies nine row-major sample values, bilinear corner means supply between-sample expectations, and explicit ramp endpoints and declaration order supply the other answers. These CPU numeric observations do not prove callback purity or cross-platform bit identity.
 * @evidence contracts/testing.md#distinguishing-cases Sample points, midpoint/edge blends, outside clamps, ordinary constant/plane surfaces, first-surface order, exact rims and no ground contrast blank ids, invalid lattice pitch/dimensions, nonfinite origin/height and missing stored samples.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_world_heightfield_terrain; this function owns every sampler/query assertion and existing malformed-input callback, without installing terrain rendering, a native artifact or a browser/GPU host.
 */
export function test_world_heightfield_terrain(): void {
  const field: IAutoMovieWorldSurface = hill();
  const lattice: number[] = [-4, 0, 4];
  TestValidator.predicate(
    "every lattice point reads back its own authored height",
    lattice.every((z: number): boolean =>
      lattice.every((x: number): boolean =>
        nclose(
          worldSurfaceHeight(field, { x, z }),
          hillHeight({ x, z }),
          1e-12,
        ),
      ),
    ),
  );

  // The cell from (0, 0) to (4, 4). Its four corners are 0, -1, 2 and 1, so the
  // centre is 0.5 — which the sampler itself would call 1 - 0.5 = 0.5 here only
  // by coincidence of this cell being planar. The corner at (-4, 0) is what
  // makes the field genuinely non-affine and is why `plane` cannot hold it.
  const corners: number[] = [
    hillHeight({ x: 0, z: 0 }),
    hillHeight({ x: 4, z: 0 }),
    hillHeight({ x: 0, z: 4 }),
    hillHeight({ x: 4, z: 4 }),
  ];
  TestValidator.equals(
    "between samples the lattice blends its own corners",
    namedFacts([
      [
        "centre",
        (): boolean =>
          nclose(
            worldSurfaceHeight(field, { x: 2, z: 2 }),
            corners.reduce(
              (sum: number, value: number): number => sum + value,
              0,
            ) / 4,
            1e-12,
          ),
      ],
      // Affine over any one cell, and not over the field: this is the fact that
      // no `plane` rule can hold this surface. The line at `z` of 0 runs -1, 0,
      // -1 across its three samples, so a plane through its ends is level at -1
      // and would read -1 here; the field reads -0.5. Restating the three
      // lattice points that make that so would restate the case above, which
      // already reads every one of them back.
      [
        "edge",
        (): boolean =>
          nclose(
            worldSurfaceHeight(field, { x: 2, z: 0 }),
            (corners[0]! + corners[1]!) / 2,
            1e-12,
          ),
      ],
    ]),
    { centre: true, edge: true },
  );

  TestValidator.equals(
    "a query outside the lattice reads its edge rather than an extrapolation",
    namedFacts([
      [
        "beyondPositiveX",
        (): boolean =>
          nclose(
            worldSurfaceHeight(field, { x: 40, z: 0 }),
            hillHeight({ x: 4, z: 0 }),
            1e-12,
          ),
      ],
      [
        "beyondNegativeZ",
        (): boolean =>
          nclose(
            worldSurfaceHeight(field, { x: 0, z: -40 }),
            hillHeight({ x: 0, z: -4 }),
            1e-12,
          ),
      ],
      [
        "beyondBoth",
        (): boolean =>
          nclose(
            worldSurfaceHeight(field, { x: -40, z: 40 }),
            hillHeight({ x: -4, z: 4 }),
            1e-12,
          ),
      ],
    ]),
    { beyondPositiveX: true, beyondNegativeZ: true, beyondBoth: true },
  );

  // What "relief is stored numbers" comes down to, written as the numbers. The
  // nine heights {@link hill}'s rule leaves behind, in the row-major order the
  // builder documents — rows along `+z` from the origin, columns along `+x`
  // inside each — as a literal rather than as a second call to the rule, which
  // would only say that a pure function is pure. The field dips in `x` while it
  // climbs in `z`, so a lattice stored transposed, reversed, or from another
  // corner really is a different array here.
  TestValidator.predicate(
    "the sampler leaves nine stored heights, row-major from the origin",
    test12ValuesClose(
      field.height.kind === "heightfield" ? field.height.samples : null,
      [-3, -2, -3, -1, 0, -1, 1, 2, 1],
    ),
  );

  const flat: IAutoMovieWorldSurface = worldTerrain({
    id: "flat",
    polygon: square(4),
    height: 2.5,
    walkable: true,
  });
  const ramp: IAutoMovieWorldSurface = worldRamp({
    id: "ramp",
    from: { x: 0, z: 0 },
    to: { x: 0, z: 10 },
    width: 4,
    baseHeight: 1,
    rise: 5,
    walkable: true,
  });
  TestValidator.equals(
    "the two rules that existed answer exactly what they answered before",
    namedFacts([
      [
        "flatHere",
        (): boolean =>
          nclose(worldSurfaceHeight(flat, { x: 3, z: -3 }), 2.5, 0),
      ],
      [
        "flatThere",
        (): boolean =>
          nclose(worldSurfaceHeight(flat, { x: -1, z: 4 }), 2.5, 0),
      ],
      [
        "rampBase",
        (): boolean =>
          nclose(worldSurfaceHeight(ramp, { x: 0, z: 0 }), 1, 1e-12),
      ],
      [
        "rampTop",
        (): boolean =>
          nclose(worldSurfaceHeight(ramp, { x: 0, z: 10 }), 6, 1e-12),
      ],
      [
        "rampMiddle",
        (): boolean =>
          nclose(worldSurfaceHeight(ramp, { x: 2, z: 5 }), 3.5, 1e-12),
      ],
    ]),
    {
      flatHere: true,
      flatThere: true,
      rampBase: true,
      rampTop: true,
      rampMiddle: true,
    },
  );

  // A step standing on a wider terrace: both contain the origin, and the one
  // declared first is the one a member stands on.
  const terrace: IAutoMovieWorldSurface = worldTerrain({
    id: "terrace",
    polygon: square(8),
    height: 0,
    walkable: true,
  });
  const step: IAutoMovieWorldSurface = worldTerrain({
    id: "step",
    polygon: square(2),
    height: 1.5,
    walkable: true,
  });
  TestValidator.equals(
    "the ground under a point is the first declared surface containing it",
    namedFacts([
      [
        "stepFirst",
        (): boolean =>
          worldGroundSurface([step, terrace], { x: 0, z: 0 })?.id === "step",
      ],
      [
        "terraceFirst",
        (): boolean =>
          worldGroundSurface([terrace, step], { x: 0, z: 0 })?.id === "terrace",
      ],
      [
        "height",
        (): boolean =>
          nclose(worldGroundHeight([step, terrace], { x: 0, z: 0 })!, 1.5, 0),
      ],
      // The edge of a floor is still floor. A unit sized to its own ground puts
      // its outermost rank exactly here, and a strict reading would drop it off
      // the terrain the author sized for it.
      [
        "onTheEdge",
        (): boolean =>
          worldGroundSurface([step], { x: 2, z: 0 })?.id === "step",
      ],
      [
        "onACorner",
        (): boolean =>
          worldGroundSurface([step], { x: -2, z: 2 })?.id === "step",
      ],
    ]),
    {
      stepFirst: true,
      terraceFirst: true,
      height: true,
      onTheEdge: true,
      onACorner: true,
    },
  );

  TestValidator.equals(
    "a point over no surface has no ground, which is not ground at zero",
    namedFacts([
      [
        "noSurface",
        (): boolean => worldGroundSurface([step], { x: 40, z: 0 }) === null,
      ],
      [
        "noHeight",
        (): boolean => worldGroundHeight([step], { x: 40, z: 0 }) === null,
      ],
      [
        "noneAtAll",
        (): boolean => worldGroundHeight([], { x: 0, z: 0 }) === null,
      ],
    ]),
    { noSurface: true, noHeight: true, noneAtAll: true },
  );

  const builder: (
    overrides: Partial<{
      id: string;
      polygon: { x: number; z: number }[];
      origin: { x: number; z: number };
      spacing: { x: number; z: number };
      columns: number;
      rows: number;
      height: (point: { x: number; z: number }) => number;
      walkable: boolean;
    }>,
  ) => () => IAutoMovieWorldSurface = (
    overrides: Partial<Parameters<typeof worldHeightfield>[0]>,
  ): (() => IAutoMovieWorldSurface) => {
    const input: {
      id: string;
      polygon: { x: number; z: number }[];
      origin: { x: number; z: number };
      spacing: { x: number; z: number };
      columns: number;
      rows: number;
      height: (point: { x: number; z: number }) => number;
      walkable: boolean;
    } = {
      id: "probe",
      polygon: square(4),
      origin: { x: -4, z: -4 },
      spacing: { x: 4, z: 4 },
      columns: 3,
      rows: 3,
      height: (): number => 0,
      walkable: true,
      ...overrides,
    };
    return (): IAutoMovieWorldSurface => worldHeightfield(input);
  };
  TestValidator.equals(
    "the builder refuses a lattice it could not sample deterministically",
    namedFacts([
      [
        "blankId",
        (): boolean => throwsError(builder({ id: "  " }), "non-whitespace"),
      ],
      [
        "zeroPitch",
        (): boolean =>
          throwsError(builder({ spacing: { x: 0, z: 1 } }), "positive"),
      ],
      [
        "infiniteOrigin",
        (): boolean =>
          throwsError(
            builder({ origin: { x: Number.POSITIVE_INFINITY, z: 0 } }),
            "finite origin",
          ),
      ],
      [
        "oneColumn",
        (): boolean =>
          throwsError(builder({ columns: 1 }), "at least two sample"),
      ],
      [
        "fractionalRows",
        (): boolean =>
          throwsError(builder({ rows: 2.5 }), "at least two sample"),
      ],
      [
        "unsampleable",
        (): boolean =>
          throwsError(
            builder({ height: (): number => NaN }),
            "non-finite height",
          ),
      ],
    ]),
    {
      blankId: true,
      zeroPitch: true,
      infiniteOrigin: true,
      oneColumn: true,
      fractionalRows: true,
      unsampleable: true,
    },
  );

  const malformed: IAutoMovieWorldSurface = {
    id: "malformed",
    polygon: square(1),
    height: {
      kind: "heightfield",
      originX: 0,
      originZ: 0,
      spacingX: 1,
      spacingZ: 1,
      columns: 2,
      rows: 2,
      samples: [3],
    },
    walkable: true,
  };
  TestValidator.equals(
    "a field whose samples do not fill its lattice reads zero rather than NaN",
    namedFacts([
      [
        "stored",
        (): boolean =>
          nclose(worldSurfaceHeight(malformed, { x: 0, z: 0 }), 3, 0),
      ],
      [
        "missing",
        (): boolean =>
          nclose(worldSurfaceHeight(malformed, { x: 1, z: 1 }), 0, 0),
      ],
      [
        "blended",
        (): boolean =>
          nclose(worldSurfaceHeight(malformed, { x: 0.5, z: 0 }), 1.5, 1e-12),
      ],
    ]),
    { stored: true, missing: true, blended: true },
  );
}
