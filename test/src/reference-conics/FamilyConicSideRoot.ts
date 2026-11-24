import { AutoMovieLoftViewFullSource, AutoMovieNaturalSpline, AutoMovieViewChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanF1, AutoMovieHumanJoinLoop } from "@automovie/human";
import type { AutoMovieVector3Tuple, IAutoMovieHumanConicLoft, IAutoMovieHumanF1 } from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicFairing as Fairing } from "./FamilyConicFairing";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicJunction as Junction } from "./FamilyConicJunction";
import { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * The arm's root refitted on its port (joints-one-shot.md, "The arm's root on its port"; the human skill's Connections rule: the child's
 * view curves start from the loop the parent publishes, and the child owns the mass between its joint and the port).
 *
 * The arm's first knot moves to the port, the armscye loop's shallowest station on the arm's course (`AutoMovieHumanF1.armscyePort`),
 * so the arm has no stretch before its first knot and no extension acts on it. Its knots from the port to the protected mark are
 * refitted; the knots past the mark keep their stored values. The skin over the port is the port blend
 * (`AutoMovieHumanBoundSection.port`): at each station and phase `P = q(tau) M + ((1 - q(tau)) r_L(phi) + h1(tau) (mark - s_L) sigma(phi))
 * dir(phi)` in the station's chart, `M` the arm's own section, `r_L` and `s_L` the loop's radius and station by phase, `sigma` the host's
 * slope (the radius's station rate that keeps the port's tangent in the host's tangent plane at the loop), `tau = (s - s_L) / (mark - s_L)`
 * held to [0, 1], `q` the quintic Hermite step and `h1` the first-derivative quintic Hermite basis. The loop's values and slopes are
 * therefore fixed: `P` is the loop at its own station at every phase and leaves it along the host's skin.
 *
 * - **Objective.** The fairing energy (`FamilyConicFairing`, minimum variation: Moreton and Sequin 1992) on the port's rings at every
 *   layer from the port to the mark (`AutoMovieHumanF1.LAYER_MM`) and on its eight guide-phase lines through them, each ring weighted by
 *   its share of the stretch.
 * - **Constraints.** `M` star-shaped wherever `q > 0`, the blend's premise: on every ring each phase's ray meets `M`'s chain and
 *   successive points turn the same way about the course (the row is minus their cross product over the larger radius, mm). A section
 *   whose ray finds no point refuses the reading.
 * - **Start.** The first section seeded from the loop's radial profile at the port (`FamilyConicSection.seed`); the other knots as stored.
 * - **Derivatives.** Forward differences, one column per free field value, each a reading of its own; a reading builds one section per
 *   station and no loft, so a column costs milliseconds.
 * - **Fit.** `FamilyConicFit.fitGroup` with the fairing fit's relative termination (`FamilyConicBody`, `FAIR_CONVERGED`).
 *
 * Usage, from `test/`: `FamilyConicSideRoot.cjs --out=<dir> [--readings=<n>]`. It logs one JSON line per event and writes `refit.json`
 * (knots, values, the guide extents along the port, the cost table) under the directory; nothing is stored in the package.
 */
namespace FamilyConicSideRoot {
  type V = AutoMovieVector3Tuple;
  type P = [number, number];

  /** Guide-phase lines through the rings, as the junction's fairing reads them. */
  const LINES: number = 8;

  /** The fairing fit's convergence share (`FamilyConicBody`, `FAIR_CONVERGED`: the energy's own resolution on 48-point rings). */
  const CONVERGED: number = (2 * Math.PI / 48) ** 2 / 12;

  /** Successive accepted steps under `CONVERGED` (`FamilyConicBody`, `FAIR_CONVERGED_STEPS`). ESTIMATE. */
  const CONVERGED_STEPS: number = 3;

  /** The feasibility tolerance of the star rows, mm: the master's own attachment tolerance (1e-6 m). */
  const TOLERANCE: number = 1e-3;

  /** The quintic Hermite step of the port (`AutoMovieHumanBoundSection`'s `flat`). */
  const step = (t: number): number => t * t * t * (10 - 15 * t + 6 * t * t);

  /** Refit the arm's root and write the result. */
  export async function main(): Promise<void> {
    const out: string | undefined = process.argv.find((arg): boolean => arg.startsWith("--out="))?.slice("--out=".length);
    if (out === undefined) throw new Error("usage: --out=<dir> [--readings=<n>]");
    const bound: number = Number(process.argv.find((arg): boolean => arg.startsWith("--readings="))?.slice("--readings=".length) ?? Infinity);
    const log = (event: string, detail: object): void => { process.stdout.write(JSON.stringify({ event, ...detail }) + "\n"); };
    const started: number = performance.now();

    const figure: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const port = AutoMovieHumanF1.armscyePort(figure);
    const stored: IAutoMovieHumanConicLoft.IFamily = figure.body.arm;
    if (!(stored.knots[0]! > port.from)) throw new Error("the arm's stored first knot does not stand past its port");
    log("side-root-port", { from: port.from, mark: port.mark, extent: port.extent, firstKnot: stored.knots[0], elapsedMs: performance.now() - started });

    // The loop's station and radius by phase: periodic natural cubics through the clocks' samples over three turns, as the port reads them.
    const turn: number = 2 * Math.PI;
    const order = port.clocks.map(({ phase, station, radius }, index: number) => ({ phase, station, radius, index })).sort((a, b): number => a.phase - b.phase);
    const xs: number[] = [], ss: number[] = [], rs: number[] = [];
    for (let k = -1; k <= 1; ++k) for (const row of order) { xs.push(row.phase + k * turn); ss.push(row.station); rs.push(row.radius); }
    const sSpline = AutoMovieNaturalSpline.create(xs, ss), rSpline = AutoMovieNaturalSpline.create(xs, rs);
    const base: number = order[0]!.phase;
    // The host's slope at each clock, as the port reads it (`AutoMovieHumanBoundSection`, `portSection`): the radius's station rate that
    // keeps the port's station tangent in the host's tangent plane, `sigma = -n . (o' + r w') / (n . e)`.
    const sigmaOf = ({ clock, station, phase, radius }: { clock: number; station: number; phase: number; radius: number }) => {
      const jet = AutoMovieHumanConicLoft.axis(stored).jet?.(station);
      if (jet === undefined || jet === null) throw new Error("the arm's course has no jet at " + station);
      const n: V = [...port.master.normal(clock)] as V, c: number = Math.cos(phase), d: number = Math.sin(phase);
      const e: V = [0, 1, 2].map((i: number): number => c * jet.value.u[i]! + d * jet.value.v[i]!) as V;
      const moving: V = [0, 1, 2].map((i: number): number => jet.first.origin[i]! + radius * (c * jet.first.u[i]! + d * jet.first.v[i]!)) as V;
      return { e, moving, n, across: dot(n, e), sigma: -dot(n, moving) / dot(n, e) };
    };
    const host = port.clocks.map(sigmaOf);
    const gs: number[] = [];
    for (let k = -1; k <= 1; ++k) for (const row of order) gs.push(host[row.index]!.sigma);
    const sigmaSpline = AutoMovieNaturalSpline.create(xs, gs);
    const loopAt = (phi: number): { s: number; r: number; sigma: number } => {
      const x: number = base + ((((phi - base) % turn) + turn) % turn);
      return { s: AutoMovieNaturalSpline.evaluate(sSpline, x), r: AutoMovieNaturalSpline.evaluate(rSpline, x),
        sigma: AutoMovieNaturalSpline.evaluate(sigmaSpline, x) };
    };
    /** The first-derivative quintic Hermite basis of the port's slope term (`AutoMovieHumanBoundSection`, `leave`). */
    const leave = (t: number): number => (t <= 0 || t >= 1 ? 0 : t - 6 * t ** 3 + 8 * t ** 4 - 3 * t ** 5);
    /** The port's radius along a phase's ray, less the own section's share: the loop's share and the host's slope. */
    const portRadius = (s: number, phi: number): { w: number; radial: number } => {
      const loop = loopAt(phi), length: number = port.mark - loop.s;
      const tau: number = Math.min(1, Math.max(0, (s - loop.s) / length));
      return { w: step(tau), radial: (1 - step(tau)) * loop.r + leave((s - loop.s) / length) * length * loop.sigma };
    };

    // How the port leaves the loop, which no field of M changes (`q'(0) = q(0) = 0`): at each clock the port's station tangent is the
    // course frame's motion carrying the loop's local point, `P_s = o' + x u' + y v'` with `(x, y) = r_L (cos phi, sin phi)`. Against the
    // host's skin there: `alpha`, the angle of that tangent (square to the loop's own tangent) out of the host's tangent plane, and
    // `beta`, the dihedral turn between the host's skin and the port's (their normals, each outward), which the shared-loop merge's fold
    // of radius `R` takes over its width `hypot(reach, R tan(beta / 2))`.
    // Measured twice: with the zero slope the port had, and with the host's slope it now carries (`P_s` plus `sigma e`, in the host's
    // tangent plane by construction). `across` is the cosine between the host's normal and the arm's ray: at or below zero the host turns
    // back under the arm there (the axillary vault concave along the course), and no radial slope can lay the port on the host's skin.
    const degrees = (a: number): number => (a * 180) / Math.PI;
    const slopes = port.clocks.map(({ clock, station }, i: number) => {
      const jet = AutoMovieHumanConicLoft.axis(stored).jet?.(station);
      if (jet === undefined || jet === null) throw new Error("the arm's course has no jet at " + station);
      const { e, moving, n, across, sigma } = host[i]!;
      const loop = port.master.at(clock), tangent: V = unit([loop.first[0]!, loop.first[1]!, loop.first[2]!]);
      const point: V = [loop.point[0]!, loop.point[1]!, loop.point[2]!];
      const measure = (along: V) => {
        const leaving: V = unit(sub(along, scale(tangent, dot(along, tangent))));
        let portNormal: V = unit(cross(tangent, along));
        if (dot(portNormal, sub(point, [jet.value.origin[0]!, jet.value.origin[1]!, jet.value.origin[2]!])) < 0) portNormal = scale(portNormal, -1);
        const beta: number = Math.acos(Math.max(-1, Math.min(1, dot(n, portNormal))));
        return { alpha: degrees(Math.asin(Math.max(-1, Math.min(1, dot(leaving, n))))), beta: degrees(beta),
          width: Math.hypot(port.fold.reach, port.fold.radius * Math.tan(beta / 2)) };
      };
      return { clock, across, sigma, zero: measure(moving), host: measure([0, 1, 2].map((k: number): number => moving[k]! + sigma * e[k]!) as V) };
    });
    const quartiles = (xs: number[]): number[] => { const s = [...xs].sort((a, b) => a - b); return [0, 0.25, 0.5, 0.75, 1].map((q) => s[Math.min(s.length - 1, Math.floor(q * s.length))]!); };
    const octants = Array.from({ length: 8 }, (_, o: number) => {
      const rows = slopes.filter(({ clock }) => Math.floor((clock / turn) * 8) === o);
      const mean = (f: (r: (typeof rows)[number]) => number): number => rows.reduce((sum, r) => sum + f(r), 0) / rows.length;
      return { from: (o * turn) / 8, betaZero: mean((r) => r.zero.beta), betaHost: mean((r) => r.host.beta), across: mean((r) => r.across),
        sigma: mean((r) => r.sigma) };
    });
    const slope = {
      zero: { alpha: quartiles(slopes.map((r) => r.zero.alpha)), beta: quartiles(slopes.map((r) => r.zero.beta)), width: quartiles(slopes.map((r) => r.zero.width)) },
      host: { alpha: quartiles(slopes.map((r) => r.host.alpha)), beta: quartiles(slopes.map((r) => r.host.beta)), width: quartiles(slopes.map((r) => r.host.width)) },
      across: quartiles(slopes.map((r) => r.across)), sigma: quartiles(slopes.map((r) => r.sigma)),
      turnedBack: slopes.filter((r) => r.across <= 0).map((r) => r.clock), fold: port.fold, octants,
    };
    log("side-root-slope", slope);

    // The slope's admissible range per clock, from the port's own form (`r_P = (1 - q) r_L + q r_M + h1 (mark - s_L) sigma`, with
    // h1 = t (1 - t)^3 (1 + 3 t) >= 0, largest 16/81 at t = 1/3): star shape with no help from M (r_M >= 0) needs
    // (1 - q) r_L + h1 L sigma > 0 for every tau, and (1 - q) / h1 = (1 + 3 t + 6 t^2) / (t (1 + 3 t)) is least, 2.5, as t -> 1, so
    // sigma > -2.5 r_L / L; a bulge no wider than the merge's fold, whose width is its reach once beta = 0, needs the slope term's largest
    // radial excursion (16/81) L sigma at most the reach, so sigma <= 81 reach / (16 L). L = mark - s_L at that clock.
    const bounds = port.clocks.map(({ clock, station, radius }, i: number) => {
      const L: number = port.mark - station, sigma: number = host[i]!.sigma;
      const lower: number = (-2.5 * radius) / L, upper: number = (81 * port.fold.reach) / (16 * L);
      return { clock, sigma, lower, upper, admissible: sigma > lower && sigma <= upper && Number.isFinite(sigma) };
    });
    const breaks = bounds.flatMap((b, i: number) => (b.admissible !== bounds[(i + bounds.length - 1) % bounds.length]!.admissible ? [{ clock: b.clock, entering: b.admissible }] : []));
    // A band across the loop under the arm: at each clock whose ray is turned back or near it, the trunk's skin at trunk-station offsets
    // of -6 to 6 mm from the loop's own host station, each point's arm address, ray, n . e and sigma as the port would read them there.
    const hostSkin = AutoMovieLoftViewFullSource.create(port.host);
    const armAxis = AutoMovieHumanConicLoft.axis(stored);
    const band = port.clocks.flatMap(({ clock }, i: number) => {
      if (!(host[i]!.across < 0.3)) return [];
      const [hs, hp] = port.master.hostAt(clock).point;
      return [{ clock, offsets: [-6, -4, -2, 0, 2, 4, 6].map((d: number) => {
        const s = hs + d, pick = (a: number, b: number): V => { const q = hostSkin.point(a, b); return [q[0]!, q[1]!, q[2]!]; };
        const p = pick(s, hp);
        let n: V = unit(cross(sub(pick(s + 1e-3, hp), pick(s - 1e-3, hp)), sub(pick(s, hp + 1e-3), pick(s, hp - 1e-3))));
        const centre = port.host.axis.at(s).origin;
        if (dot(n, sub(p, [centre[0]!, centre[1]!, centre[2]!])) < 0) n = scale(n, -1);
        const station: number = AutoMovieHumanJoinLoop.address({ name: stored.name, axis: armAxis }, [0, stored.knots.at(-1)!], p, port.clocks[i]!.station)[0];
        const jet = armAxis.jet?.(station);
        if (jet === undefined || jet === null) return { d, station, across: NaN, sigma: NaN };
        const q = sub(p, [jet.value.origin[0]!, jet.value.origin[1]!, jet.value.origin[2]!]);
        const x = dot(q, [jet.value.u[0]!, jet.value.u[1]!, jet.value.u[2]!]), y = dot(q, [jet.value.v[0]!, jet.value.v[1]!, jet.value.v[2]!]);
        const r = Math.hypot(x, y), c = x / r, sn = y / r;
        const e: V = [0, 1, 2].map((k: number): number => c * jet.value.u[k]! + sn * jet.value.v[k]!) as V;
        const moving: V = [0, 1, 2].map((k: number): number => jet.first.origin[k]! + r * (c * jet.first.u[k]! + sn * jet.first.v[k]!)) as V;
        const L = port.mark - station;
        return { d, station, across: dot(n, e), sigma: -dot(n, moving) / dot(n, e), lower: (-2.5 * r) / L, upper: (81 * port.fold.reach) / (16 * L) };
      }) }];
    });
    log("side-root-slope-bounds", { inadmissible: bounds.filter((b) => !b.admissible).length, breaks,
      sigmaOverLower: quartiles(bounds.map((b) => b.sigma / b.lower)), band: band.filter((_, k: number) => k % 4 === 0) });
    // `--measure-only`: the port and slope readings alone, no refit.
    if (process.argv.includes("--measure-only")) return;

    // The phases: the figure's count for the arm's first stored ring's girth, a multiple of the lines.
    const firstRing = Junction.read({ face: stored.name, family: stored, rings: [stored.knots[0]!], lines: [], guides: [], bracket: [], cut: [],
      phases: Array.from({ length: 96 }, (_, k: number): number => (turn * k) / 96) }, { origin: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] },
    Junction.sections()).rings[0]!;
    const girth: number = firstRing.reduce((sum: number, p: V, k: number): number => sum + Math.hypot(...(sub(firstRing[(k + 1) % firstRing.length]!, p))), 0);
    const count: number = AutoMovieHumanConicLoft.phaseCount(stored, girth);
    const phases: number[] = Array.from({ length: count }, (_, k: number): number => (turn * k) / count);

    // The knots: the port, then every stored knot; the free ones stand before the mark.
    const knots: number[] = [port.from, ...stored.knots];
    const free: number[] = knots.flatMap((k: number, j: number): number[] => (k < port.mark ? [j] : []));
    const first: number[] = C.seed(phases.map((phi: number): P => { const { r } = loopAt(phi); return [r * Math.cos(phi), r * Math.sin(phi)]; }), stored.layout);
    const startValues: number[][] = stored.values.map((field: number[], f: number): number[] => [first[f]!, ...field]);
    const columns: { f: number; j: number }[] = free.flatMap((j: number) => startValues.map((_, f: number) => ({ f, j })));
    const initial: number[] = columns.map(({ f, j }): number => startValues[f]![j]!);
    const familyOf = (state: readonly number[]): IAutoMovieHumanConicLoft.IFamily => {
      const values: number[][] = startValues.map((field: number[]): number[] => [...field]);
      columns.forEach(({ f, j }, c: number): void => { values[f]![j] = state[c]!; });
      return { ...stored, knots, values };
    };

    // The rings: every layer from the port to the mark, and the mark.
    const stations: number[] = [];
    for (let s = port.from; s < port.mark; s += AutoMovieHumanF1.LAYER_MM) stations.push(s);
    stations.push(port.mark);
    const span: number = port.mark - port.from;
    const weights: number[] = stations.map((_, i: number): number =>
      (stations[Math.min(i + 1, stations.length - 1)]! - stations[Math.max(i - 1, 0)]!) / 2 / span);
    const guides: number[] = Array.from({ length: LINES }, (_, g: number): number => (g * count) / LINES);
    let sections: number = 0;

    /** One reading: the fairing residuals on the port's rings and lines, and the star rows of the arm's own rings. */
    const reading = (state: readonly number[]): { fairing: number[]; star: number[]; folds: { station: number; phase: number; turning: number }[] } | string => {
      const family = familyOf(state), provider = Junction.sections(), axis = AutoMovieHumanConicLoft.axis(family), sectionAt = provider.prepare(family);
      const fairing: number[] = [], star: number[] = [];
      const skin: V[][] = [];
      const folds: { station: number; phase: number; turning: number }[] = [];
      for (const [i, s] of stations.entries()) {
        const frame = axis.at(s), section = sectionAt(s);
        const origin: V = [frame.origin[0]!, frame.origin[1]!, frame.origin[2]!];
        const u: V = [frame.u[0]!, frame.u[1]!, frame.u[2]!], v: V = [frame.v[0]!, frame.v[1]!, frame.v[2]!];
        const own: P[] = [];
        for (const phi of phases) {
          const read = AutoMovieViewChain.read(section, phi);
          if (read === null) return `the arm's own section at ${s} mm has no point at phase ${phi}`;
          own.push([read.point[0], read.point[1]]);
        }
        own.forEach((p: P, k: number): void => {
          const q: P = own[(k + 1) % own.length]!;
          star.push(-(p[0] * q[1] - p[1] * q[0]) / Math.max(Math.hypot(...p), Math.hypot(...q)));
        });
        const flatRing: P[] = phases.map((phi: number, k: number): P => {
          const { w, radial } = portRadius(s, phi);
          return [w * own[k]![0] + radial * Math.cos(phi), w * own[k]![1] + radial * Math.sin(phi)];
        });
        // The port's own star shape, the guard's question (a diagnostic, not a row): where it fails the station and phase are reported.
        flatRing.forEach((p: P, k: number): void => {
          const q: P = flatRing[(k + 1) % flatRing.length]!, turning: number = -(p[0] * q[1] - p[1] * q[0]) / Math.max(Math.hypot(...p), Math.hypot(...q));
          if (turning > 0) folds.push({ station: s, phase: phases[k]!, turning });
        });
        const ring: V[] = flatRing.map(([x, y]: P): V => [origin[0] + x * u[0] + y * v[0], origin[1] + x * u[1] + y * v[1], origin[2] + x * u[2] + y * v[2]]);
        skin.push(ring);
        fairing.push(...Fairing.residuals(ring, true, cross(u, v), weights[i]!));
      }
      for (const g of guides) fairing.push(...Fairing.residuals(skin.map((ring: V[]): V => ring[g]!), false));
      sections += provider.count;
      return { fairing, star, folds };
    };

    let readings: number = 0;
    const read = (state: readonly number[], derivatives: boolean) => {
      const at: number = performance.now(), before: number = sections;
      const base = reading(state);
      if (typeof base === "string") return base;
      const fairingGradients = base.fairing.map(() => new Map<number, number>());
      const starGradients = base.star.map(() => new Map<number, number>());
      if (derivatives) for (let c = 0; c < state.length; ++c) {
        const h: number = 1e-6 * Math.max(1, Math.abs(state[c]!));
        const moved = [...state];
        moved[c]! += h;
        const next = reading(moved);
        if (typeof next === "string") return "column " + c + ": " + next;
        next.fairing.forEach((x: number, r: number): void => { const d = (x - base.fairing[r]!) / h; if (d !== 0) fairingGradients[r]!.set(c, d); });
        next.star.forEach((x: number, r: number): void => { const d = (x - base.star[r]!) / h; if (d !== 0) starGradients[r]!.set(c, d); });
      }
      const measured: F.IGroupRow[] = base.fairing.map((value, r) => ({ value, gradient: fairingGradients[r]! }));
      const inside: F.IGroupRow[] = base.star.map((value, r) => ({ value, gradient: starGradients[r]! }));
      ++readings;
      log("side-root-reading", { index: readings, derivatives, columns: state.length, sections: sections - before, fairingRows: measured.length,
        starRows: inside.length, worstStar: Math.max(...base.star), portFolds: base.folds.length,
        foldPhases: [...new Set(base.folds.map((f) => Math.round(f.phase * 1000) / 1000))].slice(0, 12), elapsedMs: performance.now() - at });
      if (readings >= bound) {
        log("side-root-bounded", { readings, elapsedMs: performance.now() - started });
        process.exit(0);
      }
      return F.readGroup(state, derivatives, [{ rows: () => ({ measured, incidence: [], inside, hard: [] }) }]);
    };

    const fit = F.fitGroup(initial, read, TOLERANCE, 60, (detail): void => log("side-root-iteration", detail), undefined, undefined, undefined,
      { tolerance: CONVERGED, steps: CONVERGED_STEPS });
    if (typeof fit === "string") { log("side-root-refused", { refusal: fit, elapsedMs: performance.now() - started }); return; }
    const family = familyOf(fit.values), fields = AutoMovieHumanConicLoft.reader(family);
    const extents = AutoMovieHumanConicSection.extents(family.layout);
    const along = stations.map((s: number) => ({ station: s, extents: extents.map((f: number): number => Math.abs(fields(s)[f]!)) }));
    // Where the port's own star shape fails on the refitted arm: each such phase's clock, the host's turn there (`across`, the cosine of
    // the host's normal on the arm's ray) and the port's radius along the phase's ray at every ring station, against `tau`.
    const final = reading(fit.values);
    const folded = typeof final === "string" ? [] : [...new Set(final.folds.map((f) => f.phase))];
    const profiles = folded.slice(0, 12).map((phi: number) => {
      const loop = loopAt(phi), nearest = port.clocks.reduce((best, c, i) => (Math.abs(Math.atan2(Math.sin(c.phase - phi), Math.cos(c.phase - phi))) <
        Math.abs(Math.atan2(Math.sin(port.clocks[best]!.phase - phi), Math.cos(port.clocks[best]!.phase - phi))) ? i : best), 0);
      const sectionAt = Junction.sections().prepare(family);
      return { phase: phi, clock: port.clocks[nearest]!.clock, across: host[nearest]!.across, sigma: loop.sigma, loopStation: loop.s,
        radius: stations.map((s: number) => {
          const own = AutoMovieViewChain.read(sectionAt(s), phi), { w, radial } = portRadius(s, phi);
          return { station: s, tau: Math.min(1, Math.max(0, (s - loop.s) / (port.mark - loop.s))),
            r: own === null ? null : w * Math.hypot(own.point[0], own.point[1]) + radial };
        }) };
    });
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "refit.json"), JSON.stringify({ knots: family.knots, values: family.values, along, slope, profiles, port: { from: port.from, mark: port.mark },
      fit: { iteration: fit.iteration, objective: fit.objective, incidence: fit.incidence, stopped: fit.stopped, timings: fit.timings, steps: fit.steps },
      cost: { readings, sections, elapsedMs: performance.now() - started } }, null, 2));
    log("side-root-done", { iteration: fit.iteration, objective: fit.objective, incidence: fit.incidence, stopped: fit.stopped, along, elapsedMs: performance.now() - started });

    // `--store`: the refitted arm into the stored arm as a candidate, its knots line and each field's row rewritten in place, after a
    // pre-emit snapshot of the file under the output directory; only when the figure's arm is the stored one, so no placement is undone.
    if (process.argv.includes("--store")) {
      const stored0 = AutoMovieHumanF1.BODY.arm;
      if (JSON.stringify(stored0.knots) !== JSON.stringify(stored.knots) || JSON.stringify(stored0.values) !== JSON.stringify(stored.values))
        throw new Error("the figure's arm is not the stored arm; the candidate is not stored");
      const file: string = path.resolve(process.cwd(), "..", "packages/human/src/generation/f1/AutoMovieHumanF1Arm.ts");
      const text: string = await fs.readFile(file, "utf8");
      await fs.mkdir(path.join(out, "pre-emit"), { recursive: true });
      await fs.writeFile(path.join(out, "pre-emit", "AutoMovieHumanF1Arm.ts"), text);
      const lines: string[] = text.split("\n");
      const knotsAt: number = lines.findIndex((line: string): boolean => /^\s*knots: \[/.test(line));
      const valuesAt: number = lines.findIndex((line: string): boolean => /^\s*values: \[/.test(line));
      if (knotsAt < 0 || valuesAt < 0) throw new Error("the arm file has no knots or values line");
      lines[knotsAt] = lines[knotsAt]!.replace(/knots: \[.*\],/, "knots: " + JSON.stringify(family.knots).replaceAll(",", ", ") + ",");
      let field: number = 0;
      for (let i = valuesAt + 1; i < lines.length && field < family.values.length; ++i)
        if (/^\s{4}\[.*\],?\s*$/.test(lines[i]!)) lines[i] = "    " + JSON.stringify(family.values[field++]).replaceAll(",", ", ") + ",";
      if (field !== family.values.length) throw new Error("the arm file holds " + field + " field rows, not " + family.values.length);
      await fs.writeFile(file, lines.join("\n"));
      log("side-root-stored", { file, snapshot: path.join(out, "pre-emit", "AutoMovieHumanF1Arm.ts"), knots: family.knots.length, fields: field });
    }
  }

  /** The difference of two points. */
  function sub(a: V, b: V): V {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** The cross product of two vectors. */
  function cross(a: V, b: V): V {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** The dot product of two vectors. */
  function dot(a: V, b: V): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** A vector scaled. */
  function scale(a: V, k: number): V {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /** A vector made unit. */
  function unit(a: V): V {
    const l: number = Math.hypot(...a);
    return l > 0 ? scale(a, 1 / l) : a;
  }
}

void FamilyConicSideRoot.main();
