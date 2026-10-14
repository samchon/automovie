import { serviceSystemLoad } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServicePenetration,
  IAutoMovieServicePort,
  IAutoMovieServiceSegment,
  IAutoMovieServiceSystem,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts, nclose, violationCount } from "./predicates";
import { withNode, withPort, withSegment, withSystem } from "./serviceFixtures";

/** Run the original load-direction, spatial, root, state and numeric defect cases after the earlier test_service_network_defects cases. The original clean network and refusal closure are borrowed unchanged; this helper registers no separate test or host. */
export function assertServiceNetworkSpatialDefects(
  clean: IAutoMovieServiceNetwork,
  refuse: (network?: IAutoMovieServiceNetwork) => IAutoMovieValidation,
): void {
  const discharging: IAutoMovieValidation = refuse(
    withSystem(
      clean,
      "waste",
      (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        capacity: 0.0005,
      }),
    ),
  );
  TestValidator.equals(
    "a stack is loaded by what discharges into it, not by what it receives",
    namedFacts([
      [
        "supplyReadsItsInlets",
        () =>
          nclose(
            serviceSystemLoad({ network: clean, system: clean.systems[0]! }),
            0.0002,
            1e-15,
          ),
      ],
      [
        "stackReadsItsOutlets",
        () =>
          nclose(
            serviceSystemLoad({ network: clean, system: clean.systems[2]! }),
            0.001,
            1e-15,
          ),
      ],
      [
        "refused",
        () => hasViolation(discharging, "range", "$input.systems[2].capacity"),
      ],
      [
        "overshoot",
        () =>
          discharging.success === false &&
          discharging.violations.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              nclose(item.overshoot ?? -1, 0.0005, 1e-15),
          ),
      ],
      ["alone", () => violationCount(discharging) === 1],
    ]),
    {
      supplyReadsItsInlets: true,
      stackReadsItsOutlets: true,
      refused: true,
      overshoot: true,
      alone: true,
    },
  );

  const strayPort: IAutoMovieValidation = refuse(
    withSegment(
      withPort(
        clean,
        "bath-light-in",
        (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
          ...entry,
          position: { x: 8.2, y: 2.95, z: 3 },
        }),
      ),
      "lighting-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        route: [
          { x: 8.5, y: 2.95, z: 3 },
          { x: 8.2, y: 2.95, z: 3 },
        ],
        penetrations: [],
      }),
    ),
  );
  TestValidator.equals(
    "a port may not stand in a room its own fitting is not in",
    namedFacts([
      [
        "refused",
        () =>
          hasViolation(strayPort, "type", "$input.nodes[13].ports[0].position"),
      ],
      [
        "named",
        () =>
          strayPort.success === false &&
          strayPort.violations.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              item.expected.includes(
                'service port "bath-light-in" of node "bath-light" stands outside logical space "bath"',
              ),
          ),
      ],
      [
        "nodeUnaccused",
        () =>
          strayPort.success === false &&
          strayPort.violations.every(
            (item: IAutoMovieConstraintViolation): boolean =>
              item.path !== "$input.nodes[13].position",
          ),
      ],
      [
        "onlyDefect",
        () =>
          strayPort.success === false &&
          strayPort.violations.filter(
            (item: IAutoMovieConstraintViolation): boolean =>
              item.severity === "error",
          ).length === 1,
      ],
    ]),
    { refused: true, named: true, nodeUnaccused: true, onlyDefect: true },
  );

  const orphan: IAutoMovieValidation = refuse({
    ...clean,
    segments: clean.segments.filter(
      (entry: IAutoMovieServiceSegment): boolean => entry.id !== "cold-branch",
    ),
  });
  TestValidator.equals(
    "deleting one branch leaves two stubs and one orphan, and nothing else",
    namedFacts([
      [
        "emitterStub",
        () => hasViolation(orphan, "type", "$input.nodes[8].ports[1]"),
      ],
      [
        "consumerStub",
        () => hasViolation(orphan, "type", "$input.nodes[9].ports[0]"),
      ],
      ["orphan", () => hasViolation(orphan, "type", "$input.nodes[9]")],
      [
        "exactly",
        () => orphan.success === false && orphan.violations.length === 3,
      ],
    ]),
    { emitterStub: true, consumerStub: true, orphan: true, exactly: true },
  );

  const missingRoot: IAutoMovieValidation = refuse(
    withSystem(
      clean,
      "cold",
      (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        root: "nowhere",
      }),
    ),
  );
  const foreignRoot: IAutoMovieValidation = refuse(
    withSystem(
      clean,
      "cold",
      (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        root: "floor-gully",
      }),
    ),
  );
  const receivingRoot: IAutoMovieValidation = refuse(
    withSystem(
      clean,
      "cold",
      (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        root: "basin",
      }),
    ),
  );
  const emittingRoot: IAutoMovieValidation = refuse(
    withSystem(
      clean,
      "waste",
      (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        root: "floor-gully",
      }),
    ),
  );
  TestValidator.equals(
    "a root must exist, belong to its system, and face the way the flow does",
    namedFacts([
      [
        "missing",
        () => hasViolation(missingRoot, "type", "$input.systems[0].root"),
      ],
      [
        "foreign",
        () => hasViolation(foreignRoot, "type", "$input.systems[0].root"),
      ],
      [
        "receiving",
        () => hasViolation(receivingRoot, "type", "$input.systems[0].root"),
      ],
      [
        "emitting",
        () => hasViolation(emittingRoot, "type", "$input.systems[2].root"),
      ],
    ]),
    { missing: true, foreign: true, receiving: true, emitting: true },
  );

  const placement: IAutoMovieValidation = refuse(
    withNode(
      clean,
      "basin",
      (entry: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
        ...entry,
        space: "attic",
        element: "ghost",
      }),
    ),
  );
  const outside: IAutoMovieValidation = refuse(
    withNode(
      clean,
      "basin",
      (entry: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
        ...entry,
        position: { x: 9, y: 0.9, z: 1 },
      }),
    ),
  );
  TestValidator.equals(
    "a node must name a real space and element, and stand inside that space",
    namedFacts([
      ["space", () => hasViolation(placement, "type", "$input.nodes[9].space")],
      [
        "element",
        () => hasViolation(placement, "type", "$input.nodes[9].element"),
      ],
      [
        "outside",
        () => hasViolation(outside, "type", "$input.nodes[9].position"),
      ],
      [
        "outsideAlone",
        () => outside.success === false && outside.violations.length === 1,
      ],
    ]),
    { space: true, element: true, outside: true, outsideAlone: true },
  );

  const state: IAutoMovieValidation = refuse(
    withNode(
      withNode(
        clean,
        "bath-valve",
        (entry: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
          ...entry,
          state: { name: "   ", opening: 1.5 },
        }),
      ),
      "ahu",
      (entry: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
        ...entry,
        maintenance: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: Number.NaN, z: 1 },
        },
      }),
    ),
  );
  TestValidator.equals(
    "operating state and access volumes are range-checked",
    namedFacts([
      ["name", () => hasViolation(state, "type", "$input.nodes[8].state.name")],
      [
        "opening",
        () => hasViolation(state, "range", "$input.nodes[8].state.opening"),
      ],
      [
        "collapsed",
        () => hasViolation(state, "range", "$input.nodes[5].maintenance.max.x"),
      ],
      [
        "nonFinite",
        () => hasViolation(state, "range", "$input.nodes[5].maintenance.max.y"),
      ],
    ]),
    { name: true, opening: true, collapsed: true, nonFinite: true },
  );

  const numbers: IAutoMovieValidation = refuse(
    withPort(
      withNode(
        clean,
        "basin",
        (entry: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
          ...entry,
          position: { x: Number.NaN, y: 0.9, z: 1 },
        }),
      ),
      "basin-cold",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        demand: -1,
        section: 0,
        position: { x: 1, y: Number.POSITIVE_INFINITY, z: 1 },
      }),
    ),
  );
  TestValidator.equals(
    "non-finite and negative numbers are refused wherever a real one is required",
    namedFacts([
      [
        "nodePosition",
        () => hasViolation(numbers, "range", "$input.nodes[9].position.x"),
      ],
      [
        "demand",
        () => hasViolation(numbers, "range", "$input.nodes[9].ports[0].demand"),
      ],
      [
        "section",
        () =>
          hasViolation(numbers, "range", "$input.nodes[9].ports[0].section"),
      ],
      [
        "portPosition",
        () =>
          hasViolation(numbers, "range", "$input.nodes[9].ports[0].position.y"),
      ],
      [
        "nodeNotAlsoEvicted",
        () => !hasViolation(numbers, "type", "$input.nodes[9].position"),
      ],
      [
        "portNotAlsoEvicted",
        () =>
          !hasViolation(numbers, "type", "$input.nodes[9].ports[0].position"),
      ],
    ]),
    {
      nodePosition: true,
      demand: true,
      section: true,
      portPosition: true,
      nodeNotAlsoEvicted: true,
      portNotAlsoEvicted: true,
    },
  );

  const orphanPort: IAutoMovieValidation = refuse(
    withPort(
      clean,
      "basin-cold",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        id: "   ",
        system: "steam",
        demand: Number.NaN,
      }),
    ),
  );
  const sleeveShape: IAutoMovieValidation = refuse({
    ...clean,
    penetrations: clean.penetrations.map(
      (
        entry: IAutoMovieServicePenetration,
        index: number,
      ): IAutoMovieServicePenetration =>
        index === 0
          ? { ...entry, position: { x: Number.NaN, y: 2.5, z: 1 } }
          : index === 2
            ? { ...entry, radius: 0 }
            : entry,
    ),
  });
  const unmeasurable: IAutoMovieValidation = refuse(
    withSystem(
      clean,
      "cold",
      (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        capacity: Number.NaN,
      }),
    ),
  );
  TestValidator.equals(
    "a port on no system, a shapeless sleeve and an unmeasurable capacity",
    namedFacts([
      [
        "portSystem",
        () =>
          hasViolation(orphanPort, "type", "$input.nodes[9].ports[0].system"),
      ],
      [
        "portId",
        () => hasViolation(orphanPort, "type", "$input.nodes[9].ports[0].id"),
      ],
      [
        "nonFiniteDemand",
        () =>
          hasViolation(orphanPort, "range", "$input.nodes[9].ports[0].demand"),
      ],
      [
        "sleevePosition",
        () =>
          hasViolation(
            sleeveShape,
            "range",
            "$input.penetrations[0].position.x",
          ),
      ],
      [
        "sleeveRadius",
        () =>
          hasViolation(sleeveShape, "range", "$input.penetrations[2].radius"),
      ],
      [
        "capacityRefused",
        () =>
          hasViolation(unmeasurable, "range", "$input.systems[0].capacity") &&
          unmeasurable.success === false &&
          unmeasurable.violations.every(
            (item: IAutoMovieConstraintViolation): boolean =>
              !item.expected.includes("of declared demand against"),
          ),
      ],
    ]),
    {
      portSystem: true,
      portId: true,
      nonFiniteDemand: true,
      sleevePosition: true,
      sleeveRadius: true,
      capacityRefused: true,
    },
  );
}
