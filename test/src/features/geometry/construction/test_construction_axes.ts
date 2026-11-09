import {
  AutoMovieConstructionContinuation,
  type AutoMovieConstructionRealization,
  AutoMovieConstructionViews,
  AutoMovieLoftChain,
  type AutoMovieLoftFrame,
  AutoMovieLoftJet,
  AutoMovieViewAxis,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionOutlineParameter,
  IAutoMovieConstructionKnot,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/** World position or derivative triple in the current reader's units. */
type V3 = [number, number, number];

/**
 * The level axis on an origin course and the jointed axis place every section where their documents say.
 *
 * Scenarios:
 * 1. Level origin: a cylinder of radius 0.02 m on the level axis whose origin runs `x = 0.01 + 0.2 s`, `z = -0.005` over heights 0 to 0.1 m: every realized point at a station stands at that world height and the radius from the course's point, within the section spline's bound. Red: the same points read about a course 1 mm aside miss it.
 * 2. Jointed axis: a cylinder of radius 0.01 m along the course from (0, 0, 0) down to (0, 0, -0.1) and across to (0.1, 0, -0.1), its one turn of half length 0.02 m: the runs' set-back equals the turn's displacement read by an independent Simpson quadrature, the second run starts `2 h` after the first ends, a section in the second run is centred on that segment's line and lies square to it, and its points stand the radius from the centre. Red: runs read against a set-back of `h` (no corner cut) miss them.
 * 3. An explicit analytic moving plane is lofted through the public ViewLoft producer. Point, ring and Jet at non-layer stations retain that input law and both derivatives. Numeric frame copies preserve it; stale frames or JSON-stripped callbacks fail. All four continuation end pairings retain the host's complete signed boundary jet.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the level/jointed parts with `realizeAutoMovieConstruction` and the declared moving-plane source through `AutoMovieViewLoft.create`, then reads actual point/ring/jet consumers and continuation boundaries. It catches wrong course planes, station jets, lost copies or silently invalid source data; `AutoMovieViewAxis.runs` also checks joint placement.
 * @evidence contracts/development/testing.md#independent-expectations The level axis's document: the plane at height `s` with origin `(x(s), s, z(s))`, here a straight course a natural spline reproduces exactly. The jointed axis's document: straight segments, a turn by the quintic smoothstep of the angle over arclength `2 h`, symmetric about its corner, so its set-back `d` solves `D = d (a + b)` for the turn's displacement `D`, read here by composite Simpson on 4096 panels (independent of the kernel's Gauss-Legendre), error far under 1e-12 m. Original point limits remain the periodic cubic section spline's bound (`ConstructionChecks.polarSpline`) plus 1e-9 of the part's size for rounding. The added source consumer replays its declared analytic input and derivatives, using the existing view-section point allowance of 1e-9 mm for interpolation/product rounding; continuation compares the already-admitted host jet under the documented coordinate signs.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: a drifting level course, a right-angle jointed course, actual moving source planes, numeric copies and all continuation directions. Negative: the course read 1 mm aside, runs without the corner cut, a changed source frame and a source whose callable owner was stripped. Straight and numerical curved axes retain their other construction specs.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_axes`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Level origin: a cylinder of radius 0.02 m on the level axis whose origin runs `x = 0.01 + 0.2 s`, `z = -0.005` over heights 0 to 0.1 m:...).
 */
export function test_construction_axes(): void {
  const failures: string[] = [];
  failures.push(...level());
  failures.push(...jointed());
  failures.push(...sources());
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} axis failures:\n${failures.join("\n")}`,
    );
}

/** Actual source transfer, numeric-copy equivalence, explicit stale-source failure and all continuation end directions. */
function sources(): string[] {
  const failures: string[] = [];
  const build: (name: string, offset: number) => IAutoMovieLoftChain = (
    name: string,
    offset: number,
  ): IAutoMovieLoftChain => {
    const view: IAutoMovieConstructionView = ConstructionShapes.cylinder(
      name,
      ConstructionShapes.DOWN,
      0.003,
      0.1,
      6,
    );
    const part: IAutoMovieViewPart | string =
      AutoMovieConstructionViews.part(view);
    if (typeof part === "string") throw new Error(part);
    part.axis = {
      at: (station: number): AutoMovieLoftFrame.IFrame =>
        sourceJet(station, offset).value,
      jet: (
        station: number,
        parameter?: AutoMovieConstructionOutlineParameter,
      ): FrameJet | null =>
        parameter === undefined ? sourceJet(station, offset) : null,
    };
    const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    if (
      result.chain === null ||
      result.surface === null ||
      result.diagnostics.length !== 0
    )
      throw new Error(
        "source consumer failed: " + JSON.stringify(result.diagnostics),
      );
    return result.chain;
  };
  const host: IAutoMovieLoftChain = build("source.host", 0);
  for (const station of [7.3, 27.5, 63.4, 91.2]) {
    const source: FrameJet = sourceJet(station, 0);
    const actual: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(host, station, 0);
    const expected: V3[] = [source.value, source.first, source.second].map(
      (frame: AutoMovieLoftFrame.IFrame): V3 =>
        frame.origin.map(
          (value: number, k: number): number => value + 3 * frame.u[k]!,
        ) as V3,
    );
    closeVector(
      AutoMovieLoftChain.point(host, station, 0),
      expected[0]!,
      "actual point source",
      failures,
    );
    closeVector(
      AutoMovieLoftChain.ring(host, station, [0])[0]!,
      expected[0]!,
      "actual ring source",
      failures,
    );
    closeVector(actual.p, expected[0]!, "actual Jet value", failures);
    closeVector(actual.s, expected[1]!, "actual Jet first", failures);
    closeVector(actual.ss, expected[2]!, "actual Jet second", failures);
  }

  // Numeric frame copies keep the same explicit callable owner and geometry.
  const copy: IAutoMovieLoftChain = {
    ...host,
    layers: host.layers.map(
      (layer: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
        ...layer,
        coefficients: [...layer.coefficients],
        slopes: [...layer.slopes],
        curvatures: [...layer.curvatures!],
        frame: copyFrame(layer.frame!),
        frameSlopes: copyFrame(layer.frameSlopes!),
        frameCurvatures: copyFrame(layer.frameCurvatures!),
      }),
    ),
  };
  closeVector(
    AutoMovieLoftChain.point(copy, 7.3, 0),
    AutoMovieLoftChain.point(host, 7.3, 0),
    "numeric layer copy",
    failures,
  );
  const invalid: IAutoMovieLoftChain = {
    ...copy,
    layers: copy.layers.map(
      (
        layer: IAutoMovieLoftChain.ILayer,
        k: number,
      ): IAutoMovieLoftChain.ILayer =>
        k !== 0
          ? layer
          : {
              ...layer,
              frame: {
                ...layer.frame!,
                origin: [
                  layer.frame!.origin[0] + 1,
                  layer.frame!.origin[1],
                  layer.frame!.origin[2],
                ],
              },
            },
    ),
  };
  if (
    !fails((): void => {
      AutoMovieLoftChain.point(invalid, 7.3, 0);
    })
  )
    failures.push("changed source frame silently used another geometry");
  const stripped: IAutoMovieLoftChain = JSON.parse(
    JSON.stringify(host),
  ) as IAutoMovieLoftChain;
  if (
    !fails((): void => {
      AutoMovieLoftChain.point(stripped, 7.3, 0);
    })
  )
    failures.push("JSON-stripped callable source silently became a frame fit");

  const part: IAutoMovieLoftChain = build("source.part", 12);
  for (const hostEnd of ["bottom", "top"] as const)
    for (const partEnd of ["bottom", "top"] as const) {
      const continued: IAutoMovieLoftChain | string =
        AutoMovieConstructionContinuation.apply(host, hostEnd, part, partEnd);
      if (typeof continued === "string") {
        failures.push(continued);
        continue;
      }
      const direction: number = hostEnd === partEnd ? -1 : 1;
      const hs: number = hostEnd === "bottom" ? 0 : 100;
      const ps: number = partEnd === "bottom" ? 0 : 100;
      for (const phase of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        const owner: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
          host,
          hs,
          direction * phase,
        );
        const actual: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
          continued,
          ps,
          phase,
        );
        for (const [key, sign] of [
          ["p", 1],
          ["s", direction],
          ["t", direction],
          ["ss", 1],
          ["st", 1],
          ["tt", 1],
        ] as const)
          closeVector(
            actual[key],
            owner[key].map((value: number): number => sign * value) as V3,
            "continued source " + hostEnd + "/" + partEnd + "/" + key,
            failures,
          );
      }
    }
  return failures;
}

/** The explicit analytic input supplied to the production loft, not a sampled plane fit. */
function sourceJet(station: number, offset: number): FrameJet {
  const c: number = Math.cos(station / 50);
  const s: number = Math.sin(station / 50);
  return {
    value: {
      origin: [station + offset, (station * station) / 1000, offset],
      u: [0, c, s],
      v: [0, -s, c],
    },
    first: {
      origin: [1, station / 500, 0],
      u: [0, -s / 50, c / 50],
      v: [0, -c / 50, -s / 50],
    },
    second: {
      origin: [0, 1 / 500, 0],
      u: [0, -c / 2500, -s / 2500],
      v: [0, s / 2500, -c / 2500],
    },
  };
}

/** One actual axis value and both physical-station derivatives. */
type FrameJet = NonNullable<
  ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>>
>;

/** An independent numeric copy retains the axis owner but shares no frame triples. */
function copyFrame(
  frame: AutoMovieLoftFrame.IFrame,
): AutoMovieLoftFrame.IFrame {
  return { origin: [...frame.origin], u: [...frame.u], v: [...frame.v] };
}

/** The existing view-section point allowance, 1e-9 mm, also covers this bounded analytic source's interpolation/product rounding. */
function closeVector(
  actual: V3,
  expected: V3,
  label: string,
  failures: string[],
): void {
  if (
    !(
      Math.hypot(
        ...actual.map(
          (value: number, k: number): number => value - expected[k]!,
        ),
      ) <= 1e-9
    )
  )
    failures.push(
      label + ": " + actual.join(",") + " against " + expected.join(","),
    );
}

/** Invalid present source data must fail explicitly rather than select an unrelated frame interpolant. */
function fails(action: () => void): boolean {
  try {
    action();
    return false;
  } catch {
    return true;
  }
}

/** The level axis on a drifting origin course. */
function level(): string[] {
  const out: string[] = [];
  const r: number = 0.02;
  const course: (s: number) => [number, number] = (
    s: number,
  ): [number, number] => [0.01 + 0.2 * s, -0.005];
  const stations: number[] = ConstructionShapes.uniform(0, 0.1, 9);
  const tube: IAutoMovieConstructionView = ConstructionShapes.part(
    "column",
    ConstructionShapes.DOWN,
    stations,
    (): [number, number, number, number] => [r, r, r, r],
    "open",
  );
  tube.axis = {
    type: "level",
    origin: {
      x: {
        knots: stations.map(
          (s: number, i: number): IAutoMovieConstructionKnot => ({
            site: `x ${i}`,
            station: s,
            value: course(s)[0],
          }),
        ),
      },
      z: {
        knots: stations.map(
          (s: number, i: number): IAutoMovieConstructionKnot => ({
            site: `z ${i}`,
            station: s,
            value: course(s)[1],
          }),
        ),
      },
    },
  };
  const real: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: tube }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0)
    out.push(`level: diagnostics ${ConstructionRead.diagnostics(real)}`);
  const surface: IAutoMovieSolidSurface = ConstructionRead.metres(
    ConstructionRead.surface(real, "column"),
  );
  const bound: number =
    ConstructionChecks.polarSpline(r, r, tube.order) + 1e-9 * 0.1;
  const read: (shift: number) => string[] = (shift: number): string[] => {
    const misses: string[] = [];
    for (const s of stations)
      for (let k: number = 0; k < 32; k++) {
        const p: V3 = surface.jet(s, (2 * Math.PI * k) / 32).p as V3;
        const [x, z]: [number, number] = course(s);
        const height: number = Math.abs(p[1] - s);
        const radius: number = Math.abs(
          Math.hypot(p[0] - (x + shift), p[2] - z) - r,
        );
        if (!(height <= 1e-9 * 0.1 && radius <= bound))
          misses.push(
            `level station ${s} phase ${k}: height off ${height} m, radius off ${radius} m`,
          );
      }
    return misses;
  };
  out.push(...read(0));
  if (read(0.001).length === 0)
    out.push("level proof: points read about a course 1 mm aside stand on it");
  return out;
}

/** The jointed axis at a right-angle joint. */
function jointed(): string[] {
  const out: string[] = [];
  const r: number = 0.01;
  const h: number = 0.02;
  const centres: V3[] = [
    [0, 0, 0],
    [0, 0, -0.1],
    [0.1, 0, -0.1],
  ];
  const a: V3 = [0, 0, -1];
  const b: V3 = [1, 0, 0];

  // The turn's displacement by composite Simpson over its arclength 2h, the tangent turned by the smoothstep of the angle about a x b.
  const angle: number = Math.PI / 2;
  const tangent: (sigma: number) => V3 = (sigma: number): V3 => {
    const x: number = Math.min(1, Math.max(0, sigma / (2 * h)));
    const t: number = angle * x * x * x * (10 + x * (-15 + 6 * x));
    return [
      a[0] * Math.cos(t) + b[0] * Math.sin(t),
      a[1] * Math.cos(t) + b[1] * Math.sin(t),
      a[2] * Math.cos(t) + b[2] * Math.sin(t),
    ];
  };
  const panels: number = 4096;
  const step: number = (2 * h) / panels;
  const D: V3 = [0, 0, 0];
  for (let i: number = 0; i <= panels; i++) {
    const w: number = i === 0 || i === panels ? 1 : i % 2 === 1 ? 4 : 2;
    const t: V3 = tangent(i * step);
    for (let c: number = 0; c < 3; c++) D[c]! += (w * step * t[c]!) / 3;
  }
  const bisector: V3 = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const d: number =
    (D[0] * bisector[0] + D[1] * bisector[1] + D[2] * bisector[2]) /
    (bisector[0] ** 2 + bisector[1] ** 2 + bisector[2] ** 2);

  // The runs, in the kernel's millimetres.
  const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(
    centres.map((c: V3): V3 => [1000 * c[0], 1000 * c[1], 1000 * c[2]]),
    [1000 * h],
  );
  if (typeof runs === "string") return [`jointed: runs refused (${runs})`];
  const check: (setback: number) => string[] = (setback: number): string[] => {
    const misses: string[] = [];
    const want: [number, number, number, number][] = [
      [0, 100 - 1000 * setback, 0, 100 - 1000 * setback],
      [
        1000 * setback,
        100,
        100 - 1000 * setback + 2000 * h,
        100 - 1000 * setback + 2000 * h + 100 - 1000 * setback,
      ],
    ];
    runs.forEach((run: AutoMovieViewAxis.IRun, i: number): void => {
      const got: number[] = [run.from, run.to, run.start, run.end];
      want[i]!.forEach((value: number, k: number): void => {
        if (!(Math.abs(got[k]! - value) <= 1e-9 * 100))
          misses.push(
            `jointed run ${i} field ${k}: ${got[k]} mm against ${value} mm`,
          );
      });
    });
    return misses;
  };
  out.push(...check(d));
  if (check(h).length === 0)
    out.push("jointed proof: runs read without the corner cut stand");

  // A part along the course; a section in the second run lies on that segment's line, square to it.
  const total: number = runs[1]!.end / 1000;
  const stations: number[] = ConstructionShapes.uniform(0, total, 13);
  const limb: IAutoMovieConstructionView = ConstructionShapes.part(
    "limb",
    ConstructionShapes.DOWN,
    stations,
    (): [number, number, number, number] => [r, r, r, r],
    "open",
  );
  limb.axis = {
    type: "jointed",
    centres: centres.map(
      (c: V3): IAutoMovieVector3 => ({ x: c[0], y: c[1], z: c[2] }),
    ),
    halves: [h],
    up: { x: 1, y: 0, z: 0 },
  };
  const real: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: limb }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0)
    out.push(`jointed: diagnostics ${ConstructionRead.diagnostics(real)}`);
  const surface: IAutoMovieSolidSurface = ConstructionRead.metres(
    ConstructionRead.surface(real, "limb"),
  );
  const bound: number =
    ConstructionChecks.polarSpline(r, r, limb.order) + 1e-9 * 0.2;
  const along: number = 0.05;
  const station: number = runs[1]!.start / 1000 + (along - d);
  const points: V3[] = Array.from(
    { length: 4 },
    (_: unknown, g: number): V3 =>
      surface.jet(station, (g * Math.PI) / 2).p as V3,
  );
  const centre: V3 = [0, 1, 2].map(
    (c: number): number =>
      points.reduce((sum: number, p: V3): number => sum + p[c]!, 0) / 4,
  ) as V3;
  const offLine: number = Math.hypot(
    centre[0] - along,
    centre[1],
    centre[2] + 0.1,
  );
  if (!(offLine <= bound))
    out.push(
      `jointed: the section at ${along} m along the second segment is centred ${offLine} m off its line`,
    );
  points.forEach((p: V3, g: number): void => {
    if (!(Math.abs(p[0] - along) <= bound))
      out.push(
        `jointed: guide ${g} stands ${p[0] - along} m out of the plane square to the second segment`,
      );
    const radius: number = Math.abs(Math.hypot(p[1], p[2] + 0.1) - r);
    if (!(radius <= bound))
      out.push(`jointed: guide ${g} stands ${radius} m off the radius`);
  });
  return out;
}
