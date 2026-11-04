import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type ILine = HumanAnatomyHeadGeometry.ILine;
const A: typeof HumanAnatomy = HumanAnatomy;
const band: typeof HumanAnatomyShared.band = HumanAnatomyShared.band;
const resample: typeof HumanAnatomyShared.resample = HumanAnatomyShared.resample;

/**
 * The outer median profile of a head, walked from the vertex down the face and
 * split at the lips, whatever the skin does inside the mouth: parted by an
 * opening, closed over an oral cavity the median curve enters, or sealed.
 */
export namespace HumanAnatomyHeadProfile {
  /** The outer median profile, split at the lips. */
  export interface IProfile {
    /** From the upper lip's end up the face, over the vertex and down the back, every 0.5 mm. */
    up: V3[];

    /** From the lower lip's end down the chin and neck, every 0.5 mm. */
    lo: V3[];

    /** Upper lip's end at the labial fissure. */
    eUp: V3;

    /** Lower lip's end at the labial fissure. */
    eLo: V3;

    /** Vertex, the skin's highest median point. */
    top: V3;

    /** The median section holding the vertex. */
    topLine: ILine;

    /** The mouth's opening when the lips are parted by one. */
    mouthLoop: V3[] | undefined;

    /** Whether the lips close over an oral cavity the median curve enters. */
    cavity: boolean;
  }

  /** Distance within which a curve returning to itself has made an excursion, mm. */
  export const GAP: number = 3;

  /** Distance within which an excursion's walls meet, the closed lips' allowance, mm. */
  export const CONTACT: number = HumanAnatomyShared.HEAD;

  /**
   * The outer median profile walked down from the vertex over the face.
   *
   * The lips end the walk in one of three ways. An opening of the mouth across
   * the midline ends the median curve at the upper lip, and the walk resumes
   * from the lower lip's end of the nearest other curve. Lips that close over
   * an oral cavity carry the curve through the labial fissure into the mouth
   * and back out; every such excursion is cut out of the profile (see
   * {@link outer}), and the longest one below pronasale is the mouth's, its
   * bridge the stomion. Lips sealed without a cavity leave only the labial
   * fissure's crease, the sharpest 2 mm notch from 4 to 35 mm below
   * subnasale; the labiomental fold is broad, so it never out-notches the
   * fissure.
   *
   * @param skin Skin to read.
   * @param S Stature, mm, to bound the head's height band.
   * @param loops The skin's openings.
   */
  export function medianProfile(skin: HumanAnatomy.ISkin, S: number, loops: V3[][]): IProfile {
    const lines: ILine[] = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, 0.78 * S, S + 10));
    const crown: ICrown = summit(lines);

    // The walk stops 20 percent of stature below the vertex, past the chin.
    const floor: number = crown.top[1] - 0.2 * S;
    const tp: V3[] = crown.line.points;
    const forward: 1 | -1 =
      tp[(crown.index + 1) % tp.length]![0] > tp[(crown.index - 1 + tp.length) % tp.length]![0] ? 1 : -1;
    const down: IWalk = walk(crown.line, crown.index, forward, floor);
    const last: V3 = down.points[down.points.length - 1]!;

    if (down.open && last[1] > floor) return parted(down.points, last, lines, crown, floor, loops);
    return covered(resample(down.points, 0.5), crown);
  }

  /**
   * A curve sampled every 0.5 mm with its excursions cut out: wherever it comes
   * back within {@link GAP} of itself across more than 10 mm of arc it has
   * entered a cavity (the mouth between closed lips, a nostril the median
   * plane strays into) and left it again; the outer skin bridges the
   * entrance. Each entrance is bridged where its walls meet: the outermost
   * pair closer than {@link CONTACT}, else, when they never touch, the closest
   * pair. Entrances are the indices after which the bridge falls.
   */
  export function outer(d: V3[]): { line: V3[]; entrances: { at: number; arc: number }[] } {
    const line: V3[] = [];
    const entrances: { at: number; arc: number }[] = [];
    let i: number = 0;

    while (i < d.length) {
      const pair: [number, number] | null = excursion(d, i, d.length);

      if (pair === null) {
        line.push(...d.slice(i));
        break;
      }
      line.push(...d.slice(i, pair[0] + 1));
      entrances.push({ at: line.length - 1, arc: (pair[1] - pair[0]) / 2 });
      i = pair[1];
    }
    return { line, entrances };
  }

  /**
   * The entrance of the first excursion a curve sampled every 0.5 mm makes
   * from an index range, as the pair of its walls' points where they meet (see
   * {@link outer}); null when the curve makes none.
   */
  export function excursion(d: V3[], from: number, to: number): [number, number] | null {
    // The nearest point across an excursion: more than 10 mm of arc on.
    const partner: (i: number) => number = (i: number): number => {
      let best: number = -1;

      for (let j: number = i + 21; j < d.length; j++)
        if (A.dist(d[i]!, d[j]!) < GAP && (best < 0 || A.dist(d[i]!, d[j]!) < A.dist(d[i]!, d[best]!))) best = j;
      return best;
    };

    for (let i: number = Math.max(0, from); i < to; i++) {
      if (partner(i) < 0) continue;

      // Walk inward along the entrance's walls until they meet.
      let closest: [number, number] = [i, partner(i)];

      for (let k: number = i; k < d.length; k++) {
        const j: number = partner(k);
        if (j < 0 || j <= k + 20) break;

        const gap: number = A.dist(d[k]!, d[j]!);
        if (gap < CONTACT) return [k, j];
        if (gap < A.dist(d[closest[0]]!, d[closest[1]]!)) closest = [k, j];
      }
      return closest;
    }
    return null;
  }

  /** The vertex, the median section holding it and the point's index on that section. */
  interface ICrown {
    /** Highest median point. */
    top: V3;

    /** Section holding it. */
    line: ILine;

    /** Index of the vertex on the section. */
    index: number;
  }

  /** A walk down a section: the points it took and whether it ran off an open end. */
  interface IWalk {
    /** Points walked, in order. */
    points: V3[];

    /** Whether the walk ended at the open end of the section. */
    open: boolean;
  }

  /** The highest median point and the section holding it. */
  function summit(lines: ILine[]): ICrown {
    let top: V3 = [0, -Infinity, 0];
    let line: ILine = lines[0]!;
    let index: number = 0;

    for (const l of lines)
      l.points.forEach((p: V3, i: number): void => {
        if (p[1] > top[1]) {
          top = p;
          line = l;
          index = i;
        }
      });
    return { top, line, index };
  }

  /** Walk a section from a start index in a direction until it falls below a floor or ends. */
  function walk(line: ILine, start: number, dir: 1 | -1, floor: number): IWalk {
    const n: number = line.points.length;
    const out: V3[] = [];

    for (let k: number = 0; k < n; k++) {
      const i: number = start + dir * k;
      if (!line.closed && (i < 0 || i >= n)) return { points: out, open: true };

      const p: V3 = line.points[((i % n) + n) % n]!;
      out.push(p);
      if (p[1] < floor) break;
    }
    return { points: out, open: false };
  }

  /**
   * Lips parted by an opening: the walk ended at the upper lip, and the lower
   * profile is the nearest other section, taken from its end by the gap.
   */
  function parted(
    upperWalk: V3[],
    last: V3,
    lines: ILine[],
    crown: ICrown,
    floor: number,
    loops: V3[][],
  ): IProfile {
    let lowerLine: V3[] = [];
    let gap: number = Infinity;

    for (const l of lines) {
      if (l === crown.line) continue;

      for (const [k, p] of [l.points[0]!, l.points[l.points.length - 1]!].entries()) {
        const d: number = A.dist(p, last);

        if (d < gap) {
          gap = d;
          lowerLine = k === 0 ? l.points : [...l.points].reverse();
        }
      }
    }

    const upper: V3[] = resample(upperWalk, 0.5);
    const lo: V3[] = resample(
      lowerLine.filter((p: V3): boolean => p[1] > floor),
      0.5,
    );
    const eUp: V3 = upper[upper.length - 1]!;

    // The opening the upper curve ends at is the mouth's.
    let mouthLoop: V3[] | undefined;
    let near: number = Infinity;

    for (const l of loops)
      for (const p of l)
        if (A.dist(p, eUp) < near) {
          near = A.dist(p, eUp);
          mouthLoop = l;
        }
    return {
      up: [...upper].reverse(),
      lo,
      eUp,
      eLo: lo[0] ?? eUp,
      top: crown.top,
      topLine: crown.line,
      mouthLoop,
      cavity: false,
    };
  }

  /**
   * Lips closed over an oral cavity, or sealed: cut the excursions out of the
   * walked curve and split it at the mouth's entrance or, failing that, at the
   * labial fissure's crease.
   */
  function covered(walked: V3[], crown: ICrown): IProfile {
    const outside: { line: V3[]; entrances: { at: number; arc: number }[] } = outer(walked);
    const d: V3[] = outside.line;
    const entrances: { at: number; arc: number }[] = outside.entrances;

    let p0: number = 0;
    for (let i: number = 0; i < d.length; i++) if (d[i]![0] > d[p0]![0]) p0 = i;

    // The oral cavity is the face's largest: its entrance below pronasale is
    // the excursion that runs longest.
    let lips: { at: number; arc: number } | undefined;
    for (const e of entrances)
      if (e.at > p0 && d[e.at]![1] < d[p0]![1] - 5 && (lips === undefined || e.arc > lips.arc)) lips = e;

    if (lips !== undefined)
      return {
        up: d.slice(0, lips.at + 1).reverse(),
        lo: d.slice(lips.at + 1),
        eUp: d[lips.at]!,
        eLo: d[lips.at + 1]!,
        top: crown.top,
        topLine: crown.line,
        mouthLoop: undefined,
        cavity: true,
      };

    // Sealed lips: the sharpest notch within 70 samples of subnasale is the
    // labial fissure's crease.
    const s0: number = HumanAnatomyHeadGeometry.subnasale(d, p0, 1);
    const notch: (i: number) => number = (i: number): number => (d[i - 4]![0] + d[i + 4]![0]) / 2 - d[i]![0];
    let st: number = s0 + 8;

    for (let i: number = s0 + 8; i < Math.min(d.length - 4, s0 + 70); i++) if (notch(i) > notch(st)) st = i;
    return {
      up: d.slice(0, st + 1).reverse(),
      lo: d.slice(st),
      eUp: d[st]!,
      eLo: d[st]!,
      top: crown.top,
      topLine: crown.line,
      mouthLoop: undefined,
      cavity: false,
    };
  }
}
