import { buildAutoMovieWall, builtBoundaryWallCut, builtOpeningPanelPlacements, builtOpeningSweepEnvelope, inspectAutoMovieMeshTopology, lowerBuiltEnvironment, validateBuiltEnvironment } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose, qclose, throwsError, vclose } from "../internal/predicates";
import { builtOpeningTestPartition as partition } from "../internal/builtOpeningTestPartition";
import { BUILT_OPENING_TEST_NO_ROTATION as NO_ROTATION } from "../internal/BUILT_OPENING_TEST_NO_ROTATION";
import { assertBuiltOpeningTestRefusals } from "../internal/assertBuiltOpeningTestRefusals";
import { builtOpeningTestRefusalPaths as refusalPaths } from "../internal/builtOpeningTestRefusalPaths";



/**
 * A door is a hole in a wall, a leaf inside that hole, and a state the leaf
 * stands in, and this pins that the three agree. The boundary carries a located
 * face, the opening carries the void it cuts in that face, and the panel
 * carries one degree of freedom whose named states drive the very element the
 * shot stages. Whether a person can pass is deliberately not asked: what is
 * pinned is the geometry a later clearance or egress analysis would read.
 *
 * Scenarios:
 *
 * 1. A partition holding a folding door, a double-acting sash, a sliding shutter,
 *    a circular oculus, an arch, and one geometry-less opening validates as a
 *    whole.
 * 2. The mesh kernel and the architecture graph meet on one id: the boundary's
 *    wall cut names each void by its architectural opening id, and the wall
 *    built from it is a real hole rather than metadata. The cut wall is
 *    partitioned around its voids, so it carries more triangles than the uncut
 *    one and less material, and every number in it is finite.
 * 3. A round void is handed to the rectangular kernel as the rectangle that
 *    exactly bounds it, which for a 0.4 m circle is 0.8 m square.
 * 4. Panel placement answers where a leaf stands at the record's own state and at
 *    any other named state, without editing the record.
 * 5. Lowering stages the leaf at the current state: opening the door moves the
 *    staged node, and the fold rides its parent leaf because the element
 *    hierarchy carries the chaining.
 * 6. A record that declares no operation lowers byte-for-byte as before.
 * 7. The swept envelope is solved, not sampled: a quarter-turn leaf reaches
 *    exactly its own radius, and a double-acting leaf reaches its widest at the
 *    interior critical angle its travel crosses rather than at either limit.
 * 8. A sliding leaf sweeps its own travel and no more, and a travel no walk can
 *    enumerate is refused by name instead of entered.
 * 9. Every query refuses an unknown opening, an unknown state, and an opening that
 *    carries no operation answers emptily rather than throwing.
 * 10. A state naming no value for a panel leaves that panel at rest, so a query
 *     over a record validation refuses still answers instead of failing on a
 *     value it was never given.
 * 11. Fifty-one malformed openings are each refused at their own path, including a
 *     state the scene could not stage even though the record's current one can,
 *     and the untouched fixture produces no violation path at all.
 */
export const test_architecture_built_opening = (): void => {
  const source = partition();
  TestValidator.equals(
    "a partition carrying every opening family validates",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );

  const cut = builtBoundaryWallCut(source, "partition");
  TestValidator.equals(
    "the wall cut names each void by its own architectural opening id",
    {
      panel: { width: cut.width, height: cut.height, depth: cut.depth },
      openings: cut.openings.map((opening) => opening.id),
      door: cut.openings.find((opening) => opening.id === "door"),
    },
    {
      panel: { width: 9, height: 3, depth: 0.2 },
      openings: ["door", "casement", "hatch", "oculus", "arch"],
      door: { id: "door", x: 1, y: 0, width: 2, height: 2.1 },
    },
  );
  TestValidator.predicate(
    "a round void reaches the rectangular kernel as its own exact bound",
    (() => {
      const oculus = cut.openings.find((opening) => opening.id === "oculus")!;
      return (
        nclose(oculus.x, 8) &&
        nclose(oculus.y, 1.6) &&
        nclose(oculus.width, 0.8) &&
        nclose(oculus.height, 0.8)
      );
    })(),
  );
  TestValidator.equals(
    "the wall cut is placed by the boundary's own frame",
    namedFacts([
      ["origin", () => vclose(cut.origin, { x: 4.5, y: 1.5, z: 0 })],
      ["rotation", () => qclose(cut.rotation, NO_ROTATION)],
    ]),
    { origin: true, rotation: true },
  );
  const cutWall = buildAutoMovieWall({
    width: cut.width,
    height: cut.height,
    depth: cut.depth,
    openings: cut.openings,
  });
  const solidWall = buildAutoMovieWall({
    width: cut.width,
    height: cut.height,
    depth: cut.depth,
    openings: [],
  });
  TestValidator.predicate(
    "the declared voids become real holes in a closed wall",
    (() => {
      const cutTopology = inspectAutoMovieMeshTopology(cutWall);
      const solidTopology = inspectAutoMovieMeshTopology(solidWall);
      return (
        cutTopology.triangles > solidTopology.triangles &&
        cutTopology.volume < solidTopology.volume &&
        cutTopology.nonFinite === 0
      );
    })(),
  );

  TestValidator.predicate(
    "panel placement answers for the record's state and for another",
    (() => {
      const closed = builtOpeningPanelPlacements(source, "door");
      const open = builtOpeningPanelPlacements(source, "door", "open");
      const closedOuter = closed.find((entry) => entry.panel === "outer")!;
      const openOuter = open.find((entry) => entry.panel === "outer")!;
      const openInner = open.find((entry) => entry.panel === "inner")!;
      return (
        closedOuter.node === "vestibule/door-leaf" &&
        vclose(closedOuter.position, { x: 1, y: 0, z: 0 }) &&
        qclose(closedOuter.rotation, NO_ROTATION) &&
        vclose(openOuter.position, { x: 1, y: 0, z: 0 }) &&
        qclose(openOuter.rotation, {
          x: 0,
          y: Math.SQRT1_2,
          z: 0,
          w: Math.SQRT1_2,
        }) &&
        // The fold hangs off the outer leaf, so a quarter turn of the outer
        // leaf carries its hinge from +x to -z before its own turn applies.
        vclose(openInner.position, { x: 1, y: 0, z: -1 })
      );
    })(),
  );

  const staged = lowerBuiltEnvironment(source).set ?? [];
  const opened = partition();
  opened.openings[0]!.operation!.state = "open";
  const openedStaged = lowerBuiltEnvironment(opened).set ?? [];
  TestValidator.predicate(
    "the staged leaf reproduces the operating state the record stands in",
    (() => {
      const shut = staged.find(
        (piece) => piece.node === "vestibule/door-fold",
      )!;
      const swung = openedStaged.find(
        (piece) => piece.node === "vestibule/door-fold",
      )!;
      return (
        vclose(shut.position!, { x: 2, y: 0, z: 0 }) &&
        vclose(swung.position!, { x: 1, y: 0, z: -1 }) &&
        qclose(swung.rotation!, { x: 0, y: 1, z: 0, w: 0 })
      );
    })(),
  );
  const inert = partition();
  inert.openings.forEach((opening) => delete opening.operation);
  TestValidator.equals(
    "a record with no operation lowers exactly as a rest-state record does",
    lowerBuiltEnvironment(inert).set,
    staged,
  );

  TestValidator.predicate(
    "a quarter-turn leaf sweeps exactly the quarter disc it can reach",
    (() => {
      const sweep = builtOpeningSweepEnvelope(source, "door").find(
        (entry) => entry.panel === "outer",
      )!;
      return (
        vclose(sweep.min, { x: 1, y: 0, z: -1 }) &&
        vclose(sweep.max, { x: 2, y: 2.1, z: 0 })
      );
    })(),
  );
  TestValidator.predicate(
    "a double-acting leaf reaches its widest at an interior critical angle",
    (() => {
      const sweep = builtOpeningSweepEnvelope(source, "casement")[0]!;
      return (
        sweep.panel === "leaf" &&
        // x = 4 + 0.8 cos(t) peaks at t = 0, which is neither travel limit.
        vclose(sweep.min, { x: 4, y: 1, z: -0.8 }) &&
        vclose(sweep.max, { x: 4.8, y: 2.2, z: 0.8 })
      );
    })(),
  );
  TestValidator.predicate(
    "a sliding leaf sweeps its own travel and no more",
    (() => {
      const sweep = builtOpeningSweepEnvelope(source, "hatch")[0]!;
      return (
        vclose(sweep.min, { x: 6, y: 0, z: 0 }) &&
        vclose(sweep.max, { x: 7, y: 2, z: 0 })
      );
    })(),
  );

  TestValidator.predicate(
    "a state that gives a panel no value leaves that panel at rest",
    (() => {
      const partial = partition();
      // The record is now invalid, and validation says so; the query still has
      // to answer rather than fail on a value it was never given.
      partial.openings[0]!.operation!.states[1]!.panels.pop();
      const inner = builtOpeningPanelPlacements(partial, "door", "open").find(
        (entry) => entry.panel === "inner",
      )!;
      return (
        validateBuiltEnvironment({ environment: partial }).success === false &&
        // Carried a quarter turn by its parent leaf, but not turned itself.
        vclose(inner.position, { x: 1, y: 0, z: -1 }) &&
        qclose(inner.rotation, {
          x: 0,
          y: Math.SQRT1_2,
          z: 0,
          w: Math.SQRT1_2,
        })
      );
    })(),
  );

  TestValidator.equals(
    "an opening with no operation answers with no panel and no envelope",
    {
      placements: builtOpeningPanelPlacements(source, "oculus"),
      sweep: builtOpeningSweepEnvelope(source, "oculus"),
    },
    { placements: [], sweep: [] },
  );
  TestValidator.predicate(
    "an unknown opening refuses placement",
    throwsError(() => builtOpeningPanelPlacements(source, "missing")),
  );
  TestValidator.predicate(
    "an unknown opening refuses an envelope",
    throwsError(() => builtOpeningSweepEnvelope(source, "missing")),
  );
  TestValidator.predicate(
    "an unknown operating state is refused",
    throwsError(() => builtOpeningPanelPlacements(source, "door", "ajar")),
  );
  TestValidator.predicate(
    "an unknown boundary refuses a wall cut",
    throwsError(() => builtBoundaryWallCut(source, "missing")),
  );
  TestValidator.predicate(
    "a boundary with no face refuses a wall cut",
    throwsError(() => builtBoundaryWallCut(source, "threshold")),
  );
  TestValidator.predicate(
    "a dangling panel element refuses placement",
    throwsError(() => {
      const broken = partition();
      broken.openings[0]!.operation!.panels[0]!.element = "missing";
      builtOpeningPanelPlacements(broken, "door");
    }),
  );
  TestValidator.predicate(
    "a dangling panel element refuses an envelope",
    throwsError(() => {
      const broken = partition();
      broken.openings[0]!.operation!.panels[0]!.element = "missing";
      builtOpeningSweepEnvelope(broken, "door");
    }),
  );
  // A travel the solver cannot walk to the end of is refused by name rather
  // than entered: the critical-angle walk over an infinite or unbounded range
  // would never terminate, which is worse than any wrong number.
  TestValidator.predicate(
    "an unbounded lowest travel refuses an envelope",
    throwsError(() => {
      const broken = partition();
      broken.openings[0]!.operation!.panels[0]!.motion.min =
        Number.NEGATIVE_INFINITY;
      builtOpeningSweepEnvelope(broken, "door");
    }),
  );
  TestValidator.predicate(
    "an unbounded highest travel refuses an envelope",
    throwsError(() => {
      const broken = partition();
      broken.openings[0]!.operation!.panels[0]!.motion.max =
        Number.POSITIVE_INFINITY;
      builtOpeningSweepEnvelope(broken, "door");
    }),
  );
  TestValidator.predicate(
    "a travel beyond a full turn refuses an envelope",
    throwsError(() => {
      const broken = partition();
      broken.openings[0]!.operation!.panels[0]!.motion.min = -100;
      broken.openings[0]!.operation!.panels[0]!.motion.max = 100;
      builtOpeningSweepEnvelope(broken, "door");
    }),
  );
  assertBuiltOpeningTestRefusals();
  TestValidator.equals(
    "the untouched partition produces no violation path at all",
    refusalPaths(() => {}),
    [],
  );
  TestValidator.equals(
    "a fixed void and a purely relational opening both stay valid",
    namedFacts([
      [
        "arch",
        () =>
          validateBuiltEnvironment({
            environment: (() => {
              const value = partition();
              value.openings = [value.openings[4]!];
              return value;
            })(),
          }).success,
      ],
      [
        "gap",
        () =>
          validateBuiltEnvironment({
            environment: (() => {
              const value = partition();
              value.openings = [value.openings[5]!];
              return value;
            })(),
          }).success,
      ],
    ]),
    { arch: true, gap: true },
  );
};
