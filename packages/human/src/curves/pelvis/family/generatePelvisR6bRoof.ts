import { AutoMovieCurveMath64 as M } from "@automovie/engine";

import type { PelvisMeasurements as P } from "./PelvisMeasurements";
import { PelvisSectionRules as S } from "./PelvisSectionRules";
import type { generatePelvisOwnedFamily } from "./generatePelvisOwnedFamily";

type Grid = M.Span[][];
type Curve = {
  /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
   */
  name: string;

  /** Whether the last span returns to the first; an open guide is not implicitly capped.
   */
  closed: boolean;

  /** Ordered cubic Bernstein coefficients; positions use millimetres and derivative fields use their enclosing declared units.
   */
  spans: M.Span[];

  /** Positive span widths in the declared phase unit; closed published courses normalize these widths to one turn.
   */
  phaseIntervals: number[];

  /** Inspection role separating ordinary sections/guides from auxiliary engineering closures.
   */
  role: string;

  /** Open-guide chart unit: physical millimetres or normalized engineering-closure parameter.
   */
  phaseUnit?: "normalized" | "mm";
};

/** Generate the external R6b sparse spatial roof from its explicit dimensions and the actual merged/paired fields. Numerical cubic depth roots select medial entries; longitudinal support/handle fields and the median generate all emitted arches and guides. Missing roots, degenerate entry planes or unusable physical-Z endpoint jets reject. The continuous roof-to-paired seam and full-J compatibility remain open in this epoch; engineering saddle curves are auxiliary. This is not the V17 common rational replacement or a Sturm certificate.
 *
 * @author Samchon
 */
export function generatePelvisR6bRoof(
  p: P.Input,
  owned: ReturnType<typeof generatePelvisOwnedFamily>,
): {
  /** Sections and guides evaluated from these same generating fields, with engineering closures separately identified.
   */
  curves: Curve[];

  /** Ascending native Z stations in millimetres for the R6b spatial roof field; its transverse courses need not be planar sections.
   */
  physicalZStationsMm: number[];

  /** Cubic longitudinal Bernstein rows of all four transverse roof spans; guides and arches evaluate these same coefficient fields.
   */
  fullControlFields: Grid[];

  /** Explicit unresolved topology, parent and visual limitations; the string does not alter or authorize geometry.
   */
  qualification: string;
} {
  if (owned.epoch !== "external-r6b" || p.roof === undefined)
    throw new Error(
      "The R6b roof needs its own explicit epoch and semantic dimensions",
    );
  const r: Record<string, number | string> = p.roof;
  const dim: (key: string) => number = (key: string): number => {
    const value: number | string | undefined = r[key];
    if (typeof value !== "number" || !Number.isFinite(value))
      throw new Error("Missing R6b roof dimension: " + key);
    return value;
  };
  const names: readonly string[] = S.lanes14;
  const floor: M.Span[] = owned.merged.controls(owned.merged.ys[0]!);
  const floorJ: M.Span[] = owned.merged.controls(owned.merged.ys[0]!, true);
  const back: M.V = floor[names.indexOf("posteriorMedian")]![0],
    front: M.V = floor[names.indexOf("anteriorMedian")]![0],
    length: number = front[2] - back[2];
  if (!(length > 0))
    throw new Error("Ordered physical median depth domain required");
  const ratio: number = dim("sagDepthRatio"),
    drop: number = dim("sagDropFromBodyFloor_mm");
  let zs: number[] = [0, ratio / 2, ratio, (1 + ratio) / 2, 1].map(
    (q: number): number => back[2] + length * q,
  );
  const heights: number[] = [
    back[1],
    back[1] - drop * dim("posteriorShoulderDropRatio"),
    back[1] - drop,
    back[1] - drop * dim("anteriorShoulderDropRatio"),
    front[1],
  ];
  const median: M.V[] = zs.map(
    (z: number, i: number): M.V => [back[0], heights[i]!, z],
  );
  const ds: M.V[] = M.fieldSlopes(
    zs,
    median.map((v: M.V): M.V[] => [v]),
  ).map((row: M.V[]): M.V => row[0]!);
  for (const [at, name] of [
    [0, "posteriorMedian"],
    [4, "anteriorMedian"],
  ] as const) {
    const jet: M.V = floorJ[names.indexOf(name)]![0];
    if (jet[2] === 0)
      throw new Error(
        "The R6b median endpoint cannot use its physical-Z chart",
      );
    ds[at] = M.scale(jet, 1 / jet[2]);
  }
  let medianFields: M.Span[] = median
    .slice(0, -1)
    .map(
      (v: M.V, i: number): M.Span =>
        M.hermite(v, median[i + 1]!, ds[i]!, ds[i + 1]!, zs[i + 1]! - zs[i]!),
    );
  const roots: (span: M.Span, depth: number) => number[] = (
    span: M.Span,
    depth: number,
  ): number[] => {
    const v: number[] = span.map((q: M.V): number => q[2] - depth);
    const a: number = -v[0]! + 3 * v[1]! - 3 * v[2]! + v[3]!,
      b: number = 3 * v[0]! - 6 * v[1]! + 3 * v[2]!,
      c: number = -3 * v[0]! + 3 * v[1]!;
    const critical: number[] = [];
    if (a !== 0) {
      const disc: number = 4 * b * b - 12 * a * c;
      if (disc >= 0)
        critical.push(
          (-2 * b - Math.sqrt(disc)) / (6 * a),
          (-2 * b + Math.sqrt(disc)) / (6 * a),
        );
    } else if (b !== 0) critical.push(-c / (2 * b));
    const boundaries: number[] = [
      0,
      ...critical.filter((t: number): boolean => t > 0 && t < 1),
      1,
    ].sort((x: number, y: number): number => x - y);
    const value: (t: number) => number = (t: number): number =>
      M.cubic(span, t)[2] - depth;
    const out: number[] = boundaries.filter(
      (t: number): boolean => value(t) === 0,
    );
    for (let i: number = 0; i < boundaries.length - 1; i++) {
      let lo: number = boundaries[i]!,
        hi: number = boundaries[i + 1]!,
        vl: number = value(lo);
      const vh: number = value(hi);
      if (!(vl * vh < 0)) continue;
      for (let iteration: number = 0; iteration < 80; iteration++) {
        const mid: number = (lo + hi) / 2;
        if (mid === lo || mid === hi) break;
        const vm: number = value(mid);
        if (vm === 0) {
          lo = mid;
          hi = mid;
          break;
        }
        if (Math.sign(vm) === Math.sign(vl)) {
          lo = mid;
          vl = vm;
        } else hi = mid;
      }
      out.push((lo + hi) / 2);
    }
    return [...new Set(out)];
  };
  const cross: (a: M.V, b: M.V) => M.V = (a: M.V, b: M.V): M.V => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const rows: M.Span[][] = [];
  for (let ri: number = 0; ri < zs.length; ri++) {
    if (ri === 0) {
      const left: M.Span = [
          ...floor[names.indexOf("posteriorMedian")]!,
        ].reverse() as M.Span,
        right: M.Span = [
          ...floor[names.indexOf("rightPosteriorLane")]!,
        ].reverse() as M.Span;
      rows.push([...M.split(left, 0.5), ...M.split(right, 0.5)]);
      continue;
    }
    if (ri === 4) {
      rows.push(
        structuredClone(
          floor.slice(
            names.indexOf("leftAnteriorLane"),
            names.indexOf("rightAnteriorLane"),
          ),
        ),
      );
      continue;
    }
    const halves: M.Span[] = [];
    for (const side of ["left", "right"] as const) {
      const family: typeof owned.paired.left = owned.paired[side],
        near: number = family.ys.at(-1)!;
      const section: M.Span[] = family.controls(near),
        jet: M.Span[] = family.controls(near, true);
      const hits: {
        /** Actual evaluated cubic/depth intersection position in native millimetres.
         */
        point: M.V;

        /** Index of the paired cubic span containing this intersection.
         */
        span: number;

        /** Local dimensionless cubic parameter of the actual depth root, in [0,1].
         */
        t: number;

        /** Derivative of the intersected cubic with respect to its local parameter, used with physical J to derive the entry tangent plane.
         */
        tangent: M.V;
      }[] = section.flatMap(
        (
          span: M.Span,
          index: number,
        ): {
          /** Actual evaluated cubic/depth intersection position in native millimetres.
           */
          point: M.V;

          /** Index of the paired cubic span containing this intersection.
           */
          span: number;

          /** Local dimensionless cubic parameter of the actual depth root, in [0,1].
           */
          t: number;

          /** Derivative of the intersected cubic with respect to its local parameter, used with physical J to derive the entry tangent plane.
           */
          tangent: M.V;
        }[] =>
          roots(span, zs[ri]!).map(
            (
              t: number,
            ): {
              /** Actual evaluated cubic/depth intersection position in native millimetres.
               */
              point: M.V;

              /** Index of the paired cubic span containing this intersection.
               */
              span: number;

              /** Local dimensionless cubic parameter of the actual depth root, in [0,1].
               */
              t: number;

              /** Derivative of the intersected cubic with respect to its local parameter, used with physical J to derive the entry tangent plane.
               */
              tangent: M.V;
            } => ({
              point: M.cubic(span, t),
              span: index,
              t,
              tangent: M.derivative(span, t, 1),
            }),
          ),
      );
      if (hits.length === 0)
        throw new Error(
          "No admitted generated paired-section depth intersection",
        );
      hits.sort(
        (a: (typeof hits)[number], b: (typeof hits)[number]): number =>
          Math.abs(a.point[0]) - Math.abs(b.point[0]),
      );
      const hit: (typeof hits)[number] = hits[0]!,
        longitudinal: M.V = M.cubic(jet[hit.span]!, hit.t);
      const raw: M.V = cross(cross(hit.tangent, longitudinal), [0, 0, 1]),
        norm: number = Math.hypot(...raw);
      if (norm === 0)
        throw new Error("The roof entry tangent plane is degenerate");
      const sign: number = side === "left" ? 1 : -1,
        direction: M.V = M.scale(raw, (raw[0] >= 0 ? -sign : sign) / norm);
      const breadth: number = Math.abs(hit.point[0] - median[ri]![0]);
      const span: M.Span = [
        hit.point,
        M.add(hit.point, M.scale(direction, breadth * dim("entryRounding"))),
        M.add(median[ri]!, [sign * breadth * dim("medianRounding"), 0, 0]),
        median[ri]!,
      ];
      halves.push(side === "left" ? span : ([...span].reverse() as M.Span));
    }
    rows.push([...M.split(halves[0]!, 0.5), ...M.split(halves[1]!, 0.5)]);
  }
  const supports: M.V[][] = rows.map((row: M.Span[]): M.V[] => [
    ...row.map((s: M.Span): M.V => M.clone(s[0])),
    M.clone(row.at(-1)![3]),
  ]);
  const outgoing: M.V[][] = rows.map((row: M.Span[]): M.V[] => [
    ...row.map((s: M.Span): M.V => M.sub(s[1], s[0])),
    [0, 0, 0],
  ]);
  const incoming: M.V[][] = rows.map((row: M.Span[]): M.V[] => [
    [0, 0, 0],
    ...row.map((s: M.Span): M.V => M.sub(s[3], s[2])),
  ]);
  for (const node of [1, 3])
    for (let i: number = 0; i < rows.length; i++)
      incoming[i]![node] = M.clone(outgoing[i]![node]!);
  const fields: (values: M.V[][]) => M.V[][][] = (
    values: M.V[][],
  ): M.V[][][] => {
    const d: M.V[][] = M.fieldSlopes(zs, values);
    return zs.slice(1).map((z: number, i: number): M.V[][] => {
      /** Build a periodic cubic course from supports and one-third angular derivatives. Each outgoing and next incoming handle uses that span's width; array layouts must correspond.
       */
      const spans: M.Span[] = values[i]!.map(
        (v: M.V, n: number): M.Span =>
          M.hermite(
            v,
            values[i + 1]![n]!,
            d[i]![n]!,
            d[i + 1]![n]!,
            z - zs[i]!,
          ),
      );
      return [0, 1, 2, 3].map((k: number): M.V[] =>
        spans.map((s: M.Span): M.V => M.clone(s[k]!)),
      );
    });
  };
  const pf: M.V[][][] = fields(supports),
    of: M.V[][][] = fields(outgoing),
    inf: M.V[][][] = fields(incoming);
  let grids: Grid[] = pf.map(
    (pfield: M.V[][], i: number): Grid =>
      pfield.map((row: M.V[], k: number): M.Span[] =>
        row
          .slice(0, -1)
          .map(
            (v: M.V, n: number): M.Span => [
              M.clone(v),
              M.add(v, of[i]![k]![n]!),
              M.sub(row[n + 1]!, inf[i]![k]![n + 1]!),
              M.clone(row[n + 1]!),
            ],
          ),
      ),
  );
  grids.forEach((grid: Grid, i: number): void =>
    grid.forEach((row: M.Span[], k: number): void => {
      const m: M.V = medianFields[i]![k]!;
      row[1]![3] = M.clone(m);
      row[2]![0] = M.clone(m);
      row[1]![2][1] = m[1];
      row[2]![1][1] = m[1];
      row[1]![2][2] = m[2];
      row[2]![1][2] = m[2];
    }),
  );
  const splitGrid: (grid: Grid) => [Grid, Grid] = (
    grid: Grid,
  ): [Grid, Grid] => {
    const out: [Grid, Grid] = [
      Array.from({ length: 4 }, (): M.Span[] => []),
      Array.from({ length: 4 }, (): M.Span[] => []),
    ];
    for (let n: number = 0; n < 4; n++)
      for (let ci: number = 0; ci < 4; ci++) {
        const span: M.Span = grid.map(
          (row: M.Span[]): M.V => row[n]![ci]!,
        ) as M.Span;
        const children: [M.Span, M.Span] = M.split(span, 0.5);
        for (let h: number = 0; h < 2; h++)
          for (let k: number = 0; k < 4; k++) {
            out[h]![k]![n] ??= [] as unknown as M.Span;
            out[h]![k]![n]![ci] = children[h]![k]!;
          }
      }
    return out;
  };
  grids = [...grids.slice(0, -1), ...splitGrid(grids.at(-1)!)];
  medianFields = [
    ...medianFields.slice(0, -1),
    ...M.split(medianFields.at(-1)!, 0.5),
  ];
  zs = [...zs.slice(0, -1), (zs.at(-2)! + zs.at(-1)!) / 2, zs.at(-1)!];
  const amplitude: number =
      typeof r.anteriorSweepFullness_mm === "number"
        ? r.anteriorSweepFullness_mm
        : 0,
    rise: number =
      typeof r.anteriorArchLateralRise_mm === "number"
        ? r.anteriorArchLateralRise_mm
        : 0;
  for (let si: number = 0; si < 4; si++) {
    const u: number = si / 4,
      v: number = (si + 1) / 4;
    const g: (t: number) => number = (t: number): number => (2 * t - 1) ** 2;
    const dg: (t: number) => number = (t: number): number => 8 * t - 4;
    const weights: number[] = [
      g(u),
      g(u) + ((v - u) * dg(u)) / 3,
      g(v) - ((v - u) * dg(v)) / 3,
      g(v),
    ];
    const riseWeights: number[] =
      si === 0 || si === 2 ? [0, 0, 1, 1] : [1, 1, 0, 0];
    for (let k: number = 0; k < 4; k++)
      for (let ci: number = 0; ci < 4; ci++)
        for (const [index, factor] of [
          [grids.length - 2, [0, 0, 1, 1][k]!],
          [grids.length - 1, [1, 1, 0, 0][k]!],
        ] as const) {
          grids[index]![k]![si]![ci]![2] += factor * amplitude * weights[ci]!;
          grids[index]![k]![si]![ci]![1] += factor * rise * riseWeights[ci]!;
        }
  }
  const evaluate: (z: number) => M.Span[] = (z: number): M.Span[] => {
    let i: number = zs.findIndex((v: number): boolean => v > z) - 1;
    if (i < 0) i = zs.length - 2;
    const t: number = (z - zs[i]!) / (zs[i + 1]! - zs[i]!);
    return [0, 1, 2, 3].map(
      (n: number): M.Span =>
        [0, 1, 2, 3].map(
          (ci: number): M.V =>
            M.cubic(
              grids[i]!.map((row: M.Span[]): M.V => row[n]![ci]!),
              t,
            ),
        ) as M.Span,
    );
  };
  const labels: string[] = [
    "posteriorFloor",
    "posteriorShoulder",
    "lowPoint",
    "anteriorShoulder",
    "anteriorSweep",
    "anteriorFloor",
  ];
  const curves: Curve[] = zs.map((z: number, i: number): Curve => {
    const spans: M.Span[] = evaluate(z),
      a: number = Math.hypot(...M.sub(spans[1]![3], spans[1]![2])),
      b: number = Math.hypot(...M.sub(spans[2]![1], spans[2]![0]));
    return {
      name: "groin.roofArch." + labels[i],
      closed: false,
      spans,
      phaseIntervals: [a, a, b, b],
      role: "roofArch",
    };
  });
  curves.push({
    name: "groin.externalRoofMedian",
    closed: false,
    spans: medianFields,
    phaseIntervals: zs
      .slice(1)
      .map((z: number, i: number): number => z - zs[i]!),
    role: "guide",
  });
  for (const [side, n, ci] of [
    ["left", 0, 0],
    ["right", 3, 3],
  ] as const)
    curves.push({
      name: "groin.medialEntry." + side,
      closed: false,
      spans: grids.map(
        (grid: Grid): M.Span =>
          grid.map((row: M.Span[]): M.V => row[n]![ci]!) as M.Span,
      ),
      phaseIntervals: zs
        .slice(1)
        .map((z: number, i: number): number => z - zs[i]!),
      role: "guide",
    });
  if (p.saddle !== undefined) {
    const saddle: M.V = M.add(p.frame.origin_mm, p.saddle.offsetFromFrame_mm),
      ln: M.V = owned.paired.left.points.at(-1)![2]!,
      rn: M.V = owned.paired.right.points.at(-1)![2]!;
    const delta: number = Math.max(Math.abs(ln[0] - rn[0]), 1) * 0.2761423749;
    curves.push({
      name: "groin.medialSaddle",
      closed: false,
      role: "engineeringClosure",
      phaseUnit: "normalized",
      phaseIntervals: [0.5, 0.5],
      spans: [
        [
          ln,
          M.add(ln, [0, (saddle[1] - ln[1]) * 0.55, 0]),
          M.add(saddle, [delta, 0, 0]),
          saddle,
        ],
        [
          saddle,
          M.sub(saddle, [delta, 0, 0]),
          M.add(rn, [0, (saddle[1] - rn[1]) * 0.55, 0]),
          rn,
        ],
      ],
    });
    const dy: number = saddle[1] - back[1],
      derivative: M.V = M.scale(M.sub(saddle, back), 1 / dy);
    curves.push({
      name: "branch.medianEngineeringClosure",
      closed: false,
      role: "engineeringClosure",
      phaseUnit: "normalized",
      phaseIntervals: [1],
      spans: [M.hermite(back, saddle, derivative, derivative, dy)],
    });
  }
  return {
    curves,
    physicalZStationsMm: zs,
    fullControlFields: grids,
    qualification:
      "External R6b spatial roof with three paired station anchors only. Continuous roof-to-paired internal seam/full-J remains OPEN in this epoch; V17 is a separate replacement. Transverse courses are spatial and their phase is a relative actual median-handle chart, not a planar physical-Z section. Numerical depth roots are not an exact Sturm certificate.",
  };
}
