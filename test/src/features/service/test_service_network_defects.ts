import { validateServiceNetwork } from "@automovie/engine";
import {
  AutoMovieServiceDiscipline,
  AutoMovieServiceMedium,
  AutoMovieServiceUnit,
  IAutoMovieBuiltEnvironment,
  IAutoMovieConstraintViolation,
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertServiceNetworkSpatialDefects } from "../internal/assertServiceNetworkSpatialDefects";
import {
  hasViolation,
  namedFacts,
  nclose,
  violationCount,
} from "../internal/predicates";
import {
  node,
  port,
  segment,
  serviceEnvironment,
  serviceNetwork,
  sleeve,
  system,
  withNode,
  withPort,
  withSystem,
} from "../internal/serviceFixtures";

const environment: IAutoMovieBuiltEnvironment = serviceEnvironment();
const refuse: (network?: IAutoMovieServiceNetwork) => IAutoMovieValidation = (
  network: IAutoMovieServiceNetwork = serviceNetwork(),
): IAutoMovieValidation => validateServiceNetwork({ network, environment });

/**
 * Selected header, identity, vocabulary, load and spatial defects report their
 * owning field rather than an unrelated network property.
 *
 * Cases alter the shared bathhouse design, sometimes changing several fields
 * together. Selected exact counts distinguish secondary accusations from the
 * intended findings; the topology test owns clean-network admission.
 *
 * Dangling and unreachable are deliberately different findings. A port nothing
 * joins is a stub the author forgot to run; a node the root cannot get to is a
 * branch that was run and then orphaned. Reporting either as the other would
 * point at the wrong end of the mistake.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual network validation and directional load measurement over selected header, identity, vocabulary, medium/unit, stub, capacity, root, spatial, operating-state and numeric defects; kind/path, selected exact counts and overshoots expose missing or unrelated findings.
 * @evidence contracts/testing.md#independent-expectations Authored graph references and schema tables supply diagnostic paths; inlet .0002, waste outlet .001 and capacities .01/.0005 yield independent load/overshoot expectations through nclose. Presence-only assertions permit additional findings where no count is asserted.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all fifteen numbered groups, both data/control tables, supply/drain direction, branch deletion, nonfinite placement without extra room accusation and unmeasurable capacity without load comparison; clean-network admission and detailed run/seal geometry belong to adjacent service tests.
 * @evidence contracts/testing.md#execution-ownership The named discoverable portable unit owns early cases and calls assertServiceNetworkSpatialDefects for the original later groups with the same clean network and refusal closure; no extra registration, renderer, native host or hydraulic/electrical simulation runs.
 *
 * Scenarios:
 *
 * 1. The record's own header is checked: schema version, units, the environment it
 *    claims to serve, and a blank identity.
 * 2. Identity is enforced separately for systems, nodes, ports, runs and sleeves,
 *    with ports unique across the whole network rather than per node.
 * 3. Closed vocabularies stay closed: discipline, medium, flow, node kind and port
 *    direction each refuse a word outside their union.
 * 4. A discipline refuses a medium it does not carry, and a medium refuses a unit
 *    it is not measured in — at the system, and again at every port repeating
 *    it.
 * 5. The two disciplines the bathhouse itself does not carry answer to the same
 *    table: a data circuit is legal as a bit rate and refused as a control
 *    signal, and a control circuit is the mirror of it.
 * 6. A port carrying the wrong medium or the wrong unit is caught on its own, with
 *    the system left alone.
 * 7. A port no run joins is refused as a stub, and nothing else is.
 * 8. Declared demand beyond declared capacity is refused with the measured
 *    overshoot.
 * 9. A system is loaded at the end facing away from its root, so a drainage stack
 *    is measured by what discharges into it rather than by the zero a
 *    supply-shaped reading would hand it.
 * 10. A port standing outside the logical space its own node stands in is refused,
 *     without accusing the node that did stand in it.
 * 11. Deleting one branch produces exactly the three findings it causes: two stubs
 *     and one orphan.
 * 12. A root is refused when it does not resolve, when it carries no port on its
 *     own system, when a supply is rooted where the medium only arrives, and
 *     when a drain is rooted where it only leaves.
 * 13. A node is refused when its space does not resolve, when its element does not,
 *     and when it stands outside the space it claims.
 * 14. Operating state and access volumes are range-checked: a blank state name, an
 *     opening past 1, a collapsed envelope and a non-finite one.
 * 15. Non-finite and negative numbers are refused wherever a position, a demand or
 *     a section is required, and a point nobody can read is not additionally
 *     accused of standing in the wrong room.
 */
export function test_service_network_defects(): void {
  const clean: IAutoMovieServiceNetwork = serviceNetwork();

  const header: IAutoMovieValidation = refuse({
    ...clean,
    id: "  ",
    version: 2 as unknown as 1,
    units: "centimeter" as unknown as "meter",
    environment: "somewhere-else",
  });
  TestValidator.equals(
    "the record's own header is checked before anything it cites",
    namedFacts([
      ["id", () => hasViolation(header, "type", "$input.id")],
      ["version", () => hasViolation(header, "type", "$input.version")],
      ["units", () => hasViolation(header, "type", "$input.units")],
      ["environment", () => hasViolation(header, "type", "$input.environment")],
    ]),
    { id: true, version: true, units: true, environment: true },
  );

  const identity: IAutoMovieValidation = refuse({
    ...clean,
    systems: [...clean.systems, system({ id: "cold" })],
    nodes: [
      ...clean.nodes.map(
        (entry: IAutoMovieServiceNode): IAutoMovieServiceNode =>
          entry.id === "floor-gully"
            ? {
                ...entry,
                ports: [
                  ...entry.ports,
                  port({
                    id: "basin-cold",
                    system: "cold",
                    position: { x: 2.5, y: 0.1, z: 3 },
                  }),
                ],
              }
            : entry,
      ),
      node({ id: "basin", position: { x: 1, y: 1, z: 1 } }),
      node({ id: "  ", position: { x: 1, y: 1, z: 1 } }),
    ],
    segments: [...clean.segments, segment({ id: "cold-run" })],
    penetrations: [...clean.penetrations, sleeve({ id: "cold-bath-hall" })],
  });
  TestValidator.equals(
    "identity is enforced per record kind, and per network for ports",
    namedFacts([
      ["system", () => hasViolation(identity, "type", "$input.systems[7].id")],
      ["node", () => hasViolation(identity, "type", "$input.nodes[14].id")],
      ["blank", () => hasViolation(identity, "type", "$input.nodes[15].id")],
      [
        "port",
        () => hasViolation(identity, "type", "$input.nodes[11].ports[1].id"),
      ],
      [
        "segment",
        () => hasViolation(identity, "type", "$input.segments[10].id"),
      ],
      [
        "penetration",
        () => hasViolation(identity, "type", "$input.penetrations[13].id"),
      ],
    ]),
    {
      system: true,
      node: true,
      blank: true,
      port: true,
      segment: true,
      penetration: true,
    },
  );

  const vocabulary: IAutoMovieValidation = refuse(
    withPort(
      withNode(
        withSystem(
          clean,
          "cold",
          (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
            ...entry,
            discipline: "acoustics" as unknown as "plumbing",
            medium: "steam" as unknown as "cold-water",
            flow: "sideways" as unknown as "from-root",
            capacity: 0,
          }),
        ),
        "cold-main",
        (entry: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
          ...entry,
          kind: "gizmo" as unknown as "source",
        }),
      ),
      "basin-cold",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        direction: "sideways" as unknown as "in",
      }),
    ),
  );
  TestValidator.equals(
    "closed vocabularies stay closed at every level",
    namedFacts([
      [
        "discipline",
        () => hasViolation(vocabulary, "type", "$input.systems[0].discipline"),
      ],
      [
        "medium",
        () => hasViolation(vocabulary, "type", "$input.systems[0].medium"),
      ],
      [
        "flow",
        () => hasViolation(vocabulary, "type", "$input.systems[0].flow"),
      ],
      [
        "capacity",
        () => hasViolation(vocabulary, "range", "$input.systems[0].capacity"),
      ],
      ["kind", () => hasViolation(vocabulary, "type", "$input.nodes[0].kind")],
      [
        "direction",
        () =>
          hasViolation(
            vocabulary,
            "type",
            "$input.nodes[9].ports[0].direction",
          ),
      ],
    ]),
    {
      discipline: true,
      medium: true,
      flow: true,
      capacity: true,
      kind: true,
      direction: true,
    },
  );

  const mismatch: IAutoMovieValidation = refuse(
    withSystem(
      clean,
      "cold",
      (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        medium: "supply-air",
        unit: "watt",
      }),
    ),
  );
  const wrongUnit: IAutoMovieValidation = refuse(
    withSystem(
      clean,
      "lighting",
      (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
        ...entry,
        unit: "bit-per-second",
      }),
    ),
  );
  TestValidator.equals(
    "a discipline refuses a medium, a medium refuses a unit, and ports repeat both",
    namedFacts([
      [
        "disciplineMedium",
        () => hasViolation(mismatch, "type", "$input.systems[0].medium"),
      ],
      [
        "portMedium",
        () => hasViolation(mismatch, "type", "$input.nodes[9].ports[0].medium"),
      ],
      [
        "mediumUnit",
        () => hasViolation(wrongUnit, "type", "$input.systems[4].unit"),
      ],
      [
        "portUnit",
        () => hasViolation(wrongUnit, "type", "$input.nodes[13].ports[0].unit"),
      ],
    ]),
    {
      disciplineMedium: true,
      portMedium: true,
      mediumUnit: true,
      portUnit: true,
    },
  );

  const circuit: (
    discipline: AutoMovieServiceDiscipline,
    medium: AutoMovieServiceMedium,
    unit: AutoMovieServiceUnit,
  ) => IAutoMovieValidation = (
    discipline: AutoMovieServiceDiscipline,
    medium: AutoMovieServiceMedium,
    unit: AutoMovieServiceUnit,
  ): IAutoMovieValidation =>
    refuse(
      withPort(
        withPort(
          withSystem(
            clean,
            "lighting",
            (entry: IAutoMovieServiceSystem): IAutoMovieServiceSystem => ({
              ...entry,
              discipline,
              medium,
              unit,
            }),
          ),
          "panel-out",
          (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
            ...entry,
            medium,
            unit,
          }),
        ),
        "bath-light-in",
        (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
          ...entry,
          medium,
          unit,
        }),
      ),
    );
  TestValidator.equals(
    "the two disciplines this building never carries answer to the same table",
    namedFacts([
      [
        "dataCarriesABitRate",
        () => circuit("data", "data-signal", "bit-per-second").success === true,
      ],
      [
        "controlCarriesADimensionlessSignal",
        () =>
          circuit("control", "control-signal", "dimensionless").success ===
          true,
      ],
      [
        "dataRefusesAControlSignal",
        () => {
          const wrong: IAutoMovieValidation = circuit(
            "data",
            "control-signal",
            "dimensionless",
          );
          return (
            hasViolation(wrong, "type", "$input.systems[4].medium") &&
            violationCount(wrong) === 1
          );
        },
      ],
      [
        "controlRefusesABitRate",
        () => {
          const wrong: IAutoMovieValidation = circuit(
            "control",
            "control-signal",
            "bit-per-second",
          );
          return (
            hasViolation(wrong, "type", "$input.systems[4].unit") &&
            violationCount(wrong) === 1
          );
        },
      ],
    ]),
    {
      dataCarriesABitRate: true,
      controlCarriesADimensionlessSignal: true,
      dataRefusesAControlSignal: true,
      controlRefusesABitRate: true,
    },
  );

  const portMedium: IAutoMovieValidation = refuse(
    withPort(
      clean,
      "basin-cold",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        medium: "hot-water",
      }),
    ),
  );
  const portUnit: IAutoMovieValidation = refuse(
    withPort(
      clean,
      "basin-cold",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        unit: "watt",
      }),
    ),
  );
  TestValidator.equals(
    "one port disagreeing with its system is caught without accusing the system",
    namedFacts([
      [
        "medium",
        () =>
          hasViolation(portMedium, "type", "$input.nodes[9].ports[0].medium") &&
          portMedium.success === false &&
          portMedium.violations.length === 1,
      ],
      [
        "unit",
        () =>
          hasViolation(portUnit, "type", "$input.nodes[9].ports[0].unit") &&
          portUnit.success === false &&
          portUnit.violations.length === 1,
      ],
    ]),
    { medium: true, unit: true },
  );

  const stub: IAutoMovieValidation = refuse(
    withNode(
      clean,
      "bath-valve",
      (entry: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
        ...entry,
        ports: [
          ...entry.ports,
          port({
            id: "bath-valve-drain",
            system: "cold",
            direction: "out",
            position: { x: 3.5, y: 2.5, z: 1 },
          }),
        ],
      }),
    ),
  );
  TestValidator.equals(
    "a port no run joins is a stub, and the only finding",
    namedFacts([
      ["stub", () => hasViolation(stub, "type", "$input.nodes[8].ports[2]")],
      ["alone", () => stub.success === false && stub.violations.length === 1],
    ]),
    { stub: true, alone: true },
  );

  const overloaded: IAutoMovieValidation = refuse(
    withPort(
      clean,
      "basin-cold",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        demand: 0.02,
      }),
    ),
  );
  TestValidator.equals(
    "declared demand beyond declared capacity is refused with its overshoot",
    namedFacts([
      [
        "reported",
        () => hasViolation(overloaded, "range", "$input.systems[0].capacity"),
      ],
      [
        "overshoot",
        () =>
          overloaded.success === false &&
          overloaded.violations.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              nclose(item.overshoot ?? -1, 0.01, 1e-12),
          ),
      ],
      [
        "alone",
        () =>
          overloaded.success === false && overloaded.violations.length === 1,
      ],
    ]),
    { reported: true, overshoot: true, alone: true },
  );

  assertServiceNetworkSpatialDefects(clean, refuse);
}
