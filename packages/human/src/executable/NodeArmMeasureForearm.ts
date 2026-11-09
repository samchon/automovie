import { NodeArmDeviation } from "./NodeArmDeviation";

type V3 = [number, number, number];
type V2 = [number, number];

/**
 * f1's forearm and wrist readings on the reference mesh by their written
 * definitions, as new person inputs with receipts (`node:arm-measure`); the
 * right arm in the reference's own native frame and pose (+X forward, +Y up,
 * +Z anatomical left, millimetres), the side ANSUR measures.
 *
 * Landmarks (Wu et al. 2005, ISB): the epicondyles EL and EM are the two
 * contact points of a caliper closed across the elbow band (25 mm either
 * side of the elbow break along the upper arm's line, within 55 mm of it),
 * its jaws turned about the upper arm's line within 30 degrees of the
 * frontal plane to the greatest breadth; the styloids RS and US the same
 * across the wrist band, from 5 mm above the forearm's narrowest slice to
 * 5 mm past the wrist crease (where the slice radius first rises 5 % past
 * the narrowest), turned within 60 degrees (the reference forearm stands
 * pronated). EC is the epicondyles' midpoint and the forearm axis runs from
 * EC to the styloids' midpoint.
 *
 * Lengths: stylion's level is the radial styloid's projection on that axis;
 * radiale-stylion (ANSUR II, `forearmLength`) is the EC-to-stylion length
 * less de Leva 1996's radiale offset, 0.0432 of acromion-radiale past the
 * elbow centre (the arm law's own transfer, `AutoMovieHumanArmBones`).
 *
 * Calipers (two readings each, no shape fitted): at Perry et al. 2021's
 * forearm station, 0.2 radiale-stylion past radiale, the section's breadth
 * along the epicondyle line and its depth across it; at stylion, the
 * breadth along the styloid line and the depth across it. The section at
 * stylion also gives its taut-tape perimeter, which checks the stylion level
 * against f1's wrist girth (ANSUR II, over stylion).
 */
export namespace NodeArmMeasureForearm {
  /** The receipt. */
  export interface IReceipt {
    /** Landmarks, native mm. */
    landmarks: Record<"EL" | "EM" | "RS" | "US" | "EC" | "WC", V3>;

    /** Biepicondylar and bistyloid skin breadths, mm. */
    breadths: { epicondylar: number; styloid: number };

    /** Elbow centre to the styloids' midpoint, and to stylion's level, mm. */
    lengths: { elbowToWrist: number; elbowToStylion: number; radialeStylion: number };

    /** Caliper readings: forearm at Perry's station, wrist at stylion, mm. */
    calipers: { forearm: { station: number; breadth: number; depth: number; hull: number }; wrist: { station: number; breadth: number; depth: number; hull: number } };
  }

  /**
   * Reads the receipt.
   *
   * @param mesh The reference mesh, native mm.
   * @param arm The right arm's vertices, native mm.
   * @param acromionRadiale f1's acromion-radiale, mm (its input), for de Leva's radiale offset.
   */
  export function read(mesh: NodeArmDeviation.IMesh, arm: readonly V3[], acromionRadiale: number): IReceipt | string {
    const slices: { c: V3[]; r: number[]; elbow: number; wrist: number; crease: number } = profile(arm);
    const { c, elbow, wrist, crease } = slices;
    const upper: { point: V3; axis: V3 } = line(c, Math.round(0.3 * elbow), Math.round(0.9 * elbow));
    const lower: { point: V3; axis: V3 } = line(c, Math.round(elbow + 0.15 * (wrist - elbow)), Math.round(wrist - 0.15 * (wrist - elbow)));
    // The right arm's lateral is anatomical right, native -Z.
    const lateral: V3 = [0, 0, -1];
    const near = (l: { point: V3; axis: V3 }, reach: number, lo: number, hi: number): V3[] =>
      mesh.points.filter((p: V3): boolean => {
        const d: V3 = sub(p, l.point);
        const along: number = dot(d, l.axis);
        return along >= lo && along <= hi && Math.hypot(...sub(d, scale(l.axis, along))) <= reach;
      });
    const atUpper: number = dot(sub(c[elbow]!, upper.point), upper.axis);
    const elbowBand: V3[] = near(upper, 55, atUpper - 25, atUpper + 25);
    // The lower line's axis points up the arm (toward the elbow): the crease lies at smaller values than the narrowest slice.
    const atWrist: number = dot(sub(c[wrist]!, lower.point), lower.axis);
    const atCrease: number = dot(sub(c[crease]!, lower.point), lower.axis);
    const wristBand: V3[] = near(lower, 40, Math.min(atWrist, atCrease) - 5, Math.max(atWrist, atCrease) + 5);
    if (elbowBand.length < 10 || wristBand.length < 10) return `bands too thin: elbow ${elbowBand.length}, wrist ${wristBand.length}`;
    const [el, em]: [V3, V3] = caliper(elbowBand, upper.axis, lateral, 30);
    const [rs, us]: [V3, V3] = caliper(wristBand, lower.axis, lateral, 60);
    const ec: V3 = scale(add(el, em), 0.5);
    const wc: V3 = scale(add(rs, us), 0.5);
    const axis: V3 = unit(sub(wc, ec));
    const elbowToStylion: number = dot(sub(rs, ec), axis);
    const radiale: number = 0.0432 * acromionRadiale;
    const radialeStylion: number = elbowToStylion - radiale;
    const reading = (station: number, across: V3): { station: number; breadth: number; depth: number; hull: number } | string => {
      const x: V3 = unit(sub(across, scale(axis, dot(across, axis))));
      const y: V3 = cross(axis, x);
      const loop: V2[] | null = NodeArmDeviation.section(mesh, add(ec, scale(axis, station)), axis, x, y);
      if (loop === null) return `no section encloses the forearm axis at ${station.toFixed(1)} mm past EC`;
      const xs: number[] = loop.map((p: V2): number => p[0]);
      const ys: number[] = loop.map((p: V2): number => p[1]);
      return { station, breadth: Math.max(...xs) - Math.min(...xs), depth: Math.max(...ys) - Math.min(...ys), hull: hull(loop) };
    };
    const forearm = reading(radiale + 0.2 * radialeStylion, sub(el, em));
    const wristCaliper = reading(elbowToStylion, sub(rs, us));
    if (typeof forearm === "string") return forearm;
    if (typeof wristCaliper === "string") return wristCaliper;
    return {
      landmarks: { EL: el, EM: em, RS: rs, US: us, EC: ec, WC: wc },
      breadths: { epicondylar: dist(el, em), styloid: dist(rs, us) },
      lengths: { elbowToWrist: dist(ec, wc), elbowToStylion, radialeStylion },
      calipers: { forearm, wrist: wristCaliper },
    };
  }

  /** The two contact points of a caliper closed across `points`, its jaws normal to a direction turned about `axis` within `range` degrees of `start` to the greatest breadth: [the end along the direction, the other]. */
  function caliper(points: readonly V3[], axis: V3, start: V3, range: number): [V3, V3] {
    const base: V3 = unit(sub(start, scale(axis, dot(start, axis))));
    const side: V3 = cross(axis, base);
    let best: [V3, V3] = [points[0]!, points[0]!];
    let width: number = -Infinity;
    for (let deg: number = -range; deg <= range; deg += 1) {
      const t: number = (deg * Math.PI) / 180;
      const dir: V3 = add(scale(base, Math.cos(t)), scale(side, Math.sin(t)));
      let hi: V3 = points[0]!;
      let lo: V3 = points[0]!;
      for (const p of points) {
        if (dot(p, dir) > dot(hi, dir)) hi = p;
        if (dot(p, dir) < dot(lo, dir)) lo = p;
      }
      if (dot(sub(hi, lo), dir) > width) [width, best] = [dot(sub(hi, lo), dir), [hi, lo]];
    }
    return best;
  }

  /** Slice centroids and mean radii along the arm's principal axis, with the elbow break, the narrowest forearm slice and the wrist crease (`NodeArmReference.register`'s reading). */
  function profile(points: readonly V3[]): { c: V3[]; r: number[]; elbow: number; wrist: number; crease: number } {
    const mean: V3 = scale(points.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / points.length);
    let axis: V3 = unit(sub(points.reduce((a: V3, b: V3): V3 => (b[1] > a[1] ? b : a)), points.reduce((a: V3, b: V3): V3 => (b[1] < a[1] ? b : a))));
    for (let k: number = 0; k < 20; ++k) {
      let next: V3 = [0, 0, 0];
      for (const p of points) next = add(next, scale(sub(p, mean), dot(sub(p, mean), axis)));
      axis = unit(next);
    }
    if (axis[1] < 0) axis = scale(axis, -1);
    const ts: number[] = points.map((p: V3): number => -dot(sub(p, mean), axis));
    const lo: number = Math.min(...ts);
    const hi: number = Math.max(...ts);
    const n: number = 60;
    const bins: V3[][] = Array.from({ length: n }, (): V3[] => []);
    points.forEach((p: V3, i: number): void => {
      bins[Math.min(n - 1, Math.floor(((ts[i]! - lo) / (hi - lo)) * n))]!.push(p);
    });
    const c: V3[] = bins.map((b: V3[]): V3 => (b.length === 0 ? [NaN, NaN, NaN] : scale(b.reduce((a: V3, x: V3): V3 => add(a, x), [0, 0, 0]), 1 / b.length)));
    const r: number[] = bins.map((b: V3[], k: number): number => (b.length === 0 ? Infinity : b.reduce((s: number, p: V3): number => s + dist(p, c[k]!), 0) / b.length));
    const counts: number[] = bins.map((b: V3[]): number => b.length).sort((a: number, b: number): number => a - b);
    let wrist: number = Math.floor(0.6 * n);
    for (let k: number = Math.floor(0.45 * n); k <= Math.floor(0.85 * n); ++k) if (bins[k]!.length >= counts[Math.floor(n / 2)]! / 2 && r[k]! < r[wrist]!) wrist = k;
    const chord = (a: number, b: number): number => {
      let s: number = 0;
      const d: V3 = unit(sub(c[b]!, c[a]!));
      for (let i: number = a; i <= b; ++i) {
        if (bins[i]!.length === 0) continue;
        const w: V3 = sub(c[i]!, c[a]!);
        s += Math.hypot(...sub(w, scale(d, dot(w, d))));
      }
      return s;
    };
    let elbow: number = 3;
    let best: number = Infinity;
    for (let b: number = 3; b < wrist - 3; ++b) {
      if (bins[b]!.length === 0) continue;
      const s: number = chord(0, b) + chord(b, wrist);
      if (s < best) [best, elbow] = [s, b];
    }
    let crease: number = wrist;
    while (crease + 1 < n && r[crease + 1]! <= r[wrist]! * 1.05) ++crease;
    return { c, r, elbow, wrist, crease };
  }

  /** The least-squares line through the populated centroids `from..to`, its axis turned toward the lower index (up the arm). */
  function line(c: readonly V3[], from: number, to: number): { point: V3; axis: V3 } {
    const used: V3[] = c.slice(Math.min(from, to), Math.max(from, to) + 1).filter((p: V3): boolean => p.every(Number.isFinite));
    const point: V3 = scale(used.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / used.length);
    let axis: V3 = unit(sub(used[0]!, used[used.length - 1]!));
    for (let k: number = 0; k < 30; ++k) {
      let next: V3 = [0, 0, 0];
      for (const p of used) next = add(next, scale(sub(p, point), dot(sub(p, point), axis)));
      axis = unit(next);
    }
    if (dot(axis, sub(used[0]!, used[used.length - 1]!)) < 0) axis = scale(axis, -1);
    return { point, axis };
  }

  /** Convex hull perimeter of planar points (Andrew's monotone chain): a taut tape. */
  function hull(points: readonly V2[]): number {
    if (points.length < 3) return 0;
    const p: V2[] = [...points].sort((a: V2, b: V2): number => a[0] - b[0] || a[1] - b[1]);
    const turn = (o: V2, a: V2, b: V2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (list: V2[]): V2[] => {
      const out: V2[] = [];
      for (const q of list) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
        out.push(q);
      }
      out.pop();
      return out;
    };
    const h: V2[] = [...half(p), ...half([...p].reverse())];
    let sum: number = 0;
    for (let k: number = 0; k < h.length; ++k) sum += Math.hypot(h[(k + 1) % h.length]![0] - h[k]![0], h[(k + 1) % h.length]![1] - h[k]![1]);
    return sum;
  }
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function unit(a: V3): V3 {
  const n: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / n, a[1] / n, a[2] / n];
}

function dist(a: V3, b: V3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
