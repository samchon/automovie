import {
  type IAutoMovieBoundaryWallCut,
  type IAutoMovieMeshTopology,
  type IAutoMovieOpeningPanelPlacement,
  type IAutoMovieOpeningSweep,
  type IAutoMovieWallOpening,
  buildAutoMovieWall,
  builtBoundaryWallCut,
  builtOpeningPanelPlacements,
  builtOpeningSweepEnvelope,
  inspectAutoMovieMeshTopology,
  lowerBuiltEnvironment,
  validateBuiltEnvironment,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieMesh,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { BUILT_OPENING_TEST_NO_ROTATION as NO_ROTATION } from "../internal/BUILT_OPENING_TEST_NO_ROTATION";
import { assertBuiltOpeningTestRefusals } from "../internal/assertBuiltOpeningTestRefusals";
import { builtOpeningTestPartition as partition } from "../internal/builtOpeningTestPartition";
import { builtOpeningTestRefusalPaths as refusalPaths } from "../internal/builtOpeningTestRefusalPaths";
import {
  namedFacts,
  nclose,
  qclose,
  throwsError,
  vclose,
} from "../internal/predicates";
import { sameProductData } from "../internal/sameProductData";

/**
 * Join architectural voids to the wall kernel, place operating panels and measure analytic travel envelopes.
 *
 * Scenarios:
 * 1. A partition holding a folding door, a double-acting sash, a sliding shutter, a circular oculus, an arch, and one geometry-less opening validates as a whole.
 * 2. Wall-cut ids and selected dimensions join the graph to the mesh kernel; the cut mesh has more triangles, less measured volume and no nonfinite topology entries than the solid wall.
 * 3. A round void is handed to the rectangular kernel as the rectangle that exactly bounds it, which for a 0.4 m circle is 0.8 m square.
 * 4. Panel placement answers where a leaf stands at the record's own state and at any other named state, without editing the record.
 * 5. Lowering stages the leaf at the current state: opening the door moves the staged node, and the fold rides its parent leaf because the element hierarchy carries the chaining.
 * 6. Removing all operations preserves the current rest-state set as plain data under numeric tolerance zero.
 * 7. Selected swept-box extrema match the quarter-turn leaf and the double-acting leaf's interior critical angle within the existing vector tolerance.
 * 8. A sliding leaf sweeps its own travel and no more, and a travel no walk can enumerate is refused by name instead of entered.
 * 9. Placement/sweep queries refuse unknown openings or dangling panels, placement refuses an explicitly unknown state, and an inoperable opening returns empty lists; wall-cut queries refuse unknown or faceless boundaries.
 * 10. A state naming no value for a panel leaves that panel at rest, so a query over a record validation refuses still answers instead of failing on a value it was never given.
 * 11. Fifty-one malformed openings are each refused at their own path, including a state the scene could not stage even though the record's current one can, and the untouched fixture produces no violation path at all.
 * 12. Direct swept-envelope queries refuse finite travel that omits rest, has an empty interval or is reversed, including a 1e308 singleton whose critical-angle counter cannot advance.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls wall-cut/build/topology inspection, panel placement, swept envelopes, lowering and building validation. Selected cut records, relative triangle/volume/finite observations, chained panel TRS, rest-state set equality, numeric sweep extrema and located refusals expose metadata-only cuts, ignored parent travel or skipped interior critical angles. The mesh comparison does not assert watertightness or every individual hole boundary.
 * @evidence contracts/testing.md#independent-expectations Literal partition dimensions 9/3/0.2, door rectangle (1,0,2,2.1), radius-0.4 circle bounds, unit leaf quarter turns and shutter travel 1 determine the selected coordinates under original nclose/vclose/qclose limits. The double-acting width 0.8 peaks at interior angle zero; inert-versus-rest set equality uses sameProductData with numeric tolerance zero and shares the lowerer. Topology volume/triangle inequalities are relational observations, not independently calculated mesh volume, rendered clearance or a collision oracle.
 * @evidence contracts/testing.md#distinguishing-cases Cut versus uncut topology, closed/open/rest records, chained panels, absent/partial operation, bounded/unbounded travel, unknown identities, fixed/relational voids and located malformed openings preserve the original cases. Direct-query guards additionally distinguish finite positive-only, negative-only, empty, reversed and huge singleton ranges from the admitted zero-containing ranges; triangle-count and volume inequalities alone do not prove every hole's detailed topology or visual clearance.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_opening imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_opening(): void {
  const source: IAutoMovieBuiltEnvironment = partition();
  TestValidator.equals(
    "a partition carrying every opening family validates",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );

  const cut: IAutoMovieBoundaryWallCut = builtBoundaryWallCut(
    source,
    "partition",
  );
  TestValidator.predicate(
    "the wall cut names each void by its own architectural opening id",
    ((): boolean => {
      const observed: {
        panel: { width: number; height: number; depth: number };
        openings: string[];
        door: IAutoMovieWallOpening | undefined;
      } = {
        panel: { width: cut.width, height: cut.height, depth: cut.depth },
        openings: cut.openings.map(
          (opening: IAutoMovieWallOpening): string => opening.id,
        ),
        door: cut.openings.find(
          (opening: IAutoMovieWallOpening): boolean => opening.id === "door",
        ),
      };
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 3 &&
        Object.hasOwn(observed, "panel") &&
        typeof observed["panel"] === "object" &&
        typeof observed["panel"] === "object" &&
        observed["panel"] !== null &&
        observed["panel"] !== undefined &&
        Object.keys(observed["panel"]).length === 3 &&
        Object.hasOwn(observed["panel"], "width") &&
        typeof observed["panel"]["width"] === "number" &&
        nclose(observed["panel"]["width"], 9) &&
        Object.hasOwn(observed["panel"], "height") &&
        typeof observed["panel"]["height"] === "number" &&
        nclose(observed["panel"]["height"], 3) &&
        Object.hasOwn(observed["panel"], "depth") &&
        typeof observed["panel"]["depth"] === "number" &&
        nclose(observed["panel"]["depth"], 0.2) &&
        Object.hasOwn(observed, "openings") &&
        Array.isArray(observed["openings"]) &&
        observed["openings"].length === 5 &&
        observed["openings"][0] === "door" &&
        observed["openings"][1] === "casement" &&
        observed["openings"][2] === "hatch" &&
        observed["openings"][3] === "oculus" &&
        observed["openings"][4] === "arch" &&
        Object.hasOwn(observed, "door") &&
        typeof observed["door"] === "object" &&
        typeof observed["door"] === "object" &&
        observed["door"] !== null &&
        observed["door"] !== undefined &&
        Object.keys(observed["door"]).length === 5 &&
        Object.hasOwn(observed["door"], "id") &&
        observed["door"]["id"] === "door" &&
        Object.hasOwn(observed["door"], "x") &&
        typeof observed["door"]["x"] === "number" &&
        nclose(observed["door"]["x"], 1) &&
        Object.hasOwn(observed["door"], "y") &&
        typeof observed["door"]["y"] === "number" &&
        nclose(observed["door"]["y"], 0) &&
        Object.hasOwn(observed["door"], "width") &&
        typeof observed["door"]["width"] === "number" &&
        nclose(observed["door"]["width"], 2) &&
        Object.hasOwn(observed["door"], "height") &&
        typeof observed["door"]["height"] === "number" &&
        nclose(observed["door"]["height"], 2.1)
      );
    })(),
  );
  TestValidator.predicate(
    "a round void reaches the rectangular kernel as its own exact bound",
    ((): boolean => {
      const oculus: IAutoMovieWallOpening = cut.openings.find(
        (opening: IAutoMovieWallOpening): boolean => opening.id === "oculus",
      )!;
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
      ["origin", (): boolean => vclose(cut.origin, { x: 4.5, y: 1.5, z: 0 })],
      ["rotation", (): boolean => qclose(cut.rotation, NO_ROTATION)],
    ]),
    { origin: true, rotation: true },
  );
  const cutWall: IAutoMovieMesh = buildAutoMovieWall({
    width: cut.width,
    height: cut.height,
    depth: cut.depth,
    openings: cut.openings,
  });
  const solidWall: IAutoMovieMesh = buildAutoMovieWall({
    width: cut.width,
    height: cut.height,
    depth: cut.depth,
    openings: [],
  });
  TestValidator.predicate(
    "the declared voids become real holes in a closed wall",
    ((): boolean => {
      const cutTopology: IAutoMovieMeshTopology =
        inspectAutoMovieMeshTopology(cutWall);
      const solidTopology: IAutoMovieMeshTopology =
        inspectAutoMovieMeshTopology(solidWall);
      return (
        cutTopology.triangles > solidTopology.triangles &&
        cutTopology.volume < solidTopology.volume &&
        cutTopology.nonFinite === 0
      );
    })(),
  );

  TestValidator.predicate(
    "panel placement answers for the record's state and for another",
    ((): boolean => {
      const closed: IAutoMovieOpeningPanelPlacement[] =
        builtOpeningPanelPlacements(source, "door");
      const open: IAutoMovieOpeningPanelPlacement[] =
        builtOpeningPanelPlacements(source, "door", "open");
      const closedOuter: IAutoMovieOpeningPanelPlacement = closed.find(
        (entry: IAutoMovieOpeningPanelPlacement): boolean =>
          entry.panel === "outer",
      )!;
      const openOuter: IAutoMovieOpeningPanelPlacement = open.find(
        (entry: IAutoMovieOpeningPanelPlacement): boolean =>
          entry.panel === "outer",
      )!;
      const openInner: IAutoMovieOpeningPanelPlacement = open.find(
        (entry: IAutoMovieOpeningPanelPlacement): boolean =>
          entry.panel === "inner",
      )!;
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

  const staged: readonly IAutoMovieStageSetPiece[] =
    lowerBuiltEnvironment(source).set ?? [];
  const opened: IAutoMovieBuiltEnvironment = partition();
  opened.openings[0]!.operation!.state = "open";
  const openedStaged: readonly IAutoMovieStageSetPiece[] =
    lowerBuiltEnvironment(opened).set ?? [];
  TestValidator.predicate(
    "the staged leaf reproduces the operating state the record stands in",
    ((): boolean => {
      const shut: IAutoMovieStageSetPiece = staged.find(
        (piece: IAutoMovieStageSetPiece): boolean =>
          piece.node === "vestibule/door-fold",
      )!;
      const swung: IAutoMovieStageSetPiece = openedStaged.find(
        (piece: IAutoMovieStageSetPiece): boolean =>
          piece.node === "vestibule/door-fold",
      )!;
      return (
        vclose(shut.position!, { x: 2, y: 0, z: 0 }) &&
        vclose(swung.position!, { x: 1, y: 0, z: -1 }) &&
        qclose(swung.rotation!, { x: 0, y: 1, z: 0, w: 0 })
      );
    })(),
  );
  const inert: IAutoMovieBuiltEnvironment = partition();
  inert.openings.forEach(
    (opening: IAutoMovieBuiltOpening): boolean => delete opening.operation,
  );
  TestValidator.predicate(
    "a record with no operation lowers exactly as a rest-state record does",
    sameProductData(lowerBuiltEnvironment(inert).set, staged),
  );

  TestValidator.predicate(
    "a quarter-turn leaf sweeps exactly the quarter disc it can reach",
    ((): boolean => {
      const sweep: IAutoMovieOpeningSweep = builtOpeningSweepEnvelope(
        source,
        "door",
      ).find(
        (entry: IAutoMovieOpeningSweep): boolean => entry.panel === "outer",
      )!;
      return (
        vclose(sweep.min, { x: 1, y: 0, z: -1 }) &&
        vclose(sweep.max, { x: 2, y: 2.1, z: 0 })
      );
    })(),
  );
  TestValidator.predicate(
    "a double-acting leaf reaches its widest at an interior critical angle",
    ((): boolean => {
      const sweep: IAutoMovieOpeningSweep = builtOpeningSweepEnvelope(
        source,
        "casement",
      )[0]!;
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
    ((): boolean => {
      const sweep: IAutoMovieOpeningSweep = builtOpeningSweepEnvelope(
        source,
        "hatch",
      )[0]!;
      return (
        vclose(sweep.min, { x: 6, y: 0, z: 0 }) &&
        vclose(sweep.max, { x: 7, y: 2, z: 0 })
      );
    })(),
  );

  TestValidator.predicate(
    "a state that gives a panel no value leaves that panel at rest",
    ((): boolean => {
      const partial: IAutoMovieBuiltEnvironment = partition();
      // The record is now invalid, and validation says so; the query still has
      // to answer rather than fail on a value it was never given.
      partial.openings[0]!.operation!.states[1]!.panels.pop();
      const inner: IAutoMovieOpeningPanelPlacement =
        builtOpeningPanelPlacements(partial, "door", "open").find(
          (entry: IAutoMovieOpeningPanelPlacement): boolean =>
            entry.panel === "inner",
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
    throwsError((): IAutoMovieOpeningPanelPlacement[] =>
      builtOpeningPanelPlacements(source, "missing"),
    ),
  );
  TestValidator.predicate(
    "an unknown opening refuses an envelope",
    throwsError((): IAutoMovieOpeningSweep[] =>
      builtOpeningSweepEnvelope(source, "missing"),
    ),
  );
  TestValidator.predicate(
    "an unknown operating state is refused",
    throwsError((): IAutoMovieOpeningPanelPlacement[] =>
      builtOpeningPanelPlacements(source, "door", "ajar"),
    ),
  );
  TestValidator.predicate(
    "an unknown boundary refuses a wall cut",
    throwsError(
      (): IAutoMovieBoundaryWallCut => builtBoundaryWallCut(source, "missing"),
    ),
  );
  TestValidator.predicate(
    "a boundary with no face refuses a wall cut",
    throwsError(
      (): IAutoMovieBoundaryWallCut =>
        builtBoundaryWallCut(source, "threshold"),
    ),
  );
  TestValidator.predicate(
    "a dangling panel element refuses placement",
    throwsError((): void => {
      const broken: IAutoMovieBuiltEnvironment = partition();
      broken.openings[0]!.operation!.panels[0]!.element = "missing";
      builtOpeningPanelPlacements(broken, "door");
    }),
  );
  TestValidator.predicate(
    "a dangling panel element refuses an envelope",
    throwsError((): void => {
      const broken: IAutoMovieBuiltEnvironment = partition();
      broken.openings[0]!.operation!.panels[0]!.element = "missing";
      builtOpeningSweepEnvelope(broken, "door");
    }),
  );
  // A travel the solver cannot walk to the end of is refused by name rather
  // than entered: the critical-angle walk over an infinite or unbounded range
  // would never terminate, which is worse than any wrong number.
  TestValidator.predicate(
    "an unbounded lowest travel refuses an envelope",
    throwsError((): void => {
      const broken: IAutoMovieBuiltEnvironment = partition();
      broken.openings[0]!.operation!.panels[0]!.motion.min =
        Number.NEGATIVE_INFINITY;
      builtOpeningSweepEnvelope(broken, "door");
    }),
  );
  TestValidator.predicate(
    "an unbounded highest travel refuses an envelope",
    throwsError((): void => {
      const broken: IAutoMovieBuiltEnvironment = partition();
      broken.openings[0]!.operation!.panels[0]!.motion.max =
        Number.POSITIVE_INFINITY;
      builtOpeningSweepEnvelope(broken, "door");
    }),
  );
  TestValidator.predicate(
    "a travel beyond a full turn refuses an envelope",
    throwsError((): void => {
      const broken: IAutoMovieBuiltEnvironment = partition();
      broken.openings[0]!.operation!.panels[0]!.motion.min = -100;
      broken.openings[0]!.operation!.panels[0]!.motion.max = 100;
      builtOpeningSweepEnvelope(broken, "door");
    }),
  );
  const invalidRanges: [label: string, minimum: number, maximum: number][] = [
    [
      "a finite singleton too large for an advancing critical-angle counter",
      1e308,
      1e308,
    ],
    ["an empty rest interval", 0, 0],
    ["a reversed interval", 1, -1],
    ["a positive-only interval", 1, 2],
    ["a negative-only interval", -2, -1],
  ];
  for (const [label, minimum, maximum] of invalidRanges)
    TestValidator.predicate(
      `${label} refuses a direct swept-envelope query`,
      throwsError((): void => {
        const broken: IAutoMovieBuiltEnvironment = partition();
        broken.openings[0]!.operation!.panels[0]!.motion.min = minimum;
        broken.openings[0]!.operation!.panels[0]!.motion.max = maximum;
        builtOpeningSweepEnvelope(broken, "door");
      }, "no swept envelope can enumerate"),
    );
  assertBuiltOpeningTestRefusals();
  TestValidator.equals(
    "the untouched partition produces no violation path at all",
    refusalPaths((): void => {}),
    [],
  );
  TestValidator.equals(
    "a fixed void and a purely relational opening both stay valid",
    namedFacts([
      [
        "arch",
        (): boolean =>
          validateBuiltEnvironment({
            environment: ((): IAutoMovieBuiltEnvironment => {
              const value: IAutoMovieBuiltEnvironment = partition();
              value.openings = [value.openings[4]!];
              return value;
            })(),
          }).success,
      ],
      [
        "gap",
        (): boolean =>
          validateBuiltEnvironment({
            environment: ((): IAutoMovieBuiltEnvironment => {
              const value: IAutoMovieBuiltEnvironment = partition();
              value.openings = [value.openings[5]!];
              return value;
            })(),
          }).success,
      ],
    ]),
    { arch: true, gap: true },
  );
}
