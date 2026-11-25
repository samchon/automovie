import {
  FLUID_MAX_FLOWS,
  FLUID_MAX_SPRAYS,
  FLUID_MAX_SPRAY_PARTICLES,
  validateFluidDomain,
} from "@automovie/engine";
import type {
  IAutoMovieFluidDomain,
  IAutoMovieFluidDrain,
  IAutoMovieFluidSource,
  IAutoMovieFluidSpray,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "./predicates";

/**
 * Run the original array, solid occupancy, flow and spray admission cases
 * after the owning domain-validation entry's grid/solver/Courant cases.
 * Expected kinds, addresses and range boundaries come from the authored
 * domain contract; shared witnesses test path inclusion rather than full reports.
 * The discoverable owning entry retains its seven Scenarios and calls
 * this internal helper once with its existing source-data fixture functions.
 * This helper has no independently discoverable test entry or runtime host.
 */
export function runFluidDomainPopulationCases(props: {
  basin: (overrides?: Partial<IAutoMovieFluidDomain>) => IAutoMovieFluidDomain;
  source: (overrides?: Partial<IAutoMovieFluidSource>) => IAutoMovieFluidSource;
  drain: (overrides?: Partial<IAutoMovieFluidDrain>) => IAutoMovieFluidDrain;
  spray: (overrides?: Partial<IAutoMovieFluidSpray>) => IAutoMovieFluidSpray;
}): void {
  const { basin, source, drain, spray }: typeof props = props;
  const solid: boolean[] = new Array<boolean>(16).fill(false);
  solid[5] = true;
  const arrays: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      bed: [0, 0, 0],
      depth: [-0.1, 99, 0.25, 0.25],
      solid,
    }),
  });
  const wetPier: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({ solid, depth: new Array<number>(16).fill(0.25) }),
  });

  TestValidator.equals(
    "the state arrays must be one non-negative value per cell",
    namedFacts([
      ["bedLength", (): boolean => hasViolation(arrays, "type", "$input.bed")],
      [
        "depthLength",
        (): boolean => hasViolation(arrays, "type", "$input.depth"),
      ],
      [
        "depthNegative",
        (): boolean => hasViolation(arrays, "range", "$input.depth[0]"),
      ],
      [
        "depthTooDeep",
        (): boolean => hasViolation(arrays, "range", "$input.depth[1]"),
      ],
      [
        "wetPier",
        (): boolean => hasViolation(wetPier, "type", "$input.depth[5]"),
      ],
      [
        "solidLength",
        (): boolean =>
          hasViolation(
            validateFluidDomain({ domain: basin({ solid: [false] }) }),
            "type",
            "$input.solid",
          ),
      ],
    ]),
    {
      bedLength: true,
      depthLength: true,
      depthNegative: true,
      depthTooDeep: true,
      wetPier: true,
      solidLength: true,
    },
  );

  const flows: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      solid,
      sources: [
        source({ id: "first" }),
        source({ id: "jet" }),
        source({ id: "jet" }),
        source({ id: "off-lattice", column: 1.5, row: 1 }),
        source({ id: "negative", column: -1, row: 1 }),
        source({ id: "past-edge", column: 99, row: 1 }),
        source({ id: "row-past-edge", column: 1, row: 99 }),
        source({ id: "on-pier", column: 1, row: 1 }),
        source({ id: "backwards", flowRate: -1 }),
      ],
      drains: [
        drain({ id: "sill" }),
        drain({ id: "reverse", flowRate: -2 }),
        drain({ id: "backwards-window", start: 5, end: 1 }),
        drain({ id: "unstarted", start: -1 }),
      ],
    }),
  });
  const tooMany: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      sources: Array.from(
        { length: FLUID_MAX_FLOWS + 1 },
        (_: unknown, at: number): ReturnType<typeof source> =>
          source({ id: `jet-${at}` }),
      ),
      drains: Array.from(
        { length: FLUID_MAX_FLOWS + 1 },
        (_: unknown, at: number): ReturnType<typeof drain> =>
          drain({ id: `drain-${at}` }),
      ),
      sprays: Array.from(
        { length: FLUID_MAX_SPRAYS + 1 },
        (_: unknown, at: number): ReturnType<typeof spray> =>
          spray({ id: `mist-${at}` }),
      ),
    }),
  });
  TestValidator.equals(
    "a declared flow must name itself, land on water, and open sanely",
    namedFacts([
      [
        "duplicateId",
        (): boolean => hasViolation(flows, "type", "$input.sources[2].id"),
      ],
      [
        "fractionalColumn",
        (): boolean => hasViolation(flows, "type", "$input.sources[3].column"),
      ],
      [
        "negativeColumn",
        (): boolean => hasViolation(flows, "type", "$input.sources[4].column"),
      ],
      [
        "columnPastEdge",
        (): boolean => hasViolation(flows, "type", "$input.sources[5].column"),
      ],
      [
        "rowPastEdge",
        (): boolean => hasViolation(flows, "type", "$input.sources[6].row"),
      ],
      [
        "onPier",
        (): boolean => hasViolation(flows, "type", "$input.sources[7]"),
      ],
      [
        "negativeRate",
        (): boolean =>
          hasViolation(flows, "range", "$input.sources[8].flowRate"),
      ],
      [
        "drainRate",
        (): boolean =>
          hasViolation(flows, "range", "$input.drains[1].flowRate"),
      ],
      [
        "backwardsWindow",
        (): boolean => hasViolation(flows, "range", "$input.drains[2].end"),
      ],
      [
        "negativeStart",
        (): boolean => hasViolation(flows, "range", "$input.drains[3].start"),
      ],
      [
        "sourceBudget",
        (): boolean => hasViolation(tooMany, "range", "$input.sources"),
      ],
      [
        "drainBudget",
        (): boolean => hasViolation(tooMany, "range", "$input.drains"),
      ],
      [
        "sprayBudget",
        (): boolean => hasViolation(tooMany, "range", "$input.sprays"),
      ],
    ]),
    {
      duplicateId: true,
      fractionalColumn: true,
      negativeColumn: true,
      columnPastEdge: true,
      rowPastEdge: true,
      onPier: true,
      negativeRate: true,
      drainRate: true,
      backwardsWindow: true,
      negativeStart: true,
      sourceBudget: true,
      drainBudget: true,
      sprayBudget: true,
    },
  );

  const mists: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      sprays: [
        spray({
          id: "broken",
          rate: 0,
          lifetime: 0,
          speed: -1,
          spread: 2,
          size: 0,
          lodDistance: 0,
          maxParticles: FLUID_MAX_SPRAY_PARTICLES + 1,
          seed: 1.5,
          direction: { x: 0, y: 0, z: 0 },
        }),
        spray({ id: "under", spread: -0.5, maxParticles: 0 }),
      ],
    }),
  });
  TestValidator.equals(
    "a spray emitter must describe a bounded, launchable jet",
    namedFacts([
      [
        "rate",
        (): boolean => hasViolation(mists, "range", "$input.sprays[0].rate"),
      ],
      [
        "lifetime",
        (): boolean =>
          hasViolation(mists, "range", "$input.sprays[0].lifetime"),
      ],
      [
        "speed",
        (): boolean => hasViolation(mists, "range", "$input.sprays[0].speed"),
      ],
      [
        "spreadOver",
        (): boolean => hasViolation(mists, "range", "$input.sprays[0].spread"),
      ],
      [
        "size",
        (): boolean => hasViolation(mists, "range", "$input.sprays[0].size"),
      ],
      [
        "lod",
        (): boolean =>
          hasViolation(mists, "range", "$input.sprays[0].lodDistance"),
      ],
      [
        "capOver",
        (): boolean =>
          hasViolation(mists, "type", "$input.sprays[0].maxParticles"),
      ],
      [
        "seed",
        (): boolean => hasViolation(mists, "type", "$input.sprays[0].seed"),
      ],
      [
        "zeroAxis",
        (): boolean =>
          hasViolation(mists, "type", "$input.sprays[0].direction"),
      ],
      [
        "spreadUnder",
        (): boolean => hasViolation(mists, "range", "$input.sprays[1].spread"),
      ],
      [
        "capUnder",
        (): boolean =>
          hasViolation(mists, "type", "$input.sprays[1].maxParticles"),
      ],
    ]),
    {
      rate: true,
      lifetime: true,
      speed: true,
      spreadOver: true,
      size: true,
      lod: true,
      capOver: true,
      seed: true,
      zeroAxis: true,
      spreadUnder: true,
      capUnder: true,
    },
  );

  TestValidator.equals(
    "a tiny finite spray axis is still a direction",
    validateFluidDomain({
      domain: basin({
        sprays: [spray({ direction: { x: 1e-200, y: 0, z: 0 } })],
      }),
    }).success,
    true,
  );
}
