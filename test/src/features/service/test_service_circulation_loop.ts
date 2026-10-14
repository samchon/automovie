import {
  serviceNetworkSchematic,
  serviceSystemLoad,
  serviceSystemReach,
  validateServiceNetwork,
  validateWetZones,
} from "@automovie/engine";
import {
  AutoMovieServiceFlow,
  IAutoMovieServiceNetwork,
  IAutoMovieBuiltEnvironment,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
  IAutoMovieServiceSegment,
  IAutoMovieValidation,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  namedFacts,
  nclose,
  validationHasNoWarnings,
  violationCount,
} from "../internal/predicates";
import {
  node,
  port,
  segment,
  serviceEnvironment,
  serviceNetwork,
  system,
  withPort,
} from "../internal/serviceFixtures";

const environment: IAutoMovieBuiltEnvironment = serviceEnvironment();

/**
 * A recirculating hot water loop, wholly inside the plant room.
 *
 * Three fittings and three runs close on themselves: the heater emits, a riser
 * tee passes the medium on through a ring fitting, a tap draws from it, and the
 * return leg comes back into the heater. It stays in one logical space so that
 * nothing here answers for a wall crossing — the point under test is the cycle,
 * not the sleeve, and a fixture that needed both would not tell which one
 * failed.
 */
const circulation: (overrides?: Partial<IAutoMovieServiceNetwork>) => IAutoMovieServiceNetwork = (
  overrides: Partial<IAutoMovieServiceNetwork> = {},
): IAutoMovieServiceNetwork => ({
  version: 1,
  id: "plant-circulation",
  units: "meter",
  environment: "bathhouse",
  systems: [
    system({
      id: "loop",
      discipline: "plumbing",
      medium: "hot-water",
      unit: "cubic-meter-per-second",
      flow: "undirected",
      root: "heater",
      capacity: 0.01,
    }),
  ],
  nodes: [
    node({
      id: "heater",
      kind: "equipment",
      space: "plant",
      position: { x: 7.5, y: 1, z: 1 },
      ports: [
        port({
          id: "heater-flow",
          system: "loop",
          medium: "hot-water",
          direction: "out",
          section: 0.002,
          position: { x: 7.5, y: 1, z: 1 },
        }),
        port({
          id: "heater-return",
          system: "loop",
          medium: "hot-water",
          direction: "in",
          demand: 0.0005,
          section: 0.002,
          position: { x: 7.5, y: 1, z: 1 },
        }),
      ],
    }),
    node({
      id: "riser-tee",
      kind: "junction",
      space: "plant",
      position: { x: 7.5, y: 2.5, z: 1 },
      ports: [
        port({
          id: "riser-in",
          system: "loop",
          medium: "hot-water",
          direction: "in",
          section: 0.002,
          position: { x: 7.5, y: 2.5, z: 1 },
        }),
        port({
          id: "riser-ring",
          system: "loop",
          medium: "hot-water",
          direction: "bidirectional",
          section: 0.002,
          position: { x: 7.5, y: 2.5, z: 1 },
        }),
      ],
    }),
    node({
      id: "loop-tap",
      kind: "fixture",
      space: "plant",
      position: { x: 9, y: 2.5, z: 1 },
      state: { name: "throttled", opening: 0.5 },
      ports: [
        port({
          id: "tap-draw",
          system: "loop",
          medium: "hot-water",
          direction: "in",
          demand: 0.0002,
          section: 0.002,
          position: { x: 9, y: 2.5, z: 1 },
        }),
        port({
          id: "tap-return",
          system: "loop",
          medium: "hot-water",
          direction: "out",
          section: 0.002,
          position: { x: 9, y: 2.5, z: 1 },
        }),
      ],
    }),
  ],
  segments: [
    segment({
      id: "flow-riser",
      system: "loop",
      from: "heater-flow",
      to: "riser-in",
      route: [
        { x: 7.5, y: 1, z: 1 },
        { x: 7.5, y: 2.5, z: 1 },
      ],
      radius: 0.02,
      section: 0.002,
    }),
    segment({
      id: "flow-branch",
      system: "loop",
      from: "riser-ring",
      to: "tap-draw",
      route: [
        { x: 7.5, y: 2.5, z: 1 },
        { x: 9, y: 2.5, z: 1 },
      ],
      radius: 0.02,
      section: 0.002,
    }),
    segment({
      id: "return-leg",
      system: "loop",
      from: "tap-return",
      to: "heater-return",
      route: [
        { x: 9, y: 2.5, z: 1 },
        { x: 9, y: 1, z: 1 },
        { x: 7.5, y: 1, z: 1 },
      ],
      radius: 0.02,
      section: 0.002,
    }),
  ],
  penetrations: [],
  zones: [],
  ...overrides,
});

/** The same loop declared to be traversed in one named direction. */
const flowing: (flow: AutoMovieServiceFlow) => IAutoMovieServiceNetwork = (flow: AutoMovieServiceFlow): IAutoMovieServiceNetwork =>
  circulation({
    systems: circulation().systems.map((entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({ ...entry, flow })),
  });

/**
 * A circulation network closes on itself, and every rule that walks the graph
 * has to survive that.
 *
 * This suite's supply, drainage, vent, power, air and fire examples are trees: one
 * root, one path to each fitting, and a walk that ends because it runs out of
 * edges. A recirculating leg is the case that is not — the medium leaves the
 * plant, is drawn from on the way round, and comes back into the machine it
 * left. That is a cycle in the node graph, so reachability has to terminate on
 * its own rather than on the shape of the data, the ring fitting has to be a
 * port a run may both leave and arrive at, and the load has to be counted once
 * however many times the walk passes the tap.
 *
 * The loop is deliberately its own network rather than another branch of the
 * bathhouse: a cycle mixed into a tree would be validated alongside other runs
 * that could each explain a failure, and this file would stop naming the thing
 * it is about.
 *
 * Scenarios:
 *
 * 1. The closed loop validates clean on both the graph and its (empty) wet zones,
 *    carrying no warnings.
 * 2. The walk terminates and reaches all three fittings whichever direction the
 *    system declares — a ring reads the same forwards, backwards and either
 *    way, which is what makes it a circulation rather than a dead leg.
 * 3. The ring fitting is a port a run leaves, which no other case in this suite
 *    exercises; turning it into a consumer refuses that run and nothing else.
 * 4. A bidirectional consumer is accepted at the far end too, and is counted at
 *    neither end of the load, so the ring's declared total drops by the tap's
 *    own draw.
 * 5. The load is the 0.0007 m³/s its two inlets declare, and a capacity below it
 *    is refused with the measured overshoot.
 * 6. The schematic reports the ring as three nodes, three edges and 6 m of pipe,
 *    with nothing unreached.
 * 7. Breaking the return leg leaves exactly the two stubs it orphans; the walk
 *    still reaches every fitting, which is precisely why a stub and an orphan
 *    are separate findings.
 * 8. The tree the rest of the suite is built on has no cycle at all, so the ring
 *    is a case this fixture could not have been standing in for.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual service validators, directional reach, declared load and schematic on a three-node circulation ring, observing termination, port-direction refusal, capacity overshoot and the two dangling ports after return removal.
 * @evidence contracts/testing.md#independent-expectations Authored 1.5+1.5+3-metre routes total 6 metres; inlet demands 0.0005+0.0002 total 0.0007 cubic metres per second and exceed 0.0004 by 0.0003. Literal node/edge/path lists define graph expectations independently of returned reports.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts three flow directions, bidirectional versus inlet-only fittings, full versus reduced demand, capacity sufficiency and closed/opened return topology, with existing per-system tree edge-count neighbors; edge count alone is not a general acyclicity proof.
 * @evidence contracts/testing.md#execution-ownership Owns synchronous numerical bathhouse/service records and invokes portable engine graph/declaration checks through the runner; no hydraulic circulation, installation render or performance solver is executed, and empty wet-zone success covers only that empty zone set.
 */
export function test_service_circulation_loop(): void {
  const loop: IAutoMovieServiceNetwork = circulation();

  TestValidator.equals(
    "a loop that returns to the machine it left validates clean",
    namedFacts([
      [
        "graph",
        (): boolean =>
          validationHasNoWarnings(
            "circulation graph",
            validateServiceNetwork({ network: loop, environment }),
          ),
      ],
      [
        "zones",
        (): boolean =>
          validationHasNoWarnings(
            "circulation zones",
            validateWetZones({ network: loop, environment }),
          ),
      ],
    ]),
    { graph: true, zones: true },
  );

  TestValidator.equals(
    "the walk closes rather than running, whichever way the ring is read",
    namedFacts([
      [
        "undirected",
        (): boolean =>
          serviceSystemReach({ network: loop, system: "loop" }).join() ===
          "heater,riser-tee,loop-tap",
      ],
      [
        "fromRoot",
        (): boolean =>
          serviceSystemReach({
            network: flowing("from-root"),
            system: "loop",
          }).join() === "heater,riser-tee,loop-tap",
      ],
      [
        "toRoot",
        (): boolean =>
          serviceSystemReach({
            network: flowing("to-root"),
            system: "loop",
          }).join() === "heater,riser-tee,loop-tap",
      ],
      [
        "everyDirectionValidates",
        (): boolean =>
          (["from-root", "to-root", "undirected"] as const).every(
            (flow: AutoMovieServiceFlow): boolean =>
              validateServiceNetwork({ network: flowing(flow), environment })
                .success,
          ),
      ],
    ]),
    {
      undirected: true,
      fromRoot: true,
      toRoot: true,
      everyDirectionValidates: true,
    },
  );

  const consumingRing: IAutoMovieValidation = validateServiceNetwork({
    network: withPort(loop, "riser-ring", (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
      ...entry,
      direction: "in",
    })),
    environment,
  });
  const ringConsumer: IAutoMovieServiceNetwork = withPort(loop, "tap-draw", (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
    ...entry,
    direction: "bidirectional",
  }));
  TestValidator.equals(
    "a ring fitting is a port a run may leave and a port a run may enter",
    namedFacts([
      [
        "leavingRefused",
        (): boolean =>
          hasViolation(consumingRing, "type", "$input.segments[1].from") &&
          violationCount(consumingRing) === 1,
      ],
      [
        "enteringAccepted",
        (): boolean =>
          validateServiceNetwork({ network: ringConsumer, environment })
            .success,
      ],
      [
        "countedAtNeitherEnd",
        (): boolean =>
          nclose(
            serviceSystemLoad({
              network: ringConsumer,
              system: ringConsumer.systems[0]!,
            }),
            0.0005,
            1e-15,
          ),
      ],
    ]),
    {
      leavingRefused: true,
      enteringAccepted: true,
      countedAtNeitherEnd: true,
    },
  );

  const starved: IAutoMovieValidation = validateServiceNetwork({
    network: circulation({
      systems: circulation().systems.map((entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        capacity: 0.0004,
      })),
    }),
    environment,
  });
  TestValidator.equals(
    "the ring is loaded once by each inlet, however often the walk passes it",
    namedFacts([
      [
        "load",
        (): boolean =>
          nclose(
            serviceSystemLoad({ network: loop, system: loop.systems[0]! }),
            0.0007,
            1e-15,
          ),
      ],
      [
        "refused",
        (): boolean => hasViolation(starved, "range", "$input.systems[0].capacity"),
      ],
      [
        "overshoot",
        (): boolean =>
          starved.success === false &&
          starved.violations.some((item: IAutoMovieConstraintViolation): boolean =>
            nclose(item.overshoot ?? -1, 0.0003, 1e-15),
          ),
      ],
      ["alone", (): boolean => violationCount(starved) === 1],
    ]),
    { load: true, refused: true, overshoot: true, alone: true },
  );

  const schematic: ReturnType<typeof serviceNetworkSchematic> = serviceNetworkSchematic({ network: loop, system: "loop" });
  TestValidator.equals(
    "the ring draws as a ring, with its own hand-computed totals",
    namedFacts([
      [
        "nodes",
        (): boolean =>
          schematic.nodes.map((entry: typeof schematic.nodes[number]): string => entry.id).join() ===
          "heater,riser-tee,loop-tap",
      ],
      [
        "edges",
        (): boolean =>
          schematic.edges.map((edge: typeof schematic.edges[number]): string => edge.id).join() ===
          "flow-riser,flow-branch,return-leg",
      ],
      [
        "closes",
        (): boolean =>
          schematic.edges[2]!.from === "loop-tap" &&
          schematic.edges[2]!.to === "heater",
      ],
      ["totalLength", (): boolean => nclose(schematic.totalLength, 6, 1e-12)],
      ["totalDemand", (): boolean => nclose(schematic.totalDemand, 0.0007, 1e-15)],
      ["unreachable", (): boolean => schematic.unreachable.length === 0],
    ]),
    {
      nodes: true,
      edges: true,
      closes: true,
      totalLength: true,
      totalDemand: true,
      unreachable: true,
    },
  );

  const opened: IAutoMovieServiceNetwork = circulation({
    segments: circulation().segments.filter(
      (entry: IAutoMovieServiceSegment): boolean => entry.id !== "return-leg",
    ),
  });
  const broken: IAutoMovieValidation = validateServiceNetwork({ network: opened, environment });
  TestValidator.equals(
    "breaking the return leaves stubs, not orphans, because the walk still arrives",
    namedFacts([
      [
        "heaterStub",
        (): boolean => hasViolation(broken, "type", "$input.nodes[0].ports[1]"),
      ],
      [
        "tapStub",
        (): boolean => hasViolation(broken, "type", "$input.nodes[2].ports[1]"),
      ],
      ["exactly", (): boolean => violationCount(broken) === 2],
      [
        "stillReached",
        (): boolean =>
          serviceSystemReach({ network: opened, system: "loop" }).join() ===
          "heater,riser-tee,loop-tap",
      ],
    ]),
    { heaterStub: true, tapStub: true, exactly: true, stillReached: true },
  );

  const spanning: (network: IAutoMovieServiceNetwork, id: string) => boolean = (network: IAutoMovieServiceNetwork, id: string): boolean =>
    network.segments.filter((run: IAutoMovieServiceSegment): boolean => run.system === id).length ===
    serviceSystemReach({ network, system: id }).length - 1;
  TestValidator.equals(
    "the tree this suite is otherwise built on could not have stood in for a ring",
    namedFacts([
      [
        "bathhouseIsATree",
        (): boolean =>
          serviceNetwork().systems.every((entry: IAutoMovieServiceSystem): boolean =>
            spanning(serviceNetwork(), entry.id),
          ),
      ],
      ["ringIsNot", (): boolean => !spanning(loop, "loop")],
    ]),
    { bathhouseIsATree: true, ringIsNot: true },
  );
}
