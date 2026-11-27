import { AutoMovieHumanSkinCutLoop } from "./AutoMovieHumanSkinCutLoop";
import { AutoMovieEngineLoftViewFullSource as Full } from "@automovie/engine";
import type {
  IAutoMovieConstructionChartPoint,
  IAutoMovieConstructionPortLoop,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

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
    loop: IAutoMovieConstructionPortLoop;

    /** The part's chart point at clock 0: station in metres and phase in radians. */
    part: IAutoMovieConstructionChartPoint;

    /** The host's chart point at clock 0: station in metres and phase in radians. */
    host: IAutoMovieConstructionChartPoint;

    /** The largest distance between the part's skin on the surface and the host's skin at the same chart address, mm. */
    gap: number;

    /** The loop's station on the part's course at each part phase read, mm. */
    stations: number[];
  }

  /**
   * A world point's address on a part's chart: the station at which the point lies in the course's section plane, mm, and its polar
   * angle in that station's frame, rad.
   *
   * The section plane's normal is `v x u` (`AutoMovieEngineLoftFrame`), and a point `d` ahead of a section along it lies about `d` of
   * station ahead, so the first step is that distance and lands on a straight course; round a turn the distance to the plane is
   * brought to zero by the secant through the last two stations, which does not depend on how tight the turn is (stepped by the
   * distance alone, a made turn whose tightest radius is 1.6 times the point's distance had not landed in 64 steps).
   *
   * @param part The part whose chart is read.
   * @param domain The part's stations, mm.
   * @param p The point, mm.
   * @param guess The station the search starts at.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The secant method on the signed distance to the section plane, started by one step of that distance; the phase is read in the found station's own frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop, one frame a step, one reader of the distance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No straight-course premise and no nearest-sample search; a point the steps do not reach, or one past the part's stations, is refused with the station it stopped at.
   * @evidence contracts/development/implementation.md#efficient-algorithms One frame a step; one or two steps on a straight course, at most `ADDRESS_STEPS`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A caller walking a curve passes the last station as the next guess.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers.
   * @evidence contracts/development/common.md#meaningful-documentation States units, the premise of convergence and the refusal.
   */
  export function address(part: IAutoMovieViewPart, domain: readonly [number, number], p: readonly number[], guess: number): [number, number] {
    // The signed distance of the point ahead of the section plane at a station, and the point in that station's frame.
    const read = (station: number): { ahead: number; frame: IAutoMovieLoftSectionFrame; q: V } => {
      const frame: IAutoMovieLoftSectionFrame = part.axis.at(station);
      const q: V = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
      const normal: V = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
      return { ahead: q[0] * normal[0] + q[1] * normal[1] + q[2] * normal[2], frame, q };
    };
    const clamp = (station: number): number => Math.min(domain[1], Math.max(domain[0], station));
    let [last, lastAhead]: [number, number] = [NaN, NaN];
    let station: number = clamp(guess);
    for (let i: number = 0; i < ADDRESS_STEPS; ++i) {
      const { ahead, frame, q } = read(station);
      // Landed: under the threshold, or the secant no longer moves the station (the frames' own rounding).
      if (Math.abs(ahead) <= ADDRESS_MM || station === last) {
        if (Math.abs(ahead) > ADDRESS_FLOOR_MM) break;
        return [station, Math.atan2(q[0] * frame.v[0] + q[1] * frame.v[1] + q[2] * frame.v[2], q[0] * frame.u[0] + q[1] * frame.u[1] + q[2] * frame.u[2])];
      }
      // The first step is the distance itself; every later one is the secant through the last two stations.
      const slope: number = (ahead - lastAhead) / (station - last);
      const next: number = clamp(Number.isFinite(slope) && slope !== 0 ? station - ahead / slope : station + ahead);
      [last, lastAhead] = [station, ahead];
      station = next;
    }
    throw new Error("join loop: a point has no address on the chart of " + part.name + " (station " + station + " mm after " + ADDRESS_STEPS + " steps)");
  }

  /**
   * Generate the contact of a part on a host.
   *
   * @param host The host's complete source; every point of the part's cut stands inside its course's radius of curvature.
   * @param part The part's complete source on the stored side (+Z), carried inward past the surface.
   * @param count The join's column count: the loop's shares.
   * @param side The dividing surface, mm: positive on the part's side, zero on it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each part station line is walked for the one place it passes the surface and bisected; each point is given its address on the host's chart (the station whose section plane holds it, found by stepping along the course by the point's distance ahead of the plane, and its polar angle in that station's frame); the loop's centre and half extents are those addresses' centroid and extents; its shares are the host's own skin cut by the surface along each column's ray (`AutoMovieHumanSkinCutLoop.shares`), so the loop lies on the surface at every column and is interpolated nowhere.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cut the part, address the host, cut the host.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stored loop, landmark or person enters and nothing is faired; a point with no address on the host, a station line that passes the surface more or less than once, a loop that is not star-shaped about its centre and a ray without a crossing are refused with their numbers.
   * @evidence contracts/development/implementation.md#efficient-algorithms 360 station lines of at most the part's length in half millimetres with 40 bisections, and `count` rays of 256 steps with at most 60 bisections; no loft and no mesh.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both source readers are prepared once and serve every read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers; the readers die with the call.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' premises, the units and each refusal.
   */
  export function create(host: IAutoMovieViewPart, part: IAutoMovieViewPart, count: number, side: (p: readonly number[]) => number): IContact {
    const [onto, from]: IAutoMovieLoftViewFullSource.IReader[] = [Full.create(host), Full.create(part)];

    const chart = (p: readonly number[], guess: number): [number, number] => address(host, onto!.domain, p, guess);

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
      const [s, t]: [number, number] = chart(p, points.length === 0 ? (onto!.domain[0] + onto!.domain[1]) / 2 : points.at(-1)![0]);
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
      centre: { u: centre[0], v: centre[1] },
      semi: { u: semi[0], v: semi[1] },
      sense: 1,
      count,
      side: (p: V): number => -side(p),
      reach: REACH,
    });
    if (typeof shape === "string") throw new Error("join loop: " + shape);

    // The part's ring point nearest clock 0, for the seed.
    const first: number = clocks.reduce((best: number, clock: number, j: number): number => (Math.abs(clock) < Math.abs(clocks[best]!) ? j : best), 0);
    return {
      loop: {
        centre: { station: centre[0] / 1000, phase: centre[1] },
        semi: {
          stationMetres: semi[0] / 1000,
          phaseRadians: semi[1],
        },
        sense: 1,
        shape,
      },
      part: {
        station: stations[first]! / 1000,
        phase: (2 * Math.PI * first) / PHASES,
      },
      host: {
        station: (centre[0] + shape[0]! * semi[0]) / 1000,
        phase: centre[1],
      },
      gap,
      stations,
    };
  }

  /*
   * Part phases the cut is read at: one a degree.
   */
  const PHASES: number = 360;

  /*
   * The step a station line is walked in before a passing is bisected, mm.
   */
  const STEP_MM: number = 0.5;

  /*
   * How near a section plane a point is taken to lie in it, mm: a picometre. The station's own error is this over `1 - d / R` for a
   * point `d` from the course on a turn of radius `R`, so under a nanometre wherever the search converges at all: stopped at a
   * nanometre from the plane, stations inside a turn of 48.3 mm came back 1.9e-9 to 2.6e-9 mm short at 20 mm from the course.
   */
  const ADDRESS_MM: number = 1e-12;

  /*
   * The distance from the plane under which a search that has stopped shrinking is taken as landed, mm: a course's frames are
   * computed in doubles, and far along a long course their rounding can hold the distance above a picometre.
   */
  const ADDRESS_FLOOR_MM: number = 1e-9;

  /*
   * Steps a point's station is sought in: the secant lands in under ten from 40 mm away on a made turn; a search that needs more is refused.
   */
  const ADDRESS_STEPS: number = 64;

  /*
   * How far past the loop's half extents on the host's chart a ray is walked for its crossing, as a share: a loop inside its own box
   * lies within `sqrt(2)` of its centre, and the host's skin is read where the part's stands off it by the gap, so twice the box is
   * walked and a ray that has not crossed by then is refused.
   */
  const REACH: number = 2;
  type V = [number, number, number];
}
