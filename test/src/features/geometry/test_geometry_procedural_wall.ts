import {buildAutoMovieWall,inspectAutoMovieMeshTopology} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts,nclose,throwsError} from "../internal/predicates";
import {isFiniteProceduralMesh as finiteMesh} from "../internal/isFiniteProceduralMesh";

/**
 * Opening-aware walls retain exact cut volume, legal L remainders and both diagonal pinches; every opening admission row remains.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input.
 */
export const test_geometry_procedural_wall=():void=>{
  const wall = buildAutoMovieWall({
    width: 8,
    height: 4,
    depth: 0.3,
    openings: [
      { id: "door", x: 1, y: 0, width: 1.5, height: 2.4 },
      { id: "window", x: 4, y: 1.2, width: 2, height: 1.4 },
    ],
  });
  const plainWall = buildAutoMovieWall({
    width: 2,
    height: 2,
    depth: 0.2,
    openings: [],
  });
  TestValidator.equals(
    "opening-aware segmentation leaves exactly the standing wall solid",
    namedFacts([
      ["finite", () => finiteMesh(wall)],
      ["cut", () => wall.positions.length > plainWall.positions.length],
      ["indexed", () => wall.indices !== null && wall.indices.length > 0],
      [
        "volume",
        () =>
          nclose(
            inspectAutoMovieMeshTopology(wall).volume,
            (8 * 4 - 1.5 * 2.4 - 2 * 1.4) * 0.3,
            1e-12,
          ),
      ],
      [
        "plainVolume",
        () =>
          nclose(
            inspectAutoMovieMeshTopology(plainWall).volume,
            2 * 2 * 0.2,
            1e-12,
          ),
      ],
    ]),
    {
      finite: true,
      cut: true,
      indexed: true,
      volume: true,
      plainVolume: true,
    },
  );

  // An opening in one corner leaves an L, whose inner corner is a node three
  // cells meet at: legal, and one cell away from the diagonal that is not.
  const elbow = buildAutoMovieWall({
    width: 2,
    height: 2,
    depth: 0.2,
    openings: [{ id: "corner", x: 0, y: 0, width: 1, height: 1 }],
  });
  TestValidator.equals(
    "an L-shaped remainder stands while a diagonal one is refused as a pinch",
    namedFacts([
      ["closed", () => inspectAutoMovieMeshTopology(elbow).watertight],
      [
        "volume",
        () =>
          nclose(
            inspectAutoMovieMeshTopology(elbow).volume,
            (2 * 2 - 1) * 0.2,
            1e-12,
          ),
      ],
      [
        "pinch",
        () =>
          throwsError(
            () =>
              buildAutoMovieWall({
                width: 2,
                height: 2,
                depth: 0.2,
                openings: [
                  { id: "low", x: 0, y: 0, width: 1, height: 1 },
                  { id: "high", x: 1, y: 1, width: 1, height: 1 },
                ],
              }),
            "wall openings meet at (1, 1) and pinch the wall to a line",
          ),
      ],
      [
        "mirroredPinch",
        () =>
          throwsError(
            () =>
              buildAutoMovieWall({
                width: 2,
                height: 2,
                depth: 0.2,
                openings: [
                  { id: "high", x: 0, y: 1, width: 1, height: 1 },
                  { id: "low", x: 1, y: 0, width: 1, height: 1 },
                ],
              }),
            "wall openings meet at (1, 1) and pinch the wall to a line",
          ),
      ],
    ]),
    { closed: true, volume: true, pinch: true, mirroredPinch: true },
  );


  TestValidator.equals("cut wall reproduces the same authored solid",JSON.stringify(buildAutoMovieWall({width:8,height:4,depth:.3,openings:[{id:"door",x:1,y:0,width:1.5,height:2.4},{id:"window",x:4,y:1.2,width:2,height:1.4}]})),JSON.stringify(wall));

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "wall width",
      () => buildAutoMovieWall({ width: 0, height: 1, depth: 1, openings: [] }),
      "wall width must be a finite number > 0",
    ],
    [
      "wall height",
      () =>
        buildAutoMovieWall({
          width: 1,
          height: Number.NaN,
          depth: 1,
          openings: [],
        }),
      "wall height must be a finite number > 0",
    ],
    [
      "wall depth",
      () =>
        buildAutoMovieWall({ width: 1, height: 1, depth: -1, openings: [] }),
      "wall depth must be a finite number > 0",
    ],
    [
      "opening id",
      () =>
        buildAutoMovieWall({
          width: 2,
          height: 2,
          depth: 1,
          openings: [{ id: " ", x: 0, y: 0, width: 1, height: 1 }],
        }),
      "wall opening[0] id must be non-empty",
    ],
    [
      "opening duplicate",
      () =>
        buildAutoMovieWall({
          width: 3,
          height: 2,
          depth: 1,
          openings: [
            { id: "x", x: 0, y: 0, width: 1, height: 1 },
            { id: "x", x: 2, y: 0, width: 1, height: 1 },
          ],
        }),
      'wall opening id "x" must be unique',
    ],
    [
      "opening finite",
      () =>
        buildAutoMovieWall({
          width: 2,
          height: 2,
          depth: 1,
          openings: [{ id: "x", x: Number.NaN, y: 0, width: 1, height: 1 }],
        }),
      "wall opening[0] must be finite",
    ],
    [
      "opening width",
      () =>
        buildAutoMovieWall({
          width: 2,
          height: 2,
          depth: 1,
          openings: [{ id: "x", x: 0, y: 0, width: 0, height: 1 }],
        }),
      "wall opening[0] width must be a finite number > 0",
    ],
    [
      "opening height",
      () =>
        buildAutoMovieWall({
          width: 2,
          height: 2,
          depth: 1,
          openings: [{ id: "x", x: 0, y: 0, width: 1, height: -1 }],
        }),
      "wall opening[0] height must be a finite number > 0",
    ],
    [
      "opening bounds",
      () =>
        buildAutoMovieWall({
          width: 2,
          height: 2,
          depth: 1,
          openings: [{ id: "x", x: 1.5, y: 0, width: 1, height: 1 }],
        }),
      'wall opening "x" must stay inside the wall',
    ],
    [
      "opening overlap",
      () =>
        buildAutoMovieWall({
          width: 3,
          height: 2,
          depth: 1,
          openings: [
            { id: "a", x: 0, y: 0, width: 2, height: 1 },
            { id: "b", x: 1, y: 0, width: 2, height: 1 },
          ],
        }),
      'wall openings "a" and "b" overlap',
    ],
    [
      "opening removes wall",
      () =>
        buildAutoMovieWall({
          width: 2,
          height: 2,
          depth: 1,
          openings: [{ id: "all", x: 0, y: 0, width: 2, height: 2 }],
        }),
      "wall openings remove the entire wall",
    ],
  ];
  for (const [name, callback, message] of invalids) TestValidator.predicate(`${name} is refused by its own diagnostic`,throwsError(callback,message));

};
