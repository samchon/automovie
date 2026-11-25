import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple as P3,
  IAutoMovieSolidSurface as Solid,
} from "@automovie/interface";

/** Prepared polar clocks and exact directional support for native sections. */
export namespace AutoMovieHumanDigitalSection {
  const TURN = 2 * Math.PI;
  type Point = (phase: number) => P3;
  /** Directed native polar clock in the receiving part's immutable section. */
  export function physicalClock(
    section: { point: Point; jet: (phase: number) => Solid.IJet },
    tape: readonly P3[],
    center: P3,
    u: P3,
    v: P3,
  ) {
    const phi = (p: P3): number => {
      const delta: P3 = Vec.sub(p, center);
      return Math.atan2(Vec.dot(delta, v), Vec.dot(delta, u));
    };
    const angles: number[] = tape.map(phi);
    const wrap = (x: number): number => Math.atan2(Math.sin(x), Math.cos(x));
    const steps = angles.map((a, i): number =>
      wrap(angles[(i + 1) % angles.length]! - a),
    );
    const sense: number = Math.sign(steps.reduce((a, b) => a + b, 0));
    const origin: number = angles[0]!;
    const relative = (angle: number): number =>
      (((sense * (angle - origin)) % TURN) + TURN) % TURN;
    const step: number = TURN / tape.length;
    const intervals = [0, ...angles.slice(1).map(relative), TURN];
    return {
      phase: (p: P3): number => relative(phi(p)),
      rate: (p: P3, d: P3): number => {
        const delta = Vec.sub(p, center);
        const x = Vec.dot(delta, u);
        const y = Vec.dot(delta, v);
        return (
          (sense * (x * Vec.dot(d, v) - y * Vec.dot(d, u))) / (x * x + y * y)
        );
      },
      minimumAngularStep: Math.min(...steps.map((x): number => sense * x)),
      advance: wrap,
      read: (address: number): Solid.IJet & { phase: number } => {
        const hi = intervals.findIndex((x): boolean => x > address);
        let a: number = (hi - 1) * step;
        let b: number = hi * step;
        for (;;) {
          const m: number = (a + b) / 2;
          if (m === a || m === b) return { ...section.jet(m), phase: m };
          const difference: number = wrap(
            relative(phi(section.point(m))) - address,
          );
          if (Math.abs(difference) <= Number.EPSILON * TURN)
            return { ...section.jet(m), phase: m };
          if (difference < 0) a = m;
          else b = m;
        }
      },
    };
  }

  /** Stationary support of the actual native section in a physical direction. */
  export function support(
    section: { point: Point; jet: (phase: number) => Solid.IJet },
    normal: P3,
    tape: readonly P3[],
  ) {
    const count: number = tape.length;
    const step: number = TURN / count;
    const values = tape.map((p): number => Vec.dot(p, normal));
    const roots = values.flatMap((value, i) => {
      if (
        value < values[(i + 1) % count]! ||
        value < values[(i + count - 1) % count]!
      )
        return [];
      let lo = (i - 1) * step;
      let hi = (i + 1) * step;
      let phase = i * step;
      let jet = section.jet(phase);
      for (;;) {
        const value: number = Vec.dot(jet.v, normal);
        if (Math.abs(value) <= Number.EPSILON * Vec.norm(jet.v)) break;
        if (value > 0) lo = phase;
        else hi = phase;
        const next: number = phase - value / Vec.dot(jet.vv, normal);
        const chosen: number = next > lo && next < hi ? next : (lo + hi) / 2;
        if (Math.abs(chosen - phase) <= Number.EPSILON * TURN) break;
        phase = chosen;
        jet = section.jet(phase);
      }
      return [{ ...jet, phase }];
    });
    return roots.reduce((a, b) =>
      Vec.dot(a.p, normal) > Vec.dot(b.p, normal) ? a : b,
    );
  }
}
