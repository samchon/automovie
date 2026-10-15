import {
  type IAutoMovieMeshTopology,
  inspectAutoMovieMeshTopology,
  validateMeshTopology,
  validateModel,
} from "@automovie/engine";
import {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { makeProp } from "../internal/makeProp";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { sweepPolygonLoft } from "../internal/sweepPolygonLoft";
import { throwsError } from "../internal/throwsError";

/** One prop model carrying nothing but this mesh, as a model would hold it. */
const asPart: (mesh: IAutoMovieMesh) => IAutoMovieModel = (
  mesh: IAutoMovieMesh,
): IAutoMovieModel =>
  makeProp([
    {
      id: "member",
      name: null,
      geometry: { type: "mesh", mesh },
      material: null,
      attachedBone: null,
      transform: null,
    },
  ]);

const ell: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 3 },
  { x: 0, y: 3 },
];

const box: (half: number) => Array<{ x: number; y: number }> = (
  half: number,
): Array<{ x: number; y: number }> => [
  { x: -half, y: -half },
  { x: half, y: -half },
  { x: half, y: half },
  { x: -half, y: half },
];

/** One authored section of a loft: where it sits and its polygon rings. */
interface ISection {
  at: number;
  outer: Array<{ x: number; y: number }>;
  holes?: Array<Array<{ x: number; y: number }>>;
}

const constant: (outer: ReturnType<typeof box>, holes?: Array<ReturnType<typeof box>>) => ISection[] = (
  outer: ReturnType<typeof box>,
  holes?: Array<ReturnType<typeof box>>,
): ISection[] => [
  { at: 0, outer, holes },
  { at: 1, outer, holes },
];

const straight: (length: number) => IAutoMovieVector3[] = (
  length: number,
): IAutoMovieVector3[] => [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: length },
];

/**
 * Check topology observation, topology/model admission and analytic volume.
 * The engine observers share mesh data and are not independent render oracles.
 *
 * The last one is what makes the metric UV atlas a claim rather than an
 * assumption: a builder whose output no model can carry is a builder whose
 * output never reaches a frame, however watertight it measures.
 */
const closes: (mesh: IAutoMovieMesh, volume: number) => boolean = (
  mesh: IAutoMovieMesh,
  volume: number,
): boolean => {
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(mesh);
  return (
    topology.watertight &&
    topology.degenerate === 0 &&
    topology.nonFinite === 0 &&
    validateMeshTopology({ mesh, expectClosed: true }).success &&
    validateModel({ model: asPart(mesh) }).success &&
    nclose(topology.volume, volume, 1e-12)
  );
};

const carries: (mesh: IAutoMovieMesh, corner: IAutoMovieVector3) => boolean = (
  mesh: IAutoMovieMesh,
  corner: IAutoMovieVector3,
): boolean => {
  for (let at: number = 0; at < mesh.positions.length; at += 3)
    if (
      nclose(mesh.positions[at], corner.x, 0) &&
      nclose(mesh.positions[at + 1], corner.y, 0) &&
      nclose(mesh.positions[at + 2], corner.z, 0)
    )
      return true;
  return false;
};

/** The frustum of a pyramid: `h / 3 * (A + B + sqrt(A * B))`. */
const frustum: (near: number, far: number, height: number) => number = (
  near: number,
  far: number,
  height: number,
): number => (height / 3) * (near + far + Math.sqrt(near * far));

/**
 * Lofting polygon sections along a path with `meshAutoMovieSweep`: the variable
 * section, the taper, and the concave or hollow section.
 *
 * Straight prism and frustum expectations are closed-form. A 2 m square tapering to a 1 m square over 3 m
 * is a pyramid frustum of 7 m³; a square waisted to half width and back over 2
 * m is two frusta totaling 14/3 m³; an L section carried unchanged is a prism of its
 * own area. On a bent path the ring at each point is checked against the
 * rotation-minimizing frame of a planar curve, whose first axis stays normal to
 * the curve's plane, placed perpendicular to the path's tangent there.
 *
 * Scenarios:
 *
 * 1. A concave L section and a hollow section each loft to a closed prism of the
 *    section's own area times the path length, which is the concave and holed
 *    sweep the convex path refuses outright.
 * 2. A taper between two sections matches a pyramid frustum within 1e-12, and a
 *    section waisted at a declared midpoint is two of them.
 * 3. A ring between two declared sections carries their monotone interpolation,
 *    which between two stations is the linear blend: the midpoint of a 1 m and
 *    a 2 m half-width is a 1.5 m half-width corner in the buffer, and the
 *    volume is the two frusta that implies.
 * 4. One repeated convex section closes on a straight path, a right-angle bend
 *    and a path that turns in all three axes; the straight one is a prism of
 *    the section's area, and at the bend's corner the ring lies across the
 *    bisecting tangent with its first axis still normal to the bend's plane.
 * 5. Determinism: the same authored loft rebuilds with identical finite numeric
 *    components, structure, array order and ordered object keys.
 * 6. Negative twins: every guard refuses one property away from a loft that
 *    builds, covering the path, the stations, the hole counts, the point
 *    counts, the winding, and the ring shapes.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes loft construction with concave, holed, tapered and intermediate sections, asserting analytic volume, closed/nondegenerate finite topology, model admission, expected corners and deterministic rebuild. Existing invalid paths/stations/rings must refuse rather than produce a partial loft; caller input mutation is not observed here.
 * @evidence contracts/testing.md#independent-expectations Polygon area times path length and h/3*(A+B+sqrt(A*B)) determine prism/frustum volumes; the monotone interpolant through two knots is linear, which gives the midpoint corner. The waisted pair totals 14/3. A planar curve's rotation-minimizing frame keeps its first axis normal to the plane and a symmetric corner's tangent bisects it, which fixes the corner ring's points; topology/model observers do not prove pixels or arbitrary surface embedding.
 * @evidence contracts/testing.md#distinguishing-cases Preserves concave and hollow constant sections, taper and waist, undeclared blended station, straight, right-angle and three-axis paths, exact rebuild and each malformed path, station, cardinality, winding or shape twin. Caller input ownership is not observed; metric atlas distortion is owned by loft-atlas-density.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry reaches portable sweep source, topology/model validators and existing fixture adapters directly. It requires no consumer installation, native build, process, browser or GPU and registers no additional cases; model admission is CPU schema/topology evidence only.
 */
export function test_geometry_loft_sections(): void {
  const carried: IAutoMovieMesh = sweepPolygonLoft({
    path: straight(2),
    sections: [
      { at: 0, outer: ell },
      { at: 1, outer: ell },
    ],
  });
  const hollow: IAutoMovieMesh = sweepPolygonLoft({
    path: straight(4),
    sections: constant(box(1), [box(0.5)]),
  });
  TestValidator.equals(
    "a concave section and a hollow one each loft to a prism of their own area",
    namedFacts([
      ["concave", (): boolean => closes(carried, 5 * 2)],
      [
        "concaveIndices",
        (): boolean => carried.indices!.length === (4 * 2 + 6 * 2) * 3,
      ],
      ["hollow", (): boolean => closes(hollow, (2 * 2 - 1 * 1) * 4)],
      [
        "hollowIndices",
        (): boolean => hollow.indices!.length === (8 * 2 + 8 * 2) * 3,
      ],
    ]),
    {
      concave: true,
      concaveIndices: true,
      hollow: true,
      hollowIndices: true,
    },
  );

  const taper: IAutoMovieMesh = sweepPolygonLoft({
    path: straight(3),
    sections: [
      { at: 0, outer: box(1) },
      { at: 1, outer: box(0.5) },
    ],
  });
  const waisted: IAutoMovieMesh = sweepPolygonLoft({
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 2 },
    ],
    sections: [
      { at: 0, outer: box(1) },
      { at: 0.5, outer: box(0.5) },
      { at: 1, outer: box(1) },
    ],
  });
  TestValidator.equals(
    "a taper and a waisted section are frusta to the last digit",
    namedFacts([
      ["taper", (): boolean => closes(taper, frustum(4, 1, 3))],
      ["taperVolume", (): boolean => nclose(frustum(4, 1, 3), 7, 1e-15)],
      [
        "waisted",
        (): boolean => closes(waisted, frustum(4, 1, 1) + frustum(1, 4, 1)),
      ],
      [
        "waistedVolume",
        (): boolean => nclose(frustum(4, 1, 1) * 2, 14 / 3, 1e-15),
      ],
    ]),
    {
      taper: true,
      taperVolume: true,
      waisted: true,
      waistedVolume: true,
    },
  );

  const blended: IAutoMovieMesh = sweepPolygonLoft({
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 2 },
    ],
    sections: [
      { at: 0, outer: box(1) },
      { at: 1, outer: box(2) },
    ],
  });
  TestValidator.equals(
    "a station between two declared sections carries their blend",
    namedFacts([
      ["corner", (): boolean => carries(blended, { x: 1.5, y: 1.5, z: 1 })],
      ["opposite", (): boolean => carries(blended, { x: -1.5, y: -1.5, z: 1 })],
      [
        "notTheNear",
        (): boolean => carries(blended, { x: 1, y: 1, z: 1 }) === false,
      ],
      [
        "notTheFar",
        (): boolean => carries(blended, { x: 2, y: 2, z: 1 }) === false,
      ],
      [
        "volume",
        (): boolean => closes(blended, frustum(4, 9, 1) + frustum(9, 16, 1)),
      ],
      [
        "oracle",
        (): boolean =>
          nclose(frustum(4, 9, 1) + frustum(9, 16, 1), 56 / 3, 1e-14),
      ],
    ]),
    {
      corner: true,
      opposite: true,
      notTheNear: true,
      notTheFar: true,
      volume: true,
      oracle: true,
    },
  );

  const profile: { x: number; y: number }[] = box(0.1);
  const paths: IAutoMovieVector3[][] = [
    straight(2),
    [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
    [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 3, z: 1 },
      { x: 2, y: 3, z: 4 },
    ],
  ];
  const solids: IAutoMovieMesh[] = paths.map(
    (path: IAutoMovieVector3[]): IAutoMovieMesh => sweepPolygonLoft({ path, sections: constant(profile) }),
  );
  TestValidator.equals(
    "one repeated convex section closes along straight, bent and turning paths",
    solids.map((lofted: IAutoMovieMesh): Record<string, boolean> => {
      const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(lofted);
      return namedFacts([
        ["closed", (): boolean => topology.watertight],
        ["topology", (): boolean => validateMeshTopology({ mesh: lofted, expectClosed: true }).success],
      ]);
    }),
    paths.map((): { closed: boolean; topology: boolean } => ({ closed: true, topology: true })),
  );
  // the bend lies in the XY plane: its frame's first axis stays -Z, the second is the bisecting tangent crossed with it
  const root: number = Math.SQRT1_2;
  const second: IAutoMovieVector3 = { x: -root, y: root, z: 0 };
  const near = (mesh: IAutoMovieMesh, p: IAutoMovieVector3): boolean => {
    for (let at: number = 0; at < mesh.positions.length; at += 3)
      if (
        nclose(mesh.positions[at]!, p.x, 1e-9) &&
        nclose(mesh.positions[at + 1]!, p.y, 1e-9) &&
        nclose(mesh.positions[at + 2]!, p.z, 1e-9)
      )
        return true;
    return false;
  };
  TestValidator.equals(
    "a straight constant loft is a prism, and the bend's corner ring lies across its bisector",
    namedFacts([
      ["prism", (): boolean => nclose(inspectAutoMovieMeshTopology(solids[0]!).volume, 0.2 * 0.2 * 2, 1e-12)],
      ...profile.map((corner: { x: number; y: number }, k: number): [string, () => boolean] => [
        `corner${k}`,
        (): boolean =>
          near(solids[1]!, {
            x: 2 + corner.y * second.x,
            y: corner.y * second.y,
            z: -corner.x,
          }),
      ]),
    ]),
    { prism: true, corner0: true, corner1: true, corner2: true, corner3: true },
  );

  TestValidator.predicate(
    "the same authored loft rebuilds with exact numeric values and structure",
    equalGeometryTestValues(
      sweepPolygonLoft({
        path: straight(4),
        sections: constant(box(1), [box(0.5)]),
      }),
      hollow,
    ),
  );

  const twin: (outer: Array<{ x: number; y: number }>) => ISection[] = (
    outer: Array<{ x: number; y: number }>,
  ): ISection[] => [
    { at: 0, outer: ell },
    { at: 1, outer },
  ];
  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "short path",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: [{ x: 0, y: 0, z: 0 }],
          sections: twin(ell),
        }),
      "sweep spine needs at least two points",
    ],
    [
      "non-finite path",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: Number.NaN, z: 1 },
          ],
          sections: twin(ell),
        }),
      "sweep spine point 1 is not finite",
    ],
    [
      // Distinct neighbours are not enough: a path that doubles back has no
      // direction at the fold.
      "path folding back on itself",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
          ],
          sections: twin(ell),
        }),
      "sweep spine doubles back at point 1",
    ],
    [
      "repeated path point",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
          ],
          sections: twin(ell),
        }),
      "sweep spine points 0 and 1 coincide",
    ],
    [
      "no section",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: straight(1),
          sections: [],
        }),
      "sweep needs at least one station",
    ],
    [
      "non-finite station",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: straight(1),
          sections: [
            { at: Number.NaN, outer: ell },
            { at: 1, outer: ell },
          ],
        }),
      "sweep station 0 must lie on the spine",
    ],
    [
      "station not increasing",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: straight(1),
          sections: [
            { at: 0, outer: ell },
            { at: 0, outer: ell },
            { at: 1, outer: ell },
          ],
        }),
      "sweep station 1 does not follow station 0",
    ],
    [
      "station beyond the spine",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: straight(1),
          sections: [
            { at: 0, outer: ell },
            { at: 1.5, outer: ell },
          ],
        }),
      "sweep station 1 must lie on the spine",
    ],
    [
      "ring count",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: straight(1),
          sections: [
            { at: 0, outer: ell },
            {
              at: 1,
              outer: ell,
              holes: [
                [
                  { x: 0.2, y: 0.2 },
                  { x: 0.6, y: 0.2 },
                  { x: 0.6, y: 0.6 },
                  { x: 0.2, y: 0.6 },
                ],
              ],
            },
          ],
        }),
      "sweep station 1 must declare the same 0 holes as station 0",
    ],
    [
      "point count",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: straight(1),
          sections: twin([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
          ]),
        }),
      "sweep station 1 loop 0 must be a polygon of 6 corners like station 0",
    ],
    [
      "winding",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: straight(1),
          sections: twin([...ell].reverse()),
        }),
      "sweep mesh ring 1 loop 0 winds the other way from ring 0",
    ],
    [
      "section ring shape",
      (): IAutoMovieMesh =>
        sweepPolygonLoft({
          path: straight(1),
          sections: twin([
            { x: 0, y: 0 },
            { x: 4, y: 4 },
            { x: 4, y: 0 },
            { x: 0, y: 3 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
          ]),
        }),
      "sweep mesh ring 1 outer ring[4] doubles back along its own edge",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
