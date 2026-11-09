import { AutoMovieSolidChain, AutoMovieViewLoft, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieConstructionSplit } from "@automovie/interface";

import type { AutoMovieHumanF1Body } from "../generation/AutoMovieHumanF1Body";

type V3 = [number, number, number];

/**
 * The joint survey of `node:f1-body`.
 *
 * Seams (`kind: "seam"`, the gate rows), each the two faces' own surfaces
 * evaluated where they meet: the point gap and the angle between their
 * outward normals (`S_u x S_v` times the surface's orientation sign, so a
 * knife edge, two sheets meeting back to back, reads 180 degrees, not 0):
 * - Neck: S00's top ring against head.mass's own first section (its loft
 *   without the continuation's copied end layer), at 64 shared phases; the
 *   angle there is between the two station tangents.
 * - Every band (`band.*`, a split's or a port's) on its host: a port band's
 *   columns at station 0 against the host at the port's chart ellipse
 *   (`IAutoMovieConstructionPort.ILoop`, the clock `2 pi k / count`); a split
 *   band's arc columns (`k <= count / 2`) against S00's end ring at the
 *   nearest phase of its arc. A split band's chord columns meet the other
 *   band: band 0's clock `k` against band 1's `3 count / 2 - k`.
 * - Every band on its part: the band's columns at its far station against the
 *   part's ring at the rail (the part chain's first station plus the rail
 *   depth), at the nearest part phase.
 *
 * Lines (`kind: "lines"`, information): each hip's S00 crotch loop (arc and
 * seam chord) against the leg's own first section, matched by angle about
 * the leg section's centre: how far apart the two regions' outlines are
 * where the split's band bridges them.
 *
 * Strips (`kind: "strip"`): every blend strip (`blend.*`: toes, fingers) by
 * {@link columns}.
 *
 * Measurement only; it builds nothing the tree uses.
 */
export namespace NodeF1Joints {
  /** One column's shape measures along its span. */
  export interface IColumn {
    /**
     * Orientation reversals: adjacent samples (41 across the span) whose
     * normals `S_u x S_v` point against each other, or a vanishing normal, a
     * sign change of the chart's Jacobian: the strip folds over itself there.
     */
    reversals: number;

    /** Whether a sample (51 across) lies behind its predecessor along the column's chord: the column turns back. */
    retreats: boolean;

    /** How far the column turns back, mm: the largest drop of a sample's position along the chord below an earlier sample's (0 when it never turns back). */
    depth: number;

    /**
     * Whether a sample's normal points against the column's start normal: the
     * column turns more than 90 degrees from its start somewhere (an S-bend
     * does without folding). Information, not a defect by itself.
     */
    overturned: boolean;
  }

  /**
   * Measure one column of a strip surface from station 0 to `span`.
   *
   * @param s The strip's surface.
   * @param span The far station.
   * @param c The column's phase.
   */
  export function columns(s: IAutoMovieSolidSurface, span: number, c: number): IColumn {
    const normals: V3[] = Array.from({ length: 41 }, (_: unknown, i: number): V3 => {
      const j: IAutoMovieSolidSurface.IJet = s.jet((i / 40) * span, c);
      return cross(vec(j.u), vec(j.v));
    });
    let reversals: number = 0;
    for (let i: number = 0; i + 1 < normals.length; ++i) if (!(dot(normals[i]!, normals[i + 1]!) > 0)) ++reversals;
    const overturned: boolean = normals.some((n: V3): boolean => dot(n, normals[0]!) < 0);
    const points: V3[] = Array.from({ length: 51 }, (_: unknown, i: number): V3 => vec(s.jet((i / 50) * span, c).p));
    const chord: V3 = sub(points[50]!, points[0]!);
    const along: number[] = points.map((p: V3): number => dot(sub(p, points[0]!), chord));
    const slack: number = 1e-12 * dot(chord, chord);
    const retreats: boolean = along.some((x: number, i: number): boolean => i > 0 && x < along[i - 1]! - slack);
    let reach: number = -Infinity;
    let depth: number = 0;
    for (const x of along) {
      reach = Math.max(reach, x);
      depth = Math.max(depth, reach - x);
    }
    return { reversals, retreats, overturned, depth: depth / Math.max(Math.hypot(chord[0], chord[1], chord[2]), 1e-300) };
  }

  /** Survey every joint of a realized body. */
  export function survey(body: AutoMovieHumanF1Body.IOutput, chains: readonly IAutoMovieLoftChain[], surfaces: readonly (IAutoMovieSolidSurface | null)[]): Record<string, unknown>[] {
    const out: Record<string, unknown>[] = [];
    const find: (name: string) => { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null = (name: string): { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null => {
      const index: number = chains.findIndex((c: IAutoMovieLoftChain): boolean => c.name === name);
      const surface: IAutoMovieSolidSurface | null | undefined = surfaces[index];
      return index < 0 || surface === null || surface === undefined ? null : { chain: chains[index]!, surface };
    };
    const trunk: { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null = find("trunk");
    if (trunk === null) return out;
    const T: IAutoMovieSolidSurface = trunk.surface;
    const top: number = trunk.chain.layers[trunk.chain.layers.length - 1]!.y;
    const bottom: number = trunk.chain.layers[0]!.y;

    // Neck: S00's top ring against head.mass's own first section.
    const headPart: IAutoMovieViewPart | undefined = body.parts.get("head.mass");
    const own: IAutoMovieLoftChain | null = headPart === undefined ? null : AutoMovieViewLoft.create(headPart).chain;
    const H: IAutoMovieSolidSurface | null = own === null ? null : AutoMovieSolidChain.surface(own);
    if (own !== null && H !== null) {
      const start: number = own.layers[0]!.y;
      const rows: IRow[] = phases(64).map((phi: number): IRow => {
        const t: IAutoMovieSolidSurface.IJet = T.jet(top, phi);
        const h: IAutoMovieSolidSurface.IJet = H.jet(start, phi);
        return { clock: deg(phi), gap: len(sub(vec(h.p), vec(t.p))), angle: angle(vec(t.u), vec(h.u)) };
      });
      out.push({ kind: "seam", joint: "neck", host: "trunk top", child: "head.mass own first section", ...extremes(rows) });
    }

    // Bands on their hosts, parts and each other.
    const bandSeams: (band: string, hostFace: string, hostSurface: IAutoMovieSolidSurface, host: (k: number, c: number) => IAutoMovieSolidSurface.IJet | null, partFace: string, rail: number, count: number, corners?: number[]) => void = (
      band: string,
      hostFace: string,
      hostSurface: IAutoMovieSolidSurface,
      host: (k: number, c: number) => IAutoMovieSolidSurface.IJet | null,
      partFace: string,
      rail: number,
      count: number,
      corners: number[] = [],
    ): void => {
      const strip: { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null = find(band);
      const part: { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null = find(partFace);
      if (strip === null || part === null) {
        out.push({ kind: "seam", joint: band, missing: strip === null ? "band chain" : "part chain" });
        return;
      }
      const B: IAutoMovieSolidSurface = strip.surface;
      const span: number = strip.chain.layers[strip.chain.layers.length - 1]!.y;
      const station: number = part.chain.layers[0]!.y + rail * 1000;
      const hostRows: IRow[] = [];
      const partRows: IRow[] = [];
      // A split loop's two corners (columns 0 and n/2, where its arc meets
      // its chord) have no single tangent along the loop, so the band's
      // normal there is not the arc's: reported apart, not in the seam's
      // extremes.
      const cornerRows: IRow[] = [];
      for (let k: number = 0; k < count; ++k) {
        const c: number = (2 * Math.PI * k) / count;
        const b0: IAutoMovieSolidSurface.IJet = B.jet(0, c);
        const h: IAutoMovieSolidSurface.IJet | null = host(k, c);
        if (h !== null) (corners.includes(k) ? cornerRows : hostRows).push({ clock: deg(c), gap: len(sub(vec(b0.p), vec(h.p))), angle: angle(outward(B, b0), outward(hostSurface, h)) });
        const b1: IAutoMovieSolidSurface.IJet = B.jet(span, c);
        const psi: number = nearest(part.surface, station, vec(b1.p), 0, 2 * Math.PI);
        const q: IAutoMovieSolidSurface.IJet = part.surface.jet(station, psi);
        partRows.push({ clock: deg(c), gap: len(sub(vec(b1.p), vec(q.p))), angle: angle(outward(B, b1), outward(part.surface, q)) });
      }
      out.push({ kind: "seam", joint: `${band} on ${hostFace}`, columns: hostRows.length, ...extremes(hostRows), ...(cornerRows.length === 0 ? {} : { corners: cornerRows }) });
      out.push({ kind: "seam", joint: `${band} on ${partFace}`, columns: partRows.length, ...extremes(partRows) });
    };
    for (const port of Object.values(body.ports)) {
      const host: IAutoMovieSolidSurface | undefined = find(port.hostFace)?.surface;
      if (host === undefined) {
        out.push({ kind: "seam", joint: `${port.band} on ${port.hostFace}`, missing: "host chain" });
        continue;
      }
      const [y0, p0]: [number, number] = [port.loop.centre[0] * 1000, port.loop.centre[1]];
      const [a, b]: [number, number] = [port.loop.semi[0] * 1000, port.loop.semi[1]];
      bandSeams(port.band, port.hostFace, host, (_k: number, c: number): IAutoMovieSolidSurface.IJet => host.jet(y0 + a * Math.cos(c), p0 + port.loop.sense * b * Math.sin(c)), port.partFace, port.rail, port.count);
    }
    const split: IAutoMovieConstructionSplit | null = body.split;
    if (split !== null) {
      const n: number = split.count;
      const m: number = n / 2;
      const [a, b]: [number, number] = split.seam;
      split.children.forEach((child: IAutoMovieConstructionSplit.IChild, i: number): void => {
        const [from, to]: [number, number] = i === 0 ? [a, b] : [b, a + 2 * Math.PI];
        bandSeams(
          child.band,
          split.hostFace,
          T,
          (k: number): IAutoMovieSolidSurface.IJet | null => {
            if (k > m) return null;
            const s: { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null = find(child.band);
            if (s === null) return null;
            const p: V3 = vec(s.surface.jet(0, (2 * Math.PI * k) / n).p);
            return T.jet(bottom, nearest(T, bottom, p, from, to));
          },
          child.partFace,
          child.rail,
          n,
          // A curved seam (`IAutoMovieConstructionSplit.IProfile`) promises G1
          // at the forks, so its corners are gated with the arc; the straight
          // chord's corners are declared creases, reported apart.
          split.profile === undefined ? [0, m] : [],
        );
      });
      // The chord: band 0's clock k against band 1's 3 n / 2 - k.
      const zero: { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null = find(split.children[0].band);
      const one: { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null = find(split.children[1].band);
      if (zero !== null && one !== null) {
        const rows: IRow[] = [];
        for (let k: number = m + 1; k < n; ++k) {
          const j0: IAutoMovieSolidSurface.IJet = zero.surface.jet(0, (2 * Math.PI * k) / n);
          const j1: IAutoMovieSolidSurface.IJet = one.surface.jet(0, (2 * Math.PI * (3 * m - k)) / n);
          rows.push({ clock: deg((2 * Math.PI * k) / n), gap: len(sub(vec(j0.p), vec(j1.p))), angle: angle(outward(zero.surface, j0), outward(one.surface, j1)) });
        }
        out.push({ kind: "seam", joint: `${split.children[0].band} on ${split.children[1].band} (seam chord)`, columns: rows.length, ...extremes(rows) });
      }
    }

    // Lines: each hip's S00 crotch loop against the leg's own first section.
    for (const side of ["right", "left"] as const) {
      const chain: IAutoMovieLoftChain | null | undefined = body.legs?.sides[side].chain;
      const L: IAutoMovieSolidSurface | null = chain === null || chain === undefined ? null : AutoMovieSolidChain.surface(chain);
      if (chain === null || chain === undefined || L === null) continue;
      const port: number = chain.layers[0]!.y;
      const ring: V3[] = phases(128).map((psi: number): V3 => vec(L.jet(port, psi).p));
      const centre: V3 = mean(ring);
      const [from, to]: [number, number] = side === "right" ? [0, Math.PI] : [Math.PI, 2 * Math.PI];
      const arc: V3[] = Array.from({ length: 257 }, (_: unknown, i: number): V3 => vec(T.jet(bottom, from + ((to - from) * i) / 256).p));
      const loop: V3[] = [...arc, ...Array.from({ length: 255 }, (_: unknown, i: number): V3 => add(arc[256]!, scale(sub(arc[0]!, arc[256]!), (i + 1) / 256)))];
      const theta: (p: V3) => number = (p: V3): number => Math.atan2(p[2] - centre[2], p[0] - centre[0]);
      let worst: { clock: number; radial: number; height: number } = { clock: 0, radial: 0, height: 0 };
      for (const q of ring) {
        const target: number = theta(q);
        const best: V3 = loop.reduce((x: V3, y: V3): V3 => (Math.abs(Math.atan2(Math.sin(theta(y) - target), Math.cos(theta(y) - target))) < Math.abs(Math.atan2(Math.sin(theta(x) - target), Math.cos(theta(x) - target))) ? y : x));
        const radial: number = flat(sub(best, centre)) - flat(sub(q, centre));
        if (Math.abs(radial) > Math.abs(worst.radial)) worst = { clock: deg(target), radial, height: best[1] - q[1] };
      }
      out.push({ kind: "lines", joint: `hip.${side}`, host: "trunk crotch loop (arc and seam chord)", child: `${chain.name} own first section`, worst });
    }

    // Blend strips.
    for (const name of chains.map((c: IAutoMovieLoftChain): string => c.name).filter((n: string): boolean => n.startsWith("blend."))) {
      const strip: { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface } | null = find(name);
      if (strip === null) continue;
      const span: number = strip.chain.layers[strip.chain.layers.length - 1]!.y;
      const measured: IColumn[] = phases(strip.chain.samples).map((c: number): IColumn => columns(strip.surface, span, c));
      out.push({
        kind: "strip",
        joint: name,
        foldedColumns: measured.filter((c: IColumn): boolean => c.reversals > 0).length,
        retreatingColumns: measured.filter((c: IColumn): boolean => c.retreats).length,
        overturnedColumns: measured.filter((c: IColumn): boolean => c.overturned).length,
      });
    }
    return out;
  }

  /** One seam sample. */
  interface IRow {
    clock: number;
    gap: number;
    angle: number;
  }

  /** The largest gap and angle of a seam's rows, with their clocks (degrees). */
  function extremes(rows: IRow[]): Record<string, unknown> {
    if (rows.length === 0) return { gap: { max: NaN }, angle: { max: NaN } };
    const by: (key: "gap" | "angle") => IRow = (key: "gap" | "angle"): IRow => rows.reduce((x: IRow, y: IRow): IRow => (y[key] > x[key] ? y : x));
    return { gap: { max: by("gap").gap, at: by("gap").clock }, angle: { max: by("angle").angle, at: by("angle").clock } };
  }

  /** The outward normal of a surface at a jet. */
  function outward(s: IAutoMovieSolidSurface, j: IAutoMovieSolidSurface.IJet): V3 {
    return scale(cross(vec(j.u), vec(j.v)), s.orientation);
  }

  /**
   * The phase in `[from, to]` whose point on the ring at `station` lies
   * nearest to `p`: 256 samples, then golden-section search between the best
   * sample's neighbours (60 steps).
   */
  function nearest(s: IAutoMovieSolidSurface, station: number, p: V3, from: number, to: number): number {
    const d: (phi: number) => number = (phi: number): number => len(sub(vec(s.jet(station, phi).p), p));
    const step: number = (to - from) / 256;
    let best: number = from;
    for (let i: number = 0; i <= 256; ++i) if (d(from + i * step) < d(best)) best = from + i * step;
    let lo: number = Math.max(from, best - step);
    let hi: number = Math.min(to, best + step);
    const g: number = (Math.sqrt(5) - 1) / 2;
    for (let i: number = 0; i < 60; ++i) {
      const x1: number = hi - g * (hi - lo);
      const x2: number = lo + g * (hi - lo);
      if (d(x1) < d(x2)) hi = x2;
      else lo = x1;
    }
    return (lo + hi) / 2;
  }

  function phases(n: number): number[] {
    return Array.from({ length: n }, (_: unknown, k: number): number => (2 * Math.PI * k) / n);
  }

  function vec(a: readonly number[]): V3 {
    return [a[0]!, a[1]!, a[2]!];
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

  function len(a: V3): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /** Horizontal distance from the origin. */
  function flat(a: V3): number {
    return Math.hypot(a[0], a[2]);
  }

  function mean(points: V3[]): V3 {
    return scale(points.reduce((x: V3, y: V3): V3 => add(x, y), [0, 0, 0]), 1 / points.length);
  }

  /** The angle between two vectors, degrees. */
  function angle(a: V3, b: V3): number {
    return deg(Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))));
  }

  function deg(x: number): number {
    return (x * 180) / Math.PI;
  }
}
