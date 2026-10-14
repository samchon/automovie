import { IAutoMovieLoftSection } from "../../../../packages/engine/src/geometry/IAutoMovieLoftSection";
import { inspectAutoMovieMeshTopology } from "../../../../packages/engine/src/geometry/inspectAutoMovieMeshTopology";
import { loftAutoMovieSections } from "../../../../packages/engine/src/geometry/loftAutoMovieSections";
import { sweepAutoMovieProfile } from "../../../../packages/engine/src/geometry/sweepAutoMovieProfile";
import { validateMeshTopology } from "../../../../packages/engine/src/validation/validateMeshTopology";
import { validateModel } from "../../../../packages/engine/src/validation/validateModel";
import { IAutoMovieMesh, IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { makeProp } from "../internal/makeProp";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { throwsError } from "../internal/throwsError";
import { type IAutoMovieMeshTopology } from "../../../../packages/engine/src/geometry/IAutoMovieMeshTopology";

/** One prop model carrying nothing but this mesh, as a model would hold it. */
const asPart: (mesh: IAutoMovieMesh) => IAutoMovieModel = (mesh: IAutoMovieMesh): IAutoMovieModel =>
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

const ell: { x: number; y: number; }[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 3 },
  { x: 0, y: 3 },
];

const box: (half: number) => Array<{ x: number; y: number; }> = (half: number): Array<{ x: number; y: number }> => [
  { x: -half, y: -half },
  { x: half, y: -half },
  { x: half, y: half },
  { x: -half, y: half },
];

const constant: (outer: ReturnType<typeof box>, holes?: Array<ReturnType<typeof box>>) => IAutoMovieLoftSection[] = (
  outer: ReturnType<typeof box>,
  holes?: Array<ReturnType<typeof box>>,
): IAutoMovieLoftSection[] => [
  { at: 0, outer, holes },
  { at: 1, outer, holes },
];

const straight: (length: number) => IAutoMovieVector3[] = (length: number): IAutoMovieVector3[] => [
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
const closes: (mesh: IAutoMovieMesh, volume: number) => boolean = (mesh: IAutoMovieMesh, volume: number): boolean => {
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

const carries: (mesh: IAutoMovieMesh, corner: IAutoMovieVector3) => boolean = (mesh: IAutoMovieMesh, corner: IAutoMovieVector3): boolean => {
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
const frustum: (near: number, far: number, height: number) => number = (near: number, far: number, height: number): number =>
  (height / 3) * (near + far + Math.sqrt(near * far));

/**
 * Lofting free-form sections along a path: the variable section, the taper, and
 * the concave or hollow sweep the convex sweep cannot carry.
 *
 * Straight prism and frustum expectations are closed-form. A 2 m square tapering to a 1 m square over 3 m
 * is a pyramid frustum of 7 m³; a square waisted to half width and back over 2
 * m is two frusta totaling 14/3 m³; an L section carried unchanged is a prism of its
 * own area. Bent-path volumes are compared with `sweepAutoMovieProfile`
 * instead; both share a frame rule, so this establishes compatibility rather
 * than an independent expected volume for a bend.
 *
 * Scenarios:
 *
 * 1. A concave L section and a hollow section each loft to a closed prism of the
 *    section's own area times the path length, which is the concave and holed
 *    sweep the convex path refuses outright.
 * 2. A taper between two sections matches a pyramid frustum within 1e-12, and a
 *    section waisted at a declared midpoint is two of them.
 * 3. A station between two declared sections carries the blend: the midpoint of a
 *    1 m and a 2 m half-width is a 1.5 m half-width corner in the buffer, and
 *    the volume is the two frusta that implies.
 * 4. Regression against the sweep: a loft whose two sections are the same convex
 *    profile traces the sweep's solid on a straight path, a right-angle bend,
 *    and a path that turns in all three axes.
 * 5. Determinism: the same authored loft rebuilds with identical finite numeric
 *    components, structure, array order and ordered object keys.
 * 6. Negative twins: every guard refuses one property away from a loft that
 *    builds, covering the path, the station fractions, the ring counts, the
 *    point counts, the winding, and the ring shapes.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes loft construction with concave, holed, tapered and intermediate sections, asserting analytic volume, closed/nondegenerate finite topology, model admission, expected corners and deterministic rebuild. Existing invalid paths/stations/rings must refuse rather than produce a partial loft; caller input mutation is not observed here.
 * @evidence contracts/testing.md#independent-expectations Polygon area times path length and h/3*(A+B+sqrt(A*B)) determine prism/frustum volumes; linear section interpolation gives the midpoint corner. The waisted pair totals 14/3. Sweep parity shares the engine's frame rule and is a compatibility check, not an independent oracle for bent volume; topology/model observers do not prove pixels or arbitrary surface embedding.
 * @evidence contracts/testing.md#distinguishing-cases Preserves concave and hollow constant sections, taper and waist, undeclared blended station, straight/right-angle/3D sweep parity, exact rebuild and each existing malformed path, station, cardinality, winding or shape twin. Caller input ownership is not observed; metric atlas distortion is owned by loft-atlas-density.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry reaches portable loft/sweep source, topology/model validators and existing fixture adapters directly. It requires no consumer installation, native build, process, browser or GPU and registers no additional cases; model admission is CPU schema/topology evidence only.
 */
export function test_geometry_loft_sections(): void {
  const carried: IAutoMovieMesh = loftAutoMovieSections({
    path: straight(2),
    sections: [
      { at: 0, outer: ell },
      { at: 1, outer: ell },
    ],
  });
  const hollow: IAutoMovieMesh = loftAutoMovieSections({
    path: straight(4),
    sections: constant(box(1), [box(0.5)]),
  });
  TestValidator.equals(
    "a concave section and a hollow one each loft to a prism of their own area",
    namedFacts([
      ["concave", (): boolean  => closes(carried, 5 * 2)],
      ["concaveIndices", (): boolean  => carried.indices!.length === (4 * 2 + 6 * 2) * 3],
      ["hollow", (): boolean  => closes(hollow, (2 * 2 - 1 * 1) * 4)],
      ["hollowIndices", (): boolean  => hollow.indices!.length === (8 * 2 + 8 * 2) * 3],
    ]),
    {
      concave: true,
      concaveIndices: true,
      hollow: true,
      hollowIndices: true,
    },
  );

  const taper: IAutoMovieMesh = loftAutoMovieSections({
    path: straight(3),
    sections: [
      { at: 0, outer: box(1) },
      { at: 1, outer: box(0.5) },
    ],
  });
  const waisted: IAutoMovieMesh = loftAutoMovieSections({
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
      ["taper", (): boolean  => closes(taper, frustum(4, 1, 3))],
      ["taperVolume", (): boolean  => nclose(frustum(4, 1, 3), 7, 1e-15)],
      ["waisted", (): boolean  => closes(waisted, frustum(4, 1, 1) + frustum(1, 4, 1))],
      ["waistedVolume", (): boolean  => nclose(frustum(4, 1, 1) * 2, 14 / 3, 1e-15)],
    ]),
    {
      taper: true,
      taperVolume: true,
      waisted: true,
      waistedVolume: true,
    },
  );

  const blended: IAutoMovieMesh = loftAutoMovieSections({
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
      ["corner", (): boolean  => carries(blended, { x: 1.5, y: 1.5, z: 1 })],
      ["opposite", (): boolean  => carries(blended, { x: -1.5, y: -1.5, z: 1 })],
      ["notTheNear", (): boolean  => carries(blended, { x: 1, y: 1, z: 1 }) === false],
      ["notTheFar", (): boolean  => carries(blended, { x: 2, y: 2, z: 1 }) === false],
      ["volume", (): boolean  => closes(blended, frustum(4, 9, 1) + frustum(9, 16, 1))],
      [
        "oracle",
        (): boolean  => nclose(frustum(4, 9, 1) + frustum(9, 16, 1), 56 / 3, 1e-14),
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

  const profile: { x: number; y: number; }[] = box(0.1);
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
  TestValidator.equals(
    "a loft of one repeated convex section traces the solid the sweep traces",
    paths.map((path: IAutoMovieVector3[]): Record<string, boolean>  => {
      const lofted: IAutoMovieMesh = loftAutoMovieSections({
        path,
        sections: constant(profile),
      });
      const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(lofted);
      return namedFacts([
        [
          "volume",
          (): boolean  =>
            nclose(
              topology.volume,
              inspectAutoMovieMeshTopology(
                sweepAutoMovieProfile({ profile, path }),
              ).volume,
              1e-12,
            ),
        ],
        ["closed", (): boolean  => topology.watertight],
        [
          "topology",
          (): boolean  =>
            validateMeshTopology({ mesh: lofted, expectClosed: true }).success,
        ],
      ]);
    }),
    paths.map((): { volume: boolean; closed: boolean; topology: boolean; }  => ({ volume: true, closed: true, topology: true })),
  );

  TestValidator.predicate(
    "the same authored loft rebuilds with exact numeric values and structure",
    equalGeometryTestValues(
      loftAutoMovieSections({
        path: straight(4),
        sections: constant(box(1), [box(0.5)]),
      }),
      hollow,
    ),
  );

  const twin: (outer: Array<{ x: number; y: number; }>) => IAutoMovieLoftSection[] = (
    outer: Array<{ x: number; y: number }>,
  ): IAutoMovieLoftSection[] => [
    { at: 0, outer: ell },
    { at: 1, outer },
  ];
  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "short path",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: [{ x: 0, y: 0, z: 0 }],
          sections: twin(ell),
        }),
      "loft path needs at least two points",
    ],
    [
      "non-finite path",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: Number.NaN, z: 1 },
          ],
          sections: twin(ell),
        }),
      "loft path[1] must be finite",
    ],
    [
      // Distinct neighbours are not enough: a path that doubles back leaves the
      // centred tangent at the fold with no direction at all.
      "path folding back on itself",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
          ],
          sections: twin(ell),
        }),
      "loft path around point 1 is degenerate",
    ],
    [
      "repeated path point",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
          ],
          sections: twin(ell),
        }),
      "loft path[1] repeats the point beside it",
    ],
    [
      "one section",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: straight(1),
          sections: [{ at: 0, outer: ell }],
        }),
      "loft needs at least two sections",
    ],
    [
      "non-finite station",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: straight(1),
          sections: [
            { at: Number.NaN, outer: ell },
            { at: 1, outer: ell },
          ],
        }),
      "loft section[0] at must be finite",
    ],
    [
      "station not increasing",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: straight(1),
          sections: [
            { at: 0, outer: ell },
            { at: 0, outer: ell },
            { at: 1, outer: ell },
          ],
        }),
      "loft section[1] at must be greater than section[0] at",
    ],
    [
      "stations not spanning",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: straight(1),
          sections: [
            { at: 0, outer: ell },
            { at: 0.5, outer: ell },
          ],
        }),
      "loft sections must run from at 0 to at 1",
    ],
    [
      "ring count",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
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
      "loft section[1] must declare the same 1 rings as section[0]",
    ],
    [
      "point count",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: straight(1),
          sections: twin([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
          ]),
        }),
      "loft section[1] ring[0] must carry the same 6 points as section[0]",
    ],
    [
      "winding",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
          path: straight(1),
          sections: twin([...ell].reverse()),
        }),
      "loft section[1] ring[0] must wind the same way as section[0]",
    ],
    [
      "section ring shape",
      (): IAutoMovieMesh  =>
        loftAutoMovieSections({
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
      "loft section[1] outer ring[4] doubles back along its own edge",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
