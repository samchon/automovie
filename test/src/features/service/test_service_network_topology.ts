import {
  serviceAnalysisSupport,
  serviceNetworkSchematic,
  serviceSystemReach,
  validateBuiltEnvironment,
  validateServiceNetwork,
  validateWetZones,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  throwsError,
  validationHasNoWarnings,
} from "../internal/predicates";
import {
  serviceEnvironment,
  serviceNetwork,
  withNode,
  withSystem,
} from "../internal/serviceFixtures";

/**
 * Water, drainage, vent, power, air and fire suppression are one graph, and the
 * question that graph exists to answer is "does the root reach everything".
 *
 * A rendered bathhouse cannot distinguish a basin joined to a stack from a
 * basin joined to nothing, so the evidence has to come from the topology
 * instead. This case pins that a network authored across seven systems and five
 * disciplines validates as one object, that each system's reach is walked in
 * its own direction — forward from a supply main, backward into a drainage
 * stack, both ways on a ring — and that the derived schematic reports the same
 * graph with hand-checkable totals.
 *
 * The valve is the point where a design question and an operating question
 * separate. Shutting one must not fail validation, because a closed valve is
 * not a defect, and it must still isolate exactly what stands beyond it when
 * the caller asks the operating question.
 *
 * Scenarios:
 *
 * 1. The building itself validates as a building, and the multi-discipline network
 *    over it validates clean on both the graph and its wet zones, with no
 *    warnings riding along. A network held against a building that would not
 *    stand up proves nothing.
 * 2. Every system's reach is exactly the nodes carrying its ports, in declaration
 *    order, for all three flow directions.
 * 3. An undirected system reaches through a run in the direction opposite to the
 *    one it was authored in, which a `from-root` system does not.
 * 4. A shut valve remains admitted, is walked straight through by default,
 *    and isolates the basin when the operating question is asked.
 * 5. The same isolation is asked of a de-energised distribution panel, because an
 *    inline device is one record whatever it carries: a rule that only worked
 *    on water would be a plumbing special case wearing a general name.
 * 6. A system whose root does not resolve reaches nothing rather than reaching a
 *    name, and reach and schematic both refuse an unknown system id.
 * 7. The cold schematic reproduces the graph with hand-computed totals: three
 *    nodes, two edges, 8.6 m of run, 0.0002 m³/s of demand, nothing unreached.
 * 8. The waste schematic is read in its own direction: a stack reports the 0.001
 *    m³/s discharged into it, not the zero an inlet-shaped reading gives it.
 * 9. Structural and declared boundary-face checks are supported, while missing
 *    faces and each discipline's unsolved performance remain unsupported;
 *    removing every space volume withdraws placement and crossing support.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates the existing building/network/wet zones, walks design and operating reach and reads schematic/support output; catches reversed drainage, ignored device isolation, incorrect plan totals and invented support for absent geometry or performance solvers.
 * @evidence contracts/testing.md#independent-expectations Authored port/node/edge identities, directed graph reach and hand-summed 4.5+4.1 metre supply and 11 metre waste runs define expectations; demand totals use authored quantities and support labels describe represented checks, without establishing hydraulic/electrical performance or rendered installation.
 * @evidence contracts/testing.md#distinguishing-cases Covers supply/drainage/undirected reach, open/closed valve and panel, missing roots and unknown systems, valid/broken schematic endpoints, declared/missing faces and volumeless spaces. Initial admission asserts no warnings, but closed-device cases assert success only; malformed record admission belongs to the defects unit.
 * @evidence contracts/testing.md#execution-ownership This named synchronous portable unit calls maintained Engine source through the existing service fixture and locally declared cases, acquiring no browser, renderer, process, native artifact or dynamic test registry.
 */
export function test_service_network_topology(): void {
  const environment: ReturnType<typeof serviceEnvironment> =
    serviceEnvironment();
  const network: ReturnType<typeof serviceNetwork> = serviceNetwork();

  TestValidator.predicate(
    "the building the network is checked against is itself a valid building",
    validationHasNoWarnings(
      "service environment",
      validateBuiltEnvironment({ environment }),
    ),
  );
  TestValidator.predicate(
    "a seven-system network validates clean",
    validationHasNoWarnings(
      "service network",
      validateServiceNetwork({ network, environment }),
    ),
  );
  TestValidator.predicate(
    "its wet zones validate clean",
    validationHasNoWarnings(
      "wet zones",
      validateWetZones({ network, environment }),
    ),
  );

  TestValidator.equals(
    "each system reaches exactly the nodes carrying its ports",
    Object.fromEntries(
      network.systems.map(
        (system: (typeof network.systems)[number]): [string, string[]] => [
          system.id,
          serviceSystemReach({ network, system: system.id }),
        ],
      ),
    ),
    {
      cold: ["cold-main", "bath-valve", "basin"],
      hot: ["hot-main", "basin"],
      waste: ["stack", "basin", "waste-tee", "floor-gully"],
      vent: ["vent-head", "basin"],
      lighting: ["panel", "bath-light"],
      air: ["ahu", "hall-diffuser"],
      fire: ["fire-main", "sprinkler-head"],
    },
  );

  const ring: typeof network = withSystem(
    network,
    "hot",
    (
      system: (typeof network.systems)[number],
    ): (typeof network.systems)[number] => ({
      ...system,
      flow: "undirected",
      root: "basin",
    }),
  );
  const backwards: typeof network = withSystem(
    network,
    "hot",
    (
      system: (typeof network.systems)[number],
    ): (typeof network.systems)[number] => ({
      ...system,
      root: "basin",
    }),
  );
  TestValidator.equals(
    "an undirected system walks a run either way, a directed one does not",
    namedFacts([
      [
        "ring",
        (): boolean =>
          serviceSystemReach({ network: ring, system: "hot" }).join() ===
          "hot-main,basin",
      ],
      [
        "directed",
        (): boolean =>
          serviceSystemReach({ network: backwards, system: "hot" }).join() ===
          "basin",
      ],
    ]),
    { ring: true, directed: true },
  );

  const shut: typeof network = withNode(
    network,
    "bath-valve",
    (node: (typeof network.nodes)[number]): (typeof network.nodes)[number] => ({
      ...node,
      state: { name: "closed", opening: 0 },
    }),
  );
  TestValidator.equals(
    "a shut valve is a design fact by default and an isolation on request",
    namedFacts([
      [
        "stillValid",
        (): boolean =>
          validateServiceNetwork({ network: shut, environment }).success,
      ],
      [
        "designReach",
        (): boolean =>
          serviceSystemReach({ network: shut, system: "cold" }).join() ===
          "cold-main,bath-valve,basin",
      ],
      [
        "operatingReach",
        (): boolean =>
          serviceSystemReach({
            network: shut,
            system: "cold",
            closedValvesBlock: true,
          }).join() === "cold-main,bath-valve",
      ],
      [
        "openValvePasses",
        (): boolean =>
          serviceSystemReach({
            network,
            system: "cold",
            closedValvesBlock: true,
          }).join() === "cold-main,bath-valve,basin",
      ],
    ]),
    {
      stillValid: true,
      designReach: true,
      operatingReach: true,
      openValvePasses: true,
    },
  );

  const deEnergised: typeof network = withNode(
    network,
    "panel",
    (node: (typeof network.nodes)[number]): (typeof network.nodes)[number] => ({
      ...node,
      state: { name: "off", opening: 0 },
    }),
  );
  TestValidator.equals(
    "a device isolates the same way whatever medium it holds back",
    namedFacts([
      [
        "stillValid",
        (): boolean =>
          validateServiceNetwork({ network: deEnergised, environment }).success,
      ],
      [
        "designReach",
        (): boolean =>
          serviceSystemReach({
            network: deEnergised,
            system: "lighting",
          }).join() === "panel,bath-light",
      ],
      [
        "operatingReach",
        (): boolean =>
          serviceSystemReach({
            network: deEnergised,
            system: "lighting",
            closedValvesBlock: true,
          }).join() === "panel",
      ],
      [
        "liveCircuitPasses",
        (): boolean =>
          serviceSystemReach({
            network,
            system: "lighting",
            closedValvesBlock: true,
          }).join() === "panel,bath-light",
      ],
    ]),
    {
      stillValid: true,
      designReach: true,
      operatingReach: true,
      liveCircuitPasses: true,
    },
  );

  const rootless: typeof network = withSystem(
    network,
    "cold",
    (
      system: (typeof network.systems)[number],
    ): (typeof network.systems)[number] => ({
      ...system,
      root: "no-such-node",
    }),
  );
  TestValidator.equals(
    "an unresolved root reaches nothing and an unknown system is refused",
    namedFacts([
      [
        "rootless",
        (): boolean =>
          serviceSystemReach({ network: rootless, system: "cold" }).length ===
          0,
      ],
      [
        "reachRefuses",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof serviceSystemReach> =>
              serviceSystemReach({ network, system: "steam" }),
            ['has no system "steam"'],
          ),
      ],
      [
        "schematicRefuses",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof serviceNetworkSchematic> =>
              serviceNetworkSchematic({ network, system: "steam" }),
            ['has no system "steam"'],
          ),
      ],
    ]),
    { rootless: true, reachRefuses: true, schematicRefuses: true },
  );

  const schematic: ReturnType<typeof serviceNetworkSchematic> =
    serviceNetworkSchematic({ network, system: "cold" });
  TestValidator.equals(
    "the cold schematic is the same graph in plan, with its own totals",
    namedFacts([
      ["discipline", (): boolean => schematic.discipline === "plumbing"],
      ["unit", (): boolean => schematic.unit === "cubic-meter-per-second"],
      ["root", (): boolean => schematic.root === "cold-main"],
      [
        "nodes",
        (): boolean =>
          schematic.nodes
            .map((entry: (typeof schematic.nodes)[number]): string => entry.id)
            .join() === "cold-main,bath-valve,basin",
      ],
      [
        "plan",
        (): boolean =>
          nclose(schematic.nodes[0]!.x, 8, 0) &&
          nclose(schematic.nodes[0]!.y, 1, 0) &&
          schematic.nodes[0]!.kind === "source",
      ],
      [
        "edges",
        (): boolean =>
          schematic.edges
            .map((edge: (typeof schematic.edges)[number]): string => edge.id)
            .join() === "cold-run,cold-branch",
      ],
      [
        "endpoints",
        (): boolean =>
          schematic.edges[1]!.from === "bath-valve" &&
          schematic.edges[1]!.to === "basin",
      ],
      ["projected", (): boolean => schematic.edges[1]!.points.length === 3],
      [
        "runLength",
        (): boolean => nclose(schematic.edges[0]!.length, 4.5, 1e-12),
      ],
      [
        "branchLength",
        (): boolean => nclose(schematic.edges[1]!.length, 4.1, 1e-12),
      ],
      ["totalLength", (): boolean => nclose(schematic.totalLength, 8.6, 1e-12)],
      [
        "totalDemand",
        (): boolean => nclose(schematic.totalDemand, 0.0002, 1e-15),
      ],
      ["unreachable", (): boolean => schematic.unreachable.length === 0],
    ]),
    {
      discipline: true,
      unit: true,
      root: true,
      nodes: true,
      plan: true,
      edges: true,
      endpoints: true,
      projected: true,
      runLength: true,
      branchLength: true,
      totalLength: true,
      totalDemand: true,
      unreachable: true,
    },
  );

  const stack: ReturnType<typeof serviceNetworkSchematic> =
    serviceNetworkSchematic({ network, system: "waste" });
  TestValidator.equals(
    "a stack's schematic reports what discharges into it",
    namedFacts([
      [
        "nodes",
        (): boolean =>
          stack.nodes
            .map((entry: (typeof stack.nodes)[number]): string => entry.id)
            .join() === "stack,basin,waste-tee,floor-gully",
      ],
      [
        "edges",
        (): boolean =>
          stack.edges
            .map((edge: (typeof stack.edges)[number]): string => edge.id)
            .join() === "waste-basin,waste-gully,waste-main",
      ],
      ["totalLength", (): boolean => nclose(stack.totalLength, 11, 1e-12)],
      ["totalDemand", (): boolean => nclose(stack.totalDemand, 0.001, 1e-15)],
      ["unreachable", (): boolean => stack.unreachable.length === 0],
    ]),
    {
      nodes: true,
      edges: true,
      totalLength: true,
      totalDemand: true,
      unreachable: true,
    },
  );

  const broken: ReturnType<typeof serviceNetworkSchematic> =
    serviceNetworkSchematic({
      network: {
        ...network,
        segments: network.segments.map(
          (
            entry: (typeof network.segments)[number],
          ): (typeof network.segments)[number] =>
            entry.id === "cold-run"
              ? { ...entry, from: "ghost", to: "phantom" }
              : entry,
        ),
      },
      system: "cold",
    });
  TestValidator.equals(
    "a schematic over a broken graph names the port it could not resolve",
    namedFacts([
      ["from", (): boolean => broken.edges[0]!.from === "ghost"],
      ["to", (): boolean => broken.edges[0]!.to === "phantom"],
      [
        "orphaned",
        (): boolean => broken.unreachable.join() === "bath-valve,basin",
      ],
    ]),
    { from: true, to: true, orphaned: true },
  );

  const support: ReturnType<typeof serviceAnalysisSupport> =
    serviceAnalysisSupport({ network, environment });
  TestValidator.equals(
    "what cannot be answered is named rather than implied",
    namedFacts([
      ["count", (): boolean => support.length === 13],
      [
        "structural",
        (): boolean =>
          support
            .filter(
              (entry: (typeof support)[number]): boolean =>
                entry.status === "supported",
            )
            .map((entry: (typeof support)[number]): string => entry.check)
            .join() ===
          "port-connectivity,medium-direction-unit,segment-clash,maintenance-envelope,node-placement,boundary-penetration,penetration-on-boundary-face,waterproof-coverage",
      ],
      [
        "volumelessDropsBothPlacementAnswers",
        (): boolean =>
          serviceAnalysisSupport({
            network,
            environment: {
              ...environment,
              spaces: environment.spaces.map(
                (
                  space: (typeof environment.spaces)[number],
                ): (typeof environment.spaces)[number] => ({
                  ...space,
                  cells: [],
                }),
              ),
            },
          })
            .filter(
              (entry: (typeof support)[number]): boolean =>
                entry.status === "unsupported",
            )
            .map((entry: (typeof support)[number]): string => entry.check)
            .join()
            .startsWith("node-placement,boundary-penetration"),
      ],
      [
        "boundaryFace",
        (): boolean =>
          support.some(
            (entry: (typeof support)[number]): boolean =>
              entry.check === "penetration-on-boundary-face" &&
              entry.status === "supported",
          ),
      ],
      [
        "facelessBoundaryDropsIt",
        (): boolean =>
          serviceAnalysisSupport({
            network: {
              ...network,
              penetrations: network.penetrations.map(
                (
                  sleeve: (typeof network.penetrations)[number],
                ): (typeof network.penetrations)[number] =>
                  sleeve.id === "cold-bath-hall"
                    ? { ...sleeve, boundary: "bath-shell" }
                    : sleeve,
              ),
            },
            environment,
          }).some(
            (entry: (typeof support)[number]): boolean =>
              entry.check === "penetration-on-boundary-face" &&
              entry.status === "unsupported" &&
              entry.reason.includes('boundary "bath-shell" declares no face'),
          ),
      ],
      [
        "unresolvedBoundaryDropsItToo",
        (): boolean =>
          serviceAnalysisSupport({
            network: {
              ...network,
              penetrations: network.penetrations.map(
                (
                  sleeve: (typeof network.penetrations)[number],
                ): (typeof network.penetrations)[number] =>
                  sleeve.id === "cold-bath-hall"
                    ? { ...sleeve, boundary: "nowhere" }
                    : sleeve,
              ),
            },
            environment,
          }).some(
            (entry: (typeof support)[number]): boolean =>
              entry.check === "penetration-on-boundary-face" &&
              entry.status === "unsupported" &&
              entry.reason.includes('boundary "nowhere" declares no face'),
          ),
      ],
      [
        "perDiscipline",
        (): boolean =>
          support
            .filter((entry: (typeof support)[number]): boolean =>
              entry.check.endsWith("-performance"),
            )
            .map((entry: (typeof support)[number]): string => entry.check)
            .join() ===
          "plumbing-performance,drainage-performance,electrical-performance,hvac-performance,fire-performance",
      ],
      [
        "noSolver",
        (): boolean =>
          support
            .filter((entry: (typeof support)[number]): boolean =>
              entry.check.endsWith("-performance"),
            )
            .every(
              (entry: (typeof support)[number]): boolean =>
                entry.status === "unsupported",
            ),
      ],
    ]),
    {
      count: true,
      structural: true,
      volumelessDropsBothPlacementAnswers: true,
      boundaryFace: true,
      facelessBoundaryDropsIt: true,
      unresolvedBoundaryDropsItToo: true,
      perDiscipline: true,
      noSolver: true,
    },
  );
}
