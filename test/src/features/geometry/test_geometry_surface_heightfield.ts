import { surfaceHeightAt, tessellateSurface } from "@automovie/engine";
import { IAutoMovieSurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { type ITessellation } from "../../../../packages/engine/src/geometry/ITessellation";

/** A diamond footprint over a 3x3 lattice carrying a peak, a terrace, a bank. */
const relief: (samples: number[]) => IAutoMovieSurface = (samples: number[]): IAutoMovieSurface => ({
  id: "relief",
  kind: "floor",
  polygon: [
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 1 },
    { x: 1, y: 0, z: 2 },
  ],
  height: {
    kind: "heightfield",
    originX: 0,
    originZ: 0,
    spacingX: 1,
    spacingZ: 1,
    columns: 3,
    rows: 3,
    samples,
  },
});

/** Every tessellated vertex, as an `(x, z, y)` triple. */
const vertices: (positions: number[]) => Array<[number, number, number]> = (positions: number[]): Array<[number, number, number]> =>
  Array.from({ length: positions.length / 3 }, (_: unknown, index: number): [number, number, number] => [
    positions[index * 3]!,
    positions[index * 3 + 2]!,
    positions[index * 3 + 1]!,
  ]);

/**
 * The support surface a viewer draws is the one engine height queries answer.
 *
 * The tessellator and canonical height query must agree at emitted vertices.
 * Authored peak, terrace, bank and ramp values provide independent controls;
 * shared-query equality alone would miss a common height-rule defect. Neither
 * this test nor vertex parity establishes the height inside a planar facet
 * of a twisted bilinear cell or the viewer's rendered appearance.
 *
 * Scenarios:
 *
 * 1. A heightfield footprint emits more than one fan, retains the peak and
 *    agrees with `surfaceHeightAt` at each emitted vertex within 1e-12.
 * 2. The lattice peak reaches its authored sample, and a terrace (equal
 *    neighbours) and a bank (a one-cell step) reproduce their own bilinear
 *    values rather than the hull's corner interpolation.
 * 3. Sloped relief tilts the emitted normals off vertical; a level patch does not.
 * 4. A footprint whose bounding box contains cells lying entirely outside the hull
 *    drops those cells instead of emitting them.
 * 5. Regression: a constant patch stays one two-triangle fan and a planar ramp
 *    reproduces `origin + slopeX·x + slopeZ·z` exactly, unchanged by the
 *    heightfield path.
 * 6. Negative twin: a collinear footprint encloses no area and tessellates to
 *    nothing at all.
 * 7. The existing anchor fallback retains one fan at the stated anchor height.
 *
 * @evidence contracts/testing.md#behavioral-verification Tessellates the existing peak/terrace/bank/level/corner footprints, comparing emitted vertex heights with canonical queries, authored samples and bilinear controls; checks tilted versus upright normals and removal of cells outside the triangular footprint. Constant/plane/anchor paths retain their fan populations, plane/anchor paths retain analytic heights, and collinear input yields null; the constant case's height is not asserted.
 * @evidence contracts/testing.md#independent-expectations The peak sample is two, equal terrace samples interpolate to one, and the four bank samples average to 1.5 at its cell centre. The ramp follows 0.5+0.25*x-0.5*z and the fallback anchor is 1.75. Vertex parity retains 1e-12 agreement but shares production height logic, so it does not independently prove every bilinear interior or rendering; normal probes distinguish tilt rather than all normal directions.
 * @evidence contracts/testing.md#distinguishing-cases Preserves diamond clipping, interior peak, terrace/bank, level versus relief normals, triangular outside-cell removal, constant/plane fan regression, absent-rule anchor and zero-area footprint. Grid admission, extrapolation boundaries and concave/holed decomposition belong to space/surface companions.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable surface tessellation/footprint/height source with original in-memory surfaces and ordinary numeric observers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; no cases are dynamically registered.
 */
export function test_geometry_surface_heightfield(): void {
  const peak: IAutoMovieSurface = relief([0, 0, 0, 0, 2, 0, 0, 0, 0]);
  const mesh: ITessellation = tessellateSurface(peak)!;
  TestValidator.equals(
    "every heightfield vertex height is the engine's own query at that point",
    namedFacts([
      ["triangles", (): boolean => mesh.indices.length > 2 * 3],
      [
        "agrees",
        (): boolean =>
          vertices(mesh.positions).every(([x, z, y]: [number, number, number]): boolean =>
            nclose(y, surfaceHeightAt(peak, x, z), 1e-12),
          ),
      ],
      [
        "peak",
        (): boolean =>
          vertices(mesh.positions).some(
            ([x, z, y]: [number, number, number]): boolean => nclose(x, 1, 0) && nclose(z, 1, 0) && nclose(y, 2),
          ),
      ],
    ]),
    { triangles: true, agrees: true, peak: true },
  );

  const terraced: IAutoMovieSurface = relief([1, 1, 1, 1, 1, 1, 0, 0, 4]);
  const terracedMesh: ITessellation = tessellateSurface(terraced)!;
  TestValidator.equals(
    "a terrace and a bank reproduce their own bilinear heights",
    namedFacts([
      ["terrace", (): boolean => nclose(surfaceHeightAt(terraced, 0.5, 0.5), 1, 1e-12)],
      ["bank", (): boolean => nclose(surfaceHeightAt(terraced, 1.5, 1.5), 1.5, 1e-12)],
      [
        "agrees",
        (): boolean =>
          terracedMesh.positions.length > 0 && vertices(terracedMesh.positions).every(([x, z, y]: [number, number, number]): boolean =>
            nclose(y, surfaceHeightAt(terraced, x, z), 1e-12),
          ),
      ],
    ]),
    { terrace: true, bank: true, agrees: true },
  );

  const level: ITessellation = tessellateSurface(relief([0, 0, 0, 0, 0, 0, 0, 0, 0]))!;
  TestValidator.equals(
    "relief tilts normals off vertical and a level lattice does not",
    namedFacts([
      [
        "tilted",
        (): boolean =>
          mesh.normals.some(
            (value: number, index: number): boolean => index % 3 !== 1 && Math.abs(value) > 1e-6,
          ),
      ],
      [
        "upright",
        (): boolean =>
          level.normals.length > 0 && level.normals.every((value: number, index: number): boolean =>
            index % 3 === 1 ? nclose(value, 1) : nclose(value, 0),
          ),
      ],
    ]),
    { tilted: true, upright: true },
  );

  const corner: IAutoMovieSurface = {
    id: "corner",
    kind: "floor",
    polygon: [
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 0, y: 0, z: 4 },
    ],
    height: {
      kind: "heightfield",
      originX: 0,
      originZ: 0,
      spacingX: 1,
      spacingZ: 1,
      columns: 5,
      rows: 5,
      samples: Array.from({ length: 25 }, (_: unknown, index: number): number => index % 3),
    },
  };
  const cornerMesh: ITessellation = tessellateSurface(corner)!;
  TestValidator.equals(
    "lattice cells lying entirely outside the footprint are dropped",
    namedFacts([
      [
        "inside",
        (): boolean =>
          cornerMesh.positions.length > 0 && vertices(cornerMesh.positions).every(([x, z]: [number, number, number]): boolean => x + z <= 4 + 1e-9),
      ],
      [
        "agrees",
        (): boolean =>
          vertices(cornerMesh.positions).every(([x, z, y]: [number, number, number]): boolean =>
            nclose(y, surfaceHeightAt(corner, x, z), 1e-12),
          ),
      ],
    ]),
    { inside: true, agrees: true },
  );

  const ramp: IAutoMovieSurface = {
    ...peak,
    height: { kind: "plane", originHeight: 0.5, slopeX: 0.25, slopeZ: -0.5 },
  };
  const rampMesh: ITessellation = tessellateSurface(ramp)!;
  TestValidator.equals(
    "a constant patch stays one fan and a ramp reproduces its plane exactly",
    namedFacts([
      [
        "fan",
        (): boolean =>
          tessellateSurface({
            ...peak,
            height: { kind: "constant", value: 3 },
          })!.indices.length === 6,
      ],
      ["rampFan", (): boolean => rampMesh.indices.length === 6],
      [
        "plane",
        (): boolean =>
          vertices(rampMesh.positions).every(([x, z, y]: [number, number, number]): boolean =>
            nclose(y, 0.5 + 0.25 * x - 0.5 * z, 1e-12),
          ),
      ],
    ]),
    { fan: true, rampFan: true, plane: true },
  );

  const anchored: ITessellation = tessellateSurface({
    id: "anchored",
    kind: "floor",
    polygon: peak.polygon,
    anchor: { x: 0, y: 1.75, z: 1 },
    rampTo: null,
  })!;
  TestValidator.equals(
    "a patch stating no height rule falls back to its anchor, still one fan",
    namedFacts([
      ["fan", (): boolean => anchored.indices.length === 6],
      [
        "anchor",
        (): boolean => vertices(anchored.positions).every(([, , y]: [number, number, number]): boolean => nclose(y, 1.75)),
      ],
    ]),
    { fan: true, anchor: true },
  );

  TestValidator.equals(
    "a footprint enclosing no area tessellates to nothing",
    tessellateSurface({
      ...peak,
      polygon: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ],
    }),
    null,
  );
}
