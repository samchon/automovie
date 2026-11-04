import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * The chains an opening is trimmed from, and its trim loop in each of their
 * parameter domains.
 *
 * Each point of the opening's margin is taken to its foot on every chain
 * whose sections pass near the margin: the front-most chain point
 * nearest the margin point's line of sight along the opening's `forward`
 * axis, solved by Gauss-Newton from the previous foot and once more from a
 * coarse search where that stalls. Where the line meets the skin the foot
 * lies on it, so the rim projects onto the margin's outline (the cut's own
 * definition). Where it meets none, because it runs along a slit's groove
 * between the lips or passes a nostril's outer end that overhangs the
 * nose's turning base, the point has no foot and the loop runs on through
 * the feet that exist. A point belongs to the chain whose foot lies on its
 * line, inside the chain (a foot held at a chain's end ring and pulling past
 * it belongs to the chain beyond).
 *
 * When the feet fall on two chains, those chains must meet at one shared ring
 * (an event's contact layer): the loop is split there, and each crossing of
 * the ring is solved once on the ring's owner (the event's parent, whose layer
 * the child copies) and its phase on the neighbour read from the same point on
 * the neighbour's section at that station, so both sides of the split share
 * one boundary point. Each chain then holds its part of the loop, closed past
 * the ring, as a polygon in its own chart for the cells it leaves out; the rim
 * is one closed loop of points, each on its own chain. An opening on one chain
 * is the case with no crossing.
 *
 * Every derivative is a difference taken inside the chain's station range,
 * one-sided at its ends, so no read leaves the chain.
 */
export namespace AutoMovieHumanApertureSpan {
  /** A rim point on its chain, with its chart on the neighbour where it lies on their shared ring. */
  export interface IPoint {
    /** The chain the point is evaluated on. */
    chain: string;

    /** Station, mm. */
    s: number;

    /** Phase, radians, on the branch the loop runs on. */
    t: number;

    /** The same point in the neighbour's chart, for a point on the shared ring. */
    also?: { chain: string; s: number; t: number };
  }

  /** An opening's trim on one or two chains. */
  export interface ISpan {
    /** The chains, the one holding the most points first. */
    chains: string[];

    /** The rim points in margin order, crossings of a shared ring included. */
    points: IPoint[];

    /** Each chain's polygon `[station, phase]` for the cells it leaves out, closed past the shared ring. */
    loops: Map<string, [number, number][]>;
  }

  /**
   * The key of the one hole the chains of a spanning opening leave their
   * cells in, apart from the holes keyed by chain name.
   *
   * @param opening The opening's name.
   */
  export function key(opening: string): string {
    return "opening:" + opening;
  }

  /**
   * The span of an opening, or the reason, with its numbers, why its margin
   * lies on no chain or pair of chains that share a ring.
   *
   * @param prepared The opening.
   * @param chains The candidate chains: the declared base alone, or every chain of the calibration.
   * @param events The calibration's events, which name the owner of a shared ring.
   */
  export function of(
    prepared: AutoMovieHumanBodyApertures.IPrepared,
    chains: readonly IAutoMovieHumanLoftChain[],
    events: readonly IAutoMovieHumanBodyCalibration.IEvent[],
  ): ISpan | string {
    const margin: [number, number, number][] = AutoMovieHumanLoftAperture.polyline(prepared.aperture);
    const range: [number, number] = AutoMovieHumanLoftAperture.range(margin);
    const tolerance: number = prepared.aperture.depth;

    // Feet of every margin point on every chain whose surface comes near it,
    // searched over the stations whose sections do: a tilted section's front
    // stands far from its station's height (the planes under the nose turn
    // front-down), so a station is no height.
    const feet: Map<string, IFoot[]> = new Map();
    for (const chain of chains) {
      const reach: [number, number] | null = window(chain, margin, tolerance + REACH);
      if (reach === null) continue;
      feet.set(chain.name, footing(chain, margin, prepared.outline.forward, reach));
    }

    // Each margin point on the chain whose foot inside it lies on its line of
    // sight. A point whose line meets no skin (it runs along a slit's groove
    // between the lips, or past the silhouette where a nostril's outer end
    // overhangs the turning base) has no foot and is left out, so the loop
    // runs through the feet that exist, in margin order.
    const owners: (string | null)[] = margin.map((_: [number, number, number], i: number): string | null => {
      let best: string | null = null;
      let least: number = SOLVED;
      for (const [name, list] of feet) {
        const f: IFoot = list[i]!;
        if (!f.past && f.distance <= least) {
          least = f.distance;
          best = name;
        }
      }
      return best;
    });
    const kept: number[] = owners
      .map((o: string | null, i: number): number => (o === null ? -1 : i))
      .filter((i: number): boolean => i >= 0);
    if (kept.length < MARGIN) {
      const reading: string = [...feet]
        .map(([name, list]: [string, IFoot[]]): string => {
          const inside: IFoot[] = list.filter((f: IFoot): boolean => !f.past);
          const worst: number = inside.reduce((a: number, f: IFoot): number => Math.max(a, f.distance), 0);
          return `${name}: ${inside.length} inside, worst ${worst.toFixed(3)} mm`;
        })
        .join("; ");
      return `${kept.length} of ${owners.length} margin points have a foot over heights ${range[0].toFixed(1)} to ${range[1].toFixed(1)} (${reading})`;
    }
    const names: string[] = [...new Set(kept.map((i: number): string => owners[i]!))].sort(
      (a: string, b: string): number => count(owners, b) - count(owners, a),
    );
    const byName: Map<string, IAutoMovieHumanLoftChain> = new Map(
      chains.map((c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [c.name, c]),
    );
    const at = (i: number): IPoint => {
      const name: string = owners[i]!;
      const f: IFoot = feet.get(name)![i]!;
      return { chain: name, s: f.s, t: f.t };
    };
    if (names.length === 1) {
      const points: IPoint[] = kept.map(at);
      return {
        chains: names,
        points,
        loops: new Map([[names[0]!, points.map((p: IPoint): [number, number] => [p.s, p.t])]]),
      };
    }
    if (names.length !== 2) return `margin on ${names.length} chains: ${names.join(", ")}`;

    // The two chains must meet at one ring; its owner is the event's parent.
    const ring: IRing | null = shared(byName.get(names[0]!)!, byName.get(names[1]!)!, events);
    if (ring === null) return `chains ${names.join(" and ")} share no ring`;
    const owner: IAutoMovieHumanLoftChain = byName.get(ring.owner)!;
    const neighbour: IAutoMovieHumanLoftChain = byName.get(ring.neighbour)!;

    // The rim with a crossing on the ring between every two kept points on
    // different chains: the owner's ring point nearest the margin's chord
    // there, copied by the neighbour.
    const points: IPoint[] = [];
    for (let k: number = 0; k < kept.length; k++) {
      const i: number = kept[k]!;
      const j: number = kept[(k + 1) % kept.length]!;
      const p: IPoint = at(i);
      points.push(p);
      if (owners[j] === owners[i]) continue;
      const q: IPoint = at(j);
      const a: [number, number, number] = margin[i]!;
      const b: [number, number, number] = margin[j]!;
      const t: number = nearest(owner, ring.station, (x: readonly number[]): number => chord(x, a, b), (p.chain === ring.owner ? p : q).t);
      const point: [number, number, number] = AutoMovieHumanLoftChain.point(owner, ring.station, t);
      const other: number = phaseOf(neighbour, ring.station, point, (p.chain === ring.neighbour ? p : q).t);
      points.push({
        chain: ring.owner,
        s: ring.station,
        t,
        also: { chain: ring.neighbour, s: ring.station, t: other },
      });
    }

    // Each chain's polygon: its own points and the crossings in its chart,
    // and past the ring where the loop runs on the other chain.
    const loops: Map<string, [number, number][]> = new Map();
    for (const name of names) {
      const away: number = name === ring.lower ? 1 : -1;
      const polygon: [number, number][] = [];
      const chart = (p: IPoint): [number, number] | null =>
        p.chain === name ? [p.s, p.t] : p.also?.chain === name ? [p.also.s, p.also.t] : null;
      const start: number = points.findIndex((p: IPoint): boolean => p.chain === name && p.also === undefined);
      for (let k: number = 0; k < points.length; k++) {
        const p: IPoint = points[(start + k) % points.length]!;
        const c: [number, number] | null = chart(p);
        if (c === null) continue;
        const before: IPoint = points[(start + k - 1 + points.length) % points.length]!;
        const after: IPoint = points[(start + k + 1) % points.length]!;
        if (p.also !== undefined && chart(before) === null) polygon.push([ring.station + away * PAST, c[1]]);
        polygon.push(c);
        if (p.also !== undefined && chart(after) === null) polygon.push([ring.station + away * PAST, c[1]]);
      }
      loops.set(name, polygon);
    }
    return { chains: names, points, loops };
  }

  /**
   * The phase at which a chain's section at a station passes nearest a
   * point: the copy of an owner's ring point in a neighbour's chart.
   *
   * @param chain The chain.
   * @param s Its station, inside its range.
   * @param point The point, mm.
   * @param guess A phase near the answer.
   */
  export function phaseOf(chain: IAutoMovieHumanLoftChain, s: number, point: readonly number[], guess: number): number {
    return nearest(
      chain,
      s,
      (x: readonly number[]): number => (x[0]! - point[0]!) ** 2 + (x[1]! - point[1]!) ** 2 + (x[2]! - point[2]!) ** 2,
      guess,
    );
  }

  /**
   * The phase of a chain's section at a station where a cost of its point is
   * least: a scan of the whole section from the guess (two chains need not
   * share a phase convention), then Newton on the cost's slope.
   */
  function nearest(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    cost: (x: readonly number[]) => number,
    guess: number,
  ): number {
    const gap = (t: number): number => cost(AutoMovieHumanLoftChain.point(chain, s, t));
    let t: number = guess;
    let least: number = gap(t);
    for (let k: number = -256; k < 256; k++) {
      const u: number = guess + (k * Math.PI) / 256;
      const d: number = gap(u);
      if (d < least) {
        least = d;
        t = u;
      }
    }
    for (let k: number = 0; k < 20; k++) {
      const g0: number = gap(t - TURN);
      const g1: number = gap(t);
      const g2: number = gap(t + TURN);
      const slope: number = (g2 - g0) / (2 * TURN);
      const bend: number = (g2 - 2 * g1 + g0) / (TURN * TURN);
      if (!(bend > 0)) break;
      const step: number = Math.max(-0.05, Math.min(0.05, slope / bend));
      t -= step;
      if (Math.abs(step) < 1e-10) break;
    }
    return t;
  }

  /** Squared distance of a point from the segment between two margin points. */
  function chord(x: readonly number[], a: readonly number[], b: readonly number[]): number {
    const d: number[] = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
    const l: number = d[0]! ** 2 + d[1]! ** 2 + d[2]! ** 2;
    const u: number =
      l > 0 ? Math.min(1, Math.max(0, ((x[0]! - a[0]!) * d[0]! + (x[1]! - a[1]!) * d[1]! + (x[2]! - a[2]!) * d[2]!) / l)) : 0;
    return (a[0]! + u * d[0]! - x[0]!) ** 2 + (a[1]! + u * d[1]! - x[1]!) ** 2 + (a[2]! + u * d[2]! - x[2]!) ** 2;
  }

  /**
   * The ring two chains share, its owner the event parent whose contact layer
   * it is, or null.
   */
  function shared(
    a: IAutoMovieHumanLoftChain,
    b: IAutoMovieHumanLoftChain,
    events: readonly IAutoMovieHumanBodyCalibration.IEvent[],
  ): IRing | null {
    for (const e of events) {
      const child: string | undefined = e.splits.find(
        (sp: IAutoMovieHumanBodyCalibration.ISplit): boolean => sp.child === a.name || sp.child === b.name,
      )?.child;
      if (child === undefined) continue;
      const parentName: string = child === a.name ? b.name : a.name;
      if (e.parent !== parentName) continue;
      const parent: IAutoMovieHumanLoftChain = parentName === a.name ? a : b;
      const station: number = e.direction === "down" ? parent.layers[0]!.y : parent.layers[parent.layers.length - 1]!.y;
      return {
        owner: parentName,
        neighbour: child,
        station,
        lower: e.direction === "down" ? child : parentName,
      };
    }
    return null;
  }

  /**
   * Every margin point's foot on one chain: the chain point nearest the
   * margin point's line of sight along the opening's `forward` axis, so the
   * foot projects onto the margin's outline (`AutoMovieHumanLoftAperture.IOutline`,
   * the margin seen along that axis) wherever the line meets the skin, and is
   * the skin's nearest point to the line where the margin overhangs the
   * skin's silhouette along it. A coarse search of the front-most skin finds
   * the first; Gauss-Newton on the squared distance to the line starts each
   * from the previous foot, the station held inside the chain and its
   * difference one-sided at the chain's ends. A foot held at an end ring with
   * the distance still falling past it lies on the chain beyond (`past`).
   */
  function footing(
    chain: IAutoMovieHumanLoftChain,
    margin: readonly [number, number, number][],
    forward: readonly number[],
    stations: [number, number],
  ): IFoot[] {
    const y0: number = chain.layers[0]!.y;
    const y1: number = chain.layers[chain.layers.length - 1]!.y;

    // The part of a vector square to the line of sight.
    const square = (v: readonly number[]): number[] => {
      const along: number = dot(v, forward);
      return [v[0]! - along * forward[0]!, v[1]! - along * forward[1]!, v[2]! - along * forward[2]!];
    };
    // A coarse search of the front-most skin nearest a margin point's line.
    const seed = (target: readonly number[]): [number, number] => {
      let found: [number, number] = [Math.min(y1, Math.max(y0, (stations[0] + stations[1]) / 2)), 0];
      let best: number = Infinity;
      for (let s: number = Math.max(y0, stations[0] - REACH); s <= Math.min(y1, stations[1] + REACH); s += 0.5)
        for (let i: number = 0; i < 512; i++) {
          const t: number = (2 * Math.PI * i) / 512;
          const p: [number, number, number] = AutoMovieHumanLoftChain.point(chain, s, t);
          const off: number[] = [p[0] - target[0]!, p[1] - target[1]!, p[2] - target[2]!];

          // Front-most skin only: the opening's own side of the head.
          const d: number = Math.hypot(...square(off)) - 1e-3 * dot(off, forward);
          if (d < best) {
            best = d;
            found = [s, t];
          }
        }
      return found;
    };

    /** Gauss-Newton on the squared distance to a margin point's line of sight. */
    function solve(start: [number, number], target: readonly number[]): IFoot {
      let [s, t] = start;
      let past: boolean = false;
      for (let iteration: number = 0; iteration < 30; iteration++) {
        const p: [number, number, number] = AutoMovieHumanLoftChain.point(chain, s, t);
        const r: number[] = square([p[0] - target[0]!, p[1] - target[1]!, p[2] - target[2]!]);
        const h: number = s + STEP <= y1 ? STEP : -STEP;
        const ps: [number, number, number] = AutoMovieHumanLoftChain.point(chain, s + h, t);
        const pt: [number, number, number] = AutoMovieHumanLoftChain.point(chain, s, t + TURN);
        const du: number[] = square([(ps[0] - p[0]) / h, (ps[1] - p[1]) / h, (ps[2] - p[2]) / h]);
        const dv: number[] = square([(pt[0] - p[0]) / TURN, (pt[1] - p[1]) / TURN, (pt[2] - p[2]) / TURN]);
        const a11: number = dot(du, du);
        const a12: number = dot(du, dv);
        const a22: number = dot(dv, dv);
        const b1: number = -dot(du, r);
        const b2: number = -dot(dv, r);
        const det: number = a11 * a22 - a12 * a12;
        if (!(Math.abs(det) > 1e-12)) break;
        let ds: number = (b1 * a22 - b2 * a12) / det;
        let dt: number = (a11 * b2 - a12 * b1) / det;

        // Bound the step to a millimetre of skin.
        const length: number = Math.hypot(ds, dt * Math.sqrt(a22));
        if (length > 1) {
          ds /= length;
          dt /= length;
        }
        const next: number = Math.min(y1, Math.max(y0, s + ds));
        past = next !== s + ds && Math.abs(ds) > 1e-6;
        if (Math.abs(next - s) < 1e-7 && Math.abs(dt) < 1e-9) break;
        s = next;
        t += dt;
      }
      const p: [number, number, number] = AutoMovieHumanLoftChain.point(chain, s, t);
      return { s, t, distance: Math.hypot(...square([p[0] - target[0]!, p[1] - target[1]!, p[2] - target[2]!])), past };
    }

    // Each foot from the previous one; a solve that stops off the line of
    // sight starts once more from the coarse search for its own point, since
    // a local solve can stall in a neighbouring valley of the distance (the
    // lips' groove beside a slit) that the line never reaches.
    let guess: [number, number] = seed(margin[0]!);
    return margin.map((target: [number, number, number]): IFoot => {
      let foot: IFoot = solve(guess, target);
      if (foot.distance > SOLVED) {
        const again: IFoot = solve(seed(target), target);
        if (again.distance < foot.distance) foot = again;
      }
      guess = [foot.s, foot.t];
      return foot;
    });
  }

  /**
   * The stations of a chain whose sections pass near a margin, or null: the
   * span of the layers whose ring, read at a few phases, comes within `reach`
   * of the margin's box, widened by one layer on each side.
   */
  function window(
    chain: IAutoMovieHumanLoftChain,
    margin: readonly [number, number, number][],
    reach: number,
  ): [number, number] | null {
    const low: number[] = [Infinity, Infinity, Infinity];
    const high: number[] = [-Infinity, -Infinity, -Infinity];
    for (const m of margin)
      for (let c: number = 0; c < 3; c++) {
        low[c] = Math.min(low[c]!, m[c]! - reach);
        high[c] = Math.max(high[c]!, m[c]! + reach);
      }
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    let first: number = -1;
    let last: number = -1;
    layers.forEach((layer: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
      for (let i: number = 0; i < PHASES; i++) {
        const p: [number, number, number] = AutoMovieHumanLoftChain.point(chain, layer.y, (2 * Math.PI * i) / PHASES);
        if (p.every((v: number, c: number): boolean => low[c]! <= v && v <= high[c]!)) {
          if (first < 0) first = k;
          last = k;
          return;
        }
      }
    });
    if (first < 0) return null;
    return [layers[Math.max(0, first - 1)]!.y, layers[Math.min(layers.length - 1, last + 1)]!.y];
  }

  /** Dot product. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }

  /** How many points name a chain. */
  function count(owners: readonly (string | null)[], name: string): number {
    return owners.filter((o: string | null): boolean => o === name).length;
  }

  /**
   * Distance from its line of sight under which a foot is solved, mm: the
   * station step the skin takes round an opening (`AutoMovieHumanBodyApertures`,
   * 0.5 mm) over five, the distance within which a skin point already counted
   * as lying on an opening's outline.
   */
  const SOLVED: number = 0.1;

  /** How far past the shared ring a chain's polygon is closed, mm, so its cells on the ring fall inside. */
  const PAST: number = 1;

  /** Least feet a trim loop is drawn through, as for `AutoMovieHumanSolidTrim`'s landmarks. */
  const MARGIN: number = 4;

  /** Distance beyond the margin and its tolerance a chain's section is searched over, mm. */
  const REACH: number = 8;

  /** Phases a layer's ring is read at to find the stations near a margin. */
  const PHASES: number = 64;

  /** Station step of a difference, mm. */
  const STEP: number = 0.01;

  /** Phase step of a difference, radians. */
  const TURN: number = 1e-4;

  /** A foot of one margin point. */
  interface IFoot {
    /** Station. */
    s: number;

    /** Phase. */
    t: number;

    /** Distance from the margin point's line of sight, mm. */
    distance: number;

    /** Whether the foot is held at an end ring while the nearest point lies beyond it. */
    past: boolean;
  }

  /** A ring two chains share. */
  interface IRing {
    /** The event parent, whose contact layer the ring is. */
    owner: string;

    /** The child that copies it. */
    neighbour: string;

    /** The ring's station, mm. */
    station: number;

    /** The chain below the ring. */
    lower: string;
  }
}
