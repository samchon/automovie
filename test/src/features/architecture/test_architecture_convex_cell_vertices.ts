import type {
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtConvexCellVertices } from "../../../../packages/engine/src/architecture/builtConvexCellVertices";
import { builtSpaceVolumeBounds } from "../../../../packages/engine/src/architecture/builtSpaceVolumeBounds";
import { boxCell } from "../internal/envelopeFixtures";
import { nclose } from "../internal/nclose";
import { namedFacts, vclose } from "../internal/predicates";

/**
 * Solve convex-cell vertices and derive volume bounds from cells, shells or no stated volume.
 *
 * Scenarios:
 * 1. A unit cube produces eight ordered corners, each coordinate within 5e-10 metres of its literal expected value.
 * 2. Six planes through the origin produce one retained point; this case observes deduplicated count rather than its coordinates.
 * 3. A plane whose normal is zero states no half-space and is skipped, so a cell carrying one is read from the planes that remain.
 * 4. A single half-space closes nothing and produces no corners at all.
 * 5. A celled space reports the extent of the corners its cells cut, a shelled space the extent of its own vertices, and a space stating neither reports nothing rather than a box at the origin.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls builtConvexCellVertices and builtSpaceVolumeBounds, observing ordered unit-cube coordinates, point/zero-normal/unbounded counts and cell/shell/null bounds. Duplicate cube corners, invented half-space extents, omitted volume spelling or wrong union extremes change these observations; this fixture does not isolate an independently solvable triple lying outside another plane.
 * @evidence contracts/testing.md#independent-expectations Six literal unit-box inequalities give all eight coordinate triples checked at 5e-10 metres; origin planes give count one, and adding a zero normal retains count eight. Local L-shaped cell endpoints and tetrahedron vertices fix their min/max through the original vclose tolerance. These are finite, well-conditioned examples rather than numerical certification of every admitted plane system.
 * @evidence contracts/testing.md#distinguishing-cases Unit cube, redundant/zero planes, a singleton point, an unbounded half-space, cell and shell spellings and unstated volume distinguish finite corners from invented bounds; arbitrary ill-conditioned plane systems are not numerically certified.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_convex_cell_vertices imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_convex_cell_vertices(): void {
  TestValidator.predicate(
    "a unit cube's planes cut exactly its own eight corners",
    ((): boolean => {
      const observed: [number, number, number][] = ordered(
        builtConvexCellVertices(
          boxCell("cube", { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }),
        ),
      );
      return (
        Array.isArray(observed) &&
        observed.length === 8 &&
        Array.isArray(observed[0]!) &&
        observed[0]!.length === 3 &&
        typeof observed[0]![0]! === "number" &&
        nclose(observed[0]![0]!, 0, 5e-10) &&
        typeof observed[0]![1]! === "number" &&
        nclose(observed[0]![1]!, 0, 5e-10) &&
        typeof observed[0]![2]! === "number" &&
        nclose(observed[0]![2]!, 0, 5e-10) &&
        Array.isArray(observed[1]!) &&
        observed[1]!.length === 3 &&
        typeof observed[1]![0]! === "number" &&
        nclose(observed[1]![0]!, 0, 5e-10) &&
        typeof observed[1]![1]! === "number" &&
        nclose(observed[1]![1]!, 0, 5e-10) &&
        typeof observed[1]![2]! === "number" &&
        nclose(observed[1]![2]!, 1, 5e-10) &&
        Array.isArray(observed[2]!) &&
        observed[2]!.length === 3 &&
        typeof observed[2]![0]! === "number" &&
        nclose(observed[2]![0]!, 0, 5e-10) &&
        typeof observed[2]![1]! === "number" &&
        nclose(observed[2]![1]!, 1, 5e-10) &&
        typeof observed[2]![2]! === "number" &&
        nclose(observed[2]![2]!, 0, 5e-10) &&
        Array.isArray(observed[3]!) &&
        observed[3]!.length === 3 &&
        typeof observed[3]![0]! === "number" &&
        nclose(observed[3]![0]!, 0, 5e-10) &&
        typeof observed[3]![1]! === "number" &&
        nclose(observed[3]![1]!, 1, 5e-10) &&
        typeof observed[3]![2]! === "number" &&
        nclose(observed[3]![2]!, 1, 5e-10) &&
        Array.isArray(observed[4]!) &&
        observed[4]!.length === 3 &&
        typeof observed[4]![0]! === "number" &&
        nclose(observed[4]![0]!, 1, 5e-10) &&
        typeof observed[4]![1]! === "number" &&
        nclose(observed[4]![1]!, 0, 5e-10) &&
        typeof observed[4]![2]! === "number" &&
        nclose(observed[4]![2]!, 0, 5e-10) &&
        Array.isArray(observed[5]!) &&
        observed[5]!.length === 3 &&
        typeof observed[5]![0]! === "number" &&
        nclose(observed[5]![0]!, 1, 5e-10) &&
        typeof observed[5]![1]! === "number" &&
        nclose(observed[5]![1]!, 0, 5e-10) &&
        typeof observed[5]![2]! === "number" &&
        nclose(observed[5]![2]!, 1, 5e-10) &&
        Array.isArray(observed[6]!) &&
        observed[6]!.length === 3 &&
        typeof observed[6]![0]! === "number" &&
        nclose(observed[6]![0]!, 1, 5e-10) &&
        typeof observed[6]![1]! === "number" &&
        nclose(observed[6]![1]!, 1, 5e-10) &&
        typeof observed[6]![2]! === "number" &&
        nclose(observed[6]![2]!, 0, 5e-10) &&
        Array.isArray(observed[7]!) &&
        observed[7]!.length === 3 &&
        typeof observed[7]![0]! === "number" &&
        nclose(observed[7]![0]!, 1, 5e-10) &&
        typeof observed[7]![1]! === "number" &&
        nclose(observed[7]![1]!, 1, 5e-10) &&
        typeof observed[7]![2]! === "number" &&
        nclose(observed[7]![2]!, 1, 5e-10)
      );
    })(),
  );

  TestValidator.equals(
    "degenerate and redundant planes are read for what they state",
    namedFacts([
      [
        "six planes through one point cut that point once",
        (): boolean =>
          ordered(
            builtConvexCellVertices(
              boxCell("point", { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }),
            ),
          ).length === 1,
      ],
      [
        "a plane with no normal states no half-space",
        (): boolean =>
          ordered(
            builtConvexCellVertices({
              id: "with-null-plane",
              planes: [
                { normal: { x: 0, y: 0, z: 0 }, offset: 7 },
                ...boxCell("cube", { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 })
                  .planes,
              ],
            }),
          ).length === 8,
      ],
      [
        "and one half-space closes nothing",
        (): boolean =>
          builtConvexCellVertices({
            id: "sky",
            planes: [{ normal: { x: 0, y: 1, z: 0 }, offset: 3 }],
          }).length === 0,
      ],
    ]),
    {
      "six planes through one point cut that point once": true,
      "a plane with no normal states no half-space": true,
      "and one half-space closes nothing": true,
    },
  );

  TestValidator.equals(
    "both stated-volume spellings measure, and an unstated one measures nothing",
    namedFacts([
      [
        "a celled space measures the corners its planes cut",
        (): boolean => {
          const box: IAutoMovieSubjectBox | null = builtSpaceVolumeBounds({
            id: "hall",
            kind: "room",
            parent: null,
            cells: [
              boxCell("a", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 1 }),
              boxCell("b", { x: 0, y: 0, z: 1 }, { x: 1, y: 3, z: 4 }),
            ],
          });
          return (
            box !== null &&
            vclose(box.min, { x: 0, y: 0, z: 0 }) &&
            vclose(box.max, { x: 4, y: 3, z: 4 })
          );
        },
      ],
      [
        "a shelled space measures its own vertices",
        (): boolean => {
          const box: IAutoMovieSubjectBox | null = builtSpaceVolumeBounds({
            id: "hall",
            kind: "room",
            parent: null,
            cells: [],
            shell: {
              vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
                { x: 0, y: 0, z: 1 },
              ],
              triangles: [0, 2, 1, 0, 3, 2, 0, 1, 3, 1, 2, 3],
            },
          });
          return (
            box !== null &&
            vclose(box.min, { x: 0, y: 0, z: 0 }) &&
            vclose(box.max, { x: 1, y: 1, z: 1 })
          );
        },
      ],
      [
        "a space stating no volume measures nothing",
        (): boolean =>
          builtSpaceVolumeBounds({
            id: "hall",
            kind: "zone",
            parent: null,
            cells: [],
          }) === null,
      ],
      [
        "and a space whose cell closes nothing measures nothing either",
        (): boolean =>
          builtSpaceVolumeBounds({
            id: "hall",
            kind: "room",
            parent: null,
            cells: [
              {
                id: "sky",
                planes: [{ normal: { x: 0, y: 1, z: 0 }, offset: 3 }],
              },
            ],
          }) === null,
      ],
    ]),
    {
      "a celled space measures the corners its planes cut": true,
      "a shelled space measures its own vertices": true,
      "a space stating no volume measures nothing": true,
      "and a space whose cell closes nothing measures nothing either": true,
    },
  );
}

/**
 * Raw solved coordinates in lexicographic order for the unit-box corner oracle; the caller compares metres with a half-nanometre tolerance.
 */
const ordered: (
  vertices: readonly IAutoMovieVector3[],
) => Array<[number, number, number]> = (
  vertices: readonly IAutoMovieVector3[],
): Array<[number, number, number]> =>
  vertices
    .map((vertex: IAutoMovieVector3): [number, number, number] => [
      vertex.x,
      vertex.y,
      vertex.z,
    ])
    .sort(
      (
        left: [number, number, number],
        right: [number, number, number],
      ): number =>
        left[0] - right[0] || left[1] - right[1] || left[2] - right[2],
    );
