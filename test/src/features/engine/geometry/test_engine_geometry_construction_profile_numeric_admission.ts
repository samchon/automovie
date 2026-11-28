import {
  AutoMovieEngineConstruction,
  AutoMovieEngineConstructionProfile,
  AutoMovieEngineConstructionProfileGrid,
  AutoMovieEngineLoftAdmissionError,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionProfileSource,
  IAutoMovieLoftChain,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Admit numeric addresses and source readings of an original piecewise profile,
 * then read finite station, derivative and inspection results.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the authored and queried addresses, borrowed original callbacks, world derivative orders and sampling counts verified by the test.
 * @evidence contracts/development/testing.md#behavioral-verification Runs profile preparation and its returned readers, the original grid builder, and the public inspection sampler with finite controls and malformed or unrepresentable operands. Verifies named admission errors, false or null where the reader returns an absence, and source exception identity.
 * @evidence contracts/development/testing.md#independent-expectations A radius-two circle makes one turn in four original clock units. At its quarter turn the point is two millimetres along the frame's z direction, its tangent is minus four pi along x per normalized coordinate, and its second derivative is minus eight pi squared along z. The inspection fixture converts ten millimetres to 0.01 metres on a straight tube.
 */
export function test_engine_geometry_construction_profile_numeric_admission(): void {
  const problems: string[] = [];
  const check = (description: string, holds: boolean): void => {
    if (!holds) problems.push(description);
  };
  const refuses = (
    description: string,
    read: () => unknown,
    reason: string,
  ): void => {
    let caught: unknown;
    try {
      read();
    } catch (error) {
      caught = error;
    }
    check(
      description,
      caught instanceof AutoMovieEngineLoftAdmissionError &&
        caught.message.includes(reason),
    );
  };
  const close = (value: number, expected: number): boolean =>
    Math.abs(value - expected) < 1e-12;
  const point = (_station: number, clock: number): [number, number] => {
    const angle = (Math.PI / 2) * clock;
    return [2 * Math.cos(angle), 2 * Math.sin(angle)];
  };
  const phase: NonNullable<
    IAutoMovieConstructionProfileSource.ICurve["phase"]
  > = (station, clock) => {
    const p = point(station, clock);
    return {
      p,
      t: [-(Math.PI / 2) * p[1], (Math.PI / 2) * p[0]],
      tt: [-(Math.PI ** 2 / 4) * p[0], -(Math.PI ** 2 / 4) * p[1]],
    };
  };
  const curve: IAutoMovieConstructionProfileSource.ICurve = {
    domain: [-1, 3],
    clock: [0, 4],
    period: 4,
    point,
    phase,
    jet: (station, clock) => {
      const reading = phase(station, clock)!;
      return { ...reading, tt: reading.tt!, s: [0, 0], ss: [0, 0], st: [0, 0] };
    },
  };
  const source: IAutoMovieConstructionProfileSource = {
    definition: {
      name: "circle",
      domain: [0, 0.002],
      plane: "plane",
      loops: [
        {
          id: "outer",
          kind: "outer",
          orientation: 1,
          domain: [0, 0.002],
          pieces: [
            {
              id: "ring",
              source: "original",
              clock: [0, 4],
              direction: 1,
              branch: "outer",
            },
          ],
        },
      ],
      guides: [{ id: "front", piece: "ring", clock: 0 }],
      regions: [
        {
          id: "skin",
          logicalParts: ["circle"],
          pieces: ["ring"],
          material: "material",
          binding: "binding",
        },
      ],
      revisions: {
        source: "source",
        constraints: "constraints",
        topology: "topology",
      },
    },
    plane: {
      id: "plane",
      axis: {
        at: (station) => ({
          origin: [3, station, 5],
          u: [1, 0, 0],
          v: [0, 0, 1],
        }),
      },
    },
    curves: new Map([["original", curve]]),
  };
  const withCurve = (
    change: Partial<IAutoMovieConstructionProfileSource.ICurve>,
  ): IAutoMovieConstructionProfileSource => ({
    ...source,
    curves: new Map([["original", { ...curve, ...change }]]),
  });
  const prepare = AutoMovieEngineConstructionProfile.create;
  const valid = prepare(source);
  const retained = valid.surfaces.get("ring")!;
  const original = valid.originals.get("ring")!;
  const cardinal = valid.phase("ring", 1, 0.25);
  check(
    "closed physical interval section endpoints",
    valid.section(0)[0] === "outer" && valid.section(2)[0] === "outer",
  );
  check(
    "independent cardinal millimetres and phase derivatives",
    close(cardinal.p[0], 3) &&
      cardinal.p[1] === 1 &&
      close(cardinal.p[2], 7) &&
      close(cardinal.t[0], -4 * Math.PI) &&
      cardinal.t[1] === 0 &&
      close(cardinal.t[2], 0) &&
      cardinal.tt !== null &&
      close(cardinal.tt[0], 0) &&
      cardinal.tt[1] === 0 &&
      close(cardinal.tt[2], -8 * Math.PI ** 2),
  );
  const alias = retained.point!(0, 1.25);
  check(
    "finite periodic alias remains readable",
    valid.atlas.kept(0, 0, 1.25) &&
      close(alias[0]!, 3) &&
      alias[1] === 0 &&
      close(alias[2]!, 7),
  );
  check(
    "retained membership includes both finite chart corners",
    valid.contains("skin", "ring", 0, 0) &&
      valid.contains("skin", "ring", 2, 1),
  );
  check(
    "finite original station beyond retained end",
    original.point!(3, 0)[1] === 3,
  );
  check(
    "finite nonperiodic next boundary maps to first clock",
    prepare(withCurve({ period: undefined })).atlas.across(0, 1, 1.1)?.v === 0,
  );
  const grid = AutoMovieEngineConstructionProfileGrid.create(valid, 0.25);
  check(
    "finite grid keeps both endpoints and the quarter mark",
    grid.length === 1 &&
      grid[0]!.stations[0] === 0 &&
      grid[0]!.stations.at(-1) === 2 &&
      grid[0]!.phases.get("ring")!.includes(0.25),
  );
  const nullable = prepare(
    withCurve({ phase: () => ({ p: [2, 0], t: [0, Math.PI], tt: null }) }),
  );
  check(
    "null second derivative remains available as null",
    nullable.phase("ring", 1, 0).tt === null &&
      nullable.phase("ring", 1, 0).t[2] === 4 * Math.PI,
  );

  for (const domain of [
    [0, Infinity],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
    [0, Number.MAX_VALUE],
  ] as const)
    refuses(
      "unrepresentable retained millimetre domain " + domain,
      () =>
        prepare({
          ...source,
          definition: { ...source.definition, domain: [...domain] },
        }),
      "finite retained domain",
    );
  refuses(
    "nonfinite guide clock",
    () =>
      prepare({
        ...source,
        definition: {
          ...source.definition,
          guides: [{ id: "front", piece: "ring", clock: NaN }],
        },
      }),
    "Original guide front",
  );
  refuses(
    "nonfinite borrowed original period",
    () => prepare(withCurve({ period: Infinity })),
    "finite positive declared period",
  );
  const bounded = prepare(withCurve({ period: undefined }));
  for (const value of [NaN, Infinity, -Infinity]) {
    const suffix = " " + value;
    refuses(
      "nonfinite section station" + suffix,
      () => valid.section(value),
      "outside its retained domain",
    );
    refuses(
      "nonfinite phase station" + suffix,
      () => valid.phase("ring", value, 0),
      "outside its actual piece chart",
    );
    refuses(
      "nonfinite normalized phase coordinate" + suffix,
      () => valid.phase("ring", 1, value),
      "outside its actual piece chart",
    );
    refuses(
      "nonfinite original clock query" + suffix,
      () => original.point!(1, value),
      "outside its actual chart",
    );
    check(
      "region rejects nonfinite normalized coordinate" + suffix,
      !valid.contains("skin", "ring", 1, value),
    );
    check(
      "periodic atlas excludes nonfinite clock" + suffix,
      !valid.atlas.kept(0, 1, value),
    );
    check(
      "atlas has no neighbor for nonfinite clock" + suffix,
      bounded.atlas.across(0, 1, value) === null,
    );
    check(
      "atlas has no neighbor for nonfinite station" + suffix,
      bounded.atlas.across(0, value, 1.1) === null,
    );
  }

  const invalidPoint = prepare(withCurve({ point: () => [NaN, 0] }));
  refuses(
    "nonfinite actual point",
    () => invalidPoint.surfaces.get("ring")!.point!(1, 0),
    "two finite local components",
  );
  refuses(
    "nonfinite endpoints cannot close a section",
    () => invalidPoint.section(1),
    "two finite local components",
  );
  const invalidPhase = prepare(
    withCurve({
      phase: () => ({ p: [2, 0], t: [NaN, 0], tt: null }),
    }),
  );
  refuses(
    "nonfinite actual phase tangent",
    () => invalidPhase.phase("ring", 1, 0),
    "two finite local components",
  );
  const overflow = prepare(
    withCurve({
      point: () => [Number.MAX_VALUE, 0],
      phase: () => ({ p: [2, 0], t: [Number.MAX_VALUE, 0], tt: null }),
    }),
  );
  refuses(
    "finite phase coefficients can overflow world derivatives",
    () => overflow.phase("ring", 1, 0),
    "unrepresentable world result",
  );
  const invalidFrame = prepare({
    ...source,
    plane: {
      id: "plane",
      axis: {
        at: (station) => ({
          origin: [3, station, 5],
          u: [NaN, 0, 0],
          v: [0, 0, 1],
        }),
      },
    },
  });
  refuses(
    "phase rejects nonfinite frame components",
    () => invalidFrame.phase("ring", 1, 0),
    "finite components per plane vector",
  );
  refuses(
    "point rejects nonfinite frame components",
    () => invalidFrame.surfaces.get("ring")!.point!(1, 0),
    "nonfinite plane data",
  );
  const overflowingPoint = prepare({
    ...withCurve({ point: () => [Number.MAX_VALUE, 0] }),
    plane: {
      id: "plane",
      axis: {
        at: (station) => ({
          origin: [Number.MAX_VALUE, station, 5],
          u: [1, 0, 0],
          v: [0, 0, 1],
        }),
      },
    },
  });
  refuses(
    "finite point operands can overflow world millimetres",
    () => overflowingPoint.surfaces.get("ring")!.point!(1, 0),
    "point is not representable",
  );
  const narrowClock: [number, number] = [0, Number.MIN_VALUE];
  refuses(
    "finite source period and width can overflow the normalized period",
    () => {
      const tiny = withCurve({ period: 4, clock: narrowClock });
      prepare({
        ...tiny,
        definition: {
          ...tiny.definition,
          loops: tiny.definition.loops.map((loop) => ({
            ...loop,
            pieces: loop.pieces.map((piece) => ({
              ...piece,
              clock: narrowClock,
            })),
          })),
        },
      });
    },
    "period is not representable",
  );
  const fallback = prepare(withCurve({ phase: undefined })).phase(
    "ring",
    1,
    0.25,
  );
  check(
    "missing phase callback keeps original jet fallback",
    close(fallback.t[0], -4 * Math.PI) &&
      close(fallback.tt![2], -8 * Math.PI ** 2),
  );
  const foreign = new Error("original point failure");
  const throwing = prepare(
    withCurve({
      point: () => {
        throw foreign;
      },
    }),
  );
  let seen: unknown;
  try {
    throwing.surfaces.get("ring")!.point!(1, 0);
  } catch (error) {
    seen = error;
  }
  check("foreign callback exception identity", seen === foreign);
  refuses(
    "grid requires finite tolerance",
    () => AutoMovieEngineConstructionProfileGrid.create(valid, Infinity),
    "finite positive millimetre chord tolerance",
  );

  const chain: IAutoMovieLoftChain = {
    name: "tube",
    order: 1,
    rule: "polar",
    samples: 8,
    layers: [
      { y: 0, coefficients: [10, 0, 0], slopes: [0, 0, 0] },
      { y: 20, coefficients: [10, 0, 0], slopes: [0, 0, 0] },
    ],
  };
  const curves = AutoMovieEngineConstruction.sampleConstructionCurves(
    {
      chains: [chain],
      surfaces: [
        {
          name: "tube",
          orientation: 1,
          domain: [0, 20],
          point: (station, angle) => [
            10 * Math.cos(angle),
            station,
            10 * Math.sin(angle),
          ],
          jet: (station, angle) => ({
            p: [10 * Math.cos(angle), station, 10 * Math.sin(angle)],
            u: [0, 1, 0],
            v: [-10 * Math.sin(angle), 0, 10 * Math.cos(angle)],
            uu: [0, 0, 0],
            uv: [0, 0, 0],
            vv: [-10 * Math.cos(angle), 0, -10 * Math.sin(angle)],
          }),
        },
      ],
      diagnostics: [],
    },
    { phases: 8, steps: 2 },
  );
  check(
    "inspection preserves seven curves and metre samples",
    curves.length === 7 &&
      curves[0]?.kind === "section" &&
      curves[0].points.length === 24 &&
      curves[0].points[0] === 0.01 &&
      curves[0].points[1] === 0 &&
      curves[0].points[2] === 0 &&
      curves[2]?.kind === "guide" &&
      curves[2].points[4] === 0.01 &&
      curves[6]?.kind === "axis" &&
      curves[6].points[7] === 0.02,
  );
  for (const options of [
    { steps: 1.5 },
    { steps: Infinity },
    { steps: 2 ** 53 },
    { phases: 2 ** 53 },
  ]) {
    let caught: unknown;
    try {
      AutoMovieEngineConstruction.sampleConstructionCurves(
        { chains: [], surfaces: [], diagnostics: [] },
        options,
      );
    } catch (error) {
      caught = error;
    }
    const field = options.steps === undefined ? "phases" : "steps";
    check(
      "sampling rejects invalid " +
        field +
        ": " +
        (options.steps ?? options.phases),
      caught instanceof Error &&
        caught.message.includes("sampleAutoMovieConstructionCurves: " + field),
    );
  }
  TestValidator.equals(
    "original profile numeric admission and finite controls",
    problems,
    [],
  );
}
