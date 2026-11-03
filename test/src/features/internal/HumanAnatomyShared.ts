import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";

type V3 = HumanAnatomy.V3;
const A = HumanAnatomy;

/** Limits, site records and measuring helpers the Human anatomy audits share. */
export namespace HumanAnatomyShared {
  /** Sides of the paired parts. */
  export const SIDES = ["left", "right"] as const;

  /** ISO 20685-1:2018 Table 4 maximum allowable error, large circumferences, mm. */
  export const LARGE: number = 9;

  /** ISO 20685-1:2018 Table 4, small circumferences, mm. */
  export const SMALL: number = 4;

  /** ISO 20685-1:2018 Table 4, head dimensions without hair, mm. */
  export const HEAD: number = 1;

  /** ISO 20685-1:2018 Table 4, hand dimensions, mm. */
  export const HAND: number = 1;

  /** ISO 20685-1:2018 Table 4, foot dimensions, mm. */
  export const FOOT: number = 2;

  /** Sagitta over a 10 mm chord past a 12.5 mm radius that reads as a crease, mm. */
  export const CREASE: number = 1;

  /** Distance proximal of stylion the least wrist girth may lie, mm. */
  export const WRIST_PROXIMAL: number = 30;

  /** Distance distal of stylion the least wrist girth may lie, up to the distal wrist crease, mm. */
  export const WRIST_DISTAL: number = 10;

  /** Bulge of the wrist's thumb side over its chord, mm. */
  export const BULGE: number = 1;

  /** Depth two skins may overlap where the joint's flexion presses them, mm. */
  export const COMPRESSION: number = 10;

  /** Depth skin may pass into skin at rest, where nothing presses, mm. */
  export const CONTACT: number = 1;

  /** Principal stretch past the failure strain of skin (0.54 +- 0.17, Annaidh et al. 2012). */
  export const STRETCH: number = 2;

  /** Share of a flexed limb's volume the body may gain or lose. */
  export const VOLUME: number = 0.05;

  /** Trunk sites. */
  export interface ITrunk {
    /** Stature as the skin's highest point, mm. */
    vertex: number;

    /** Crotch height: the lowest point of the midline between the legs, mm. */
    crotch: number;

    /** Section at the bust point. */
    chest: HumanAnatomy.ICut;

    /** Section at the inframammary fold. */
    underbust: HumanAnatomy.ICut;

    /** Section at the natural waist. */
    waist: HumanAnatomy.ICut;

    /** Section midway between waist and hip. */
    highHip: HumanAnatomy.ICut;

    /** Section at the buttock prominence. */
    hip: HumanAnatomy.ICut;

    /** Heights of the bust point, the fold, the waist, the hip and the axilla, mm. */
    heights: { chest: number; underbust: number; waist: number; hip: number; axilla: number };
  }

  /** Neck sites. */
  export interface INeck {
    /** Least girth across the neck axis, mm. */
    neck: number;

    /** Girth over cervicale and suprasternale, mm. */
    base: number;

    /** Girth from the base station to the jaw, every 2 mm. */
    profile: number[];

    /** Deepest crease sagitta on the neck's meridians, mm. */
    crease: number;

    /** Height of suprasternale, the front neck point, mm. */
    notch: number;

    /** Height of cervicale, the back neck point, mm. */
    cervicale: number;
  }

  /** Arm sites, one side. */
  export interface IArm {
    /** Upper arm girth, mm. */
    bicep: number;

    /** Elbow girth, mm. */
    elbow: number;

    /** Forearm maximum girth, mm. */
    forearm: number;

    /** Wrist girth over stylion, mm. */
    wrist: number;

    /** Forearm girth from the elbow to stylion, every 2 mm. */
    forearmProfile: number[];

    /** Where the least girth from the forearm's belly to the knuckles lies, mm from stylion. */
    narrowest: number;

    /** That least girth, mm. */
    least: number;

    /** How far each joint centre lies outside the section through it, mm. */
    outside: Record<string, number>;

    /** Largest bulge of the wrist's thumb side over its chord, mm. */
    radialBulge: number;
  }

  /** Hand sites, one side. */
  export interface IHand {
    /** Stylion to the middle fingertip, mm. */
    length: number;

    /** Breadth across metacarpals II to V, mm. */
    breadth: number;

    /** Circumference over metacarpals II to V, thumb excluded, mm. */
    circumference: number;

    /** Stylion to the middle finger's base, mm. */
    palm: number;

    /** Thumb's MCP crease to tip, mm. */
    thumb: number;
  }

  /** Leg sites, one side. */
  export interface ILeg {
    /** Thigh girth at the gluteal furrow, mm. */
    thigh: number;

    /** Knee girth at mid-patella, mm. */
    knee: number;

    /** Maximum calf girth, mm. */
    calf: number;

    /** Shank girth from the knee down to the ankle's least girth, every 2 mm. */
    shankProfile: number[];

    /** How far the leg's bone axis lies outside the section through it, mm. */
    outside: Record<string, number>;
  }

  /** Face sites. */
  export interface IFace {
    /** Head length, mm. */
    length: number;

    /** Head breadth, mm. */
    breadth: number;

    /** Head height, mm. */
    height: number;

    /** Head circumference, mm. */
    circumference: number;

    /** Face height n-gn, mm. */
    faceHeight: number;

    /** Face width zy-zy, mm. */
    faceWidth: number;

    /** Mandibular width go-go, mm. */
    mandibular: number;

    /** Intercanthal width, mm. */
    intercanthal: number;

    /** Palpebral fissures by side. */
    fissure: Record<"left" | "right", { length: number; height: number }>;

    /** Nasal width, mm. */
    noseWidth: number;

    /** Nasal height, mm. */
    noseHeight: number;

    /** Nasal protrusion, mm. */
    noseProtrusion: number;

    /** Mouth width, mm. */
    mouthWidth: number;

    /** Upper vermilion height, mm. */
    upperVermilion: number;

    /** Lower vermilion height, mm. */
    lowerVermilion: number;

    /** Gap between the lips at the midline, mm. */
    lipGap: number;

    /** Widest gap along the mouth's middle half, mm. */
    mouthGap: number;

    /** Tooth points visible from the front. */
    teethSeen: number;

    /** Nasolabial angle, degrees. */
    nasolabial: number;

    /** sn-gn over n-gn. */
    lowerFace: number;

    /** sn-sto over n-gn. */
    upperLip: number;
  }

  /** An identity row: the measured value equals the input within a tolerance. */
  export function identity(person: string, site: string, value: number, input: number, tol: number): HumanAnatomyAudit.IRow {
    return { person, site, value, low: input - tol, high: input + tol, unit: "mm" };
  }

  /** A ratio row against a population range. */
  export function ratio(person: string, site: string, value: number, low: number, high: number): HumanAnatomyAudit.IRow {
    return { person, site, value, low, high, unit: "" };
  }

  /** Extent of points along an axis. */
  export function extent(points: V3[], axis: number): number {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const p of points) {
      lo = Math.min(lo, p[axis]!);
      hi = Math.max(hi, p[axis]!);
    }
    return hi - lo;
  }

  /** Extent of points along a direction. */
  export function extentAlong(points: V3[], d: V3): number {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const p of points) {
      const s: number = A.dot(p, d);
      lo = Math.min(lo, s);
      hi = Math.max(hi, s);
    }
    return hi - lo;
  }

  /**
   * Turns of a profile past its single least value: local minima other than the
   * global one, each counted when it lies deeper than a noise floor below both
   * neighbouring maxima.
   */
  export function extraTurns(profile: number[], floor: number): number {
    const v: number[] = profile.filter((x: number): boolean => Number.isFinite(x));
    let count: number = 0;
    const minima: number[] = [];
    for (let i: number = 1; i + 1 < v.length; i++) if (v[i]! < v[i - 1]! && v[i]! <= v[i + 1]!) minima.push(i);
    if (minima.length <= 1) return 0;
    let global: number = minima[0]!;
    for (const m of minima) if (v[m]! < v[global]!) global = m;
    for (const m of minima) {
      if (m === global) continue;
      let left: number = v[m]!;
      for (let i: number = m; i >= 0; i--) left = Math.max(left, v[i]!);
      let right: number = v[m]!;
      for (let i: number = m; i < v.length; i++) right = Math.max(right, v[i]!);
      // The rise toward the global minimum is the barrier on that side.
      const toward: number = m < global ? Math.max(...v.slice(m, global + 1)) : Math.max(...v.slice(global, m + 1));
      const other: number = m < global ? left : right;
      if (Math.min(toward, other) - v[m]! > floor) count++;
    }
    return count;
  }

  /**
   * Horizontal cut of the trunk at a height, the component holding the spine,
   * the arms left out: a tape round the chest passes under them.
   */
  export function trunkCut(skin: HumanAnatomy.ISkin, y: number): HumanAnatomy.ICut | null {
    let keep: Uint8Array | undefined = trunkMasks.get(skin);
    if (keep === undefined) {
      const arm: boolean[] = skin.chains.map((c: string): boolean => /^(arm|thumb|hand|finger)/.test(c));
      keep = Uint8Array.from(skin.tri, (c: number): number => (arm[c] ? 0 : 1));
      trunkMasks.set(skin, keep);
    }
    const mask: Uint8Array = keep;
    const tris: Uint32Array = band(skin, y - 1, y + 1).filter((t: number): boolean => mask[t] === 1);
    return A.cut(skin, [0, y, 0], [0, 1, 0], [spineX(skin, y), y, 0], tris);
  }

  /** Trunk-only triangle masks, per skin. */
  export const trunkMasks: WeakMap<HumanAnatomy.ISkin, Uint8Array> = new WeakMap();

  /**
   * Deepest crease along a planar skin curve: at each point, the sagitta of the
   * curve inside the chord of its neighbours 5 mm of arc either side, less the
   * sagitta a 12.5 mm radius gives over that chord (1 mm). Inside is toward a
   * reference line, the limb's axis.
   */
  export function curveCrease(curve: V3[], origin: V3, axis: V3): number {
    const line: V3[] = resample(curve, 1);
    const depth = (p: V3): number => A.dist(p, A.add(origin, A.scale(axis, A.dot(A.sub(p, origin), axis))));
    let deepest: number = 0;
    for (let i: number = 5; i + 5 < line.length; i++) {
      const a: V3 = line[i - 5]!;
      const b: V3 = line[i + 5]!;
      const m: V3 = line[i]!;
      const chord: V3 = A.lerp(a, b, 0.5);
      const sag: number = A.dist(m, chord) * (depth(m) < depth(chord) ? 1 : -1);
      deepest = Math.max(deepest, sag - 1);
    }
    return deepest;
  }

  /** The x of the spine's joint line at a height. */
  export function spineX(skin: HumanAnatomy.ISkin, y: number): number {
    const line: V3[] = ["hips", "spine", "chest", "neck", "head"].map((b: string): V3 => A.joint(skin, b));
    if (y <= line[0]![1]) return line[0]![0];
    for (let i: number = 0; i + 1 < line.length; i++) {
      const a: V3 = line[i]!;
      const b: V3 = line[i + 1]!;
      if (y <= b[1]) return a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
    }
    return line[line.length - 1]![0];
  }

  /** Triangles whose height range meets a band, cached per skin and band. */
  export function band(skin: HumanAnatomy.ISkin, lo: number, hi: number): Uint32Array {
    let sorted: { order: Uint32Array; low: Float64Array } | undefined = bands.get(skin);
    if (sorted === undefined) {
      const n: number = skin.I.length / 3;
      const low: Float64Array = new Float64Array(n);
      const high: Float64Array = new Float64Array(n);
      for (let t: number = 0; t < n; t++) {
        const ys: number[] = [0, 1, 2].map((k: number): number => skin.P[3 * skin.I[3 * t + k]! + 1]!);
        low[t] = Math.min(...ys);
        high[t] = Math.max(...ys);
      }
      const order: Uint32Array = Uint32Array.from({ length: n }, (_: unknown, i: number): number => i).sort(
        (a: number, b: number): number => low[a]! - low[b]!,
      );
      sorted = { order, low };
      bands.set(skin, sorted);
      highs.set(skin, high);
    }
    const high: Float64Array = highs.get(skin)!;
    const out: number[] = [];
    // Triangles are at most a few centimetres tall; start the scan 60 mm low.
    let a: number = 0;
    let b: number = sorted.order.length;
    while (a < b) {
      const m: number = (a + b) >> 1;
      if (sorted.low[sorted.order[m]!]! < lo - 60) a = m + 1;
      else b = m;
    }
    for (let i: number = a; i < sorted.order.length; i++) {
      const t: number = sorted.order[i]!;
      if (sorted.low[t]! > hi) break;
      if (high[t]! >= lo) out.push(t);
    }
    return Uint32Array.from(out);
  }

  /** Triangles ordered by their lowest height, per skin, for band queries. */
  export const bands: WeakMap<HumanAnatomy.ISkin, { order: Uint32Array; low: Float64Array }> = new WeakMap();
  /** Highest vertex height of every triangle, per skin. */
  export const highs: WeakMap<HumanAnatomy.ISkin, Float64Array> = new WeakMap();
  /** Trunk sites, located once per skin. */
  export const trunks: WeakMap<HumanAnatomy.ISkin, ITrunk> = new WeakMap();

  /** Breadth of all skin in a height band. */
  export function breadth(skin: HumanAnatomy.ISkin, lo: number, hi: number): number {
    let a: number = Infinity;
    let b: number = -Infinity;
    for (let v: number = 0; v < skin.P.length; v += 3) {
      const y: number = skin.P[v + 1]!;
      if (y < lo || y > hi) continue;
      a = Math.min(a, skin.P[v + 2]!);
      b = Math.max(b, skin.P[v + 2]!);
    }
    return b - a;
  }

  /** Resample a polyline at an even step. */
  export function resample(line: V3[], step: number): V3[] {
    if (line.length < 2) return [...line];
    const out: V3[] = [line[0]!];
    let carry: number = 0;
    for (let i: number = 0; i + 1 < line.length; i++) {
      const a: V3 = line[i]!;
      const b: V3 = line[i + 1]!;
      const len: number = A.dist(a, b);
      let s: number = step - carry;
      while (s <= len) {
        out.push(A.lerp(a, b, s / len));
        s += step;
      }
      carry = len - (s - step);
    }
    return out;
  }

  /**
   * Mirror symmetry of skin built from inputs the two sides share: each vertex of
   * the chains, reflected across the median plane, against the nearest skin.
   */
  export function symmetry(name: string, skin: HumanAnatomy.ISkin, chains: RegExp, label: string): HumanAnatomyAudit.IRow[] {
    const points: V3[] = A.vertices(skin, chains)
      .filter((_: V3, i: number): boolean => i % 4 === 0)
      .map((p: V3): V3 => [p[0], p[1], -p[2]]);
    const d: number[] = A.distances(skin, points, 6);
    let worst: number = 0;
    for (const x of d) if (Number.isFinite(x)) worst = Math.max(worst, x);
    return [{ person: name, site: `${label}: mirror image off the other side's skin, mm`, value: worst, low: 0, high: MIRROR, unit: "mm" }];
  }

  /** Mirror distance that reads as an asymmetry, mm. */
  export const MIRROR: number = 0.5;

}
