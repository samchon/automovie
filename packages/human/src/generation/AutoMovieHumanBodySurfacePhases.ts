import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

const { circular, forward } = AutoMovieHumanBodySurfaceRead;

/** The phases a chain's rings are sampled at: its own rings' phases, refined beside a web, and the phases a child inherits from its parent's contact ring, with the arc vertices they share. */
export namespace AutoMovieHumanBodySurfacePhases {
  /**
   * A chain's own ring phases: uniform samples plus the pinch phases of the
   * events it parents, so every arc of those events falls on vertices.
   */
  export function ownPhases(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
  ): number[] {
    const uniform: number[] = Array.from(
      { length: target.samples },
      (_: unknown, i: number): number => (2 * Math.PI * i) / target.samples,
    );
    const pinches: number[] = context.events
      .filter(
        (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
          e.parent === target.name,
      )
      .flatMap((e: IAutoMovieHumanBodyCalibration.IEvent): number[] =>
        e.splits.flatMap((s: IAutoMovieHumanBodyCalibration.ISplit): number[] =>
          s.arcs.flat(),
        ),
      )
      // A whole-ring arc ends at 2pi, the same vertex as phase 0.
      .map((p: number): number => (p >= 2 * Math.PI - 1e-9 ? 0 : p));

    // Merge, dropping uniform phases that nearly coincide with a pinch or with
    // a web's own phases about one.
    const spacing: number = (2 * Math.PI) / target.samples;
    const refined: number[] = webPhases(context, target, spacing);
    const kept: number[] = uniform.filter(
      (t: number): boolean =>
        pinches.every((p: number): boolean => circular(t, p) > 0.25 * spacing) &&
        refined.every((p: number): boolean => circular(t, p) > 0.5 * spacing),
    );
    return [...new Set([...kept, ...pinches, ...refined])].sort(
      (a: number, b: number): number => a - b,
    );
  }

  /**
   * Phases a parent's ring takes about the pinches of its webs: at distances
   * along the ring growing as the square of their count, `WEB_REFINE k^2` of
   * the web's margin radius, up to the ring's own spacing. A web's columns
   * cross its crest's row at the square root of that distance
   * ({@link AutoMovieHumanBodyWeb}), so they pass the crest at even steps
   * instead of leaving cells there as wide as the ring's spacing.
   */
  export function webPhases(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    spacing: number,
  ): number[] {
    const out: number[] = [];
    for (const event of context.events) {
      if (event.parent !== target.name || event.web !== true) continue;
      const s: number =
        event.direction === "down"
          ? target.layers[0]!.y
          : target.layers[target.layers.length - 1]!.y;
      const at: (t: number) => [number, number, number] = AutoMovieHumanLoftChain.sampler(target, s);
      const pairs: Map<string, [number, number]> = new Map();
      for (const split of event.splits)
        split.arcs.forEach((arc: [number, number], k: number): void => {
          const next: [number, number] = split.arcs[(k + 1) % split.arcs.length]!;
          const a: number = arc[1];
          const b: number = next[0];
          pairs.set([Math.min(a, b), Math.max(a, b)].join(":"), [a, b]);
        });
      for (const [a, b] of pairs.values()) {
        const A: [number, number, number] = at(a);
        const B: [number, number, number] = at(b);
        const rho: number = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) / 2;
        for (const t of [a, b]) {
          const p: [number, number, number] = at(t - 1e-4);
          const q: [number, number, number] = at(t + 1e-4);
          const speed: number = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) / 2e-4;
          for (let k: number = 1; ; k++) {
            const d: number = WEB_REFINE * k * k * rho;
            if (d > 0.75 * spacing * speed) break;
            for (const sign of [-1, 1]) {
              const u: number = t + (sign * d) / speed;
              out.push(((u % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
            }
          }
        }
      }
    }
    return out;
  }

  /** First distance of a web's own phase from its pinch, in its margin's radius. */
  export const WEB_REFINE: number = 0.08;

  /**
   * Phases of inherited ring vertices on the chain's own end section.
   *
   * Each vertex takes the phase of its nearest point on the section the chain
   * itself evaluates at the inheriting end (a dense scan refined on the two
   * neighbouring chords), so the inherited ring is parametrized exactly as
   * the chain's own rings, whatever rule or matching fitted them. Phases are
   * then made to increase along the ring order, which the zipper requires.
   */
  export function inheritedPhases(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    station: number,
    ring: readonly number[],
  ): number[] {
    const outline: [number, number][] = AutoMovieHumanLoftChain.local(
      target,
      station,
      ring.map((v: number): [number, number, number] =>
        AutoMovieHumanLoftMesh.position(context.mesh, v),
      ),
    );
    // Dense samples of the chain's own section at this station.
    const c: number[] = AutoMovieHumanLoftChain.coefficients(target, station);
    const n: number = Math.max(1024, 8 * target.order);
    const curve: [number, number][] = Array.from(
      { length: n },
      (_: unknown, k: number): [number, number] => {
        const p: [number, number, number, number] =
          AutoMovieHumanLoftChain.section(target, c, (2 * Math.PI * k) / n);
        return [p[0], p[1]];
      },
    );

    // Nearest sample, then the nearest point on its two chords.
    const projected: number[] = outline.map((p: [number, number]): number => {
      let best: number = 0;
      let distance: number = Infinity;
      curve.forEach((q: [number, number], k: number): void => {
        const d: number = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
        if (d < distance) {
          distance = d;
          best = k;
        }
      });
      let phase: number = best;
      let closest: number = Infinity;
      for (const k of [best - 1, best]) {
        const a: [number, number] = curve[(k + n) % n]!;
        const b: [number, number] = curve[(k + 1 + n) % n]!;
        const dx: number = b[0] - a[0];
        const dz: number = b[1] - a[1];
        const L: number = dx * dx + dz * dz;
        const u: number =
          L > 0
            ? Math.min(
                1,
                Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L),
              )
            : 0;
        const d: number =
          (a[0] + u * dx - p[0]) ** 2 + (a[1] + u * dz - p[1]) ** 2;
        if (d < closest) {
          closest = d;
          phase = k + u;
        }
      }
      return (2 * Math.PI * phase) / n;
    });

    // Increase along the ring: unwrap, never step backward, wrap again.
    const out: number[] = [];
    projected.forEach((t: number, i: number): void => {
      if (i === 0) {
        out.push(t);
        return;
      }
      const previous: number = out[i - 1]!;
      const step: number =
        ((((t - previous) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) -
        Math.PI;
      out.push(previous + Math.max(step, 1e-6));
    });
    return out.map(
      (t: number): number =>
        ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    );
  }

  /** Ring vertices whose phases lie on a forward arc, inclusive, in ring order. */
  export function arcVertices(
    ring: readonly number[],
    phases: readonly number[],
    arc: [number, number],
  ): number[] {
    const [from, to]: [number, number] = arc;

    // A whole-period arc is a continuation event: the child takes every
    // vertex of the ring, which a forward distance of zero would lose.
    const width: number =
      to - from >= 2 * Math.PI - 1e-9 ? 2 * Math.PI : forward(from, to);

    // Phases are ascending in [0, 2pi); start at the arc's first vertex.
    const start: number = phases.findIndex(
      (t: number): boolean => circular(t, from) < 1e-9,
    );
    if (start < 0) throw new Error("Branch arc does not start on a vertex");

    const out: number[] = [];
    for (let k: number = 0; k < ring.length; k++) {
      const i: number = (start + k) % ring.length;
      if (forward(from, phases[i]!) > width + 1e-9) break;
      out.push(ring[i]!);
    }
    return out;
  }
}
