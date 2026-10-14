import {buildAutoMovieWall,inspectAutoMovieMeshTopology} from "@automovie/engine";
import {TestValidator} from "@nestia/e2e";
import {namedFacts,nclose,throwsError} from "../internal/predicates";
import {isFiniteProceduralMesh as finiteMesh} from "../internal/isFiniteProceduralMesh";
import { type IAutoMovieMesh } from "@automovie/interface";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

/**
 * Opening-aware walls retain exact cut volume, legal L remainders and both diagonal pinches; every opening admission row remains.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the existing door/window wall, plain wall and legal corner-opening L remainder, checking observed finiteness, nonempty indices, populations, analytic cut volumes and L closure. Both diagonal pinch orientations and every original malformed wall/opening row must refuse by its diagnostic; repeated authored construction remains identical.
 * @evidence contracts/testing.md#independent-expectations Standing rectangular area minus disjoint opening areas, multiplied by depth, gives each expected volume; a single corner opening leaves a connected L while diagonal corner contacts pinch the remaining wall at (1,1). Deterministic rebuild is a compatibility check, finiteMesh is partial, and topology/volume observations do not certify arbitrary architecture or pixels.
 * @evidence contracts/testing.md#distinguishing-cases Preserves no openings, door/window cuts, a legal L, both diagonal pinches, exact rebuild and eleven wall-size/ID/finite/extent/overlap/total-removal refusals. Lattice face census, texture coordinates and other procedural operations have separate entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable wall/topology source and existing canonical observers on its unchanged cases. It installs no consumer, builds no native artifact and starts no process, browser or GPU; no cases are dynamically registered.
 */
export function test_geometry_procedural_wall(): void {
  const wall: IAutoMovieMesh = buildAutoMovieWall({
    width: 8,
    height: 4,
    depth: 0.3,
    openings: [
      { id: "door", x: 1, y: 0, width: 1.5, height: 2.4 },
      { id: "window", x: 4, y: 1.2, width: 2, height: 1.4 },
    ],
  });
  const plainWall: IAutoMovieMesh = buildAutoMovieWall({
    width: 2,
    height: 2,
    depth: 0.2,
    openings: [],
  });
  TestValidator.equals(
    "opening-aware segmentation leaves exactly the standing wall solid",
    namedFacts([
      ["finite", (): boolean => finiteMesh(wall)],
      ["cut", (): boolean => wall.positions.length > plainWall.positions.length],
      ["indexed", (): boolean => wall.indices !== null && wall.indices.length > 0],
      [
        "volume",
        (): boolean =>
          nclose(
            inspectAutoMovieMeshTopology(wall).volume,
            (8 * 4 - 1.5 * 2.4 - 2 * 1.4) * 0.3,
            1e-12,
          ),
      ],
      [
        "plainVolume",
        (): boolean =>
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
  const elbow: IAutoMovieMesh = buildAutoMovieWall({
    width: 2,
    height: 2,
    depth: 0.2,
    openings: [{ id: "corner", x: 0, y: 0, width: 1, height: 1 }],
  });
  TestValidator.equals(
    "an L-shaped remainder stands while a diagonal one is refused as a pinch",
    namedFacts([
      ["closed", (): boolean => inspectAutoMovieMeshTopology(elbow).watertight],
      [
        "volume",
        (): boolean =>
          nclose(
            inspectAutoMovieMeshTopology(elbow).volume,
            (2 * 2 - 1) * 0.2,
            1e-12,
          ),
      ],
      [
        "pinch",
        (): boolean =>
          throwsError(
            (): IAutoMovieMesh =>
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
        (): boolean =>
          throwsError(
            (): IAutoMovieMesh =>
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


  TestValidator.predicate("cut wall reproduces the same authored solid",equalGeometryTestValues(buildAutoMovieWall({width:8,height:4,depth:.3,openings:[{id:"door",x:1,y:0,width:1.5,height:2.4},{id:"window",x:4,y:1.2,width:2,height:1.4}]}),wall));

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "wall width",
      (): IAutoMovieMesh => buildAutoMovieWall({ width: 0, height: 1, depth: 1, openings: [] }),
      "wall width must be a finite number > 0",
    ],
    [
      "wall height",
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
        buildAutoMovieWall({ width: 1, height: 1, depth: -1, openings: [] }),
      "wall depth must be a finite number > 0",
    ],
    [
      "opening id",
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
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
      (): IAutoMovieMesh =>
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

}
