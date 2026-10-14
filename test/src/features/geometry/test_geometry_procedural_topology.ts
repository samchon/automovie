import {
  IAutoMovieMeshTopology,
  buildAutoMoviePolyhedron,
  buildAutoMovieWall,
  extrudeAutoMovieProfile,
  inspectAutoMovieMeshTopology,
  mergeAutoMovieMeshParts,
  transformAutoMovieMesh,
} from "@automovie/engine";
import { IAutoMovieMesh, type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

const meshOf: (positions: number[], indices: number[] | null) => IAutoMovieMesh = (
  positions: number[],
  indices: number[] | null,
): IAutoMovieMesh => ({
  positions,
  normals: null,
  uvs: null,
  indices,
  skin: null,
});

/** The subset of a topology report a scenario names, kept in one spelling. */
const summary: (mesh: IAutoMovieMesh, keys: ReadonlyArray<keyof IAutoMovieMeshTopology>) => Record<string, number | boolean | number[]> = (
  mesh: IAutoMovieMesh,
  keys: ReadonlyArray<keyof IAutoMovieMeshTopology>,
): Record<string, number | boolean | number[]> => {
  const report: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(mesh);
  return Object.fromEntries(keys.map((key: keyof IAutoMovieMeshTopology): [string, number | boolean | number[]] => [key, report[key]]));
};

/**
 * A closed solid must be provably closed, and an assembly must not be able to
 * pass as one.
 *
 * The inspector counts edge incidence on the shared position grid and sums
 * signed tetrahedra for volume. Authored analytic volumes and explicit edge
 * populations provide expectations, but incidence closure alone does not
 * prove winding consistency, nonzero area or absence of self-intersection.
 *
 * Scenarios:
 *
 * 1. An extruded prism and a face-authored ridged solid are both watertight, with
 *    volumes equal to their hand-computed `w·h·d` and `w·h·d/2`.
 * 2. A single triangle is an open surface: three boundary edges, not watertight,
 *    zero volume.
 * 3. Three triangles sharing one edge report that edge as non-manifold, while a
 *    cut wall closes into one solid: it drops the face between every adjacent
 *    pair of standing cells, so it emits exactly the 32 outward quads its
 *    lattice leaves and no interior wall a camera could never reach.
 * 4. A collapsed triangle is counted as degenerate and contributes no edges.
 * 5. Non-finite positions, normals, and uvs are all counted; an attribute-free
 *    mesh counts none of them.
 * 6. Corners a trillionth of a metre apart weld into one shared edge, leaving
 *    four boundary edges around the two-triangle patch.
 * 7. An empty mesh is not watertight, because no edges is not the same as no
 *    holes.
 * 8. Negative twins: an empty face list, a two-corner face, a non-finite corner, a
 *    collinear face, a reflex face, a self-intersecting bow-tie face, and a
 *    pentagram that turns twice without a reflex corner are each refused, as is
 *    a non-planar face.
 * 9. A convex face whose first corner lies straight on an edge is admitted with
 *    the normal its other corners give, not refused as enclosing no area.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the existing prism, ridged solid, open triangle, three-face fin, cut wall, collapsed/seam/empty meshes and nonfinite attributes. It asserts authored volume/incidence/population reports, preserved placed closure, named malformed face/index refusals and admission of a convex face whose first corner is straight.
 * @evidence contracts/testing.md#independent-expectations Prism and triangular-prism dimensions give volumes 0.5 and twelve; one triangle has three boundary edges, three faces sharing one edge give one non-manifold and six boundary edges, and the 3-by-3 cut wall has 32 exposed quads. Authored grid-near corners yield four boundary edges. Report equality is numerical/topological evidence only: this census omits winding and general intersection checks, and its three nonfinite-attribute probes do not cover every optional attribute.
 * @evidence contracts/testing.md#distinguishing-cases Preserves nine numbered scenarios including closed/open/non-manifold/degenerate/empty inputs, three nonfinite attributes, nearby welded seam, mirrored rotation, thirteen original malformed face/index cases and the straight-first-corner positive. Physical-source incidence, closedness policy and general validator admission belong to other topology tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable polyhedron/wall/extrusion/placement/topology source on existing in-memory data and observers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; all cases belong to this entry without dynamic registration.
 */
export function test_geometry_procedural_topology(): void {
  const prism: IAutoMovieMesh = extrudeAutoMovieProfile({
    profile: [
      { x: -1, y: -0.5 },
      { x: 1, y: -0.5 },
      { x: 1, y: 0.5 },
      { x: -1, y: 0.5 },
    ],
    depth: 0.25,
  });
  const b0: IAutoMovieVector3 = { x: -1, y: 0, z: -2 };
  const b1: IAutoMovieVector3 = { x: 1, y: 0, z: -2 };
  const b2: IAutoMovieVector3 = { x: 1, y: 0, z: 2 };
  const b3: IAutoMovieVector3 = { x: -1, y: 0, z: 2 };
  const r0: IAutoMovieVector3 = { x: 0, y: 3, z: -2 };
  const r1: IAutoMovieVector3 = { x: 0, y: 3, z: 2 };
  const ridged: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [b0, b1, b2, b3],
    [b1, r0, r1, b2],
    [b3, r1, r0, b0],
    [b0, r0, b1],
    [b2, r1, b3],
  ]);
  const ridgedTopology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(ridged);
  TestValidator.equals(
    "a closed prism and a face-authored ridged solid report their exact volumes",
    namedFacts([
      [
        "prism",
        (): boolean => {
          const report: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(prism);
          return (
            report.watertight &&
            report.triangles === 12 &&
            report.degenerate === 0 &&
            report.boundaryEdges === 0 &&
            report.nonManifoldEdges === 0 &&
            nclose(report.volume, 2 * 1 * 0.25, 1e-12)
          );
        },
      ],
      ["ridgedClosed", (): boolean => ridgedTopology.watertight],
      ["ridgedTriangles", (): boolean => ridgedTopology.triangles === 8],
      [
        "ridgedVolume",
        (): boolean => nclose(ridgedTopology.volume, (2 * 3 * 4) / 2, 1e-12),
      ],
      [
        "ridgedUvs",
        (): boolean =>
          ridged.uvs !== null &&
          ridged.uvs.length === (ridged.positions.length / 3) * 2,
      ],
    ]),
    {
      prism: true,
      ridgedClosed: true,
      ridgedTriangles: true,
      ridgedVolume: true,
      ridgedUvs: true,
    },
  );

  const patch: IAutoMovieMesh = meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 2]);
  TestValidator.predicate(
    "an open surface reports its boundary instead of claiming closure",
    equalGeometryTestValues(summary(patch, ["triangles", "boundaryEdges", "watertight", "volume"]),
    { triangles: 1, boundaryEdges: 3, watertight: false, volume: 0 }),
  );

  const fin: IAutoMovieMesh = meshOf(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1],
    [0, 1, 2, 0, 1, 3, 0, 1, 4],
  );
  const cutWall: IAutoMovieMesh = buildAutoMovieWall({
    width: 4,
    height: 3,
    depth: 0.2,
    openings: [{ id: "window", x: 1, y: 1, width: 1, height: 1 }],
  });
  TestValidator.equals(
    "a shared edge is non-manifold while a cut wall closes into one solid",
    namedFacts([
      [
        "fin",
        (): boolean => {
          const report: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(fin);
          return (
            report.nonManifoldEdges === 1 &&
            report.boundaryEdges === 6 &&
            report.watertight === false
          );
        },
      ],
      [
        "wall",
        (): boolean => {
          const report: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(cutWall);
          return (
            report.watertight &&
            report.nonManifoldEdges === 0 &&
            report.boundaryEdges === 0 &&
            report.degenerate === 0
          );
        },
      ],
      [
        // The lattice is 3 x 3 cells with the centre one removed, so 8 cells
        // stand and 8 adjacent pairs hide a face from each other: 8 x 6 - 2 x 8
        // = 32 quads survive, which is 64 triangles. A union of boxes would
        // emit all 48 quads and bury 16 of them inside the wall.
        "faces",
        (): boolean => inspectAutoMovieMeshTopology(cutWall).triangles === 64,
      ],
      [
        "wallVolume",
        (): boolean =>
          nclose(
            inspectAutoMovieMeshTopology(cutWall).volume,
            (4 * 3 - 1) * 0.2,
            1e-12,
          ),
      ],
    ]),
    { fin: true, wall: true, faces: true, wallVolume: true },
  );

  TestValidator.equals(
    "a collapsed triangle is counted, not silently dropped",
    summary(meshOf([0, 0, 0, 1, 0, 0, 1, 0, 0], null), [
      "triangles",
      "degenerate",
      "degenerateTriangles",
      "watertight",
    ]),
    {
      triangles: 1,
      degenerate: 1,
      degenerateTriangles: [0],
      watertight: false,
    },
  );

  TestValidator.equals(
    "non-finite components are counted across every present attribute",
    {
      all: inspectAutoMovieMeshTopology({
        positions: [Number.NaN, 0, 0, 1, 0, 0, 0, 1, 0],
        normals: [0, 0, Number.POSITIVE_INFINITY, 0, 0, 1, 0, 0, 1],
        uvs: [0, 0, 1, Number.NaN, 0, 1],
        indices: [0, 1, 2],
        skin: null,
      }).nonFinite,
      none: inspectAutoMovieMeshTopology(patch).nonFinite,
    },
    { all: 3, none: 0 },
  );

  TestValidator.equals(
    "corners a picosecond of a metre apart weld into one shared edge",
    inspectAutoMovieMeshTopology(
      meshOf(
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 1e-12, 0, 0, 1, 0, 0, 0, -1, 0],
        [0, 1, 2, 3, 4, 5],
      ),
    ).boundaryEdges,
    4,
  );

  TestValidator.predicate(
    "an empty mesh is not watertight, because no edges is not no holes",
    equalGeometryTestValues(summary(meshOf([], []), [
      "triangles",
      "degenerateTriangles",
      "watertight",
      "volume",
    ]),
    { triangles: 0, degenerateTriangles: [], watertight: false, volume: 0 }),
  );

  TestValidator.predicate(
    "a placed solid keeps the topology it was built with",
    inspectAutoMovieMeshTopology(
      transformAutoMovieMesh(ridged, {
        rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
        scale: { x: -1, y: 1, z: 1 },
      }),
    ).watertight,
  );

  const refusals: Array<readonly [string, () => unknown, string]> = [
    [
      "no faces",
      (): IAutoMovieMesh => buildAutoMoviePolyhedron([]),
      "polyhedron needs at least one face",
    ],
    [
      "two-corner face",
      (): IAutoMovieMesh => buildAutoMoviePolyhedron([[b0, b1]]),
      "polyhedron face[0] needs at least three corners",
    ],
    [
      "non-finite corner",
      (): IAutoMovieMesh => buildAutoMoviePolyhedron([[b0, b1, { x: Number.NaN, y: 0, z: 0 }]]),
      "polyhedron face[0] corner[2] must be finite",
    ],
    [
      "collinear face",
      (): IAutoMovieMesh =>
        buildAutoMoviePolyhedron([
          [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
          ],
        ]),
      "polyhedron face[0] encloses no area",
    ],
    [
      "reflex face",
      (): IAutoMovieMesh =>
        buildAutoMoviePolyhedron([
          [
            { x: 0, y: 0, z: 0 },
            { x: 3, y: 0, z: 0 },
            { x: 3, y: 0, z: 1 },
            { x: 1, y: 0, z: 1 },
            { x: 1, y: 0, z: 3 },
            { x: 0, y: 0, z: 3 },
          ],
        ]),
      "polyhedron face[0] must be convex",
    ],
    [
      // A bow tie is four corners in convex position wound so the ring crosses
      // itself. Its area is real, its plane is real, and its first corner still
      // fans, so nothing but the turn test can tell it from a quad.
      "self-intersecting face",
      (): IAutoMovieMesh =>
        buildAutoMoviePolyhedron([
          [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 1 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
          ],
        ]),
      "polyhedron face[0] must be convex",
    ],
    [
      "ragged positions",
      (): IAutoMovieMeshTopology => inspectAutoMovieMeshTopology(meshOf([0, 0, 0, 1], null)),
      "mesh topology needs positions in whole xyz triples",
    ],
    [
      "ragged indices",
      (): IAutoMovieMeshTopology =>
        inspectAutoMovieMeshTopology(
          meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 2, 0]),
        ),
      "mesh topology needs triangle indices in threes",
    ],
    [
      "index past the last vertex",
      (): IAutoMovieMesh =>
        transformAutoMovieMesh(
          meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 5]),
          {},
        ),
      "mesh transform indexes a vertex the mesh does not carry",
    ],
    [
      "fractional index",
      (): ReturnType<typeof mergeAutoMovieMeshParts> =>
        mergeAutoMovieMeshParts([
          {
            id: "ragged",
            mesh: meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 1.5]),
          },
        ]),
      'mesh part "ragged" indexes a vertex the mesh does not carry',
    ],
    [
      "negative index",
      (): IAutoMovieMeshTopology =>
        inspectAutoMovieMeshTopology(
          meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, -1]),
        ),
      "mesh topology indexes a vertex the mesh does not carry",
    ],
    [
      "non-planar face",
      (): IAutoMovieMesh => buildAutoMoviePolyhedron([[b0, b1, b2, { x: -1, y: 0.5, z: 2 }]]),
      "polyhedron face[0] is not planar",
    ],
    [
      // Every corner of a pentagram turns the same way, so the reflex test
      // passes it; only its total turning of 4 pi tells it from a pentagon.
      "pentagram face",
      (): IAutoMovieMesh =>
        buildAutoMoviePolyhedron([
          [0, 2, 4, 1, 3].map((k: number): IAutoMovieVector3 => ({
            x: Math.cos(((90 + 72 * k) * Math.PI) / 180),
            y: 0,
            z: Math.sin(((90 + 72 * k) * Math.PI) / 180),
          })),
        ]),
      "polyhedron face[0] must be convex",
    ],
  ];
  for (const [name, callback, message] of refusals)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );

  // The first corner sits on the middle of the bottom edge, so its own two
  // edges are parallel; the square is still convex, planar and one metre wide.
  const straightFirst: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [
      { x: 0.5, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
      { x: 1, y: 0, z: 0 },
    ],
  ]);
  TestValidator.predicate(
    "a straight first corner is admitted with its face's normal",
    equalGeometryTestValues({
      triangles: straightFirst.indices!.length / 3,
      normal: straightFirst.normals!.slice(0, 3),
    },
    { triangles: 3, normal: [0, 1, 0] }),
  );
}
