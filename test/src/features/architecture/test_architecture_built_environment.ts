import { builtEnvironmentAdjacentSpaces, builtEnvironmentBuildingOfSpace, builtEnvironmentContainsPoint, builtEnvironmentSpaceConnectors, builtEnvironmentSpaceNodes, builtEnvironmentSpaceSurfaces, lowerBuiltEnvironment, mergeAutoMovieSpaces, validateBuiltEnvironment } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, qclose, throwsError } from "../internal/predicates";
import { builtEnvironmentTestBuilding as building } from "../internal/builtEnvironmentTestBuilding";
import { builtEnvironmentTestCampus as campus } from "../internal/builtEnvironmentTestCampus";
import { assertBuiltEnvironmentTestRefusals } from "../internal/assertBuiltEnvironmentTestRefusals";
import { builtEnvironmentTestRefusalPaths as refusalPaths } from "../internal/builtEnvironmentTestRefusalPaths";



/**
 * A building keeps its visible assembly, its logical partitions, and its
 * traversal relations as three linked graphs over one set of stable ids, then
 * lowers once into ordinary shot contributions. This pins that the two
 * hierarchies stay independent, that every query answers by stable id, that a
 * floor is one classification among many rather than the root of anything, and
 * that each malformed graph is refused at the exact field that broke.
 *
 * Scenarios:
 *
 * 1. A four-space, three-connector tower validates, and the space list it lowers
 *    to is namespaced by the work id rather than colliding with world spaces.
 * 2. Parent-local placement flattens to world TRS: a slab offset under a
 *    translated root lands at the summed position with its own axis scale, and
 *    a quarter-turn about Z survives as a quaternion rather than a yaw.
 * 3. Support spaces merge into one stage space without restating surfaces.
 * 4. Containment answers for a space and every descendant, and refuses a point
 *    outside all of them.
 * 5. Adjacency follows both boundaries and connectors, and honours a one-way
 *    ladder in one direction only.
 * 6. The connector query answers with the authored records, so a stair's 3D centre
 *    route is still there after the query.
 * 7. The surface query answers support patches by stable id for a space and its
 *    descendants, separating "supports" from "walkable" (the helipad deck holds
 *    a prop but is not walkable).
 * 8. The staged-node query returns exactly the lowered `node` ids of a space's
 *    subtree, and the envelope element that belongs to no logical space is in
 *    the set yet in no room: visible and semantic never diverge, and neither is
 *    forced to be a subset of the other.
 * 9. Building ownership is answered per logical space across two units.
 * 10. Every query refuses an unknown space id instead of answering emptily.
 * 11. Declaration order does not change the lowering, because parents are composed
 *     by reference rather than by position.
 * 12. One work owns two independently rooted, independently placed units.
 * 13. Sixty-eight malformed graphs are each refused at their own path.
 * 14. Lowering refuses an invalid building rather than emitting a partial set.
 */
export const test_architecture_built_environment = (): void => {
  const source = building();
  TestValidator.equals(
    "a multi-level connected building validates",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );
  const contribution = lowerBuiltEnvironment(source);
  TestValidator.equals(
    "lowering preserves owned models and the structured building",
    {
      models: contribution.models?.map((model) => model.id),
      buildings: contribution.builtEnvironments?.map((value) => value.id),
      spaces: contribution.spaces?.map((space) => space.id),
    },
    {
      models: ["slab"],
      buildings: ["tower"],
      spaces: ["tower/whole", "tower/ground", "tower/upper", "tower/roof"],
    },
  );
  const pieces = contribution.set ?? [];
  TestValidator.equals(
    "parent-local placement is flattened to world-space full TRS",
    {
      slab: pieces.find((piece) => piece.node === "tower/ground-slab"),
      externalModel: pieces.find((piece) => piece.node === "tower/bridge")
        ?.model,
    },
    {
      slab: {
        node: "tower/ground-slab",
        model: "slab",
        position: { x: 12, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 4, y: 0.2, z: 3 },
      },
      externalModel: "external-stone",
    },
  );
  TestValidator.predicate(
    "full arbitrary rotation survives hierarchy lowering",
    qclose(pieces.find((piece) => piece.node === "tower/bridge")!.rotation!, {
      x: 0,
      y: 0,
      z: Math.SQRT1_2,
      w: Math.SQRT1_2,
    }),
  );
  TestValidator.equals(
    "logical support spaces merge without restating surfaces",
    mergeAutoMovieSpaces("tower-stage", contribution.spaces ?? []),
    {
      id: "tower-stage",
      surfaces: source.surfaces.map((entry) => entry.surface),
      walkable: ["ground-floor", "upper-floor"],
    },
  );
  TestValidator.equals(
    "containment includes descendants and excludes outside points",
    namedFacts([
      [
        "ground",
        () =>
          builtEnvironmentContainsPoint(source, "ground", {
            x: 10,
            y: 2,
            z: 0,
          }),
      ],
      [
        "whole",
        () =>
          builtEnvironmentContainsPoint(source, "whole", {
            x: 10,
            y: 5,
            z: 0,
          }),
      ],
      [
        "outside",
        () =>
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
  TestValidator.equals(
    "connector endpoints and authored 3D routes survive the query",
    builtEnvironmentSpaceConnectors(source, "upper").map((connector) => ({
      id: connector.id,
      from: connector.from,
      to: connector.to,
      route: connector.route,
    })),
    [
      {
        id: "grand-stair",
        from: "ground",
        to: "upper",
        route: [
          { x: 8, y: 0, z: 0 },
          { x: 10, y: 4, z: 0 },
        ],
      },
      {
        id: "facade-ladder",
        from: "roof",
        to: "upper",
        route: [
          { x: 15, y: 7, z: 0 },
          { x: 15, y: 4, z: 0 },
        ],
      },
    ],
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
        .map((piece) => piece.node)
        .filter(
          (node) => !builtEnvironmentSpaceNodes(source, "whole").includes(node),
        ),
    },
    {
      whole: ["tower/ground-slab", "tower/bridge", "tower/helipad"],
      ground: ["tower/ground-slab"],
      unplaced: ["tower/curtain-wall"],
    },
  );
  const twoUnits = campus();
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
    throwsError(() =>
      builtEnvironmentContainsPoint(source, "missing", { x: 0, y: 0, z: 0 }),
    ),
  );
  TestValidator.predicate(
    "unknown adjacency space throws",
    throwsError(() => builtEnvironmentAdjacentSpaces(source, "missing")),
  );
  TestValidator.predicate(
    "unknown connector space throws",
    throwsError(() => builtEnvironmentSpaceConnectors(source, "missing")),
  );
  TestValidator.predicate(
    "unknown surface space throws",
    throwsError(() => builtEnvironmentSpaceSurfaces(source, "missing")),
  );
  TestValidator.predicate(
    "unknown staged-node space throws",
    throwsError(() => builtEnvironmentSpaceNodes(source, "missing")),
  );
  TestValidator.predicate(
    "unknown owner space throws",
    throwsError(() => builtEnvironmentBuildingOfSpace(source, "missing")),
  );
  TestValidator.predicate(
    "a space owned by no building unit throws",
    throwsError(() => {
      const orphan = building();
      orphan.spaces.push({
        id: "detached",
        kind: "room",
        parent: null,
        cells: [],
      });
      builtEnvironmentBuildingOfSpace(orphan, "detached");
    }),
  );

  const reversed = building();
  reversed.elements.reverse();
  TestValidator.equals(
    "lowering composes parents independently of declaration order",
    lowerBuiltEnvironment(reversed).set?.length,
    4,
  );

  TestValidator.equals(
    "one work may own independently placed building units",
    validateBuiltEnvironment({ environment: twoUnits }).success,
    true,
  );
  assertBuiltEnvironmentTestRefusals();
  TestValidator.equals(
    "the untouched fixture produces no violation path at all",
    refusalPaths(() => {}),
    [],
  );
  TestValidator.predicate(
    "lowering refuses an invalid building",
    throwsError(() => {
      const value = building();
      value.elements[0]!.parent = "missing";
      lowerBuiltEnvironment(value);
    }),
  );
};
