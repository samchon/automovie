import { bounds } from "../internal/bounds";
import { arch } from "../internal/arch";
import { colonnade } from "../internal/colonnade";
import { roof } from "../internal/roof";
import { stair } from "../internal/stair";
import { cofferedCeiling } from "../internal/cofferedCeiling";
import { tiledFloor } from "../internal/tiledFloor";
import { IAutoMovieMeshAssembly } from "../../../../packages/engine/src/geometry/IAutoMovieMeshAssembly";
import { buildAutoMovieWall } from "../../../../packages/engine/src/geometry/buildAutoMovieWall";
import { inspectAutoMovieMeshTopology } from "../../../../packages/engine/src/geometry/inspectAutoMovieMeshTopology";
import { mergeAutoMovieMeshParts } from "../../../../packages/engine/src/geometry/mergeAutoMovieMeshParts";
import { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

/**
 * A code-only fixture builds a building's members from the kernel alone.
 *
 * This is the acceptance the kernel exists for: an opening wall, an arch, a
 * column row, gable and hip roofs, straight and helical stairs, a barrel vault,
 * a coffered ceiling, and a tiled floor, every one of them generated from loops
 * and utilities and never from an authored vertex array. The members live here
 * and not in the engine on purpose: the engine ships operations a customer
 * composes, not a catalogue of components they were going to author anyway.
 *
 * Volume expectations use hand math on the authored dimensions: shoelace area
 * times depth, the analytic n-gon prism, the prismatoid volume of a ridged
 * solid — so a builder that drifts is caught by arithmetic rather than by a
 * re-recorded snapshot.
 *
 * Scenarios:
 *
 * 1. An arch on piers merges `segments + 2` groups whose volume equals the sum of
 *    its voussoir and pier prisms, and reaches exactly its authored extrados.
 * 2. The same builder at zero springing is a barrel vault: the ring alone, no
 *    piers, extruded to its length.
 * 3. A column row places one revolve `count` times; the assembly volume is `count`
 *    analytic n-gon prisms and the row spans `(count − 1) · spacing`.
 * 4. A gable roof is watertight with volume `w·h·d/2`, and a hip roof with the
 *    same eaves integrates its shrinking rectangle section to `w·h·(d/2 −
 *    inset/3)`.
 * 5. A straight flight rises `steps · rise` over `steps · run`; a helical flight
 *    of the same steps holds the same total volume while turning.
 * 6. A coffered ceiling generates `1 + (rows + 1) + (columns + 1)` members and a
 *    tiled floor `rows · columns`, each spanning its authored field.
 * 7. An opening wall composes with the members and keeps its own volume.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes wall, extrusion, revolution, polyhedron, transform and merge source through the existing member builders; asserts assembly group identities, bounds, topology and volume to catch misplaced or lost members while allowing their authored tessellation.
 * @evidence contracts/testing.md#independent-expectations Prism, polygon-area and prismatoid formulas determine volumes and dimension arithmetic determines bounds. Arch area shares the builder's authored ring coordinates but uses shoelace accumulation rather than mesh tetrahedra; it cannot detect a common mistake in those ring coordinates. Watertightness is the topology observer's result, not a pixel or full building-admission proof.
 * @evidence contracts/testing.md#distinguishing-cases Retains piers versus zero-springing vault, repeated columns, gable versus inset hip, straight versus turning stairs, ceiling/floor grids and an opening wall composed with a roof. Malformed kernel inputs belong to the individual procedural-operation tests; these compositions do not establish arbitrary architectural validity.
 * @evidence contracts/testing.md#execution-ownership The named geometry entry constructs its existing code-only fixtures through the canonical arch, colonnade, roof, stair, ceiling and floor helpers and calls portable engine source and numerical observers directly. It starts no process, browser, GPU or native build and registers no additional cases.
 */
export function test_geometry_architecture_fixture(): void {
  const ringed: { assembly: IAutoMovieMeshAssembly; volume: number; } = arch({
    span: 3,
    rise: 1.5,
    thickness: 0.4,
    depth: 0.6,
    springing: 2,
    segments: 6,
  });
  const archBounds: [number, number][] = bounds(ringed.assembly.mesh);
  TestValidator.equals(
    "an arch on piers merges its voussoirs and piers at the authored extrados",
    namedFacts([
      ["groups", (): boolean  => ringed.assembly.groups.length === 6 + 2],
      [
        "ids",
        (): boolean  =>
          ringed.assembly.groups.at(-1)!.id === "pier-right" &&
          ringed.assembly.groups[0]!.id === "voussoir-1",
      ],
      [
        "volume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(ringed.assembly.mesh).volume,
            ringed.volume,
            1e-12,
          ),
      ],
      ["span", (): boolean  => nclose(archBounds[0]![1], 3 / 2 + 0.4, 1e-12)],
      ["crown", (): boolean  => nclose(archBounds[1]![1], 2 + 1.5 + 0.4, 1e-12)],
      ["springing", (): boolean  => nclose(archBounds[1]![0], 0, 1e-12)],
      [
        "depth",
        (): boolean  => nclose(archBounds[2]![1] - archBounds[2]![0], 0.6, 1e-12),
      ],
    ]),
    {
      groups: true,
      ids: true,
      volume: true,
      span: true,
      crown: true,
      springing: true,
      depth: true,
    },
  );

  const vault: { assembly: IAutoMovieMeshAssembly; volume: number; } = arch({
    span: 4,
    rise: 2,
    thickness: 0.3,
    depth: 8,
    springing: 0,
    segments: 8,
  });
  TestValidator.equals(
    "the same builder at zero springing is a barrel vault of pure ring",
    namedFacts([
      ["groups", (): boolean  => vault.assembly.groups.length === 8],
      [
        "volume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(vault.assembly.mesh).volume,
            vault.volume,
            1e-12,
          ),
      ],
      [
        "length",
        (): boolean  => {
          const box: [number, number][] = bounds(vault.assembly.mesh);
          return nclose(box[2]![1] - box[2]![0], 8, 1e-12);
        },
      ],
    ]),
    { groups: true, volume: true, length: true },
  );

  const row: IAutoMovieMeshAssembly = colonnade({
    count: 4,
    spacing: 2.5,
    radius: 0.3,
    height: 4,
    segments: 12,
  });
  const ngon: number = (12 / 2) * 0.3 * 0.3 * Math.sin((2 * Math.PI) / 12);
  const rowBounds: [number, number][] = bounds(row.mesh);
  TestValidator.equals(
    "a column row is one revolve placed four times, of four n-gon prisms",
    namedFacts([
      ["groups", (): boolean  => row.groups.length === 4],
      [
        "volume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(row.mesh).volume,
            4 * ngon * 4,
            1e-9,
          ),
      ],
      [
        "span",
        (): boolean  =>
          nclose(rowBounds[0]![1] - rowBounds[0]![0], 3 * 2.5 + 2 * 0.3, 1e-9),
      ],
      ["height", (): boolean  => nclose(rowBounds[1]![1], 4, 1e-12)],
    ]),
    { groups: true, volume: true, span: true, height: true },
  );

  const gable: IAutoMovieMesh = roof({ width: 6, depth: 10, height: 2.5, ridgeInset: 0 });
  const hip: IAutoMovieMesh = roof({ width: 6, depth: 10, height: 2.5, ridgeInset: 2 });
  TestValidator.equals(
    "a gable and a hip roof share their eaves and differ by the prismatoid rule",
    namedFacts([
      ["gableClosed", (): boolean  => inspectAutoMovieMeshTopology(gable).watertight],
      ["hipClosed", (): boolean  => inspectAutoMovieMeshTopology(hip).watertight],
      [
        "gableVolume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(gable).volume,
            (6 * 2.5 * 10) / 2,
            1e-12,
          ),
      ],
      [
        "hipVolume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(hip).volume,
            6 * 2.5 * (10 / 2 - 2 / 3),
            1e-12,
          ),
      ],
      [
        "eaves",
        (): boolean  =>
          equalGeometryTestValues(bounds(gable)[0], bounds(hip)[0]),
      ],
    ]),
    {
      gableClosed: true,
      hipClosed: true,
      gableVolume: true,
      hipVolume: true,
      eaves: true,
    },
  );

  const straight: IAutoMovieMeshAssembly = stair({
    steps: 5,
    rise: 0.18,
    run: 0.28,
    width: 1.1,
    turnDeg: 0,
    innerRadius: 0,
  });
  const helical: IAutoMovieMeshAssembly = stair({
    steps: 5,
    rise: 0.18,
    run: 0.28,
    width: 1.1,
    turnDeg: 90,
    innerRadius: 0.2,
  });
  const stepVolume: number =
    1.1 * 0.28 * (0.18 * 0.2) + 1.1 * (0.18 * 0.8) * (0.28 * 0.15);
  const straightBounds: [number, number][] = bounds(straight.mesh);
  TestValidator.equals(
    "a straight flight rises over its going and a helical flight keeps its stock",
    namedFacts([
      ["groups", (): boolean  => straight.groups.length === 2 * 5],
      ["helicalGroups", (): boolean  => helical.groups.length === 2 * 5],
      ["top", (): boolean  => nclose(straightBounds[1]![1], 5 * 0.18, 1e-12)],
      ["going", (): boolean  => nclose(straightBounds[2]![1], 5 * 0.28, 1e-12)],
      [
        "width",
        (): boolean  => nclose(straightBounds[0]![1] - straightBounds[0]![0], 1.1, 1e-12),
      ],
      [
        "volume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(straight.mesh).volume,
            5 * stepVolume,
            1e-12,
          ),
      ],
      [
        "helicalVolume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(helical.mesh).volume,
            5 * stepVolume,
            1e-12,
          ),
      ],
      ["turns", (): boolean  => bounds(helical.mesh)[0]![1] > straightBounds[0]![1]],
    ]),
    {
      groups: true,
      helicalGroups: true,
      top: true,
      going: true,
      width: true,
      volume: true,
      helicalVolume: true,
      turns: true,
    },
  );

  const ceiling: IAutoMovieMeshAssembly = cofferedCeiling({
    width: 6,
    depth: 4,
    rows: 3,
    columns: 4,
    beam: 0.2,
    drop: 0.3,
    panel: 0.1,
  });
  const floor: IAutoMovieMeshAssembly = tiledFloor({
    rows: 3,
    columns: 5,
    tile: 0.6,
    joint: 0.02,
    thickness: 0.02,
  });
  const floorBounds: [number, number][] = bounds(floor.mesh);
  TestValidator.equals(
    "a coffered ceiling and a tiled floor generate every member from their counts",
    namedFacts([
      ["ceilingGroups", (): boolean  => ceiling.groups.length === 1 + 4 + 5],
      ["floorGroups", (): boolean  => floor.groups.length === 3 * 5],
      [
        "floorWidth",
        (): boolean  =>
          nclose(
            floorBounds[0]![1] - floorBounds[0]![0],
            5 * 0.62 - 0.02,
            1e-12,
          ),
      ],
      [
        "floorDepth",
        (): boolean  =>
          nclose(
            floorBounds[2]![1] - floorBounds[2]![0],
            3 * 0.62 - 0.02,
            1e-12,
          ),
      ],
      [
        "floorVolume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(floor.mesh).volume,
            3 * 5 * 0.6 * 0.6 * 0.02,
            1e-12,
          ),
      ],
      ["ceilingDrop", (): boolean  => nclose(bounds(ceiling.mesh)[1]![0], -0.3, 1e-12)],
    ]),
    {
      ceilingGroups: true,
      floorGroups: true,
      floorWidth: true,
      floorDepth: true,
      floorVolume: true,
      ceilingDrop: true,
    },
  );

  const walled: IAutoMovieMeshAssembly = mergeAutoMovieMeshParts([
    {
      id: "wall",
      mesh: buildAutoMovieWall({
        width: 6,
        height: 3,
        depth: 0.25,
        openings: [
          { id: "door", x: 0.5, y: 0, width: 1, height: 2.1 },
          { id: "window", x: 3, y: 1, width: 1.2, height: 1 },
        ],
      }),
    },
    {
      id: "roof",
      mesh: gable,
      transform: { translation: { x: 0, y: 1.5, z: 0 } },
    },
  ]);
  TestValidator.equals(
    "an opening wall composes with a roof and keeps its own volume",
    namedFacts([
      ["groups", (): boolean  => walled.groups.length === 2],
      [
        "volume",
        (): boolean  =>
          nclose(
            inspectAutoMovieMeshTopology(walled.mesh).volume,
            (6 * 3 - 1 * 2.1 - 1.2 * 1) * 0.25 + (6 * 2.5 * 10) / 2,
            1e-12,
          ),
      ],
      [
        "attributes",
        (): boolean  => walled.mesh.normals !== null && walled.mesh.uvs === null,
      ],
    ]),
    { groups: true, volume: true, attributes: true },
  );
}
