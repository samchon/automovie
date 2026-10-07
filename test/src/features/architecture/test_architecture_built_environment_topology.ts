import {
  builtEnvironmentAdjacentSpaces,
  builtEnvironmentBuildingOfSpace,
  builtEnvironmentContainsPoint,
  builtEnvironmentSpaceNodes,
  lowerBuiltEnvironment,
  validateBuiltEnvironment,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { BUILT_TOPOLOGY_TEST_ANNEX_TILT as ANNEX_TILT } from "../internal/BUILT_TOPOLOGY_TEST_ANNEX_TILT";
import { BUILT_TOPOLOGY_TEST_WING_YAW as WING_YAW } from "../internal/BUILT_TOPOLOGY_TEST_WING_YAW";
import { builtTopologyTestRoll as roll } from "../internal/builtTopologyTestRoll";
import { builtTopologyTestWork as work } from "../internal/builtTopologyTestWork";
import { builtTopologyTestYaw as yaw } from "../internal/builtTopologyTestYaw";
import { namedFacts, nclose, qclose, vclose } from "../internal/predicates";

/**
 * A floor is one classification among many, never the root of the hierarchy.
 *
 * This pins the shapes the requirement calls for against the record as it
 * actually stands: two independently rooted and independently placed building
 * units, a sky-bridge that is a work-owned relation between them at two
 * different heights, a yawed wing and a tilted unit whose full quaternions
 * survive lowering, one duplex owning two slabs, a mezzanine sharing the hall's
 * own air, a void the surrounding storey is written around, and differing
 * storey heights. Two limits are pinned as limits rather than passes: a logical
 * volume is a set of convex cells, so a non-convex region exists only as the
 * cells it is split into, and a curved shell (dome, vault, free-form surface)
 * is visible geometry in a cited model whose logical volume here is only its
 * bounding cell.
 *
 * Scenarios:
 *
 * 1. The whole work validates as one record.
 * 2. The only root spaces are the two building units' roots; every storey, duplex,
 *    attic, void, mezzanine and dome is a child classification, and the kinds
 *    are siblings rather than levels of a floor tree.
 * 3. Ownership is answered per space: keep spaces name the keep, annex spaces name
 *    the annex.
 * 4. The sky-bridge joins spaces owned by two different units at two different
 *    heights, and adjacency reports it from both ends.
 * 5. One duplex logical space owns two slabs, so a dwelling is not forced to be a
 *    floor; the staged nodes of `duplex` are both slabs.
 * 6. The mezzanine sits inside the hall's own volume: a point at (0, 5, 3) is in
 *    both, which is the physically-continuous / logically-partitioned case.
 * 7. The void is punched through the second level: the atrium centre is in
 *    `atrium` and in the building root, but not in `storey-2`, whose remaining
 *    area is written as two convex cells; a point west of the void is in
 *    `storey-2` and not in `atrium`.
 * 8. Storey elevations are deliberately unequal (9.0, 3.2, 2.8, 3.0 apart), so no
 *    uniform floor height is baked into the record.
 * 9. A yawed wing's child lands at the hand-computed rotated world position and
 *    keeps the wing's quaternion, not a re-derived yaw.
 * 10. A tilted second unit does the same about a different axis, proving the unit
 *     root is a real coordinate root.
 * 11. The dome is a cited mesh on an element in the `rotunda` space; its
 *     containment answer comes from the bounding cell, which is why a point
 *     just outside that cell is refused while the curved shell is not modelled
 *     by half-spaces at all.
 * 12. A door is an opening in a wall boundary filled by a leaf element, and the
 *     lowered set stages that leaf like any other element.
 */
export const test_architecture_built_environment_topology = (): void => {
  const citadel = work();
  TestValidator.equals(
    "a two-unit work with a sky-bridge validates",
    validateBuiltEnvironment({ environment: citadel }).success,
    true,
  );
  TestValidator.equals(
    "only building units root the logical hierarchy",
    {
      roots: citadel.spaces
        .filter((space) => space.parent === null)
        .map((space) => space.id),
      rootKinds: citadel.spaces
        .filter((space) => space.parent === null)
        .map((space) => space.kind),
      keepChildKinds: citadel.spaces
        .filter((space) => space.parent === "keep-whole")
        .map((space) => space.kind),
    },
    {
      roots: ["keep-whole", "annex-whole"],
      rootKinds: ["building", "building"],
      keepChildKinds: [
        "double-height-hall",
        "mezzanine",
        "void",
        "storey",
        "duplex",
        "attic",
        "dome",
        "storey",
      ],
    },
  );
  TestValidator.equals(
    "every logical space names its owning building unit",
    {
      hall: builtEnvironmentBuildingOfSpace(citadel, "hall"),
      duplex: builtEnvironmentBuildingOfSpace(citadel, "duplex"),
      annexUpper: builtEnvironmentBuildingOfSpace(citadel, "annex-storey-1"),
    },
    { hall: "keep", duplex: "keep", annexUpper: "annex" },
  );
  const bridge = citadel.connectors.find(
    (connector) => connector.id === "skybridge",
  )!;
  TestValidator.equals(
    "the sky-bridge is a work-owned relation between two units at two heights",
    {
      from: builtEnvironmentBuildingOfSpace(citadel, bridge.from),
      to: builtEnvironmentBuildingOfSpace(citadel, bridge.to),
      rise: bridge.route[0]!.y > bridge.route.at(-1)!.y,
    },
    { from: "keep", to: "annex", rise: true },
  );
  TestValidator.equals(
    "one duplex logical space owns two slabs",
    builtEnvironmentSpaceNodes(citadel, "duplex"),
    ["citadel/keep-duplex-lower-slab", "citadel/keep-duplex-upper-slab"],
  );
  TestValidator.equals(
    "continuous volume, independent logical partitions, and a real void",
    namedFacts([
      [
        "mezzanineInHallAir",
        () =>
          builtEnvironmentContainsPoint(citadel, "hall", {
            x: 0,
            y: 5,
            z: 3,
          }) &&
          builtEnvironmentContainsPoint(citadel, "mezzanine", {
            x: 0,
            y: 5,
            z: 3,
          }),
      ],
      [
        "voidIsNotStorey",
        () =>
          builtEnvironmentContainsPoint(citadel, "atrium", {
            x: 0,
            y: 10,
            z: 0,
          }) &&
          !builtEnvironmentContainsPoint(citadel, "storey-2", {
            x: 0,
            y: 10,
            z: 0,
          }),
      ],
      [
        "storeyIsWrittenAroundTheVoid",
        () =>
          builtEnvironmentContainsPoint(citadel, "storey-2", {
            x: -4,
            y: 10,
            z: 0,
          }) &&
          !builtEnvironmentContainsPoint(citadel, "atrium", {
            x: -4,
            y: 10,
            z: 0,
          }),
      ],
      [
        "unitRootSeesItsWholeSubtree",
        () =>
          builtEnvironmentContainsPoint(citadel, "keep-whole", {
            x: 0,
            y: 10,
            z: 0,
          }),
      ],
      [
        "domeVolumeIsOnlyItsBoundingCell",
        () =>
          builtEnvironmentContainsPoint(citadel, "rotunda", {
            x: 0,
            y: 19,
            z: 0,
          }) &&
          !builtEnvironmentContainsPoint(citadel, "rotunda", {
            x: 0,
            y: 21.5,
            z: 0,
          }),
      ],
    ]),
    {
      mezzanineInHallAir: true,
      voidIsNotStorey: true,
      storeyIsWrittenAroundTheVoid: true,
      unitRootSeesItsWholeSubtree: true,
      domeVolumeIsOnlyItsBoundingCell: true,
    },
  );
  const elevations = [
    "keep-hall-slab",
    "keep-level-2-slab",
    "keep-duplex-lower-slab",
    "keep-duplex-upper-slab",
    "keep-attic-slab",
  ].map(
    (id) =>
      citadel.elements.find((element) => element.id === id)!.transform
        .translation.y,
  );
  const rises = elevations
    .slice(1)
    .map((value, index) => value - elevations[index]!);
  TestValidator.equals(
    "storey heights are deliberately unequal, so no floor pitch is baked in",
    namedFacts([
      ["hallToLevel2", () => nclose(rises[0]!, 9)],
      ["level2ToDuplexLower", () => nclose(rises[1]!, 3.2)],
      ["duplexLowerToUpper", () => nclose(rises[2]!, 2.8)],
      ["duplexUpperToAttic", () => nclose(rises[3]!, 3)],
      [
        "allDistinct",
        () =>
          new Set(rises.map((rise) => Math.round(rise * 10))).size ===
          rises.length,
      ],
    ]),
    {
      hallToLevel2: true,
      level2ToDuplexLower: true,
      duplexLowerToUpper: true,
      duplexUpperToAttic: true,
      allDistinct: true,
    },
  );
  TestValidator.equals(
    "the sky-bridge is reported from both of its ends",
    {
      keep: builtEnvironmentAdjacentSpaces(citadel, "storey-2").includes(
        "annex-storey-1",
      ),
      annex: builtEnvironmentAdjacentSpaces(citadel, "annex-storey-1").includes(
        "storey-2",
      ),
    },
    { keep: true, annex: true },
  );

  const pieces = lowerBuiltEnvironment(citadel).set ?? [];
  const wing = pieces.find((piece) => piece.node === "citadel/keep-wing-slab")!;
  TestValidator.equals(
    "a yawed wing places its child by the composed rotation",
    namedFacts([
      [
        "position",
        () =>
          vclose(wing.position, {
            x: 6 + 4 * Math.cos(WING_YAW),
            y: 9,
            z: -4 * Math.sin(WING_YAW),
          }),
      ],
      ["rotation", () => qclose(wing.rotation!, yaw(WING_YAW))],
      ["perAxisScale", () => typeof wing.scale === "object"],
      [
        "scale",
        () =>
          // The `typeof` is restated only to narrow the union inside this
          // closure; a comparison cannot move the answer.
          typeof wing.scale === "object" &&
          vclose(wing.scale, { x: 6, y: 0.2, z: 4 }),
      ],
    ]),
    { position: true, rotation: true, perAxisScale: true, scale: true },
  );
  const annex = pieces.find(
    (piece) => piece.node === "citadel/annex-upper-slab",
  )!;
  TestValidator.equals(
    "a tilted unit root is a real coordinate root",
    namedFacts([
      [
        "position",
        () =>
          vclose(annex.position, {
            x: 30 + 6 * Math.cos(ANNEX_TILT) - 4.2 * Math.sin(ANNEX_TILT),
            y: 6 * Math.sin(ANNEX_TILT) + 4.2 * Math.cos(ANNEX_TILT),
            z: 0,
          }),
      ],
      ["rotation", () => qclose(annex.rotation!, roll(ANNEX_TILT))],
    ]),
    { position: true, rotation: true },
  );
  TestValidator.equals(
    "the dome and the door leaf stage like any other element",
    {
      dome: pieces.find((piece) => piece.node === "citadel/keep-dome")?.model,
      leaf: pieces.find((piece) => piece.node === "citadel/keep-door-leaf")
        ?.model,
      door: citadel.openings[0],
    },
    {
      dome: "dome-mesh",
      leaf: "stone",
      door: {
        id: "front-door",
        kind: "door",
        boundary: "hall-wall",
        fill: "keep-door-leaf",
      },
    },
  );
};
