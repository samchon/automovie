import { type AutoMovieLoftFrame, AutoMovieLoftViewFullSource as Full, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieConstructionPort } from "@automovie/interface";

import { AutoMovieHumanSkinCutLoop } from "./AutoMovieHumanSkinCutLoop";

/**
 * The loop of a part that stands on a host's side, generated for the person: both skins cut by the surface that divides them.
 *
 * Where a part leaves a host's side (the arm at the armscye, the breast on the chest, the auricle's plate at its root), the two
 * families are fitted either side of one dividing surface: on its own side each wall is skin, past it each is a closure nobody sees.
 * The curve the two parts meet on is therefore the surface's trace on the skin, read twice: on the part's chart as the station at
 * which each of its station lines passes the surface, and on the host's chart as the shares of a port loop
 * (`AutoMovieHumanSkinCutLoop.shares`). The crossing of the two fitted walls is not that curve: past the surface each wall is free,
 * and measured on f1's shoulder the walls' crossing jumped between arm stations 74 and 119 over the cap.
 *
 * The loop is handed to the engine as `IAutoMovieConstructionPort.ILoop` on the host's chart, the declared contact of a shared-loop
 * join (`IAutoMovieConstructionJoin.loop`), with the two chart points a point seed names and the largest distance between the two
 * skins on it, which is what the join's tolerance has to admit.
 */
export namespace AutoMovieHumanJoinLoop {
  type V = [number, number, number];

  /**
   * The generated contact.
   *
   * @evidence contracts/development/design.md#principled-representation The loop as the engine admits it, the two chart points a point seed names, and the two readings the join's tolerance and an inspection need.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the figure's join or by the pre-check tool.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The gap is reported, never folded into the loop.
   * @evidence contracts/development/common.md#meaningful-documentation Members state charts and units.
   */
  export interface IContact {
    /** The loop on the host's chart, `count` shares about its own centre. */
    loop: IAutoMovieConstructionPort.ILoop;

    /** The part's chart point `[station m, phase rad]` of the loop's point at clock 0. */
    part: [number, number];

    /** The host's chart point `[station m, phase rad]` at clock 0. */
    host: [number, number];

    /** The largest distance between the part's skin on the surface and the host's skin at the same chart address, mm. */
    gap: number;

    /** The loop's station on the part's course at each part phase read, mm. */
    stations: number[];
  }

  /** Part phases the cut is read at: one a degree. */
  const PHASES: number = 360;

  /** The step a station line is walked in before a passing is bisected, mm. */
  const STEP_MM: number = 0.5;

  /**
   * How far past the loop's half extents on the host's chart a ray is walked for its crossing, as a share: a loop inside its own box
   * lies within `sqrt(2)` of its centre, and the host's skin is read where the part's stands off it by the gap, so twice the box is
   * walked and a ray that has not crossed by then is refused.
   */
  const REACH: number = 2;

  /**
   * Generate the contact of a part on a host.
   *
   * @param host The host's complete source, level sections on a straight course.
   * @param part The part's complete source on the stored side (+Z), carried inward past the surface.
   * @param count The join's column count: the loop's shares.
   * @param side The dividing surface, mm: positive on the part's side, zero on it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each part station line is walked for the one place it passes the surface and bisected; each point is given its address on the host's chart (a level section about a straight course: station its height along the course, phase its polar angle); the loop's centre and half extents are those addresses' centroid and extents; its shares are the host's own skin cut by the surface along each column's ray (`AutoMovieHumanSkinCutLoop.shares`), so the loop lies on the surface at every column and is interpolated nowhere.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cut the part, address the host, cut the host.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stored loop, landmark or person enters and nothing is faired; a host that is not straight and level, a station line that passes the surface more or less than once, a loop that is not star-shaped about its centre and a ray without a crossing are refused with their numbers.
   * @evidence contracts/development/implementation.md#efficient-algorithms 360 station lines of at most the part's length in half millimetres with 40 bisections, and `count` rays of 256 steps with at most 60 bisections; no loft and no mesh.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both source readers are prepared once and serve every read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers; the readers die with the call.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' premises, the units and each refusal.
   */
  export function create(host: IAutoMovieViewPart, part: IAutoMovieViewPart, count: number, side: (p: readonly number[]) => number): IContact {
    const [onto, from]: Full.IReader[] = [Full.create(host), Full.create(part)];
    const sub = (a: readonly number[], b: readonly number[]): V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
    const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

    // The host's chart of a world point: its course is straight and its frame constant, which is checked at both ends of its domain.
    const [foot, head]: AutoMovieLoftFrame.IFrame[] = [host.axis.at(onto!.domain[0]), host.axis.at(onto!.domain[1])];
    const along: V = sub(head!.origin, foot!.origin);
    const length: number = Math.hypot(along[0], along[1], along[2]);
    const tangent: V = [along[0] / length, along[1] / length, along[2] / length];
    if (Math.abs(length - (onto!.domain[1] - onto!.domain[0])) > 1e-6 || Math.hypot(...sub(head!.u, foot!.u)) > 1e-9 || Math.abs(dot(tangent, foot!.u)) > 1e-9)
      throw new Error("join loop: the host's course is not straight with level sections");
    const chart = (p: readonly number[]): [number, number] => {
      const q: V = sub(p, foot!.origin);
      return [onto!.domain[0] + dot(q, tangent), Math.atan2(dot(q, foot!.v), dot(q, foot!.u))];
    };

    // The part's skin cut by the surface: on each station line, the one place the line passes from the host's side to the part's.
    const stations: number[] = Array.from({ length: PHASES }, (_: unknown, j: number): number => {
      const phase: number = (2 * Math.PI * j) / PHASES;
      const at = (s: number): number => side(from!.point(s, phase));
      const crossings: number[] = [];
      let previous: number = at(from!.domain[0]);
      for (let s: number = from!.domain[0] + STEP_MM; s <= from!.domain[1]; s += STEP_MM) {
        const d: number = at(s);
        if (previous < 0 !== d < 0) {
          let [lo, hi]: [number, number] = [s - STEP_MM, s];
          for (let i: number = 0; i < 40; ++i) {
            const middle: number = (lo + hi) / 2;
            if (at(middle) < 0 === previous < 0) lo = middle;
            else hi = middle;
          }
          crossings.push((lo + hi) / 2);
        }
        previous = d;
      }
      if (crossings.length !== 1) throw new Error("join loop: the part's station line at phase " + phase + " rad passes the dividing surface " + crossings.length + " times, not once");
      return crossings[0]!;
    });

    // Each point's address on the host's chart, with the gap between the two skins there. The phase is unwrapped along the ring, so a
    // loop across the chart's seam keeps one centre.
    let gap: number = 0;
    const points: [number, number][] = [];
    stations.forEach((station: number, j: number): void => {
      const p: readonly number[] = from!.point(station, (2 * Math.PI * j) / PHASES);
      const [s, t]: [number, number] = chart(p);
      const before: number = points.length === 0 ? t : points.at(-1)![1];
      const phase: number = before + Math.atan2(Math.sin(t - before), Math.cos(t - before));
      const q: readonly number[] = onto!.point(s, phase);
      gap = Math.max(gap, Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!));
      points.push([s, phase]);
    });
    const centre: [number, number] = [0, 1].map((k: number): number => points.reduce((sum: number, p: [number, number]): number => sum + p[k]!, 0) / PHASES) as [number, number];
    const semi: [number, number] = [0, 1].map((k: number): number => Math.max(...points.map((p: [number, number]): number => Math.abs(p[k]! - centre[k]!)))) as [number, number];
    if (!(semi[0] > 0 && semi[1] > 0 && semi[1] < Math.PI)) throw new Error("join loop: the loop's half extents on the host's chart are " + semi.join(" mm and ") + " rad");

    // Star-shaped about the centre: the part's ring turns one way round it, once.
    const clocks: number[] = points.map((p: [number, number]): number => Math.atan2((p[1] - centre[1]) / semi[1], (p[0] - centre[0]) / semi[0]));
    const steps: number[] = clocks.map((clock: number, j: number): number => {
      const d: number = clock - clocks[(j + PHASES - 1) % PHASES]!;
      return Math.atan2(Math.sin(d), Math.cos(d));
    });
    const turn: number = steps.reduce((sum: number, d: number): number => sum + d, 0);
    const back: number = steps.filter((d: number): boolean => Math.sign(turn) * d <= 0).length;
    if (Math.abs(Math.abs(turn) - 2 * Math.PI) > 1e-6 || back > 0)
      throw new Error("join loop: the loop is not star-shaped about its centre on the host's chart (" + back + " of " + PHASES + " steps turn back)");

    // The host's own skin cut by the same surface, along each column's ray from the centre.
    const shape: number[] | string = AutoMovieHumanSkinCutLoop.shares({
      point: (u: number, v: number): V => onto!.point(u, v) as V,
      centre,
      semi,
      sense: 1,
      count,
      side: (p: V): number => -side(p),
      reach: REACH,
    });
    if (typeof shape === "string") throw new Error("join loop: " + shape);

    // The part's ring point nearest clock 0, for the seed.
    const first: number = clocks.reduce((best: number, clock: number, j: number): number => (Math.abs(clock) < Math.abs(clocks[best]!) ? j : best), 0);
    return {
      loop: { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense: 1, shape },
      part: [stations[first]! / 1000, (2 * Math.PI * first) / PHASES],
      host: [(centre[0] + shape[0]! * semi[0]) / 1000, centre[1]],
      gap,
      stations,
    };
  }
}
