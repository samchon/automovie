import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import { AutoMovieHumanRelief } from "../network/AutoMovieHumanRelief";
import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkRing } from "./AutoMovieHumanTrunkRing";
import type { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import { AutoMovieHumanTrunkGuides } from "./AutoMovieHumanTrunkGuides";

/**
 * The trunk's course inputs read on the construction's own surface, by their
 * ISO 8559-1 definitions (`docs/sources/iso-8559-1-2017-landmarks.md`): each
 * a tape taut over the skin between its landmarks in the plane they and the
 * tape's outward direction span, so it bridges hollows. The construction
 * bisects the landmark each course owns until the course reads its input.
 */
export namespace AutoMovieHumanTrunkCourses {
  type V3 = [number, number, number];

  /**
   * Length of a tape taut from a to b over points, bridging hollows, on the
   * side `out` points to: the hull chain between the two ends in the plane
   * of the chord and `out`.
   */
  export function taut(a: V3, b: V3, out: V3, points: readonly V3[]): number {
    const d: V3 = sub(b, a);
    const L: number = norm(d);
    const u: V3 = scale(d, 1 / L);
    const o: V3 = sub(out, scale(u, dot(out, u)));
    const n: V3 = scale(o, 1 / (norm(o) || 1));
    const flat: [number, number][] = [
      [0, 0] as [number, number],
      ...points
        .map((p: V3): [number, number] => [dot(sub(p, a), u), dot(sub(p, a), n)])
        .filter((q: [number, number]): boolean => q[0] > 0 && q[0] < L && q[1] > 0),
      [L, 0] as [number, number],
    ].sort((p, q): number => p[0] - q[0]);
    // The upper hull from the first end to the last.
    const hull: [number, number][] = [];
    for (const p of flat) {
      while (hull.length >= 2) {
        const o2: [number, number] = hull[hull.length - 2]!;
        const c: [number, number] = hull[hull.length - 1]!;
        if ((c[0] - o2[0]) * (p[1] - o2[1]) - (c[1] - o2[1]) * (p[0] - o2[0]) >= 0) hull.pop();
        else break;
      }
      hull.push(p);
    }
    let sum: number = 0;
    for (let i: number = 1; i < hull.length; i++) sum += Math.hypot(hull[i]![0] - hull[i - 1]![0], hull[i]![1] - hull[i - 1]![1]);
    return sum;
  }

  /**
   * ISO 8559-1 5.4.5, back neck point to waist: down the back's median skin
   * from cervicale to the waist level.
   */
  export function backNeckToWaist(column: AutoMovieHumanTrunkColumn.IColumn, waist: number, cervicale: V3): number {
    const points: V3[] = [];
    for (let y: number = waist; y < cervicale[1]; y += 2) points.push([column.at(y).back, y, 0]);
    const low: V3 = [column.at(waist).back, waist, 0];
    return taut(cervicale, low, [-1, 0, 0], points);
  }

  /** The skin point of a section at a lateral place, front (phases 0 to L) or back (L to S), reliefs included. */
  export function point(
    s: AutoMovieHumanTrunkQuadrant.ISection,
    reliefs: readonly IAutoMovieHumanRelief[],
    z: number,
    side: AutoMovieHumanTrunkQuadrant.Side,
    controls: number[] = AutoMovieHumanTrunkRing.controls(s),
  ): V3 {
    const L: number = AutoMovieHumanTrunkQuadrant.phase(AutoMovieHumanTrunkGuides.KNOT.midAxillary);
    const S: number = AutoMovieHumanTrunkQuadrant.phase(AutoMovieHumanTrunkGuides.KNOT.backMidline);
    // Phase rises with z on the front and falls with it on the back.
    let lo: number = side === "front" ? 0 : L;
    let hi: number = side === "front" ? L : S;
    const zAt = (t: number): number => AutoMovieHumanSplineCurve.evaluate(controls, AutoMovieHumanTrunkQuadrant.ORDER, t)[1];
    for (let k: number = 0; k < 40; k++) {
      const mid: number = (lo + hi) / 2;
      const rising: boolean = side === "front";
      if (zAt(mid) < z === rising) lo = mid;
      else hi = mid;
    }
    const t: number = (lo + hi) / 2;
    const p: [number, number, number, number] = AutoMovieHumanSplineCurve.evaluate(controls, AutoMovieHumanTrunkQuadrant.ORDER, t);
    let x: number = p[0];
    let y: number = s.y;
    let zz: number = p[1];
    for (const r of reliefs) {
      const d: number = AutoMovieHumanRelief.height(r, s.y, t)[0];
      x += d * r.axis[0];
      y += d * r.axis[1];
      zz += d * r.axis[2];
    }
    return [x, y, zz];
  }

  /**
   * ISO 8559-1 5.4.10, side neck point to bust point: taut over the front of
   * the skin in the plane of the two points and the forward direction.
   */
  export function sideNeckToBust(
    column: AutoMovieHumanTrunkColumn.IColumn,
    reliefs: readonly IAutoMovieHumanRelief[],
    neck: V3,
    bust: V3,
  ): number {
    const points: V3[] = [];
    const count: number = 20;
    for (let i: number = 1; i < count; i++) {
      const f: number = i / count;
      const y: number = bust[1] + f * (neck[1] - bust[1]);
      const z: number = bust[2] + f * (neck[2] - bust[2]);
      points.push(point(column.at(y), reliefs, z, "front"));
    }
    return taut(neck, bust, [1, 0, 0], points);
  }

  /**
   * ISO 8559-1 5.4.3, across back shoulder width: shoulder point through the
   * back neck point to shoulder point, taut over the back in their plane.
   */
  export function acrossBack(column: AutoMovieHumanTrunkColumn.IColumn, shoulder: V3, cervicale: V3): number {
    const points: V3[] = [];
    const count: number = 20;
    for (let i: number = 1; i < count; i++) {
      const f: number = i / count;
      const y: number = cervicale[1] + f * (shoulder[1] - cervicale[1]);
      const z: number = f * shoulder[2];
      const s: AutoMovieHumanTrunkQuadrant.ISection = column.at(y);
      if (z < s.width) points.push(point(s, [], z, "back"));
    }
    return 2 * taut(cervicale, shoulder, [-1, 0, 0], points);
  }

  /**
   * ISO 8559-1 5.4.7, across front width: between the anterior axillary fold
   * points over the front of the section at the axilla, taut.
   */
  export function acrossFront(s: AutoMovieHumanTrunkQuadrant.ISection, reliefs: readonly IAutoMovieHumanRelief[]): number {
    const controls: number[] = AutoMovieHumanTrunkRing.controls(s);
    const A: number = AutoMovieHumanTrunkQuadrant.phase(AutoMovieHumanTrunkGuides.KNOT.anteriorAxillary);
    const at = (t: number): V3 => {
      const p: [number, number, number, number] = AutoMovieHumanSplineCurve.evaluate(controls, AutoMovieHumanTrunkQuadrant.ORDER, t);
      let x: number = p[0];
      let z: number = p[1];
      for (const r of reliefs) {
        const d: number = AutoMovieHumanRelief.height(r, s.y, t)[0];
        x += d * r.axis[0];
        z += d * r.axis[2];
      }
      return [x, s.y, z];
    };
    // From the right fold point over the front to the left one; the tape
    // bridges the hollow between the breasts, so the midline is not an end.
    const points: V3[] = [];
    for (let i: number = -59; i < 60; i++) points.push(at(A * (i / 60)));
    return taut(at(-A), at(A), [1, 0, 0], points);
  }
}

function sub(a: readonly number[], b: readonly number[]): [number, number, number] {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
function norm(a: readonly number[]): number {
  return Math.hypot(a[0]!, a[1]!, a[2]!);
}
function scale(a: readonly number[], s: number): [number, number, number] {
  return [a[0]! * s, a[1]! * s, a[2]! * s];
}
