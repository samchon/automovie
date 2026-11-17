import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionPort,
  IAutoMovieConstructionRealization,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieSolidChain,
  realizeAutoMovieConstruction,
} from "@automovie/engine";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A port's two seams are one curve between its columns as well as at them: the host's port curve and the band's start edge, and the band's
 * end edge and the part's rail, with the cross 2-jets the band promises, and a cutter's traced loop passes either seam.
 *
 * Fixture (metres; the host in the `DOWN` frame, stations along `-z`): the host `trunk` is a cylinder of radius 0.02 over stations
 * `[0, 0.1]`; its port curve is the chart ellipse about station 0.05 and phase 0 with semi-axes 0.01 m and 0.45 rad, sense +1, its distance
 * from the centre scaled per column by `1 + 0.15 cos 3c`, which leaves three concave stretches between the 16 columns. The part `arm` is a
 * cylinder of radius 0.007 along `+x` from `(0.012, 0, -0.05)`, its rail 0.02 m in (`x = 0.032`). Columns 16, rows 4. The port curve between
 * columns is the node's: the periodic cubic spline through the shares (`IAutoMovieConstructionPortLoop.shape`), here solved densely.
 *
 * Scenarios, each read at the 16 mid-columns `c = 2 pi (k + 1/2) / 16`:
 * 1. Parent seam: the band's station-0 point is the host's point on the port curve within 1e-9 mm; its phase derivative is the host's
 *    derivative along the curve's clock rate within 1e-9 of its length; its cross derivative is parallel to the host's derivative along
 *    the ellipse's inward chart direction `(-10 cos c, -0.45 sin c)` and its `uu / |u|^2` equals the host's second derivative along that
 *    direction over its length squared, within 1e-9 (G2 across the seam).
 * 2. Child seam: the band's end point lies on the part's surface at the rail station 20 mm (read by a one-dimensional Newton in the part's
 *    phase) within 1e-9 mm, and the two normals there are parallel within 1e-9.
 * 3. Proof: at the mid-column 7.5 the host's point under the chord between the two columns' chart points stands more than 1e-3 mm from
 *    its point on the curve, and the start edge of the column strip the port still publishes as its chain (the periodic cubic through the
 *    columns' world points, the band's face before this contract) stands more than 1e-6 mm off the host's port curve at the mid-columns,
 *    so a band ending on either, or a host trimmed by the chords, fails scenario 1 by three orders or more.
 * 4. Traced crossings: three diffs, each a cylinder of radius 0.001 square to the skin, each cut from its own realization of the port
 *    under the angle parameter: one centred on the parent seam at mid-column 7.5 in a concave stretch (an oblique crossing), one centred
 *    0.00095 m inside the port curve at mid-column 2.5, its loop crossing the seam about 18 degrees from tangent with its seed 0.05 mm
 *    outside the curve, between the curve and the chord (a shallow crossing), and one centred on the child seam at mid-column 12.5. Each
 *    leaves no diagnostic, and each traced loop has points on two host faces.
 * 5. Between the seams: at the shares 0.25, 0.5 and 0.75 of every mid-column the band's five derivative jets are the central differences
 *    of its own points and first derivatives (steps 1e-3 mm and 1e-4 rad) within 1e-6 of their size, and along every quarter-column the
 *    normal turns less than a right angle from one sixteenth of the span to the next with the chart directions' sine above 0.05.
 * 6. A second cutter across a clipped seam: the shallow cutter of scenario 4 cut from the tree the oblique cut has already cut leaves no
 *    diagnostic; every traced point lies on the cutter and on its host face (trunk or band) within 1e-9 mm, and on that face's kept side
 *    of the seam itself (at or beyond the port curve's share on the trunk, at a station from 0 on the band) within 1e-9; the loop has
 *    points on both faces, is within 1 % of `2 pi` mm long and holds no chord, the closing one included, over twice the mean.
 * 7. Short root: the same rail ring on a part whose first station stands 1 mm before its rail (`x = 31`, rail `x = 32`), the field a
 *    mound publishes past its rail. The port realizes with no diagnostic, and at the mid-columns its band's end lies on the part's rail
 *    with the part's normal and its start edge on the host's port curve, each within 1e-9. A band that reads the part between its end
 *    and its rail refuses this port.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes port and diff trees with `realizeAutoMovieConstruction` and reads the band's, host's and part's surfaces and the joins' traced curves. It catches a band edge that is not the host's port curve or the part's rail between columns, cross jets that are the host's only at the columns, a band whose jets are not its points' derivatives or that folds, and a seam a traced loop cannot cross.
 * @evidence contracts/development/testing.md#independent-expectations The port curve from the node's definition with the periodic cubic solved densely here; host and part points read on their realized surfaces at those chart points; cross jets by the chain rule on the host's own 2-jet; the part's rail point by a Newton solve on the part; the band's interior jets by central differences of its own readings, whose truncation at those steps is under 1e-8 of a jet's size; the second cutter's points by the cutter's and the faces' own surfaces at the traced chart points and by the port curve's share at the point's polar clock, its length by the tube's circle. Limits 1e-9 are rounding of the kernel's millimetre arithmetic; the proof's 1e-3 mm is the chord's sagitta at 16 columns.
 * @evidence contracts/development/testing.md#distinguishing-cases Mid-columns rather than columns (at columns both seams already agree), a concave stretch where a chord stands outside the curve, an oblique and a shallow crossing of the parent seam, the shallow one seeded in the strip between the curve and its chord that neither face owned, and one crossing of the child seam; the columns' own seams belong to `test_construction_port`; and the shallow crossing again after the oblique cut has clipped the same seam five columns away. `test_construction_port_seam_clip` owns the clipped cycle's readings on a made circle. A part with 1 mm of field before its rail stands against the 20 mm of the others.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_port_seam`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the input and the behavior it pins (first: the parent seam's position, tangent and cross 2-jet at the mid-columns).
 */
export function test_construction_port_seam(): void {
  const failures: string[] = [];
  const n: number = 16;
  const turn: number = 2 * Math.PI;
  const clock = (k: number): number => (turn * k) / n;
  const shares: number[] = Array.from({ length: n }, (_: unknown, k: number): number => 1 + 0.15 * Math.cos(3 * clock(k)));

  // The periodic cubic through the shares: curvatures M[j-1] + 4 M[j] + M[j+1] = 6 (y[j+1] - 2 y[j] + y[j-1]) / h^2, solved densely.
  const h: number = turn / n;
  const rows: number[][] = Array.from({ length: n }, (_: unknown, j: number): number[] => {
    const row: number[] = new Array<number>(n + 1).fill(0);
    row[(j - 1 + n) % n] = 1;
    row[j] = 4;
    row[(j + 1) % n] = 1;
    row[n] = (6 * (shares[(j + 1) % n]! - 2 * shares[j]! + shares[(j - 1 + n) % n]!)) / (h * h);
    return row;
  });
  for (let i: number = 0; i < n; ++i)
    for (let r: number = i + 1; r < n; ++r) {
      const f: number = rows[r]![i]! / rows[i]![i]!;
      for (let c: number = i; c <= n; ++c) rows[r]![c]! -= f * rows[i]![c]!;
    }
  const M: number[] = new Array<number>(n).fill(0);
  for (let i: number = n - 1; i >= 0; --i) {
    let rest: number = rows[i]![n]!;
    for (let c: number = i + 1; c < n; ++c) rest -= rows[i]![c]! * M[c]!;
    M[i] = rest / rows[i]![i]!;
  }
  /** The share and its first two clock derivatives. */
  const share = (psi: number): [number, number, number] => {
    const x: number = ((psi % turn) + turn) % turn;
    const j: number = Math.min(n - 1, Math.floor(x / h));
    const t: number = x - j * h;
    const [y0, y1, m0, m1]: number[] = [shares[j]!, shares[(j + 1) % n]!, M[j]!, M[(j + 1) % n]!];
    const slope: number = (y1! - y0!) / h - (h * (2 * m0! + m1!)) / 6;
    return [
      y0! + t * slope + (m0! * t * t) / 2 + ((m1! - m0!) * t * t * t) / (6 * h),
      slope + m0! * t + ((m1! - m0!) * t * t) / (2 * h),
      m0! + ((m1! - m0!) * t) / h,
    ];
  };
  /** The port curve's chart point (mm, rad) and its clock derivative. */
  const curve = (psi: number): { at: [number, number]; rate: [number, number] } => {
    const [r, r1]: [number, number, number] = share(psi);
    return {
      at: [50 + r * 10 * Math.cos(psi), r * 0.45 * Math.sin(psi)],
      rate: [10 * (r1 * Math.cos(psi) - r * Math.sin(psi)), 0.45 * (r1 * Math.sin(psi) + r * Math.cos(psi))],
    };
  };

  const sub = (a: readonly number[], b: readonly number[]): V3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const len = (a: readonly number[]): number => Math.hypot(a[0]!, a[1]!, a[2]!);
  const scaled = (a: readonly number[], k: number): V3 => [a[0]! * k, a[1]! * k, a[2]! * k];
  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const cross = (a: readonly number[], b: readonly number[]): V3 => [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
  const angle = (a: readonly number[], b: readonly number[]): number => len(sub(scaled(a, 1 / len(a)), scaled(b, 1 / len(b))));
  const along = (j: IAutoMovieSolidSurface.IJet, d: readonly [number, number]): V3 =>
    [0, 1, 2].map((i: number): number => j.u[i]! * d[0] + j.v[i]! * d[1]) as V3;
  const bend = (j: IAutoMovieSolidSurface.IJet, d: readonly [number, number]): V3 =>
    [0, 1, 2].map((i: number): number => j.uu[i]! * d[0] * d[0] + 2 * j.uv[i]! * d[0] * d[1] + j.vv[i]! * d[1] * d[1]) as V3;

  const trunk: IAutoMovieConstructionNode = ConstructionShapes.cylinder("trunk", ConstructionShapes.DOWN, 0.02, 0.1);
  const arm: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
    "arm",
    { origin: { x: 0.012, y: 0, z: -0.05 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } },
    0.007,
    0.06,
    7,
  );
  const port: IAutoMovieConstructionPort = {
    type: "port",
    name: "port.arm",
    host: trunk,
    hostFace: "trunk",
    loop: { centre: [0.05, 0], semi: [0.01, 0.45], sense: 1, shape: shares },
    band: "band.port",
    part: arm,
    partFace: "arm",
    partEnd: "bottom",
    rail: 0.02,
    count: n,
    rows: 4,
  };
  const realize = (root: IAutoMovieConstructionNode): IAutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
  const real: IAutoMovieConstructionRealization.IRealization = realize(port);
  if (real.diagnostics.length !== 0) failures.push(`port: ${ConstructionRead.diagnostics(real)}`);
  const host: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, "band.port");
  const part: IAutoMovieSolidSurface = ConstructionRead.surface(real, "arm");
  const span: number = real.chains.find((c: { name: string }): boolean => c.name === "band.port")?.layers.at(-1)?.y ?? NaN;

  // 1-2. Both seams at every mid-column.
  let worst: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
  for (let k: number = 0; k < n; ++k) {
    const psi: number = clock(k + 0.5);
    const { at, rate }: { at: [number, number]; rate: [number, number] } = curve(psi);
    const j: IAutoMovieSolidSurface.IJet = host.jet(at[0], at[1]);
    const b: IAutoMovieSolidSurface.IJet = band.jet(0, psi);
    const d: [number, number] = [-10 * Math.cos(psi), -0.45 * Math.sin(psi)];
    const first: V3 = along(j, d);
    const tangent: V3 = along(j, rate);
    const readings: number[] = [
      len(sub(b.p, j.p)),
      len(sub(b.v, tangent)) / len(tangent),
      angle(b.u, first),
      len(sub(scaled(b.uu, 1 / dot(b.u, b.u)), scaled(bend(j, d), 1 / dot(first, first)))),
    ];

    // The part's point at the rail station nearest the band's end point, by Newton in its phase.
    const e: IAutoMovieSolidSurface.IJet = band.jet(span, psi);
    let phi: number = Math.atan2(e.p[1], e.p[2] + 50);
    for (let step: number = 0; step < 40; ++step) {
      const q: IAutoMovieSolidSurface.IJet = part.jet(20, phi);
      const r: V3 = sub(q.p, e.p);
      const slope: number = 2 * dot(r, q.v);
      const curvature: number = 2 * (dot(q.v, q.v) + dot(r, q.vv));
      if (!(curvature > 0)) break;
      phi -= slope / curvature;
    }
    const q: IAutoMovieSolidSurface.IJet = part.jet(20, phi);
    const normals: number = Math.min(angle(cross(e.u, e.v), cross(q.u, q.v)), angle(cross(e.u, e.v), scaled(cross(q.u, q.v), -1)));
    readings.push(len(sub(e.p, q.p)), normals);
    worst = worst.map((w: number, i: number): number => Math.max(w, readings[i]!)) as typeof worst;
  }
  const names: string[] = [
    "parent seam position, mm",
    "parent seam tangent, share",
    "parent cross direction",
    "parent cross curvature, 1/mm",
    "child seam position, mm",
    "child seam normal",
  ];
  worst.forEach((w: number, i: number): void => {
    if (!(w <= 1e-9)) failures.push(`${names[i]}: ${w} at the mid-columns`);
  });

  // 3. Proof: the chord between columns 7 and 8 stands off the curve by its sagitta.
  {
    const a: [number, number] = curve(clock(7)).at;
    const b: [number, number] = curve(clock(8)).at;
    const chord: readonly number[] = host.jet((a[0] + b[0]) / 2, (a[1] + b[1]) / 2).p;
    const exact: [number, number] = curve(clock(7.5)).at;
    const sagitta: number = len(sub(chord, host.jet(exact[0], exact[1]).p));
    if (!(sagitta > 1e-3)) failures.push(`proof: the chord's mid-point stands only ${sagitta} mm off the curve, which the seam check cannot tell from it`);

    // The column strip the port still publishes as its chain, the band's face before the exact band: its start edge between columns
    // is the periodic cubic through the columns' world points, which fails scenario 1's position check.
    const strip: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(
      real.chains.find((c: { name: string }): boolean => c.name === "band.port")!,
    );
    let stripEdge: number = 0;
    if (strip !== null)
      for (let k: number = 0; k < n; ++k) {
        const at: [number, number] = curve(clock(k + 0.5)).at;
        stripEdge = Math.max(stripEdge, len(sub(strip.jet(0, clock(k + 0.5)).p, host.jet(at[0], at[1]).p)));
      }
    if (!(stripEdge > 1e-6)) failures.push(`proof: the column strip's start edge stands only ${stripEdge} mm off the host's port curve at the mid-columns`);
    console.log({ portSeam: { chordOffCurve: sagitta, columnStripEdgeOffCurve: stripEdge, bandEdgeOffCurve: worst[0], bandEndOffRail: worst[4] } });
  }

  // 5. The band between its seams: its jets are its own points' derivatives, and it does not fold.
  {
    const hu: number = 1e-3;
    const hv: number = 1e-4;
    const central = (a: readonly number[], b: readonly number[], h: number): V3 => scaled(sub(a, b), 1 / (2 * h));
    let worstJet: number = 0;
    for (let k: number = 0; k < n; ++k)
      for (const t of [0.25, 0.5, 0.75]) {
        const u: number = t * span;
        const v: number = clock(k + 0.5);
        const j: IAutoMovieSolidSurface.IJet = band.jet(u, v);
        const [up, um, vp, vm]: IAutoMovieSolidSurface.IJet[] = [
          band.jet(u + hu, v),
          band.jet(u - hu, v),
          band.jet(u, v + hv),
          band.jet(u, v - hv),
        ];
        const pairs: [readonly number[], V3][] = [
          [j.u, central(up!.p, um!.p, hu)],
          [j.v, central(vp!.p, vm!.p, hv)],
          [j.uu, central(up!.u, um!.u, hu)],
          [j.uv, central(vp!.u, vm!.u, hv)],
          [j.vv, central(vp!.v, vm!.v, hv)],
        ];
        for (const [exact, numeric] of pairs) worstJet = Math.max(worstJet, len(sub(exact, numeric)) / (1 + len(exact)));
      }
    if (!(worstJet <= 1e-6)) failures.push(`band interior: a jet stands ${worstJet} of its size off the central difference of the band's own points`);

    // Along every quarter-column clock the normal turns less than a right angle from one sixteenth of the span to the next, and the
    // two chart directions stay apart.
    const regular = (surface: IAutoMovieSolidSurface, L: number): { flips: string[]; least: number } => {
      const flips: string[] = [];
      let least: number = Infinity;
      for (let q: number = 0; q < 4 * n; ++q) {
        let before: V3 | null = null;
        for (let i: number = 0; i <= 16; ++i) {
          const j: IAutoMovieSolidSurface.IJet = surface.jet((L * i) / 16, clock(q / 4));
          const normal: V3 = cross(j.u, j.v);
          least = Math.min(least, len(normal) / (len(j.u) * len(j.v)));
          if (before !== null && !(dot(before, normal) > 0)) flips.push(`column ${q / 4} share ${i / 16}`);
          before = normal;
        }
      }
      return { flips, least };
    };
    const now: { flips: string[]; least: number } = regular(band, span);
    if (now.flips.length !== 0 || !(now.least > 0.05)) {
      const strip: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(real.chains.find((c: { name: string }): boolean => c.name === "band.port")!);
      const old: { flips: string[]; least: number } | null = strip === null ? null : regular(strip, span);
      failures.push(
        `band interior: the normal flips at ${now.flips.length} steps (${now.flips.slice(0, 12).join("; ")}), least sine between its chart directions ${now.least}; the column strip: ${old === null ? "none" : `${old.flips.length} flips, least sine ${old.least}`}`,
      );
    }
  }

  // 7. A part published only 1 mm past its rail: the same rail ring `x = 32`, on a part whose first station is `x = 31`.
  {
    const short: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
      "arm",
      { origin: { x: 0.031, y: 0, z: -0.05 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } },
      0.007,
      0.041,
      7,
    );
    const made: IAutoMovieConstructionRealization.IRealization = realize({ ...port, part: short, rail: 0.001 });
    if (made.diagnostics.length !== 0) failures.push(`short root: ${ConstructionRead.diagnostics(made)}`);
    else {
      const face: IAutoMovieSolidSurface = ConstructionRead.surface(made, "band.port");
      const L: number = made.chains.find((c: { name: string }): boolean => c.name === "band.port")?.layers.at(-1)?.y ?? NaN;
      let off: number = 0;
      let turned: number = 0;
      let edge: number = 0;
      for (let k: number = 0; k < n; ++k) {
        const psi: number = clock(k + 0.5);
        const e: IAutoMovieSolidSurface.IJet = face.jet(L, psi);
        const radius: V3 = [0, e.p[1], e.p[2] + 50];
        off = Math.max(off, Math.abs(len(radius) - 7), Math.abs(e.p[0] - 32));
        turned = Math.max(turned, Math.min(angle(cross(e.u, e.v), radius), angle(cross(e.u, e.v), scaled(radius, -1))));
        const at: [number, number] = curve(psi).at;
        edge = Math.max(edge, len(sub(face.jet(0, psi).p, host.jet(at[0], at[1]).p)));
      }
      if (!(off <= 1e-9)) failures.push(`short root: the band's end stands ${off} mm off the part's rail at the mid-columns`);
      if (!(turned <= 1e-9)) failures.push(`short root: the band's end normal stands ${turned} off the part's at the mid-columns`);
      if (!(edge <= 1e-9)) failures.push(`short root: the band's start edge stands ${edge} mm off the host's port curve at the mid-columns`);
    }
  }

  // 4. Three cutters across the seams, each on its own port. Each is a cylinder of radius 1 mm along the skin's normal at its centre,
  // 20 mm long, its stations advancing outward, so it meets the skin near its station 10 mm.
  const m = (p: readonly number[]): IAutoMovieVector3 => ({ x: p[0]! / 1000, y: p[1]! / 1000, z: p[2]! / 1000 });
  const cutter = (
    name: string,
    centre: V3,
    normal: V3,
    u: V3,
    seed: { face: string; host: [number, number]; phase: number },
    on: IAutoMovieConstructionNode,
  ): IAutoMovieConstructionNode => {
    const v: V3 = cross(u, normal);
    const tube: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
      name,
      { origin: m(sub(centre, scaled(normal, 10))), u: m(scaled(u, 1000)), v: m(scaled(v, 1000)) },
      0.001,
      0.02,
    );
    return ConstructionShapes.join(
      "diff",
      `cut.${name}`,
      on,
      tube,
      { partFace: name, hostFace: seed.face, part: [0.01, seed.phase], host: [seed.host[0] / 1000, seed.host[1]] },
      { part: { type: "chord", value: 0.0003 }, host: { type: "chord", value: 0.0003 } },
      { type: "angle", centre: m(centre), normal: m(scaled(normal, 1000)), reference: m(scaled(u, 1000)) },
    );
  };
  const trunkPoint = (c: readonly [number, number]): V3 => [20 * Math.cos(c[1]), 20 * Math.sin(c[1]), -c[0]];
  const radial = (c: readonly [number, number]): V3 => [Math.cos(c[1]), Math.sin(c[1]), 0];
  const chartOf = (p: readonly number[]): [number, number] => [-p[2]!, Math.atan2(p[1]!, p[0]!)];

  // The oblique cut: centred on the seam at mid-column 7.5, its seed 1 mm along -z, toward lower stations, outside the port curve.
  const c1: [number, number] = curve(clock(7.5)).at;
  const q1: V3 = trunkPoint(c1);
  const one: IAutoMovieConstructionNode = cutter("oblique", q1, radial(c1), [0, 0, 1], { face: "trunk", host: [c1[0] - 1, c1[1]], phase: 0 }, port);

  // The shallow cut: centred 0.95 mm inside the seam at mid-column 2.5, along the seam's normal in the tangent plane.
  const c2: { at: [number, number]; rate: [number, number] } = curve(clock(2.5));
  const q2: V3 = trunkPoint(c2.at);
  const n2: V3 = radial(c2.at);
  const tangent2: V3 = [-20 * Math.sin(c2.at[1]) * c2.rate[1], 20 * Math.cos(c2.at[1]) * c2.rate[1], -c2.rate[0]];
  let inward: V3 = cross(n2, scaled(tangent2, 1 / len(tangent2)));
  const d2: [number, number] = [-10 * Math.cos(clock(2.5)), -0.45 * Math.sin(clock(2.5))];
  if (dot(inward, [-20 * Math.sin(c2.at[1]) * d2[1], 20 * Math.cos(c2.at[1]) * d2[1], -d2[0]]) < 0) inward = scaled(inward, -1);
  const centre2: V3 = [q2[0] + 0.95 * inward[0], q2[1] + 0.95 * inward[1], q2[2] + 0.95 * inward[2]];
  const outer2: V3 = sub(centre2, inward);
  const v2: V3 = cross([0, 0, 1], n2);
  const two: IAutoMovieConstructionNode = cutter(
    "shallow",
    centre2,
    n2,
    [0, 0, 1],
    { face: "trunk", host: chartOf(outer2), phase: Math.atan2(dot(scaled(inward, -1), v2), dot(scaled(inward, -1), [0, 0, 1])) },
    port,
  );

  // The child cut: centred on the band's end point at mid-column 12.5, its seed 1 mm along +x on the part.
  const p3: readonly number[] = band.jet(span, clock(12.5)).p;
  const n3: V3 = scaled([0, p3[1]!, p3[2]! + 50], 1 / Math.hypot(p3[1]!, p3[2]! + 50));
  const three: IAutoMovieConstructionNode = cutter(
    "child",
    [p3[0]!, p3[1]!, p3[2]!],
    n3,
    [1, 0, 0],
    { face: "arm", host: [p3[0]! - 12 + 1, Math.atan2(p3[1]!, p3[2]! + 50)], phase: 0 },
    port,
  );
  for (const [name, tree] of [["cut.oblique", one], ["cut.shallow", two], ["cut.child", three]] as const) {
    const cut: IAutoMovieConstructionRealization.IRealization = realize(tree);
    const own: string[] = cut.diagnostics
      .filter((d: { node: string }): boolean => d.node === name)
      .map((d: { contract: string; detail: string }): string => `${d.contract}: ${d.detail}`);
    if (own.length !== 0) {
      failures.push(`${name}: ${own.join("; ")}`);
      continue;
    }
    const faces: Set<number> = new Set(
      ConstructionRead.join(cut, name).join.curve.points.map((p: IAutoMovieSolidIntersection.IPoint): number => p.face),
    );
    if (faces.size < 2) failures.push(`${name}: the traced loop stays on one host face, so it crosses no seam`);
  }

  // 6. The shallow cutter again, on the tree the oblique cut has already cut: the parent seam it crosses was clipped five columns away.
  {
    const again: IAutoMovieConstructionNode = cutter(
      "second",
      centre2,
      n2,
      [0, 0, 1],
      { face: "trunk", host: chartOf(outer2), phase: Math.atan2(dot(scaled(inward, -1), v2), dot(scaled(inward, -1), [0, 0, 1])) },
      one,
    );
    const cut: IAutoMovieConstructionRealization.IRealization = realize(again);
    const own: string[] = cut.diagnostics
      .filter((d: { node: string }): boolean => d.node === "cut.second" || d.node === "cut.oblique")
      .map((d: { node: string; contract: string; detail: string }): string => `${d.node}: ${d.contract}: ${d.detail}`);
    if (own.length !== 0) failures.push(`second cut across the clipped seam: ${own.join("; ")}`);
    else {
      const loop: IAutoMovieSolidIntersection.IPoint[] = ConstructionRead.join(cut, "cut.second").join.curve.points;
      const tube: IAutoMovieSolidSurface = ConstructionRead.surface(cut, "second");
      const sides: IAutoMovieSolidSurface[] = [ConstructionRead.surface(cut, "trunk"), ConstructionRead.surface(cut, "band.port")];
      const counts: [number, number] = [0, 0];
      let [offPart, offHost, outside, length, widest]: number[] = [0, 0, 0, 0, 0];
      loop.forEach((p: IAutoMovieSolidIntersection.IPoint, i: number): void => {
        offPart = Math.max(offPart!, len(sub(tube.jet(p.s, p.phi).p, p.point)));
        const off: number[] = sides.map((s: IAutoMovieSolidSurface): number => len(sub(s.jet(p.y, p.theta).p, p.point)));
        const side: number = off[0]! <= off[1]! ? 0 : 1;
        counts[side]!++;
        offHost = Math.max(offHost!, off[side]!);

        // Each point on its face's kept side of the seam itself: outside the port curve on the trunk, at a station from 0 on the band.
        const theta: number = p.theta - turn * Math.round(p.theta / turn);
        const radial: [number, number] = [(p.y - 50) / 10, theta / 0.45];
        outside = Math.max(outside!, side === 0 ? share(Math.atan2(radial[1], radial[0]))[0] - Math.hypot(radial[0], radial[1]) : -p.y);
        const gap: number = len(sub(loop[(i + 1) % loop.length]!.point, p.point));
        length! += gap;
        widest = Math.max(widest!, gap);
      });
      console.log({ secondCut: { points: loop.length, onTrunk: counts[0], onBand: counts[1], offPart, offHost, outside, length, widest } });
      if (counts[0] === 0 || counts[1] === 0) failures.push(`second cut: ${counts[0]} points on the trunk and ${counts[1]} on the band, so the loop crosses no seam`);
      if (!(offPart! <= 1e-9 && offHost! <= 1e-9)) failures.push(`second cut: a traced point stands ${offPart} mm off the cutter and ${offHost} mm off its host face`);
      if (!(outside! <= 1e-9)) failures.push(`second cut: a traced point stands ${outside} past the seam on its own face (curve shares on the trunk, mm on the band)`);

      // The loop closes: a tube of radius 1 mm square to a skin of radius 20 mm meets it in a loop within 1 % of 2 pi mm, and its uniform
      // angles leave no chord, the closing one included, twice the mean.
      if (!(length! >= 0.99 * turn && length! <= 1.01 * turn && widest! <= (2 * length!) / loop.length))
        failures.push(`second cut: the loop is ${length} mm long with a widest chord of ${widest} mm among ${loop.length}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} port seam failures:\n${failures.join("\n")}`);
}
