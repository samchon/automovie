import {extrudeAutoMovieProfile,inspectAutoMovieMeshTopology,tessellate} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts,nclose,throwsError} from "../internal/predicates";
import { PROCEDURAL_TEST_SQUARE as square } from "../internal/PROCEDURAL_TEST_SQUARE";
import {isFiniteProceduralMesh as finiteMesh} from "../internal/isFiniteProceduralMesh";

/**
 * Convex extrusion retains closed volume, convex admission and primitive compatibility. Each guard keeps its original positive neighbor and diagnostic.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input.
 */
export const test_geometry_procedural_architecture=():void=>{
  const extrusion = extrudeAutoMovieProfile({ profile: square, depth: 0.5 });
  const extrusionTopology = inspectAutoMovieMeshTopology(extrusion);
  TestValidator.equals(
    "a convex profile extrudes to one closed prism of the authored volume",
    namedFacts([
      ["finite", () => finiteMesh(extrusion)],
      ["vertices", () => extrusion.positions.length === 8 * 3],
      ["triangles", () => extrusion.indices!.length === 12 * 3],
      [
        "depth",
        () =>
          Math.min(
            ...extrusion.positions.filter((_, index) => index % 3 === 2),
          ) === -0.25 &&
          Math.max(
            ...extrusion.positions.filter((_, index) => index % 3 === 2),
          ) === 0.25,
      ],
      ["watertight", () => extrusionTopology.watertight],
      ["volume", () => nclose(extrusionTopology.volume, 2 * 2 * 0.5, 1e-12)],
    ]),
    {
      finite: true,
      vertices: true,
      triangles: true,
      depth: true,
      watertight: true,
      volume: true,
    },
  );

  TestValidator.equals("extrusion rebuilds byte-identically from the same authored profile",JSON.stringify(extrudeAutoMovieProfile({profile:square,depth:.5})),JSON.stringify(extrusion));
  const box = tessellate({ type: "box", width: 2, height: 2, depth: 0.2 });
  TestValidator.equals(
    "existing primitive tessellation is untouched by the procedural kernel",
    { vertices: box.positions.length, indices: box.indices.length },
    { vertices: 24 * 3, indices: 12 * 3 },
  );

  TestValidator.equals(
    "a bow-tie ordering of convex-position points is normalized to its hull, not refused",
    JSON.stringify(
      extrudeAutoMovieProfile({
        profile: [
          { x: -1, y: -1 },
          { x: 1, y: 1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
        ],
        depth: 0.5,
      }),
    ),
    JSON.stringify(extrusion),
  );
  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "extrusion depth",
      () => extrudeAutoMovieProfile({ profile: square, depth: 0 }),
      "extrusion depth must be a finite number > 0",
    ],
    [
      "profile finite",
      () =>
        extrudeAutoMovieProfile({
          profile: [{ x: Number.NaN, y: 0 }, ...square],
          depth: 1,
        }),
      "profile[0] must be finite",
    ],
    [
      "profile area",
      () =>
        extrudeAutoMovieProfile({
          profile: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
          ],
          depth: 1,
        }),
      "profile needs at least three non-collinear points",
    ],
    [
      "profile convexity",
      () =>
        extrudeAutoMovieProfile({
          profile: [...square, { x: 0, y: 0 }],
          depth: 1,
        }),
      "profile must be convex and contain no interior points",
    ],
    [
      "concave profile",
      () =>
        extrudeAutoMovieProfile({
          profile: [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 3, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 3 },
            { x: 0, y: 3 },
          ],
          depth: 1,
        }),
      "profile must be convex and contain no interior points",
    ],
  ];
  for (const [name, callback, message] of invalids) TestValidator.predicate(`${name} is refused by its own diagnostic`,throwsError(callback,message));

};
