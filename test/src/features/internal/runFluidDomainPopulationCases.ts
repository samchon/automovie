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
 * Run the original array, solid flag, boundary, flow and spray admission cases
 * after the owning domain-validation entry's schema/grid/solver/Courant cases.
 * Expected kinds, addresses and finite/range boundaries come from the authored
 * domain contract; shared witnesses test path inclusion rather than full reports.
 * The discoverable owning entry retains the original nine Scenarios and calls
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
      bed: [Number.NaN, 0, 0],
      depth: [-0.1, 99, 0.25, 0.25],
      solid,
    }),
  });
  const wetPier: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({ solid, depth: new Array<number>(16).fill(0.25) }),
  });
  // A flag that is neither `true` nor `false` answers "no" to both readers of
  // it, so the solver would push water through a pier the surface refuses to
  // draw around. The sibling cell one index away is the twin: it is a real
  // boolean, and nothing is reported about it.
  const flags: unknown[] = new Array<boolean>(16).fill(false);
  flags[7] = 1;
  const flagged: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({ solid: flags as boolean[] }),
  });
  TestValidator.equals(
    "the state arrays must be one finite, non-negative value per cell",
    namedFacts([
      ["bedLength", (): boolean => hasViolation(arrays, "type", "$input.bed")],
      [
        "bedFinite",
        (): boolean => hasViolation(arrays, "range", "$input.bed[0]"),
      ],
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
      [
        "solidFlag",
        (): boolean => hasViolation(flagged, "type", "$input.solid[7]"),
      ],
      [
        "solidFlagTwin",
        (): boolean =>
          hasViolation(flagged, "type", "$input.solid[6]") === false,
      ],
    ]),
    {
      bedLength: true,
      bedFinite: true,
      depthLength: true,
      depthNegative: true,
      depthTooDeep: true,
      wetPier: true,
      solidLength: true,
      solidFlag: true,
      solidFlagTwin: true,
    },
  );

  const edges: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      boundaries: {
        xMin: "leak" as unknown as "wall",
        xMax: "leak" as unknown as "wall",
        zMin: "leak" as unknown as "wall",
        zMax: "leak" as unknown as "wall",
      },
    }),
  });
  TestValidator.equals(
    "an unknown edge kind is refused on every edge",
    namedFacts([
      [
        "xMin",
        (): boolean => hasViolation(edges, "type", "$input.boundaries.xMin"),
      ],
      [
        "xMax",
        (): boolean => hasViolation(edges, "type", "$input.boundaries.xMax"),
      ],
      [
        "zMin",
        (): boolean => hasViolation(edges, "type", "$input.boundaries.zMin"),
      ],
      [
        "zMax",
        (): boolean => hasViolation(edges, "type", "$input.boundaries.zMax"),
      ],
    ]),
    { xMin: true, xMax: true, zMin: true, zMax: true },
  );

  const flows: ReturnType<typeof validateFluidDomain> = validateFluidDomain({
    domain: basin({
      solid,
      sources: [
        source({ id: " " }),
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
        drain({ id: "sill", sillLevel: Number.NaN }),
        drain({ id: "reverse", flowRate: -2 }),
        drain({ id: "backwards-window", start: 5, end: 1 }),
        drain({ id: "unstarted", start: -1 }),
        drain({ id: "non-finite-end", end: Number.POSITIVE_INFINITY }),
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
        "emptyId",
        (): boolean => hasViolation(flows, "type", "$input.sources[0].id"),
      ],
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
        "sill",
        (): boolean =>
          hasViolation(flows, "range", "$input.drains[0].sillLevel"),
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
        "nonFiniteEnd",
        (): boolean => hasViolation(flows, "range", "$input.drains[4].end"),
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
      emptyId: true,
      duplicateId: true,
      fractionalColumn: true,
      negativeColumn: true,
      columnPastEdge: true,
      rowPastEdge: true,
      onPier: true,
      negativeRate: true,
      sill: true,
      drainRate: true,
      backwardsWindow: true,
      negativeStart: true,
      nonFiniteEnd: true,
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
        spray({ id: "nan-axis", direction: { x: Number.NaN, y: 1, z: 0 } }),
        spray({ id: "nan-y", direction: { x: 0, y: Number.NaN, z: 0 } }),
        spray({ id: "nan-z", direction: { x: 0, y: 1, z: Number.NaN } }),
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
      [
        "nanX",
        (): boolean =>
          hasViolation(mists, "type", "$input.sprays[2].direction"),
      ],
      [
        "nanY",
        (): boolean =>
          hasViolation(mists, "type", "$input.sprays[3].direction"),
      ],
      [
        "nanZ",
        (): boolean =>
          hasViolation(mists, "type", "$input.sprays[4].direction"),
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
      nanX: true,
      nanY: true,
      nanZ: true,
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
