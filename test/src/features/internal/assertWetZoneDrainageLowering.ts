import { lowerWetZoneDrainage, validateFluidDomain } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieFluidDomain,
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieValidation,
  IAutoMovieWetZone,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "./predicates";
import { withNode, withPort, withZone } from "./serviceFixtures";

/** Run the original stranded drain, drainage lowering, stranded supply and refusal cases of test_service_wet_zone_drainage in order. The same clean/immersed networks, floor constructor and refusal closure are supplied; no extra test, fixture values or fluid integration is introduced. */
export function assertWetZoneDrainageLowering(
  clean: IAutoMovieServiceNetwork,
  basin: IAutoMovieServiceNetwork,
  bathFloor: (
    overrides?: Partial<IAutoMovieFluidDomain>,
  ) => IAutoMovieFluidDomain,
  refuse: (network?: IAutoMovieServiceNetwork) => IAutoMovieValidation,
): void {
  const strandedDrain: IAutoMovieValidation = refuse(
    withPort(
      clean,
      "gully-waste",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        system: "no-such-system",
      }),
    ),
  );
  TestValidator.equals(
    "a gully whose waste port names no system discharges into nothing",
    namedFacts([
      ["refused", () => strandedDrain.success === false],
      [
        "atDrain",
        () =>
          // The `success` comparison is restated only to narrow the union
          // inside this closure.
          strandedDrain.success === false &&
          strandedDrain.violations.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              item.path === "$input.zones[0].drains[0]" &&
              item.expected.includes("carries no outgoing waste-water port"),
          ),
      ],
    ]),
    { refused: true, atDrain: true },
  );

  const lowered: IAutoMovieFluidDomain = lowerWetZoneDrainage({
    network: clean,
    zone: "bath-zone",
    domain: bathFloor(),
  });
  TestValidator.equals(
    "the room's plumbing becomes an independent domain's own sources and drains",
    namedFacts([
      [
        "sourceIds",
        () =>
          lowered.sources
            .map(
              (entry: IAutoMovieFluidDomain["sources"][number]): string =>
                entry.id,
            )
            .join() ===
          "rain,bath-zone/bath-valve-in,bath-zone/basin-cold,bath-zone/basin-hot",
      ],
      [
        "valveCell",
        () => lowered.sources[1]!.column === 3 && lowered.sources[1]!.row === 1,
      ],
      [
        "basinCell",
        () => lowered.sources[2]!.column === 1 && lowered.sources[2]!.row === 1,
      ],
      ["supplyRate", () => nclose(lowered.sources[2]!.flowRate, 0.0002, 1e-15)],
      [
        "drainIds",
        () =>
          lowered.drains
            .map(
              (entry: IAutoMovieFluidDomain["drains"][number]): string =>
                entry.id,
            )
            .join() === "bath-zone/gully-waste",
      ],
      [
        "drainCell",
        () => lowered.drains[0]!.column === 2 && lowered.drains[0]!.row === 3,
      ],
      ["drainRate", () => nclose(lowered.drains[0]!.flowRate, 0.0006, 1e-15)],
      ["sill", () => nclose(lowered.drains[0]!.sillLevel, 0.125, 1e-15)],
      ["opensAtOnce", () => nclose(lowered.drains[0]!.start, 0, 0)],
      ["neverCloses", () => lowered.drains[0]!.end === null],
      ["stillValid", () => validateFluidDomain({ domain: lowered }).success],
      [
        "latticeUntouched",
        () => lowered.grid === bathFloor().grid || lowered.grid.columns === 4,
      ],
      [
        "gradeIsNotHydraulic",
        () => {
          const deeper: IAutoMovieFluidDomain = lowerWetZoneDrainage({
            network: basin,
            zone: "bath-zone",
            domain: bathFloor(),
          });
          return (
            deeper.sources
              .map(
                (entry: IAutoMovieFluidDomain["sources"][number]): string =>
                  entry.id,
              )
              .join() ===
              lowered.sources
                .map(
                  (entry: IAutoMovieFluidDomain["sources"][number]): string =>
                    entry.id,
                )
                .join() &&
            deeper.drains
              .map(
                (entry: IAutoMovieFluidDomain["drains"][number]): string =>
                  entry.id,
              )
              .join() ===
              lowered.drains
                .map(
                  (entry: IAutoMovieFluidDomain["drains"][number]): string =>
                    entry.id,
                )
                .join()
          );
        },
      ],
    ]),
    {
      sourceIds: true,
      valveCell: true,
      basinCell: true,
      supplyRate: true,
      drainIds: true,
      drainCell: true,
      drainRate: true,
      sill: true,
      opensAtOnce: true,
      neverCloses: true,
      stillValid: true,
      latticeUntouched: true,
      gradeIsNotHydraulic: true,
    },
  );

  const strandedSupply: IAutoMovieFluidDomain = lowerWetZoneDrainage({
    network: withPort(
      clean,
      "basin-cold",
      (entry: IAutoMovieServicePort): IAutoMovieServicePort => ({
        ...entry,
        system: "no-such-system",
      }),
    ),
    zone: "bath-zone",
    domain: bathFloor(),
  });
  TestValidator.equals(
    "a supply port naming no system delivers nothing the domain can count",
    strandedSupply.sources
      .map(
        (entry: IAutoMovieFluidDomain["sources"][number]): string => entry.id,
      )
      .join(),
    "rain,bath-zone/bath-valve-in,bath-zone/basin-hot",
  );

  TestValidator.equals(
    "the lowering refuses what it cannot honestly place",
    namedFacts([
      [
        "unknownZone",
        () =>
          throwsError(
            () =>
              lowerWetZoneDrainage({
                network: clean,
                zone: "no-such-zone",
                domain: bathFloor(),
              }),
            ['has no wet zone "no-such-zone"'],
          ),
      ],
      [
        "unknownDrain",
        () =>
          throwsError(
            () =>
              lowerWetZoneDrainage({
                network: withZone(
                  clean,
                  "bath-zone",
                  (zone: IAutoMovieWetZone): IAutoMovieWetZone => ({
                    ...zone,
                    drains: ["ghost"],
                  }),
                ),
                zone: "bath-zone",
                domain: bathFloor(),
              }),
            ['cites drain node "ghost"'],
          ),
      ],
      [
        "pastLattice",
        () =>
          throwsError(
            () =>
              lowerWetZoneDrainage({
                network: clean,
                zone: "bath-zone",
                domain: bathFloor({
                  grid: {
                    columns: 1,
                    rows: 1,
                    cellX: 1,
                    cellZ: 1,
                    origin: { x: 0, y: 0, z: 0 },
                  },
                }),
              }),
            ['node "bath-valve" stands off the lattice'],
          ),
      ],
      [
        "beforeLattice",
        () =>
          throwsError(
            () =>
              lowerWetZoneDrainage({
                network: clean,
                zone: "bath-zone",
                domain: bathFloor({
                  grid: {
                    columns: 4,
                    rows: 5,
                    cellX: 1,
                    cellZ: 1,
                    origin: { x: 5, y: 0, z: 5 },
                  },
                }),
              }),
            ["stands off the lattice"],
          ),
      ],
      [
        "nonFinite",
        () =>
          throwsError(
            () =>
              lowerWetZoneDrainage({
                network: withNode(
                  clean,
                  "bath-valve",
                  (entry: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
                    ...entry,
                    position: { x: Number.NaN, y: 2.5, z: 1 },
                  }),
                ),
                zone: "bath-zone",
                domain: bathFloor(),
              }),
            ["stands off the lattice"],
          ),
      ],
      [
        "sourceCollision",
        () =>
          throwsError(
            () =>
              lowerWetZoneDrainage({
                network: clean,
                zone: "bath-zone",
                domain: bathFloor({
                  sources: [
                    {
                      id: "bath-zone/basin-cold",
                      column: 0,
                      row: 0,
                      flowRate: 0,
                      start: 0,
                      end: null,
                    },
                  ],
                }),
              }),
            ['already declares a source named "bath-zone/basin-cold"'],
          ),
      ],
      [
        "drainCollision",
        () =>
          throwsError(
            () =>
              lowerWetZoneDrainage({
                network: clean,
                zone: "bath-zone",
                domain: bathFloor({
                  drains: [
                    {
                      id: "bath-zone/gully-waste",
                      column: 0,
                      row: 0,
                      flowRate: 0,
                      sillLevel: 0,
                      start: 0,
                      end: null,
                    },
                  ],
                }),
              }),
            ['already declares a drain named "bath-zone/gully-waste"'],
          ),
      ],
    ]),
    {
      unknownZone: true,
      unknownDrain: true,
      pastLattice: true,
      beforeLattice: true,
      nonFinite: true,
      sourceCollision: true,
      drainCollision: true,
    },
  );
}
