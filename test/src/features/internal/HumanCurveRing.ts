import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveVector } from "./HumanCurveVector";
import { HumanCurveConstants } from "./HumanCurveConstants";

type V3 = [number, number, number];
const { add, cross, distance, dot, sub, unit }: typeof HumanCurveVector = HumanCurveVector;
const { NORMAL_PHASE, NORMAL_STATION, PROFILE_STEP }: typeof HumanCurveConstants = HumanCurveConstants;

/** Measures of a ring and a chain that several curve rules read: curvature, area normal, crossings, perimeter, uniform phases, sides and bands. */
export namespace HumanCurveRing {
  /** Shorter arc enclosed by a ring's largest self-crossing, 0 without one, mm. */
  export function crossingArc(ring: V3[]): number {
    const n: V3 = areaNormal(ring);
    const seed: V3 = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
    const u: V3 = unit(cross(n, seed));
    const v: V3 = cross(n, u);
    const flat: [number, number][] = ring.map((p: V3): [number, number] => [
      dot(p, u),
      dot(p, v),
    ]);

    // Twice the signed area of a triangle: which side of a line a point lies on.
    const turn: (a: [number, number], b: [number, number], c: [number, number]) => number = (
      a: [number, number],
      b: [number, number],
      c: [number, number],
    ): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const size: number = flat.length;
    const lengths: number[] = ring.map((p: V3, i: number): number =>
      distance(p, ring[(i + 1) % size]!),
    );
    const whole: number = lengths.reduce((s: number, l: number): number => s + l, 0);
    let worst: number = 0;
    for (let i: number = 0; i < size; i++) {
      let run: number = lengths[i]!;
      for (let j: number = i + 2; j < size; j++) {
        run += lengths[j - 1]!;
        if (i === 0 && j === size - 1) continue;
        const a: [number, number] = flat[i]!;
        const b: [number, number] = flat[(i + 1) % size]!;
        const c: [number, number] = flat[j]!;
        const d: [number, number] = flat[(j + 1) % size]!;
        if (turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0)
          worst = Math.max(worst, Math.min(run, whole - run));
      }
    }
    return worst;
  }

  /** Rearmost place where a ring crosses the plane at a lateral place. */
  export function rearAt(ring: V3[], z: number): number {
    let best: number = Infinity;
    ring.forEach((a: V3, i: number): void => {
      const b: V3 = ring[(i + 1) % ring.length]!;
      if ((a[2] - z) * (b[2] - z) > 0 || a[2] === b[2]) return;
      best = Math.min(best, a[0] + ((z - a[2]) / (b[2] - a[2])) * (b[0] - a[0]));
    });
    return best;
  }

  /**
   * The face's front x against world height at a fixed distance from the midline,
   * read off the lower and middle head's rings.
   */
  export function faceProfile(
    body: IAutoMovieHumanBodyCalibration,
    z: number,
    low: number,
    high: number,
  ): [number, number][] {
    const out: [number, number][] = [];
    for (const chain of body.chains.filter((c: IAutoMovieHumanLoftChain): boolean =>
      /^head\.(lower|middle)$/.test(c.name),
    )) {
      const bottom: number = chain.layers[0]!.y;
      const top: number = chain.layers[chain.layers.length - 1]!.y;
      for (let s: number = bottom; s <= top; s += PROFILE_STEP) {
        const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, s, uniform(1440));
        let best: [number, number] | null = null;
        ring.forEach((p: V3, i: number): void => {
          const q: V3 = ring[(i + 1) % ring.length]!;
          if ((p[2] - z) * (q[2] - z) > 0 || p[2] === q[2]) return;
          const f: number = (z - p[2]) / (q[2] - p[2]);
          const x: number = p[0] + f * (q[0] - p[0]);
          if (best === null || x > best[1]) best = [p[1] + f * (q[1] - p[1]), x];
        });
        if (best !== null && best[0] >= low && best[0] <= high) out.push(best);
      }
    }
    return out.sort((p: [number, number], q: [number, number]): number => p[0] - q[0]);
  }

  /** Unit normals of a chain's surface at one station and given phases. */
  export function normalsOf(
    chain: IAutoMovieHumanLoftChain,
    station: number,
    phases: number[],
  ): V3[] {
    // The ring at a station with every phase moved by a shift.
    const at: (s: number, shift: number) => V3[] = (s: number, shift: number): V3[] =>
      AutoMovieHumanLoftChain.ring(
        chain,
        s,
        phases.map((t: number): number => t + shift),
      );
    const up: V3[] = at(station + NORMAL_STATION, 0);
    const down: V3[] = at(station - NORMAL_STATION, 0);
    const ahead: V3[] = at(station, NORMAL_PHASE);
    const behind: V3[] = at(station, -NORMAL_PHASE);
    return phases.map(
      (_: number, i: number): V3 =>
        unit(cross(sub(up[i]!, down[i]!), sub(ahead[i]!, behind[i]!))),
    );
  }

  /** Station span of a chain. */
  export function length(chain: IAutoMovieHumanLoftChain): number {
    return chain.layers[chain.layers.length - 1]!.y - chain.layers[0]!.y;
  }

  /** Indices where a ring's curvature flips sign while large. */
  export function flipsOf(
    values: number[],
    radius: number,
    limit: number,
  ): number[] {
    const out: number[] = [];
    let sign: number = 0;
    values.forEach((v: number, i: number): void => {
      if (Math.abs(v) * radius < limit) return;
      if (sign !== 0 && Math.sign(v) !== sign) out.push(i);
      sign = Math.sign(v);
    });
    return out;
  }

  /** Signed curvature round a closed ring in the plane of its area. */
  export function signedCurvature(ring: V3[]): number[] {
    const n: V3 = areaNormal(ring);
    return ring.map((p: V3, j: number): number => {
      const a: V3 = sub(p, ring[(j + ring.length - 1) % ring.length]!);
      const b: V3 = sub(ring[(j + 1) % ring.length]!, p);
      const la: number = Math.hypot(...a);
      const lb: number = Math.hypot(...b);
      if (la < 1e-6 || lb < 1e-6) return 0;
      const c: V3 = cross(a, b);
      const turn: number = Math.atan2(dot(c, n), dot(a, b));
      return turn / ((la + lb) / 2);
    });
  }

  /** Unit normal of a ring's area. */
  export function areaNormal(ring: V3[]): V3 {
    const c: V3 = centre(ring);
    let n: V3 = [0, 0, 0];
    ring.forEach((p: V3, i: number): void => {
      n = add(n, cross(sub(p, c), sub(ring[(i + 1) % ring.length]!, c)));
    });
    return unit(n);
  }

  /** Direction on the body of a ring's point, about the ring's centre. */
  export function side(ring: V3[], j: number): string {
    const c: V3 = centre(ring);
    const p: V3 = ring[j]!;
    const a: number = Math.atan2(p[2] - c[2], p[0] - c[0]);
    const names: string[] = ["front", "front-left", "left", "back-left", "back", "back-right", "right", "front-right"];
    return names[(Math.round((a / (2 * Math.PI)) * 8) + 8) % 8]!;
  }

  /** Groups neighbouring layers so one defect reads as one line. */
  export function band(k: number): string {
    const from: number = Math.floor(k / 4) * 4;
    return `${from}-${from + 3}`;
  }

  const UNIFORM: Map<number, number[]> = new Map();

  /** Phases of a ring sampled evenly, once per sample count. */
  export function uniform(count: number): number[] {
    const found: number[] | undefined = UNIFORM.get(count);
    if (found !== undefined) return found;
    const phases: number[] = Array.from(
      { length: count },
      (_: unknown, i: number): number => (2 * Math.PI * i) / count,
    );
    UNIFORM.set(count, phases);
    return phases;
  }

  /** Length of a closed ring. */
  export function perimeter(ring: V3[]): number {
    return ring.reduce(
      (s: number, p: V3, i: number): number =>
        s + distance(p, ring[(i + 1) % ring.length]!),
      0,
    );
  }

  /** How many times a ring crosses itself, read flat in its own plane. */
  export function crossings(ring: V3[]): number {
    const n: V3 = areaNormal(ring);
    const seed: V3 = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
    const u: V3 = unit(cross(n, seed));
    const v: V3 = cross(n, u);
    const flat: [number, number][] = ring.map((p: V3): [number, number] => [
      dot(p, u),
      dot(p, v),
    ]);

    // Twice the signed area of a triangle: which side of a line a point lies on.
    const turn: (a: [number, number], b: [number, number], c: [number, number]) => number = (
      a: [number, number],
      b: [number, number],
      c: [number, number],
    ): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    let count: number = 0;
    const size: number = flat.length;
    for (let i: number = 0; i < size; i++)
      for (let j: number = i + 2; j < size; j++) {
        if (i === 0 && j === size - 1) continue;
        const a: [number, number] = flat[i]!;
        const b: [number, number] = flat[(i + 1) % size]!;
        const c: [number, number] = flat[j]!;
        const d: [number, number] = flat[(j + 1) % size]!;
        if (turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0)
          count++;
      }
    return count;
  }

  /** Whether a closed polygon in the plane holds a point, by the even-odd rule. */
  export function encloses(polygon: [number, number][], p: [number, number]): boolean {
    let odd: boolean = false;
    for (let i: number = 0, j: number = polygon.length - 1; i < polygon.length; j = i++) {
      const a: [number, number] = polygon[i]!;
      const b: [number, number] = polygon[j]!;
      if (
        a[1] > p[1] !== b[1] > p[1] &&
        p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
      )
        odd = !odd;
    }
    return odd;
  }

  /** Mean of a ring's points. */
  export function centre(ring: V3[]): V3 {
    const s: V3 = ring.reduce((a: V3, p: V3): V3 => add(a, p), [0, 0, 0]);
    return [s[0] / ring.length, s[1] / ring.length, s[2] / ring.length];
  }
}
