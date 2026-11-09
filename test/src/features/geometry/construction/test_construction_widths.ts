import {
  type AutoMovieConstructionRealization,
  type AutoMovieSolidIntersection,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  AutoMovieConstructionWidth,
} from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A join's width laws read as their records state: a chord table as the periodic cubic B-spline through its values, a fold width as `R tan(beta / 2)` capped, and a curvature width as a share of the surface's radius across the curve, capped; each rail then stands at its law's chord.
 *
 * Scenarios, all on a post of radius 0.015 m merged square onto a beam of radius 0.03 m:
 * 1. Chord table: host chords 4, 5, 6 and 7 mm at the curve parameters 0, pi / 2, pi and 3 pi / 2: at every traced point the join's host width is the periodic cubic B-spline through them, solved here from its cyclic system, and the host rail stands at it. Red: the table read one quarter turn shifted misses.
 * 2. Fold width: radius 4 mm, cap 8 mm on both sides: at every traced point each width is `min(cap, R tan(beta / 2))`, `beta` the turn between the two outward normals there (`ConstructionChecks.fold`), and both rails stand at it. Red: the same law at radius 5 mm misses.
 * 3. Curvature width on the host: share 0.2, cap 8 mm: at every traced point the host width is `min(cap, share / k)`, `k = (d . e)^2 / R` the beam's normal curvature in the direction `d` square to the curve in its tangent plane (Euler's formula on a cylinder, `e` the circumferential direction), and the host rail stands at it. Red: the same law at share 0.25 misses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes each merge with `realizeAutoMovieConstruction` and reads the join's width laws (`IJoin.widths`) and rails at every traced point. It catches a table read at the wrong parameters or by another interpolant, a fold read with the wrong normals or angle, a curvature read in the wrong direction or on the wrong surface, and a rail that ignores its law; any join that reads its widths as the records state passes.
 * @evidence contracts/development/testing.md#independent-expectations The width records' documents (`IAutoMovieConstructionChordTable`, `IAutoMovieConstructionFoldWidth`, `IAutoMovieConstructionCurvatureWidth`). The table's spline is solved here from the cyclic system `(c_{k-1} + 4 c_k + c_{k+1}) / 6 = v_k` and evaluated by the uniform cubic B-spline basis, not the kernel's filter. The fold's angle is read from the realized surfaces' own normals at each preimage, the law's definition. The cylinder's normal curvature is Euler's `kappa_1 cos^2 + kappa_2 sin^2` with `kappa_1 = 1 / R` round it and 0 along it; the realized beam is a 16-point cubic section spline, whose curvature departs from the circle's by about `h^2 / 12` relative (`h = 2 pi / 16`), so that law is read within 2 percent. Values are compared to 1e-9 of the chord where the law is the kernel's to rounding.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: a table, a fold and a curvature law. Negative: the shifted table, the wider fold radius and the larger share. Constant chords and the station width belong to `test_construction_merge`; width refusals to `test_construction_diagnostics`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_widths`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Chord table: host chords 4, 5, 6 and 7 mm at the curve parameters 0, pi / 2, pi and 3 pi / 2: at every traced point the join's host width...).
 */
export function test_construction_widths(): void {
  const failures: string[] = [];
  const R: number = 0.03;
  const r: number = 0.015;
  const merge: (widths: {
    part: AutoMovieConstructionWidth;
    host: AutoMovieConstructionWidth;
  }) => AutoMovieConstructionRealization.IRealization = (widths: {
    part: AutoMovieConstructionWidth;
    host: AutoMovieConstructionWidth;
  }): AutoMovieConstructionRealization.IRealization => {
    const host: AutoMovieConstructionNode = ConstructionShapes.cylinder(
      "beam",
      {
        origin: { x: -0.1, y: 0, z: 0 },
        u: { x: 0, y: 0, z: 1 },
        v: { x: 0, y: 1, z: 0 },
      },
      R,
      0.2,
    );
    const part: AutoMovieConstructionNode = ConstructionShapes.cylinder(
      "post",
      {
        origin: { x: 0, y: 0, z: 0 },
        u: { x: 0, y: 1, z: 0 },
        v: { x: 1, y: 0, z: 0 },
      },
      r,
      0.08,
    );
    const tree: AutoMovieConstructionNode = ConstructionShapes.join(
      "merge",
      "blend.post",
      host,
      part,
      {
        partFace: "post",
        hostFace: "beam",
        part: [R + 0.001, Math.PI / 2],
        host: [0.1 + r, 0.01],
      },
      widths,
    );
    return realizeAutoMovieConstruction(
      { name: "made", root: tree },
      { chord: 1e-4 },
    );
  };
  const joined: (
    real: AutoMovieConstructionRealization.IRealization,
    label: string,
  ) => AutoMovieConstructionRealization.IJoin | null = (
    real: AutoMovieConstructionRealization.IRealization,
    label: string,
  ): AutoMovieConstructionRealization.IJoin | null => {
    if (real.diagnostics.length !== 0)
      failures.push(
        `${label}: diagnostics ${ConstructionRead.diagnostics(real)}`,
      );
    const found: AutoMovieConstructionRealization.IJoin | undefined =
      real.joins.find(
        (j: AutoMovieConstructionRealization.IJoin): boolean =>
          j.name === "blend.post",
      );
    if (found === undefined) failures.push(`${label}: no join`);
    return found ?? null;
  };
  // Every traced point's law value against an expectation, in millimetres.
  const laws: (
    join: AutoMovieConstructionRealization.IJoin,
    side: "host" | "part",
    want: (p: AutoMovieSolidIntersection.IPoint) => number,
    relative: number,
  ) => string[] = (
    join: AutoMovieConstructionRealization.IJoin,
    side: "host" | "part",
    want: (p: AutoMovieSolidIntersection.IPoint) => number,
    relative: number,
  ): string[] =>
    join.join.curve.points.flatMap(
      (p: AutoMovieSolidIntersection.IPoint): string[] => {
        const got: number | null = join.join.widths(p.t)[side];
        const expected: number = want(p);
        return got !== null && Math.abs(got - expected) <= relative * expected
          ? []
          : [`${side} width at t ${p.t}: ${got} mm against ${expected} mm`];
      },
    );

  // 1. The chord table.
  const values: number[] = [4, 5, 6, 7];
  const table: (t: number) => number = periodic(values);
  const tabled: AutoMovieConstructionRealization.IJoin | null = joined(
    merge({
      part: { type: "chord", value: 0.006 },
      host: {
        type: "chords",
        values: values.map((v: number): number => v / 1000),
      },
    }),
    "table",
  );
  if (tabled !== null) {
    failures.push(
      ...laws(
        tabled,
        "host",
        (p: AutoMovieSolidIntersection.IPoint): number => table(p.t),
        1e-9,
      ).map((f: string): string => `table: ${f}`),
    );
    failures.push(
      ...ConstructionChecks.chords(
        tabled.join,
        (): number => 6,
        table,
        1e-6 * R,
      ).map((f: string): string => `table: ${f}`),
    );
    if (
      laws(
        tabled,
        "host",
        (p: AutoMovieSolidIntersection.IPoint): number =>
          table(p.t + Math.PI / 2),
        1e-9,
      ).length === 0
    )
      failures.push(
        "table proof: the table read a quarter turn shifted passes",
      );
  }

  // 2. The fold width.
  const real: AutoMovieConstructionRealization.IRealization = merge({
    part: { type: "fold", radius: 0.004, cap: 0.008 },
    host: { type: "fold", radius: 0.004, cap: 0.008 },
  });
  const folded: AutoMovieConstructionRealization.IJoin | null = joined(
    real,
    "fold",
  );
  if (folded !== null) {
    const post: IAutoMovieSolidSurface = ConstructionRead.surface(real, "post");
    const beam: IAutoMovieSolidSurface = ConstructionRead.surface(real, "beam");
    const fold: (t: number) => number = ConstructionChecks.fold(
      folded.join,
      post,
      beam,
      4,
      8,
    );
    for (const side of ["host", "part"] as const)
      failures.push(
        ...laws(
          folded,
          side,
          (p: AutoMovieSolidIntersection.IPoint): number => fold(p.t),
          1e-9,
        ).map((f: string): string => `fold: ${f}`),
      );
    failures.push(
      ...ConstructionChecks.chords(folded.join, fold, fold, 1e-6 * R).map(
        (f: string): string => `fold: ${f}`,
      ),
    );
    const wider: (t: number) => number = ConstructionChecks.fold(
      folded.join,
      post,
      beam,
      5,
      8,
    );
    if (
      laws(
        folded,
        "host",
        (p: AutoMovieSolidIntersection.IPoint): number => wider(p.t),
        1e-9,
      ).length === 0
    )
      failures.push("fold proof: the law at radius 5 mm passes");
  }

  // 3. The curvature width on the host.
  const share: number = 0.2;
  const curved: AutoMovieConstructionRealization.IJoin | null = joined(
    merge({
      part: { type: "chord", value: 0.006 },
      host: { type: "curvature", share, cap: 0.008, end: null },
    }),
    "curvature",
  );
  if (curved !== null) {
    const law: (
      s: number,
    ) => (p: AutoMovieSolidIntersection.IPoint) => number =
      (s: number): ((p: AutoMovieSolidIntersection.IPoint) => number) =>
      (p: AutoMovieSolidIntersection.IPoint): number => {
        // The beam's axis is +x; its outward normal at the point is radial in y and z.
        const q: V3 = [p.point[0], p.point[1], p.point[2]];
        const n: V3 = unit([0, q[1], q[2]]);
        const e: V3 = [0, -n[2], n[1]];
        const d: V3 = unit(cross(n, p.tangent as V3));
        const k: number =
          (d[0] * e[0] + d[1] * e[1] + d[2] * e[2]) ** 2 / (1000 * R);
        return k > 0 ? Math.min(8, s / k) : 8;
      };
    failures.push(
      ...laws(curved, "host", law(share), 2e-2).map(
        (f: string): string => `curvature: ${f}`,
      ),
    );
    if (laws(curved, "host", law(0.25), 2e-2).length === 0)
      failures.push("curvature proof: the law at share 0.25 passes");
  }
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} width failures:\n${failures.join("\n")}`,
    );
}

/**
 * The periodic cubic B-spline through values at the parameters `2 pi k / n`, solved from its cyclic system by Gaussian elimination.
 *
 * @param values The values, at least four.
 * @returns The spline as a function of the parameter.
 */
function periodic(values: readonly number[]): (t: number) => number {
  const n: number = values.length;
  const rows: number[][] = values.map((v: number, k: number): number[] => {
    const row: number[] = new Array<number>(n + 1).fill(0);
    row[(k - 1 + n) % n]! += 1 / 6;
    row[k]! += 4 / 6;
    row[(k + 1) % n]! += 1 / 6;
    row[n] = v;
    return row;
  });
  for (let c: number = 0; c < n; c++) {
    let pivot: number = c;
    for (let i: number = c + 1; i < n; i++)
      if (Math.abs(rows[i]![c]!) > Math.abs(rows[pivot]![c]!)) pivot = i;
    [rows[c], rows[pivot]] = [rows[pivot]!, rows[c]!];
    for (let i: number = 0; i < n; i++) {
      if (i === c) continue;
      const f: number = rows[i]![c]! / rows[c]![c]!;
      for (let j: number = c; j <= n; j++) rows[i]![j]! -= f * rows[c]![j]!;
    }
  }
  const control: number[] = rows.map(
    (row: number[], i: number): number => row[n]! / row[i]!,
  );
  return (t: number): number => {
    const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
    const i: number = Math.min(n - 1, Math.floor(u));
    const f: number = u - i;
    const g: number = 1 - f;
    const w: number[] = [
      (g * g * g) / 6,
      (3 * f * f * f - 6 * f * f + 4) / 6,
      (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6,
      (f * f * f) / 6,
    ];
    return w.reduce(
      (sum: number, weight: number, j: number): number =>
        sum + weight * control[(i - 1 + j + n) % n]!,
      0,
    );
  };
}

/** A vector's cross product. */
function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** A vector scaled to length 1. */
function unit(a: V3): V3 {
  const l: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
}
