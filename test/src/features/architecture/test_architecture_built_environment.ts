import type {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSurface,
  IAutoMovieModel,
  IAutoMovieSpace,
  IAutoMovieStageSetPiece,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieSubjectContribution, builtEnvironmentAdjacentSpaces, builtEnvironmentBuildingOfSpace, builtEnvironmentContainsPoint, builtEnvironmentSpaceConnectors, builtEnvironmentSpaceNodes, builtEnvironmentSpaceSurfaces, lowerBuiltEnvironment, mergeAutoMovieSpaces, validateBuiltEnvironment } from "@automovie/engine";









import { assertBuiltEnvironmentTestRefusals } from "../internal/assertBuiltEnvironmentTestRefusals";
import { builtEnvironmentTestBuilding as building } from "../internal/builtEnvironmentTestBuilding";
import { builtEnvironmentTestCampus as campus } from "../internal/builtEnvironmentTestCampus";
import { builtEnvironmentTestRefusalPaths as refusalPaths } from "../internal/builtEnvironmentTestRefusalPaths";
import { nclose } from "../internal/nclose";
import { namedFacts, qclose, throwsError } from "../internal/predicates";
import { sameProductData } from "../internal/sameProductData";

/**
 * Lower linked visible, logical and traversal graphs and query their stable identities and descendant membership.
 *
 * Scenarios:
 * 1. A four-space, three-connector tower validates, and the space list it lowers to is namespaced by the work id rather than colliding with world spaces.
 * 2. Parent-local placement flattens to world TRS: a slab offset under a translated root lands at the summed position with its own axis scale, and a quarter-turn about Z survives as a quaternion rather than a yaw.
 * 3. Support spaces merge into one stage space without restating surfaces.
 * 4. Containment answers for a space and every descendant, and refuses a point outside all of them.
 * 5. Adjacency follows both boundaries and connectors, and honours a one-way ladder in one direction only.
 * 6. The connector query answers with the authored records, so a stair's 3D centre route is still there after the query.
 * 7. The surface query answers support patches by stable id for a space and its descendants, separating "supports" from "walkable" (the helipad deck holds a prop but is not walkable).
 * 8. The staged-node query returns the expected subtree ids; the unassigned envelope remains visible while belonging to no queried room.
 * 9. Building ownership is answered per logical space across two units.
 * 10. Every query refuses an unknown space id instead of answering emptily.
 * 11. Reversing element declaration order still lowers four visible set pieces; this check observes count rather than complete reordered poses.
 * 12. One work owns two independently rooted, independently placed units.
 * 13. Sixty-eight malformed graphs are each refused at their own path.
 * 14. Lowering refuses an invalid building rather than emitting a partial set.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls lowerBuiltEnvironment and the containment, adjacency, connector, surface, node and building-owner queries, alongside validateBuiltEnvironment and its existing located mutation part. Returned ids, selected world TRS fields, support rows, point verdicts and throws expose lost hierarchy placement, confused walkability or cross-unit ownership; reversed declaration order is observed only through staged count.
 * @evidence contracts/testing.md#independent-expectations Authored tower ids, parent X 10 plus slab X 2, scale (4,0.2,3) and literal Z quarter-turn determine the selected fields under existing nclose/qclose limits. Boundary/connector direction, support assignments and explicit id lists fix semantic expectations. The merged support record is compared with authored source surfaces through sameProductData at numeric tolerance zero; this checks transport rather than independently measuring those surfaces or rendering the building.
 * @evidence contracts/testing.md#distinguishing-cases Multi-level and two-unit graphs, descendant containment, one-way adjacency, empty connector lists, support versus walkability, unassigned visible elements, unknown spaces, reversed declaration order and located malformed graphs retain working and refusing cases; full shell geometry is checked separately.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_environment imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_environment(): void {
  const source: IAutoMovieBuiltEnvironment = building();
  TestValidator.equals(
    "a multi-level connected building validates",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );
  const contribution: IAutoMovieSubjectContribution =
    lowerBuiltEnvironment(source);
  TestValidator.equals(
    "lowering preserves owned models and the structured building",
    {
      models: contribution.models?.map(
        (model: IAutoMovieModel): string => model.id,
      ),
      buildings: contribution.builtEnvironments?.map(
        (value: IAutoMovieBuiltEnvironment): string => value.id,
      ),
      spaces: contribution.spaces?.map(
        (space: IAutoMovieSpace): string => space.id,
      ),
    },
    {
      models: ["slab"],
      buildings: ["tower"],
      spaces: ["tower/whole", "tower/ground", "tower/upper", "tower/roof"],
    },
  );
  const pieces: readonly IAutoMovieStageSetPiece[] = contribution.set ?? [];
  TestValidator.predicate(
    "parent-local placement is flattened to world-space full TRS",
    ((): boolean => {
      const observed: {
        slab: IAutoMovieStageSetPiece | undefined;
        externalModel: string | undefined;
      } = {
        slab: pieces.find(
          (piece: IAutoMovieStageSetPiece): boolean =>
            piece.node === "tower/ground-slab",
        ),
        externalModel: pieces.find(
          (piece: IAutoMovieStageSetPiece): boolean =>
            piece.node === "tower/bridge",
        )?.model,
      };
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 2 &&
        Object.hasOwn(observed, "slab") &&
        typeof observed["slab"] === "object" &&
        typeof observed["slab"] === "object" &&
        observed["slab"] !== null &&
        observed["slab"] !== undefined &&
        Object.keys(observed["slab"]).length === 5 &&
        Object.hasOwn(observed["slab"], "node") &&
        observed["slab"]["node"] === "tower/ground-slab" &&
        Object.hasOwn(observed["slab"], "model") &&
        observed["slab"]["model"] === "slab" &&
        Object.hasOwn(observed["slab"], "position") &&
        typeof observed["slab"]["position"] === "object" &&
        typeof observed["slab"]["position"] === "object" &&
        observed["slab"]["position"] !== null &&
        observed["slab"]["position"] !== undefined &&
        Object.keys(observed["slab"]["position"]).length === 3 &&
        Object.hasOwn(observed["slab"]["position"], "x") &&
        typeof observed["slab"]["position"]["x"] === "number" &&
        nclose(observed["slab"]["position"]["x"], 12) &&
        Object.hasOwn(observed["slab"]["position"], "y") &&
        typeof observed["slab"]["position"]["y"] === "number" &&
        nclose(observed["slab"]["position"]["y"], 0) &&
        Object.hasOwn(observed["slab"]["position"], "z") &&
        typeof observed["slab"]["position"]["z"] === "number" &&
        nclose(observed["slab"]["position"]["z"], 0) &&
        Object.hasOwn(observed["slab"], "rotation") &&
        typeof observed["slab"]["rotation"] === "object" &&
        typeof observed["slab"]["rotation"] === "object" &&
        observed["slab"]["rotation"] !== null &&
        observed["slab"]["rotation"] !== undefined &&
        Object.keys(observed["slab"]["rotation"]).length === 4 &&
        Object.hasOwn(observed["slab"]["rotation"], "x") &&
        typeof observed["slab"]["rotation"]["x"] === "number" &&
        nclose(observed["slab"]["rotation"]["x"], 0) &&
        Object.hasOwn(observed["slab"]["rotation"], "y") &&
        typeof observed["slab"]["rotation"]["y"] === "number" &&
        nclose(observed["slab"]["rotation"]["y"], 0) &&
        Object.hasOwn(observed["slab"]["rotation"], "z") &&
        typeof observed["slab"]["rotation"]["z"] === "number" &&
        nclose(observed["slab"]["rotation"]["z"], 0) &&
        Object.hasOwn(observed["slab"]["rotation"], "w") &&
        typeof observed["slab"]["rotation"]["w"] === "number" &&
        nclose(observed["slab"]["rotation"]["w"], 1) &&
        Object.hasOwn(observed["slab"], "scale") &&
        typeof observed["slab"]["scale"] === "object" &&
        typeof observed["slab"]["scale"] === "object" &&
        observed["slab"]["scale"] !== null &&
        observed["slab"]["scale"] !== undefined &&
        Object.keys(observed["slab"]["scale"]).length === 3 &&
        Object.hasOwn(observed["slab"]["scale"], "x") &&
        typeof observed["slab"]["scale"]["x"] === "number" &&
        nclose(observed["slab"]["scale"]["x"], 4) &&
        Object.hasOwn(observed["slab"]["scale"], "y") &&
        typeof observed["slab"]["scale"]["y"] === "number" &&
        nclose(observed["slab"]["scale"]["y"], 0.2) &&
        Object.hasOwn(observed["slab"]["scale"], "z") &&
        typeof observed["slab"]["scale"]["z"] === "number" &&
        nclose(observed["slab"]["scale"]["z"], 3) &&
        Object.hasOwn(observed, "externalModel") &&
        observed["externalModel"] === "external-stone"
      );
    })(),
  );
  TestValidator.predicate(
    "full arbitrary rotation survives hierarchy lowering",
    qclose(
      pieces.find(
        (piece: IAutoMovieStageSetPiece): boolean =>
          piece.node === "tower/bridge",
      )!.rotation!,
      {
        x: 0,
        y: 0,
        z: Math.SQRT1_2,
        w: Math.SQRT1_2,
      },
    ),
  );
  TestValidator.predicate(
    "logical support spaces merge without restating surfaces",
    sameProductData(
      mergeAutoMovieSpaces("tower-stage", contribution.spaces ?? []),
      {
        id: "tower-stage",
        surfaces: source.surfaces.map(
          (entry: IAutoMovieBuiltSurface): IAutoMovieSurface => entry.surface,
        ),
        walkable: ["ground-floor", "upper-floor"],
      },
    ),
  );
  TestValidator.equals(
    "containment includes descendants and excludes outside points",
    namedFacts([
      [
        "ground",
        (): boolean =>
          builtEnvironmentContainsPoint(source, "ground", {
            x: 10,
            y: 2,
            z: 0,
          }),
      ],
      [
        "whole",
        (): boolean =>
          builtEnvironmentContainsPoint(source, "whole", {
            x: 10,
            y: 5,
            z: 0,
          }),
      ],
      [
        "outside",
        (): boolean =>
          !builtEnvironmentContainsPoint(source, "whole", {
            x: 100,
            y: 0,
            z: 0,
          }),
      ],
    ]),
    { ground: true, whole: true, outside: true },
  );
  TestValidator.equals(
    "boundaries and directional connectors answer adjacency",
    {
      ground: builtEnvironmentAdjacentSpaces(source, "ground"),
      roof: builtEnvironmentAdjacentSpaces(source, "roof"),
      upper: builtEnvironmentAdjacentSpaces(source, "upper"),
    },
    {
      ground: ["upper", "roof"],
      roof: ["ground", "upper"],
      upper: ["ground"],
    },
  );
  TestValidator.predicate(
    "connector endpoints and authored 3D routes survive the query",
    ((): boolean => {
      const observed: {
        id: string;
        from: string;
        to: string;
        route: IAutoMovieVector3[];
      }[] = builtEnvironmentSpaceConnectors(source, "upper").map(
        (
          connector: IAutoMovieBuiltConnector,
        ): {
          id: string;
          from: string;
          to: string;
          route: IAutoMovieVector3[];
        } => ({
          id: connector.id,
          from: connector.from,
          to: connector.to,
          route: connector.route,
        }),
      );
      return (
        Array.isArray(observed) &&
        observed.length === 2 &&
        typeof observed[0]! === "object" &&
        typeof observed[0]! === "object" &&
        observed[0] !== null &&
        observed[0] !== undefined &&
        Object.keys(observed[0]!).length === 4 &&
        Object.hasOwn(observed[0]!, "id") &&
        observed[0]!["id"] === "grand-stair" &&
        Object.hasOwn(observed[0]!, "from") &&
        observed[0]!["from"] === "ground" &&
        Object.hasOwn(observed[0]!, "to") &&
        observed[0]!["to"] === "upper" &&
        Object.hasOwn(observed[0]!, "route") &&
        Array.isArray(observed[0]!["route"]) &&
        observed[0]!["route"].length === 2 &&
        typeof observed[0]!["route"][0]! === "object" &&
        typeof observed[0]!["route"][0]! === "object" &&
        observed[0]!["route"][0] !== null &&
        observed[0]!["route"][0] !== undefined &&
        Object.keys(observed[0]!["route"][0]!).length === 3 &&
        Object.hasOwn(observed[0]!["route"][0]!, "x") &&
        typeof observed[0]!["route"][0]!["x"] === "number" &&
        nclose(observed[0]!["route"][0]!["x"], 8) &&
        Object.hasOwn(observed[0]!["route"][0]!, "y") &&
        typeof observed[0]!["route"][0]!["y"] === "number" &&
        nclose(observed[0]!["route"][0]!["y"], 0) &&
        Object.hasOwn(observed[0]!["route"][0]!, "z") &&
        typeof observed[0]!["route"][0]!["z"] === "number" &&
        nclose(observed[0]!["route"][0]!["z"], 0) &&
        typeof observed[0]!["route"][1]! === "object" &&
        typeof observed[0]!["route"][1]! === "object" &&
        observed[0]!["route"][1] !== null &&
        observed[0]!["route"][1] !== undefined &&
        Object.keys(observed[0]!["route"][1]!).length === 3 &&
        Object.hasOwn(observed[0]!["route"][1]!, "x") &&
        typeof observed[0]!["route"][1]!["x"] === "number" &&
        nclose(observed[0]!["route"][1]!["x"], 10) &&
        Object.hasOwn(observed[0]!["route"][1]!, "y") &&
        typeof observed[0]!["route"][1]!["y"] === "number" &&
        nclose(observed[0]!["route"][1]!["y"], 4) &&
        Object.hasOwn(observed[0]!["route"][1]!, "z") &&
        typeof observed[0]!["route"][1]!["z"] === "number" &&
        nclose(observed[0]!["route"][1]!["z"], 0) &&
        typeof observed[1]! === "object" &&
        typeof observed[1]! === "object" &&
        observed[1] !== null &&
        observed[1] !== undefined &&
        Object.keys(observed[1]!).length === 4 &&
        Object.hasOwn(observed[1]!, "id") &&
        observed[1]!["id"] === "facade-ladder" &&
        Object.hasOwn(observed[1]!, "from") &&
        observed[1]!["from"] === "roof" &&
        Object.hasOwn(observed[1]!, "to") &&
        observed[1]!["to"] === "upper" &&
        Object.hasOwn(observed[1]!, "route") &&
        Array.isArray(observed[1]!["route"]) &&
        observed[1]!["route"].length === 2 &&
        typeof observed[1]!["route"][0]! === "object" &&
        typeof observed[1]!["route"][0]! === "object" &&
        observed[1]!["route"][0] !== null &&
        observed[1]!["route"][0] !== undefined &&
        Object.keys(observed[1]!["route"][0]!).length === 3 &&
        Object.hasOwn(observed[1]!["route"][0]!, "x") &&
        typeof observed[1]!["route"][0]!["x"] === "number" &&
        nclose(observed[1]!["route"][0]!["x"], 15) &&
        Object.hasOwn(observed[1]!["route"][0]!, "y") &&
        typeof observed[1]!["route"][0]!["y"] === "number" &&
        nclose(observed[1]!["route"][0]!["y"], 7) &&
        Object.hasOwn(observed[1]!["route"][0]!, "z") &&
        typeof observed[1]!["route"][0]!["z"] === "number" &&
        nclose(observed[1]!["route"][0]!["z"], 0) &&
        typeof observed[1]!["route"][1]! === "object" &&
        typeof observed[1]!["route"][1]! === "object" &&
        observed[1]!["route"][1] !== null &&
        observed[1]!["route"][1] !== undefined &&
        Object.keys(observed[1]!["route"][1]!).length === 3 &&
        Object.hasOwn(observed[1]!["route"][1]!, "x") &&
        typeof observed[1]!["route"][1]!["x"] === "number" &&
        nclose(observed[1]!["route"][1]!["x"], 15) &&
        Object.hasOwn(observed[1]!["route"][1]!, "y") &&
        typeof observed[1]!["route"][1]!["y"] === "number" &&
        nclose(observed[1]!["route"][1]!["y"], 4) &&
        Object.hasOwn(observed[1]!["route"][1]!, "z") &&
        typeof observed[1]!["route"][1]!["z"] === "number" &&
        nclose(observed[1]!["route"][1]!["z"], 0)
      );
    })(),
  );
  TestValidator.equals(
    "a space with no connector at all answers with an empty list",
    builtEnvironmentSpaceConnectors(source, "whole"),
    [],
  );
  TestValidator.equals(
    "support and walkability are answered separately by stable surface id",
    {
      whole: builtEnvironmentSpaceSurfaces(source, "whole"),
      roof: builtEnvironmentSpaceSurfaces(source, "roof"),
    },
    {
      whole: [
        { space: "ground", surface: "ground-floor", walkable: true },
        { space: "upper", surface: "upper-floor", walkable: true },
        { space: "roof", surface: "helipad-deck", walkable: false },
      ],
      roof: [{ space: "roof", surface: "helipad-deck", walkable: false }],
    },
  );
  TestValidator.equals(
    "staged nodes and logical spaces answer over the same stable ids",
    {
      whole: builtEnvironmentSpaceNodes(source, "whole"),
      ground: builtEnvironmentSpaceNodes(source, "ground"),
      unplaced: pieces
        .map((piece: IAutoMovieStageSetPiece): string => piece.node)
        .filter(
          (node: string): boolean =>
            !builtEnvironmentSpaceNodes(source, "whole").includes(node),
        ),
    },
    {
      whole: ["tower/ground-slab", "tower/bridge", "tower/helipad"],
      ground: ["tower/ground-slab"],
      unplaced: ["tower/curtain-wall"],
    },
  );
  const twoUnits: IAutoMovieBuiltEnvironment = campus();
  TestValidator.equals(
    "each logical space names the building unit that owns it",
    {
      room: builtEnvironmentBuildingOfSpace(twoUnits, "ground"),
      root: builtEnvironmentBuildingOfSpace(twoUnits, "whole"),
      annex: builtEnvironmentBuildingOfSpace(twoUnits, "annex-space"),
    },
    { room: "tower-a", root: "tower-a", annex: "annex" },
  );
  TestValidator.predicate(
    "unknown containment space throws",
    throwsError((): boolean =>
      builtEnvironmentContainsPoint(source, "missing", { x: 0, y: 0, z: 0 }),
    ),
  );
  TestValidator.predicate(
    "unknown adjacency space throws",
    throwsError((): string[] =>
      builtEnvironmentAdjacentSpaces(source, "missing"),
    ),
  );
  TestValidator.predicate(
    "unknown connector space throws",
    throwsError((): IAutoMovieBuiltConnector[] =>
      builtEnvironmentSpaceConnectors(source, "missing"),
    ),
  );
  TestValidator.predicate(
    "unknown surface space throws",
    throwsError((): { space: string; surface: string; walkable: boolean }[] =>
      builtEnvironmentSpaceSurfaces(source, "missing"),
    ),
  );
  TestValidator.predicate(
    "unknown staged-node space throws",
    throwsError((): string[] => builtEnvironmentSpaceNodes(source, "missing")),
  );
  TestValidator.predicate(
    "unknown owner space throws",
    throwsError((): string =>
      builtEnvironmentBuildingOfSpace(source, "missing"),
    ),
  );
  TestValidator.predicate(
    "a space owned by no building unit throws",
    throwsError((): void => {
      const orphan: IAutoMovieBuiltEnvironment = building();
      orphan.spaces.push({
        id: "detached",
        kind: "room",
        parent: null,
        cells: [],
      });
      builtEnvironmentBuildingOfSpace(orphan, "detached");
    }),
  );

  const reversed: IAutoMovieBuiltEnvironment = building();
  reversed.elements.reverse();
  TestValidator.predicate(
    "lowering composes parents independently of declaration order",
    ((): boolean => {
      const observed: number | undefined =
        lowerBuiltEnvironment(reversed).set?.length;
      return typeof observed === "number" && nclose(observed, 4);
    })(),
  );

  TestValidator.equals(
    "one work may own independently placed building units",
    validateBuiltEnvironment({ environment: twoUnits }).success,
    true,
  );
  assertBuiltEnvironmentTestRefusals();
  TestValidator.equals(
    "the untouched fixture produces no violation path at all",
    refusalPaths((): void => {}),
    [],
  );
  TestValidator.predicate(
    "lowering refuses an invalid building",
    throwsError((): void => {
      const value: IAutoMovieBuiltEnvironment = building();
      value.elements[0]!.parent = "missing";
      lowerBuiltEnvironment(value);
    }),
  );
}
