import { AutoMovieEngineService } from "@automovie/engine";
import type {
  AutoMovieServiceUnit,
  IAutoMovieFluidDomain,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";
import {
  node,
  port,
  serviceNetwork,
  system,
  wetZone,
} from "../internal/serviceFixtures";

/**
 * Wet-zone supplies require volumetric demand before lowering into fluid sources.
 *
 * Scenarios:
 * 1. Nonvolumetric system units, port units or both reject for each supported incompatible unit.
 * 2. Volumetric cold-water and other media retain their declared positive or zero demand.
 * 3. Ports outside the selected room, outgoing ports and nonplumbing systems remain unselected.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which selected units refuse, which media remain supported and which adjacent inputs must remain unselected.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public lowerWetZoneDrainage and observes Error refusals, the derived source id/cell/rate and preservation of the authored source and input source count. It catches treating power, current, bandwidth or dimensionless demand as fluid volume.
 * @evidence contracts/development/testing.md#independent-expectations A fluid source measures cubic metres per second; the other four supported service units cannot be copied into that quantity. A node at half a metre on a one-metre single-cell grid belongs to cell zero, and lowering must preserve the authored demand without conversion. Zero tolerance checks copied values rather than a fluid simulation.
 * @evidence contracts/development/testing.md#distinguishing-cases Independently changes port and system units, includes equal incompatible units with medium other, positive/zero volumetric demand and three nonselected neighbors. Existing wet-zone drainage tests own drains, lattice failures, id collisions and full network admission.
 * @evidence contracts/development/testing.md#execution-ownership This named synchronous unit supplies an in-memory domain and uses existing service fixture factories; it invokes no solver, process, renderer or foreign override.
 */
export function test_service_wet_zone_supply_units(): void {
  const domain: IAutoMovieFluidDomain = {
    version: 1,
    id: "unit-floor",
    units: "meter",
    grid: {
      columns: 1,
      rows: 1,
      cellX: 1,
      cellZ: 1,
      origin: { x: 0, y: 0, z: 0 },
    },
    solver: {
      fixedStepSeconds: 0.0625,
      gravity: 8,
      drag: 0,
      dryDepth: 0,
      referenceDepth: 0.5,
      maxSteps: 100,
    },
    boundaries: { xMin: "wall", xMax: "wall", zMin: "wall", zMax: "wall" },
    bed: [0],
    depth: [0],
    solid: [false],
    sources: [
      {
        id: "authored",
        column: 0,
        row: 0,
        flowRate: 0.001,
        start: 0,
        end: null,
      },
    ],
    drains: [],
    sprays: [],
  };

  /** Isolate the supply projection while preserving the shared service record defaults. */
  const lower: (
    supply: IAutoMovieServiceSystem,
    inlet: IAutoMovieServicePort,
    placement?: Partial<IAutoMovieServiceNode>,
  ) => IAutoMovieFluidDomain = (
    supply: IAutoMovieServiceSystem,
    inlet: IAutoMovieServicePort,
    placement: Partial<IAutoMovieServiceNode> = {},
  ): IAutoMovieFluidDomain =>
    AutoMovieEngineService.lowerWetZoneDrainage({
      network: serviceNetwork({
        systems: [supply],
        nodes: [
          node({
            position: { x: 0.5, y: 0, z: 0.5 },
            ports: [inlet],
            ...placement,
          }),
        ],
        segments: [],
        penetrations: [],
        zones: [wetZone()],
      }),
      zone: "zone",
      domain,
    });
  const incompatible: AutoMovieServiceUnit[] = [
    "watt",
    "ampere",
    "bit-per-second",
    "dimensionless",
  ];
  const failures: string[] = [];

  for (const unit of incompatible)
    for (const changed of ["system", "port", "both"] as const)
      if (
        !throwsError(
          (): IAutoMovieFluidDomain =>
            lower(
              system({
                medium: "other",
                unit: changed === "port" ? "cubic-meter-per-second" : unit,
              }),
              port({
                medium: "other",
                unit: changed === "system" ? "cubic-meter-per-second" : unit,
                demand: 0.002,
              }),
            ),
          ["port", "cubic-meter-per-second"],
        )
      )
        failures.push(`${changed} unit ${unit} was admitted`);

  for (const medium of ["cold-water", "other"] as const)
    for (const demand of [0, 0.002]) {
      try {
        const lowered: IAutoMovieFluidDomain = lower(
          system({ medium }),
          port({ medium, demand }),
        );
        const source: IAutoMovieFluidDomain["sources"][number] | undefined =
          lowered.sources[1];
        if (
          lowered.sources.length !== 2 ||
          lowered.sources[0] !== domain.sources[0] ||
          source === undefined ||
          source.id !== "zone/port" ||
          source.column !== 0 ||
          source.row !== 0 ||
          !nclose(source.flowRate, demand, 0) ||
          !nclose(source.start, 0, 0) ||
          source.end !== null ||
          domain.sources.length !== 1
        )
          failures.push(`${medium} volumetric demand ${demand}`);
      } catch (error) {
        failures.push(`valid volumetric supply: ${String(error)}`);
      }
    }

  for (const excluded of ["room", "direction", "discipline"] as const) {
    try {
      const lowered: IAutoMovieFluidDomain = lower(
        system({
          discipline: excluded === "discipline" ? "electrical" : "plumbing",
          medium: "other",
          unit: "watt",
        }),
        port({
          medium: "other",
          unit: "watt",
          direction: excluded === "direction" ? "out" : "in",
        }),
        excluded === "room" ? { space: "another-room" } : {},
      );
      if (
        lowered.sources.length !== 1 ||
        lowered.sources[0] !== domain.sources[0]
      )
        failures.push(`unselected ${excluded} produced a source`);
    } catch (error) {
      failures.push(`unselected ${excluded} refused: ${String(error)}`);
    }
  }

  TestValidator.predicate(
    `wet-zone supply units: ${failures.join("; ")}`,
    failures.length === 0,
  );
}
