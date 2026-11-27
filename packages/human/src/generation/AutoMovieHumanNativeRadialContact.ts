import { AutoMovieEngineMath } from "@automovie/engine";

/**
 * Where a cutter's seed line enters a host whose sections are star-shaped about a straight course: the point seed of a diff join, derived
 * from both sources before any loft, in place of a contact read off an earlier run's output.
 *
 * The host is read radially. A point `p` stands at the host station `s_h` of its projection on the host's course and at the host phase
 * `t_h = atan2(p . v, p . u)` of its offset in that station's section plane; it is inside when its in-plane distance from the course is
 * less than the host section's at the same station and phase, `f(p) = |p - o(s_h)|_plane - |h(s_h, t_h) - o(s_h)|_plane`. Along the
 * cutter's line the first sign change of `f`, refined by the engine's bracketed root, is the seed: the part's material station there and
 * the host's chart point `[s_h, t_h]`, with the phase in [0, 2 pi). On a host whose section point at `(s, t)` lies on the polar ray of `t`
 * the two seed points coincide; a relief that displaces a section off its ray leaves a residual, reported, which the engine's Newton
 * start absorbs.
 */
export namespace AutoMovieHumanNativeRadialContact {
  /** A point or direction in the figure's frame, mm. */
  export type V = [number, number, number];

  /** A section frame of a course: origin, and the section plane's unit u and v, figure frame. */
  export interface IFrame {
    /** The course point, mm. */
    origin: readonly number[];
    /** The section plane's first axis, unit. */
    u: readonly number[];
    /** The section plane's second axis, unit. */
    v: readonly number[];
  }

  /** The host: its straight course, its source point at a chart point, and its material domain. */
  export interface IHost {
    /** The course frame at a station, mm. */
    at: (station: number) => IFrame;
    /** The host source's point at `[station mm, phase rad]`, figure frame mm. */
    point: (station: number, phase: number) => readonly number[];
    /** The host source's station domain, mm. */
    domain: readonly [number, number];
  }

  /** The derived seed and its observation. */
  export interface IResult {
    /** The part's material station on its seed line, mm. */
    part: number;
    /** The host chart point `[station mm, phase rad]`, phase in [0, 2 pi). */
    host: [number, number];
    /** The part's point at the seed, figure frame mm. */
    point: V;
    /** The host's point at its chart point, figure frame mm. */
    target: V;
  }

  const turn: number = 2 * Math.PI;

  /**
   * The seed of a cutter line `line(s)`, s from `from` to `to` in material mm, entering `host`, scanned at `samples` equal steps.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The radial inside function of a star-shaped host about its straight course; the first sign change along the declared seed line is bracketed and refined by the engine's root owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan, one root, one chart reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A line that never crosses the host, a degenerate course or a host station outside its domain is refused; no stored contact or retry stands in.
   * @evidence contracts/development/implementation.md#efficient-algorithms samples + 1 inside evaluations plus at most 64 root iterations, each one host point read.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure derivation coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers; nothing is retained.
   */
  export function seed(line: (s: number) => readonly number[], from: number, to: number, host: IHost, samples: number = 64): IResult {
    if (!(Number.isFinite(from) && Number.isFinite(to) && to > from && Number.isInteger(samples) && samples >= 2))
      throw new Error("radial contact needs an ordered finite seed window and at least two samples");
    const o0: readonly number[] = host.at(0).origin;
    const o1: readonly number[] = host.at(1).origin;
    const t: V = [o1[0]! - o0[0]!, o1[1]! - o0[1]!, o1[2]! - o0[2]!];
    const speed2: number = t[0] * t[0] + t[1] * t[1] + t[2] * t[2];
    if (!(Number.isFinite(speed2) && speed2 > 0)) throw new Error("radial contact host course has no direction");
    const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
    const chart = (p: readonly number[]): { station: number; phase: number; r: number; frame: IFrame } => {
      const station: number = dot([p[0]! - o0[0]!, p[1]! - o0[1]!, p[2]! - o0[2]!], t) / speed2;
      const frame: IFrame = host.at(station);
      const q: V = [p[0]! - frame.origin[0]!, p[1]! - frame.origin[1]!, p[2]! - frame.origin[2]!];
      const [a, b]: number[] = [dot(q, frame.u), dot(q, frame.v)];
      return { station, phase: Math.atan2(b!, a!), r: Math.hypot(a!, b!), frame };
    };
    const inside = (s: number): number => {
      const c = chart(line(s));
      if (!(c.station >= host.domain[0] && c.station <= host.domain[1])) return NaN;
      const h: readonly number[] = host.point(c.station, c.phase);
      const g: V = [h[0]! - c.frame.origin[0]!, h[1]! - c.frame.origin[1]!, h[2]! - c.frame.origin[2]!];
      return c.r - Math.hypot(dot(g, c.frame.u), dot(g, c.frame.v));
    };
    let previous: number = from;
    let before: number = inside(from);
    let at: number | null = null;
    for (let k: number = 1; k <= samples && at === null; ++k) {
      const s: number = from + ((to - from) * k) / samples;
      const now: number = inside(s);
      if (Number.isFinite(before) && Number.isFinite(now) && before * now <= 0)
        at = before === 0 ? previous : now === 0 ? s : AutoMovieEngineMath.bracketedRoot(inside, previous, s, 1e-9 * Math.max(1, Math.abs(s)), 64);
      previous = s;
      before = now;
    }
    if (at === null) throw new Error("radial contact: the seed line does not cross its host in its window");
    const p: readonly number[] = line(at);
    const c = chart(p);
    const phase: number = ((c.phase % turn) + turn) % turn;
    const h: readonly number[] = host.point(c.station, phase);
    return { part: at, host: [c.station, phase], point: [p[0]!, p[1]!, p[2]!], target: [h[0]!, h[1]!, h[2]!] };
  }
}
