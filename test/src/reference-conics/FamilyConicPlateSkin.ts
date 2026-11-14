import { FamilyConicExcursion as X } from "./FamilyConicExcursion";
import type { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * The ear's plate read with its hollows: `FamilyConicExcursion.plate`'s lens, whose lateral face is the convex hull of the auricle's
 * floor, with that face laid down onto the faired skin inside given windows of the chord's share, so a hollow such as the scapha becomes
 * a groove of the plate's lateral face that its family carries as an inflection line (lofting, One section family).
 *
 * Measured on f1 (stations 46 to 64 of the plate's course, shares 0.65 to 0.9 of the chord from the root to the outermost point): the
 * hull's lateral face stood 6.5 to 8 mm inside the cranial skin where the scapha's floor is 1.8 to 4 mm, because the hull bridges from the
 * antihelix's depth (8 to 10 mm) to the rounded outer end; the plate's floor there is the strip that stands proud under the helix. Laid
 * over shares 0.6 to 0.86 and read star-shaped about the course (below), the face there stands 5.2 to 6 mm inside the cranial skin at
 * stations 56 to 64: the rest of the scapha's depth is hidden from the course point by the groove's outer wall.
 */
export namespace FamilyConicPlateSkin {
  type P = C.P;

  /** One window of the chord's share where the lateral face follows the skin; `weight` scales it, for a fade along the stations. */
  export interface IWindow {
    from: number;
    to: number;
    weight: number;
  }

  /** Share over which a window's weight rises from 0 to 1 at each of its ends (a C2 smootherstep). */
  const RAMP: number = 0.08;

  /** Half width of the Gaussian that fairs the skin's floor, mm: the scale of the scapha's and the fossa's own width, 4 to 6 mm. */
  const FAIR_MM: number = 1.5;

  /** Least thickness the plate keeps in a window, mm: the auricle's sheet is 1.8 mm at its thinnest over the scapha on f1. */
  const LEAST_MM: number = 1.5;

  /** Rays the laid lens is read along, one every half degree: the scapha is 4 to 6 mm wide 10 to 15 mm from the course. */
  const RAYS: number = 720;

  /** The C2 smootherstep `10 x^3 - 15 x^4 + 6 x^5` of `x` clamped to `[0, 1]`. */
  const smoother = (x: number): number => {
    const c: number = Math.min(1, Math.max(0, x));
    return c * c * c * (10 - 15 * c + 6 * c * c);
  };

  /**
   * The plate lens with its lateral face on the skin in `windows`.
   *
   * @param loop The counter-clockwise excursion section, as `FamilyConicExcursion.plate` takes it.
   * @param thickness As `FamilyConicExcursion.plate`.
   * @param into As `FamilyConicExcursion.plate`.
   * @param deepest As `FamilyConicExcursion.plate`.
   * @param rim As `FamilyConicExcursion.plate`.
   * @param windows Chord-share windows (0 at the root, 1 at the outermost point) where the face follows the faired skin.
   */
  export function plate(loop: readonly P[], thickness: number, into: number, deepest: number, rim: number, windows: readonly IWindow[]): P[] {
    const hull: P[] = X.plate(loop, thickness, into, deepest, rim);
    if (windows.every((w: IWindow): boolean => w.weight <= 0)) return hull;

    // The chord frame `FamilyConicExcursion.plate` reads: from the root landmark to the outermost point.
    const [a, , m]: [number, number, number] = X.landmarks(loop);
    const A: P = loop[a]!;
    const M: P = loop[m]!;
    const chord: P = [M[0] - A[0], M[1] - A[1]];
    const length: number = Math.hypot(chord[0], chord[1]) || 1;
    const along: P = [chord[0] / length, chord[1] / length];
    const inward: P = [along[1], -along[0]];
    const toTh = (p: P): P => [((p[0] - A[0]) * along[0] + (p[1] - A[1]) * along[1]) / length, (p[0] - A[0]) * inward[0] + (p[1] - A[1]) * inward[1]];
    const fromTh = (q: P): P => [A[0] + q[0] * chord[0] + q[1] * inward[0], A[1] + q[0] * chord[1] + q[1] * inward[1]];

    // The skin's lateral side (all of the loop off the cranial path from the outermost point round to the root) and its floor: at each
    // share the point nearest the cranial skin, faired by a Gaussian of `FAIR_MM` along the chord.
    const n: number = loop.length;
    const cranial: Set<number> = new Set();
    for (let k: number = 0; ; ++k) {
      const i: number = (m + k) % n;
      cranial.add(i);
      if (i === a || k > n) break;
    }
    const lateral: P[] = loop.filter((_: P, i: number): boolean => !cranial.has(i)).map(toTh);
    const STEP: number = 0.005;
    const grid: number[] = Array.from({ length: Math.round(1 / STEP) + 1 }, (_: unknown, k: number): number => k * STEP);
    const raw: number[] = grid.map((t: number): number => {
      const near: number[] = lateral.filter((q: P): boolean => Math.abs(q[0] - t) <= 0.02).map((q: P): number => q[1]);
      return near.length === 0 ? NaN : Math.min(...near);
    });
    // The floor is read only inside each window and short of the plate's outer end: past that end lie the helix's curl and its underside,
    // and before the root the section's closure across the head, neither of which is the plate's floor.
    const sigma: number = FAIR_MM / length;
    const end: number = 1 - rim / length;
    const floorIn = (window: IWindow): ((t: number) => number) => {
      const lo: number = Math.max(0.02, window.from - RAMP);
      const hi: number = Math.min(end, window.to + RAMP);
      return (t: number): number => {
        let sum: number = 0;
        let weight: number = 0;
        grid.forEach((u: number, k: number): void => {
          if (u < lo || u > hi || !Number.isFinite(raw[k]!)) return;
          const g: number = Math.exp(-0.5 * ((u - t) / sigma) ** 2);
          sum += g * raw[k]!;
          weight += g;
        });
        return weight > 0 ? sum / weight : NaN;
      };
    };
    const floors: ((t: number) => number)[] = windows.map(floorIn);
    // Inside overlapping windows the shallower floor holds.
    const floorAt = (t: number): number => {
      const values: number[] = windows.map((w: IWindow, i: number): number => (t >= w.from - RAMP && t <= w.to + RAMP ? floors[i]!(t) : NaN)).filter(Number.isFinite);
      return values.length === 0 ? NaN : Math.min(...values);
    };
    const weightAt = (t: number): number =>
      Math.min(1, windows.reduce((sum: number, w: IWindow): number => sum + Math.max(0, w.weight) * smoother((t - w.from) / RAMP) * smoother((w.to - t) / RAMP), 0));

    // The hull's two faces by share: its cranial face the least `h`, its lateral face the greatest.
    const th: P[] = hull.map(toTh);
    const across = (t: number): [number, number] | null => {
      const hs: number[] = [];
      for (let k: number = 0; k < th.length; ++k) {
        const p: P = th[k]!;
        const q: P = th[(k + 1) % th.length]!;
        if ((p[0] - t) * (q[0] - t) > 0 || p[0] === q[0]) continue;
        hs.push(p[1] + ((t - p[0]) / (q[0] - p[0])) * (q[1] - p[1]));
      }
      return hs.length < 2 ? null : [Math.min(...hs), Math.max(...hs)];
    };

    // Each lateral point of the hull inside a window is laid down toward the faired floor, by the window's weight, keeping `LEAST_MM`
    // from the hull's cranial face; points on the cranial face and the ends' caps stand as they are.
    const laid: P[] = th.map((q: P): P => {
      const w: number = weightAt(q[0]);
      const faces: [number, number] | null = w <= 0 ? null : across(q[0]);
      if (faces === null || q[1] < (faces[0] + faces[1]) / 2) return fromTh(q);
      const target: number = Math.max(faces[0] + LEAST_MM, floorAt(q[0]));
      if (!Number.isFinite(target) || target >= q[1]) return fromTh(q);
      return fromTh([q[0], q[1] - w * (q[1] - target)]);
    });

    // A family's section is star-shaped about its course point (lofting, One section family): a groove as deep as the skin's, where
    // the plate's course runs within 1 to 2 mm of its cranial face (stations 54 to 64), turned back on the rays from it by 9 to 26
    // degrees. The section the fit reads is the laid lens read along rays from the course point, its outermost crossing kept, so a
    // groove keeps the depth the rays see.
    return X.star(laid, RAYS, "outer")?.points ?? hull;
  }
}
