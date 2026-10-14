import { validateServiceNetwork } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConstraintViolation,
  IAutoMovieServiceNetwork,
  IAutoMovieServicePort,
  IAutoMovieServiceSegment,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  namedFacts,
  nclose,
  violationCount,
} from "../internal/predicates";
import {
  serviceEnvironment,
  serviceNetwork,
  withPort,
  withSegment,
} from "../internal/serviceFixtures";

const environment: IAutoMovieBuiltEnvironment = serviceEnvironment();
const refuse: (network?: IAutoMovieServiceNetwork) => IAutoMovieValidation = (
  network: IAutoMovieServiceNetwork = serviceNetwork(),
): IAutoMovieValidation => validateServiceNetwork({ network, environment });

/**
 * What a run is allowed to be: two real ports on its own system, joined the way
 * the medium actually travels, along a line that starts and ends where it
 * says.
 *
 * A run is the only record that repeats geometry a port already stated, so it
 * is the only record that can contradict one. The centre line is what a clash,
 * a sleeve and a length are all measured on, so a line whose ends float away
 * from the fittings it claims to join silently invalidates every one of those,
 * and it does so without looking wrong in a frame.
 *
 * Direction is checked in the node's own terms. `out` means the node puts the
 * medium into the network and `in` means it takes it out, so a run always
 * leaves an `out` and arrives at an `in`, whatever the medium is.
 * `bidirectional` is the one port that satisfies both, which is what a ring tap
 * needs and what the negative twin below proves is not an accident.
 *
 * Scenarios:
 *
 * 1. A run on a system that does not resolve is refused, and so are its two ports
 *    for belonging to a different one.
 * 2. Ports that do not resolve are refused on the run, and the fittings they were
 *    meant to join are then reported as stubs.
 * 3. A run may not join a port to itself.
 * 4. A run may not join a port belonging to another system.
 * 5. A run must leave an emitting port and arrive at a consuming one; a
 *    bidirectional port satisfies either end and is not refused.
 * 6. A run's section must match every port that states one, with the measured
 *    difference carried; a port that states none imposes none.
 * 7. A route needs at least two points; a single point is refused for its length
 *    and again for not reaching the far fitting.
 * 8. Repeated and non-finite route points are refused where they stand.
 * 9. A run's own radius and section must be finite and positive.
 * 10. An endpoint that drifts off its fitting is refused with the gap in metres.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates networks with authored run/port mutations and reads actual finding kinds, paths, selected counts and measured overshoot; catches missing endpoint/system/direction checks, dropped route defects and a gap reported at the wrong authored address.
 * @evidence contracts/testing.md#independent-expectations Closed service relationships require distinct resolved same-system endpoints and compatible directions/sections; literal 0.001 square-metre section difference and 0.25 metre endpoint gap come from the supplied records. These assertions do not independently solve continuous run clearance or discipline performance.
 * @evidence contracts/testing.md#distinguishing-cases Covers unknown systems/ports, self and foreign-system joins, reversed and bidirectional ports, null versus mismatched section, empty/single/repeated/nonfinite routes, zero radius and nonfinite section with valid fixture twins; counts are asserted only in the cases that explicitly pin them, and sleeve/maintenance rules belong to adjacent units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous portable unit calls maintained Engine validation through the existing service fixture and declares every mutation locally, without a browser, renderer, process, native artifact or dynamically registered cases.
 */
export function test_service_run_defects(): void {
  const clean: IAutoMovieServiceNetwork = serviceNetwork();

  const foreignSystem: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        system: "steam",
      }),
    ),
  );
  TestValidator.equals(
    "a run on an unknown system takes its ports down with it",
    namedFacts([
      [
        "system",
        (): boolean =>
          hasViolation(foreignSystem, "type", "$input.segments[0].system"),
      ],
      [
        "from",
        (): boolean =>
          hasViolation(foreignSystem, "type", "$input.segments[0].from"),
      ],
      [
        "to",
        (): boolean =>
          hasViolation(foreignSystem, "type", "$input.segments[0].to"),
      ],
      [
        "valveOrphaned",
        (): boolean => hasViolation(foreignSystem, "type", "$input.nodes[8]"),
      ],
      [
        "basinOrphaned",
        (): boolean => hasViolation(foreignSystem, "type", "$input.nodes[9]"),
      ],
      ["exactly", (): boolean => violationCount(foreignSystem) === 5],
    ]),
    {
      system: true,
      from: true,
      to: true,
      valveOrphaned: true,
      basinOrphaned: true,
      exactly: true,
    },
  );

  const ghostPorts: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        from: "ghost",
        to: "phantom",
      }),
    ),
  );
  TestValidator.equals(
    "ports that do not resolve are refused, and their fittings become stubs",
    namedFacts([
      [
        "from",
        (): boolean =>
          hasViolation(ghostPorts, "type", "$input.segments[0].from"),
      ],
      [
        "to",
        (): boolean =>
          hasViolation(ghostPorts, "type", "$input.segments[0].to"),
      ],
      [
        "emitterStub",
        (): boolean =>
          hasViolation(ghostPorts, "type", "$input.nodes[0].ports[0]"),
      ],
      [
        "consumerStub",
        (): boolean =>
          hasViolation(ghostPorts, "type", "$input.nodes[8].ports[0]"),
      ],
    ]),
    { from: true, to: true, emitterStub: true, consumerStub: true },
  );

  const loop: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        to: "cold-main-out",
      }),
    ),
  );
  const foreignPort: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-branch",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        to: "basin-hot",
      }),
    ),
  );
  TestValidator.equals(
    "a run joins two different ports of its own system",
    namedFacts([
      [
        "loop",
        (): boolean => hasViolation(loop, "type", "$input.segments[0].to"),
      ],
      [
        "foreign",
        (): boolean =>
          hasViolation(foreignPort, "type", "$input.segments[1].to"),
      ],
    ]),
    { loop: true, foreign: true },
  );

  const reversedEmitter: IAutoMovieValidation = refuse(
    withPort(
      clean,
      "cold-main-out",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        direction: "in",
      }),
    ),
  );
  const reversedConsumer: IAutoMovieValidation = refuse(
    withPort(
      clean,
      "bath-valve-in",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        direction: "out",
      }),
    ),
  );
  const ringTap: IAutoMovieValidation = refuse(
    withPort(
      clean,
      "bath-valve-in",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        direction: "bidirectional",
      }),
    ),
  );
  TestValidator.equals(
    "a run leaves an emitter and arrives at a consumer, and a ring tap is both",
    namedFacts([
      [
        "emitter",
        (): boolean =>
          hasViolation(reversedEmitter, "type", "$input.segments[0].from"),
      ],
      [
        "rootToo",
        (): boolean =>
          hasViolation(reversedEmitter, "type", "$input.systems[0].root"),
      ],
      [
        "consumer",
        (): boolean =>
          hasViolation(reversedConsumer, "type", "$input.segments[0].to") &&
          violationCount(reversedConsumer) === 1,
      ],
      ["bidirectional", (): boolean => ringTap.success === true],
    ]),
    { emitter: true, rootToo: true, consumer: true, bidirectional: true },
  );

  const section: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        section: 0.003,
      }),
    ),
  );
  TestValidator.equals(
    "a run's section answers to every port that states one",
    namedFacts([
      [
        "refused",
        (): boolean =>
          hasViolation(section, "range", "$input.segments[0].section"),
      ],
      ["bothEnds", (): boolean => violationCount(section) === 2],
      [
        "difference",
        (): boolean =>
          section.success === false &&
          section.violations.every(
            (item: IAutoMovieConstraintViolation): boolean =>
              nclose(item.overshoot ?? -1, 0.001, 1e-12),
          ),
      ],
      [
        "sectionlessPortImposesNothing",
        (): boolean =>
          clean.nodes[9]!.ports[3]!.section === null && refuse().success,
      ],
    ]),
    {
      refused: true,
      bothEnds: true,
      difference: true,
      sectionlessPortImposesNothing: true,
    },
  );

  const empty: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        route: [],
      }),
    ),
  );
  const single: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        route: [{ x: 8, y: 2.5, z: 1 }],
      }),
    ),
  );
  TestValidator.equals(
    "a route needs two points before it can be a line at all",
    namedFacts([
      [
        "empty",
        (): boolean =>
          hasViolation(empty, "range", "$input.segments[0].route") &&
          violationCount(empty) === 1,
      ],
      [
        "singleLength",
        (): boolean =>
          hasViolation(single, "range", "$input.segments[0].route"),
      ],
      [
        "singleGap",
        (): boolean =>
          hasViolation(single, "range", "$input.segments[0].route[0]"),
      ],
      ["singleExactly", (): boolean => violationCount(single) === 2],
    ]),
    {
      empty: true,
      singleLength: true,
      singleGap: true,
      singleExactly: true,
    },
  );

  const repeated: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        route: [
          { x: 8, y: 2.5, z: 1 },
          { x: 8, y: 2.5, z: 1 },
          { x: 3.5, y: 2.5, z: 1 },
        ],
      }),
    ),
  );
  const infinite: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        route: [
          { x: 8, y: 2.5, z: 1 },
          { x: Number.NaN, y: 2.5, z: 1 },
          { x: 3.5, y: 2.5, z: 1 },
        ],
      }),
    ),
  );
  TestValidator.equals(
    "repeated and non-finite route points are refused where they stand",
    namedFacts([
      [
        "repeated",
        (): boolean =>
          hasViolation(repeated, "range", "$input.segments[0].route[1]") &&
          violationCount(repeated) === 1,
      ],
      [
        "nonFinite",
        (): boolean =>
          hasViolation(infinite, "range", "$input.segments[0].route[1].x") &&
          violationCount(infinite) === 1,
      ],
    ]),
    { repeated: true, nonFinite: true },
  );

  const shapeless: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        radius: 0,
        section: Number.NaN,
      }),
    ),
  );
  const drifted: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        route: [
          { x: 8, y: 2.5, z: 1 },
          { x: 3.5, y: 2.5, z: 1.25 },
        ],
      }),
    ),
  );
  TestValidator.equals(
    "a run states a real radius and section, and ends where it says it does",
    namedFacts([
      [
        "radius",
        (): boolean =>
          hasViolation(shapeless, "range", "$input.segments[0].radius"),
      ],
      [
        "section",
        (): boolean =>
          hasViolation(shapeless, "range", "$input.segments[0].section"),
      ],
      [
        "gap",
        (): boolean =>
          hasViolation(drifted, "range", "$input.segments[0].route[1]"),
      ],
      [
        "gapMeasured",
        (): boolean =>
          drifted.success === false &&
          drifted.violations.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              nclose(item.overshoot ?? -1, 0.25, 1e-12),
          ),
      ],
    ]),
    { radius: true, section: true, gap: true, gapMeasured: true },
  );
}
