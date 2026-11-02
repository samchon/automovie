import { AutoMovieHumanHeadDefinition as D } from "./AutoMovieHumanHeadDefinition";

/** Landmark readings on an analytic head's emitted median and transverse profiles. */
export namespace AutoMovieHumanHeadLandmarks {
  /** Point in calibration millimetres. */
  export type IPoint = [number, number, number];

  /** Measurements found on the surface, rather than at its shape keys. */
  export interface IMeasures {
    /** Vertex to menton height. */
    height: number;
    /** Glabella to opisthocranion distance. */
    length: number;
    /** Greatest vault breadth above the auricles. */
    breadth: number;
    /** Nasion to gnathion distance. */
    faceHeight: number;
    /** Greatest breadth over the zygomatic arches. */
    faceWidth: number;
    /** Greatest breadth between the mandibular angles. */
    mandibularWidth: number;
    /** Nasion to subnasale distance. */
    noseHeight: number;
    /** Subnasale to pronasale distance. */
    noseProtrusion: number;
    /** Alare to alare distance. */
    noseWidth: number;
    /** Labrale superius to stomion distance. */
    upperLip: number;
    /** Stomion to labrale inferius distance. */
    lowerLip: number;
    /** Perimeter of the designated neck course, or minimum in fixture mode. */
    neck: number;
    /** Forward coordinate of that section's axis. */
    neckX: number;
    /** Height of that section's axis. */
    neckY: number;
    /** Forward component of its unit normal. */
    neckNX: number;
    /** Upward component of its unit normal. */
    neckNY: number;
    /** Diagnostic surrogate only: alar crease width is not alare width. */
    alarCreaseWidth: number;
    /** Diagnostic surrogate only: deepest nasal-root profile point. */
    sellionY: number;
    /** Diagnostic surrogate only: 45-degree chin support. */
    chinSupportY: number;
    /** Diagnostic surrogate only: upper lip prominence distance. */
    upperProminence: number;
    /** Diagnostic surrogate only: lower lip prominence distance. */
    lowerProminence: number;
  }

  /** Anatomical search regions supplied by the eye and auricle modules. */
  export interface IRegions {
    /** Centre of the lid margins. */
    eye: number;
    /** Lowest point of the lid margins. */
    lid: number;
    /** Auricle top. */
    earTop: number;
    /** Auricle centre height. */
    earMiddle: number;
    /** Tragus's forward coordinate. */
    tragus: number;
    /** Oral fissure centre, used only to isolate the lips from the chin. */
    stomion: number;
  }

  /**
   * Read median landmarks from a profile ordered vertex-to-neck and widths
   * from complete surface rings. Median resampling uses a 0.25 mm arc pitch;
   * concavities use a 2 mm chord, independent of the production tessellation.
   */
  export function measure(
    median: readonly IPoint[],
    rings: readonly (readonly IPoint[])[],
    regions: IRegions,
    neckCourse?: readonly IPoint[],
    addresses?: D.IAddresses,
  ): IMeasures {
    const line: IPoint[] = resample(median, 0.25);
    const top: IPoint = line[0]!;
    const max = (from: number, to: number, value: (p: IPoint) => number): number => {
      let out: number = from;
      for (let i: number = from + 1; i <= to; i++) if (value(line[i]!) > value(line[out]!)) out = i;
      return out;
    };
    const min = (from: number, to: number, value: (p: IPoint) => number): number => max(from, to, (p: IPoint): number => -value(p));
    const nearest = (y: number): number => min(0, line.length - 1, (p: IPoint): number => Math.abs(p[1] - y));
    const mouth: number = nearest(regions.stomion);
    const prn: number = max(0, mouth, (p: IPoint): number => p[0]);

    // A nasal base is a concave turn before the upper lip, not the lowest
    // point of the nose's driving station or its relief support.
    let end: number = prn;
    for (let i: number = prn + 1; i < mouth; i++) {
      if (line[i]![0] < line[end]![0]) end = i;
      else if (line[i]![0] - line[end]![0] > 1.5) break;
    }
    let sn: number = Math.min(end, prn + 8);
    let hollow: number = -Infinity;
    for (let i: number = prn + 8; i <= Math.min(end, mouth - 8); i++) {
      const a: IPoint = line[i - 8]!;
      const p: IPoint = line[i]!;
      const b: IPoint = line[i + 8]!;
      const turn: number = (a[0] + b[0]) / 2 - p[0];
      if (turn > hollow) { hollow = turn; sn = i; }
    }
    const forehead: number[] = line.map((p: IPoint, i: number): number => p[1] >= regions.eye && p[1] <= regions.eye + 45 ? i : -1).filter((i: number): boolean => i >= 0);
    const g: number = forehead.length === 0 ? 0 : max(forehead[0]!, forehead[forehead.length - 1]!, (p: IPoint): number => p[0]);
    const n: number = min(g, prn, (p: IPoint): number => p[0]);
    const lipEnd: number = nearest(regions.stomion - 12);
    const ls: number = max(sn, mouth, (p: IPoint): number => p[0]);
    const li: number = max(mouth, lipEnd, (p: IPoint): number => p[0]);
    const gn: number = max(li, Math.min(line.length - 1, li + 240), (p: IPoint): number => p[0] - p[1]);
    const me: number = min(gn, Math.min(line.length - 1, gn + 160), (p: IPoint): number => p[1]);
    let op: IPoint = line[g]!;
    let breadth: number = 0;
    let faceWidth: number = 0;
    let mandibularWidth: number = 0;
    let noseWidth: number = 0;
    let neck: number = Infinity;
    let neckX: number = 0;
    let neckY: number = 0;
    let neckNX: number = 0;
    let neckNY: number = 1;
    for (const ring of [...rings, ...(neckCourse === undefined ? [] : [neckCourse])]) {
      if (ring.length > 1 && (neckCourse === undefined ? ring.every((p: IPoint): boolean => p[1] < line[me]![1]) : ring === neckCourse)) {
        const a: IPoint = ring[0]!;
        const b: IPoint = ring[ring.length - 1]!;
        const dx: number = a[0] - b[0];
        const dy: number = a[1] - b[1];
        const length: number = Math.hypot(dx, dy);
        if (length > 0) {
          const points: [number, number][] = ring.map((p: IPoint): [number, number] => [(p[0] - b[0]) * dx / length + (p[1] - b[1]) * dy / length, p[2]]);
          const girth: number = hullLength([...points, ...points.map(([x, z]: [number, number]): [number, number] => [x, -z])]);
          if (girth < neck) {
            neck = girth; neckX = (a[0] + b[0]) / 2; neckY = (a[1] + b[1]) / 2;
            neckNX = -dy / length; neckNY = dx / length;
          }
        }
      }
      for (const p of ring) {
        if (p[1] > line[g]![1] - 60 && distance(p, line[g]!) > distance(op, line[g]!)) op = p;
        if (p[1] > regions.earTop + 3) breadth = Math.max(breadth, 2 * Math.abs(p[2]));
        if (p[0] > regions.tragus + 10 && p[1] < regions.lid && p[1] > regions.earMiddle - 5) faceWidth = Math.max(faceWidth, 2 * Math.abs(p[2]));
        if (p[0] > regions.tragus - 10 && p[0] < regions.tragus + 40 && p[1] < line[mouth]![1] && p[1] > line[me]![1]) mandibularWidth = Math.max(mandibularWidth, 2 * Math.abs(p[2]));
      }

      // The lateral nasal groove is a concavity in the front half-profile.
      const front: IPoint[] = ring.filter((p: IPoint): boolean => p[2] >= 0 && p[2] <= 35 && p[0] > line[sn]![0] - 25 && p[1] >= line[sn]![1] - 1 && p[1] <= line[sn]![1] + 0.4 * (line[prn]![1] - line[sn]![1] + 15));
      const transverse: IPoint[] = resample(front, 0.25);
      let groove: number = 0;
      let sag: number = 0;
      for (let i: number = 4; i + 4 < transverse.length; i++) {
        const p: IPoint = transverse[i]!;
        const d: number = (transverse[i - 4]![0] + transverse[i + 4]![0]) / 2 - p[0];
        if (p[2] > 5 && d > sag) { sag = d; groove = p[2]; }
      }
      noseWidth = Math.max(noseWidth, 2 * groove);
    }
    const identity: D.IMeasures = D.measure(addresses ?? {}, line[sn]!);
    return {
      height: top[1] - line[me]![1], length: distance(line[g]!, op), breadth,
      faceHeight: identity.faceHeight, faceWidth, mandibularWidth,
      noseHeight: identity.noseHeight, noseProtrusion: distance(line[sn]!, line[prn]!), noseWidth: identity.noseWidth,
      upperLip: identity.upperLip, lowerLip: identity.lowerLip,
      neck, neckX, neckY, neckNX, neckNY,
      alarCreaseWidth: noseWidth, sellionY: line[n]![1], chinSupportY: line[gn]![1],
      upperProminence: distance(line[ls]!, line[mouth]!), lowerProminence: distance(line[li]!, line[mouth]!),
    };
  }

  /** Uniform arc sampling retains endpoints and ignores zero-length spans. */
  function resample(points: readonly IPoint[], pitch: number): IPoint[] {
    if (points.length === 0) return [];
    const out: IPoint[] = [points[0]!];
    let remain: number = pitch;
    for (let i: number = 1; i < points.length; i++) {
      let a: IPoint = points[i - 1]!;
      const b: IPoint = points[i]!;
      let span: number = distance(a, b);
      while (span >= remain && span > 0) {
        const t: number = remain / span;
        a = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
        out.push(a);
        span -= remain;
        remain = pitch;
      }
      remain -= span;
    }
    out.push(points[points.length - 1]!);
    return out;
  }

  /** Euclidean landmark distance. */
  function distance(a: IPoint, b: IPoint): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /** Taut tape around planar points, including sections with a hollow. */
  function hullLength(points: [number, number][]): number {
    points.sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    const turn = (a: [number, number], b: [number, number], c: [number, number]): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const lower: [number, number][] = [];
    const upper: [number, number][] = [];
    for (const p of points) {
      while (lower.length > 1 && turn(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
      lower.push(p);
    }
    for (let i: number = points.length - 1; i >= 0; i--) {
      const p: [number, number] = points[i]!;
      while (upper.length > 1 && turn(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
      upper.push(p);
    }
    const hull: [number, number][] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    return hull.reduce((total: number, p: [number, number], i: number): number => {
      const q: [number, number] = hull[(i + 1) % hull.length]!;
      return total + Math.hypot(q[0] - p[0], q[1] - p[1]);
    }, 0);
  }
}
