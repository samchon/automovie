import { HumanAnatomy } from "./HumanAnatomy";
import { HumanSkinMemo } from "./HumanSkinMemo";

type V3 = HumanAnatomy.V3;
const A: typeof HumanAnatomy = HumanAnatomy;

/** Vertex normals by skin; each dies with its skin. */
const NORMALS: HumanSkinMemo.Values<Float64Array> = new WeakMap();

/**
 * Point and profile geometry the head observers share: the median-plane
 * measures of a face profile, the apex of the nasolabial angle, and small
 * readings of point sets. Nothing here knows a landmark by name beyond the
 * subnasale rule.
 */
export namespace HumanAnatomyHeadGeometry {
  /** One component of a plane's section: its points in order and whether it closes on itself. */
  export interface ILine {
    /** Section points in walking order. */
    points: V3[];

    /** Whether the last point joins the first. */
    closed: boolean;
  }

  /** Mean of points. */
  export function centre(points: V3[]): V3 {
    return A.scale(
      points.reduce((sum: V3, p: V3): V3 => A.add(sum, p), [0, 0, 0]),
      1 / points.length,
    );
  }

  /** The farthest pair of points. */
  export function diameter(points: V3[]): [V3, V3] {
    let best: [V3, V3] = [points[0]!, points[0]!];

    for (const a of points)
      for (const b of points) if (A.dist(a, b) > A.dist(best[0], best[1])) best = [a, b];
    return best;
  }

  /** Length of a pair's segment. */
  export function span(pair: [V3, V3]): number {
    return A.dist(pair[0], pair[1]);
  }

  /** A point's identity among a skin's vertices. */
  export function key(p: V3): string {
    return `${p[0]},${p[1]},${p[2]}`;
  }

  /** Vertex normals of a skin, computed once per skin. */
  export function normals(skin: HumanAnatomy.ISkin): Float64Array {
    return HumanSkinMemo.get(NORMALS, skin, (): Float64Array => HumanAnatomy.vertexNormals(skin));
  }

  /**
   * Canthal tilt: the angle of the exocanthion above the endocanthion in the
   * frontal plane, against the face's transverse axis, the normal of the
   * median plane, degrees. Gao 2025 reads it against the intercanthal line;
   * on a face held level the two agree, and the transverse axis spares each
   * side the other endocanthion's error.
   */
  export function tilt(en: V3, ex: V3): number {
    return (Math.atan2(ex[1] - en[1], Math.abs(ex[2] - en[2])) * 180) / Math.PI;
  }

  /**
   * Facial convexity: the angle at subnasale between glabella-subnasale and
   * subnasale-pogonion in the median plane, positive when pogonion lies behind
   * the line from glabella through subnasale, degrees.
   */
  export function convexity(g: V3, sn: V3, pg: V3): number {
    return (-turn(g, sn, pg) * 180) / Math.PI;
  }

  /** Signed distance of a point ahead of the line from a to b in the median plane, mm. */
  export function ahead(p: V3, a: V3, b: V3): number {
    const e: [number, number] = [b[0] - a[0], b[1] - a[1]];
    const l: number = Math.hypot(e[0], e[1]);

    // The forward normal of a line running down the face.
    const n: [number, number] = [-e[1] / l, e[0] / l];
    return (p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1];
  }

  /**
   * The signed turn in the median plane from the direction a to b into the
   * direction b to c, radians: positive to the left of the walk.
   */
  export function turn(a: V3, b: V3, c: V3): number {
    const t1: [number, number] = [b[0] - a[0], b[1] - a[1]];
    const t2: [number, number] = [c[0] - b[0], c[1] - b[1]];
    return Math.atan2(t1[0] * t2[1] - t1[1] * t2[0], t1[0] * t2[0] + t1[1] * t2[1]);
  }

  /**
   * Subnasale on a median profile sampled every 0.5 mm, the apex of the
   * nasolabial angle: walking from pronasale toward the lips, the sharpest
   * concave turn over 2 mm of arc before the deepest point the walk reaches ere
   * the profile comes forward again by 1.5 mm onto the upper lip. That hollow
   * bounds the search, so the labial fissure beyond it never competes.
   *
   * @param line Median profile, every 0.5 mm.
   * @param prn Index of pronasale on the line.
   * @param step +1 or -1, the index direction from pronasale toward the lips.
   */
  export function subnasale(line: V3[], prn: number, step: 1 | -1): number {
    let deepest: number = prn;

    for (let i: number = prn; i >= 0 && i < line.length; i += step) {
      if (line[i]![0] < line[deepest]![0]) deepest = i;
      else if (line[i]![0] > line[deepest]![0] + 1.5) break;
    }

    // Walking toward the lips (down), the body lies on the walker's right, so a
    // concave corner turns left: a positive turn.
    let best: number = deepest;
    let sharpest: number = -Infinity;

    for (let i: number = prn + 4 * step; step * (i - deepest) <= 0; i += step) {
      if (i - 4 < 0 || i + 4 >= line.length) continue;

      const t: number = turn(line[i - 4 * step]!, line[i]!, line[i + 4 * step]!);
      if (t > sharpest) {
        sharpest = t;
        best = i;
      }
    }
    return best;
  }
}
