import type {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtEnvironmentAdjacentSpaces } from "../../../../packages/engine/src/architecture/builtEnvironmentAdjacentSpaces";
import { builtEnvironmentBuildingOfSpace } from "../../../../packages/engine/src/architecture/builtEnvironmentBuildingOfSpace";
import { builtEnvironmentContainsPoint } from "../../../../packages/engine/src/architecture/builtEnvironmentContainsPoint";
import { builtEnvironmentSpaceNodes } from "../../../../packages/engine/src/architecture/builtEnvironmentSpaceNodes";
import { lowerBuiltEnvironment } from "../../../../packages/engine/src/architecture/lowerBuiltEnvironment";
import { validateBuiltEnvironment } from "../../../../packages/engine/src/architecture/validateBuiltEnvironment";
import { BUILT_TOPOLOGY_TEST_ANNEX_TILT as ANNEX_TILT } from "../internal/BUILT_TOPOLOGY_TEST_ANNEX_TILT";
import { BUILT_TOPOLOGY_TEST_WING_YAW as WING_YAW } from "../internal/BUILT_TOPOLOGY_TEST_WING_YAW";
import { builtTopologyTestRoll as roll } from "../internal/builtTopologyTestRoll";
import { builtTopologyTestWork as work } from "../internal/builtTopologyTestWork";
import { builtTopologyTestYaw as yaw } from "../internal/builtTopologyTestYaw";
import { namedFacts, qclose, vclose } from "../internal/predicates";

/**
 * Lower a two-unit topology with independently rooted wings, bridge connectivity, duplex, mezzanine and void spaces.
 *
 * Scenarios:
 * 1. The whole work validates as one record.
 * 2. Ownership is answered per space: keep spaces name the keep, annex spaces name the annex.
 * 3. The sky-bridge joins spaces owned by two different units, and adjacency reports it from both ends.
 * 4. One duplex logical space owns two slabs, so a dwelling is not forced to be a floor; the staged nodes of `duplex` are both slabs.
 * 5. The mezzanine sits inside the hall's own volume: a point at (0, 5, 3) is in both, which is the physically-continuous / logically-partitioned case.
 * 6. The void is punched through the second level: the atrium centre is in `atrium` and in the building root, but not in `storey-2`, whose remaining area is written as two convex cells; a point west of the void is in `storey-2` and not in `atrium`.
 * 7. A yawed wing's child lands at the hand-computed rotated world position and keeps the wing's quaternion, not a re-derived yaw.
 * 8. A tilted second unit does the same about a different axis, proving the unit root is a real coordinate root.
 * 9. The dome is a cited mesh on an element in the `rotunda` space; its containment answer comes from the bounding cell, which is why a point just outside that cell is refused while the curved shell is not modelled by half-spaces at all.
 * 10. The door leaf filling the front-door opening is staged like any other element.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls building validation, ownership, subtree-node, containment, adjacency and lowering queries on the two-unit fixture. Selected owner/id lists, positive and negative volume points, bridge reachability, transformed wing/annex fields and dome/leaf model ids expose lost roots, leaked void membership or rotation reduced to translation.
 * @evidence contracts/testing.md#independent-expectations Literal ownership/node tables and authored half-space intervals determine point membership. Local sine/cosine coordinate equations determine wing and tilted-annex positions under the original vclose limit; qclose expectations share yaw/roll constructors with the fixture and therefore check quaternion transport rather than independently validating those constructors. Dome admission uses its stated bounding cell, and model-id observations do not measure external dome bytes or rendered shape.
 * @evidence contracts/testing.md#distinguishing-cases Two owners, cross-unit bridge adjacency, multi-slab duplex, overlapping logical volumes, void exclusions, arbitrary-axis placement and staged door/dome references cover topology; curved-shell fidelity and external appearance bytes are outside this test.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_environment_topology imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_environment_topology(): void {
  const citadel: IAutoMovieBuiltEnvironment = work();
  TestValidator.equals(
    "a two-unit work with a sky-bridge validates",
    validateBuiltEnvironment({ environment: citadel }).success,
    true,
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
  const bridge: IAutoMovieBuiltConnector = citadel.connectors.find(
    (connector: IAutoMovieBuiltConnector): boolean =>
      connector.id === "skybridge",
  )!;
  TestValidator.equals(
    "the sky-bridge is a work-owned relation between two units at two heights",
    {
      from: builtEnvironmentBuildingOfSpace(citadel, bridge.from),
      to: builtEnvironmentBuildingOfSpace(citadel, bridge.to),
    },
    { from: "keep", to: "annex" },
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
        (): boolean =>
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
        (): boolean =>
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
        (): boolean =>
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
        (): boolean =>
          builtEnvironmentContainsPoint(citadel, "keep-whole", {
            x: 0,
            y: 10,
            z: 0,
          }),
      ],
      [
        "domeVolumeIsOnlyItsBoundingCell",
        (): boolean =>
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

  const pieces: readonly IAutoMovieStageSetPiece[] =
    lowerBuiltEnvironment(citadel).set ?? [];
  const wing: IAutoMovieStageSetPiece = pieces.find(
    (piece: IAutoMovieStageSetPiece): boolean =>
      piece.node === "citadel/keep-wing-slab",
  )!;
  TestValidator.equals(
    "a yawed wing places its child by the composed rotation",
    namedFacts([
      [
        "position",
        (): boolean =>
          vclose(wing.position, {
            x: 6 + 4 * Math.cos(WING_YAW),
            y: 9,
            z: -4 * Math.sin(WING_YAW),
          }),
      ],
      ["rotation", (): boolean => qclose(wing.rotation!, yaw(WING_YAW))],
      ["perAxisScale", (): boolean => typeof wing.scale === "object"],
      [
        "scale",
        (): boolean =>
          // The `typeof` is restated only to narrow the union inside this
          // closure; a comparison cannot move the answer.
          typeof wing.scale === "object" &&
          vclose(wing.scale, { x: 6, y: 0.2, z: 4 }),
      ],
    ]),
    { position: true, rotation: true, perAxisScale: true, scale: true },
  );
  const annex: IAutoMovieStageSetPiece = pieces.find(
    (piece: IAutoMovieStageSetPiece): boolean =>
      piece.node === "citadel/annex-upper-slab",
  )!;
  TestValidator.equals(
    "a tilted unit root is a real coordinate root",
    namedFacts([
      [
        "position",
        (): boolean =>
          vclose(annex.position, {
            x: 30 + 6 * Math.cos(ANNEX_TILT) - 4.2 * Math.sin(ANNEX_TILT),
            y: 6 * Math.sin(ANNEX_TILT) + 4.2 * Math.cos(ANNEX_TILT),
            z: 0,
          }),
      ],
      ["rotation", (): boolean => qclose(annex.rotation!, roll(ANNEX_TILT))],
    ]),
    { position: true, rotation: true },
  );
  TestValidator.equals(
    "the dome and the door leaf stage like any other element",
    {
      dome: pieces.find(
        (piece: IAutoMovieStageSetPiece): boolean =>
          piece.node === "citadel/keep-dome",
      )?.model,
      leaf: pieces.find(
        (piece: IAutoMovieStageSetPiece): boolean =>
          piece.node === "citadel/keep-door-leaf",
      )?.model,
    },
    {
      dome: "dome-mesh",
      leaf: "stone",
    },
  );
}
