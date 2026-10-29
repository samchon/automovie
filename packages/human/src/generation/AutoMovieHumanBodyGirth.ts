import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";

/**
 * Tape measures of a calibrated body: girths of chain sections and the
 * stations where the body's named girths are taken.
 *
 * A girth is the perimeter of the convex hull of a section's horizontal
 * projection, which is what a tape stretched around the body measures: it
 * bridges the hollow between the breasts or the buttocks instead of
 * following the skin into it. Sections are sampled at 128 uniform phases,
 * so a hull edge is at most a few millimetres long on the trunk.
 *
 * Named stations follow the measurement definitions as extrema along a
 * chain, searched in station windows (mm, registered frame): the hip is
 * the largest trunk girth in the 200 mm above the crotch, the waist the
 * smallest in the 400 mm above the hip, the chest the level where the
 * trunk reaches farthest forward (the bust apex, through which the chest
 * tape runs; the girth itself keeps growing toward the axillae with the
 * latissimus) and the underbust 50 mm below it, a convention for the
 * inframammary fold, which has no girth extremum; the thigh is the largest
 * leg girth from 100 to 20 mm below the crotch, the knee the smallest from
 * 380 to 560 mm, the calf the largest between the ankle and the knee; on
 * an arm, whose horizontal sections cut it obliquely, the wrist is the
 * smallest girth 20 to 80 mm above the hand, the elbow the smallest in the
 * upper half short of the axilla, the forearm the largest between them and
 * the biceps the largest above the elbow. Windows are conventions placing
 * each landmark in its region of the calibration specimen; the extremum
 * inside is measured.
 */
export namespace AutoMovieHumanBodyGirth {
  /** Named girth stations of one specimen, chain stations in mm. */
  export interface IStations {
    /** Trunk stations: hip, high hip, waist, underbust, chest. */
    trunk: Record<"hip" | "highHip" | "waist" | "underbust" | "chest", number>;

    /** Leg stations, by leg chain name: thigh, knee, calf. */
    legs: Map<string, Record<"thigh" | "knee" | "calf", number>>;

    /** Arm stations, by arm chain name: biceps, elbow, forearm, wrist. */
    arms: Map<string, Record<"bicep" | "elbow" | "forearm" | "wrist", number>>;
  }

  /**
   * Tape girth of a chain's section at station s, mm.
   *
   * @param chain Chain evaluated by the generator's own section rule,
   *   lift included.
   * @param s Declared chain station, not a world-space rig pivot height.
   * @param scale Proposed x/z scale in the existing world-XZ tape plane.
   */
  export function at(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    scale: readonly [number, number] = [1, 1],
  ): number {
    const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
      chain,
      s,
      PHASES,
    );
    return perimeter(
      hull(
        ring.map((p: [number, number, number]): [number, number] => [
          p[0] * scale[0],
          p[2] * scale[1],
        ]),
      ),
    );
  }

  /**
   * Named girth stations of a body.
   *
   * @param chains Calibration chains by name; `trunk`, `leg.*` and `arm.*`
   *   are read.
   * @param crotch Station of the crotch event, mm.
   */
  export function stations(
    chains: Map<string, IAutoMovieHumanLoftChain>,
    crotch: number,
  ): IStations {
    const trunk: IAutoMovieHumanLoftChain = chains.get("trunk")!;
    const top: number = end(trunk, "top");
    const hip: number = extreme(trunk, crotch + 10, crotch + 200, 1);
    const waist: number = extreme(trunk, hip + 60, hip + 400, -1);
    const chest: number = apex(trunk, waist + 60, top - 5);
    const underbust: number = Math.max(waist + 20, chest - 50);

    const legs: IStations["legs"] = new Map();
    const arms: IStations["arms"] = new Map();
    for (const [name, chain] of chains) {
      if (name.startsWith("leg.")) {
        const t: number = end(chain, "top");
        const knee: number = extreme(chain, 380, 560, -1);
        legs.set(name, {
          thigh: extreme(chain, t - 100, t - 20, 1),
          knee,
          calf: extreme(chain, end(chain, "bottom") + 60, knee - 40, 1),
        });
      } else if (name.startsWith("arm.")) {
        const b: number = end(chain, "bottom");
        const t: number = end(chain, "top");
        const wrist: number = extreme(chain, b + 20, b + 80, -1);
        const elbow: number = extreme(chain, (b + t) / 2, t - 60, -1);
        arms.set(name, {
          wrist,
          forearm: extreme(chain, wrist + 20, elbow - 20, 1),
          elbow,
          bicep: extreme(chain, elbow + 20, t - 25, 1),
        });
      }
    }
    return {
      trunk: { hip, highHip: (hip + waist) / 2, waist, underbust, chest },
      legs,
      arms,
    };
  }
}

/** Uniform phases of a girth section. */
const PHASES: number[] = Array.from(
  { length: 128 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 128,
);

/** Station of a chain end, mm. */
function end(chain: IAutoMovieHumanLoftChain, side: "bottom" | "top"): number {
  return side === "bottom"
    ? chain.layers[0]!.y
    : chain.layers[chain.layers.length - 1]!.y;
}

/**
 * Station of the largest (`sign` 1) or smallest (-1) girth in a window,
 * clamped into the chain, scanned at 2 mm and refined at 0.25 mm.
 */
function extreme(
  chain: IAutoMovieHumanLoftChain,
  from: number,
  to: number,
  sign: 1 | -1,
): number {
  const lo: number = Math.max(end(chain, "bottom"), Math.min(from, to));
  const hi: number = Math.min(end(chain, "top"), Math.max(from, to));
  let best: number = lo;
  let value: number = -Infinity;
  const visit: (s: number) => void = (s: number): void => {
    const v: number = sign * AutoMovieHumanBodyGirth.at(chain, s);
    if (v > value) {
      value = v;
      best = s;
    }
  };
  for (let s: number = lo; s <= hi; s += 2) visit(s);
  const centre: number = best;
  for (let s: number = centre - 2; s <= centre + 2; s += 0.25)
    if (s >= lo && s <= hi) visit(s);
  return best;
}

/**
 * Station in a window where a chain's section reaches farthest forward
 * (+X), scanned at 2 mm: the bust apex on the trunk.
 */
function apex(
  chain: IAutoMovieHumanLoftChain,
  from: number,
  to: number,
): number {
  const lo: number = Math.max(end(chain, "bottom"), from);
  const hi: number = Math.min(end(chain, "top"), to);
  let best: number = lo;
  let front: number = -Infinity;
  for (let s: number = lo; s <= hi; s += 2) {
    const x: number = Math.max(
      ...AutoMovieHumanLoftChain.ring(chain, s, PHASES).map(
        (p: [number, number, number]): number => p[0],
      ),
    );
    if (x > front) {
      front = x;
      best = s;
    }
  }
  return best;
}

/** Convex hull of planar points, counter-clockwise (Andrew's monotone chain). */
function hull(points: [number, number][]): [number, number][] {
  const sorted: [number, number][] = [...points].sort(
    (a: [number, number], b: [number, number]): number =>
      a[0] - b[0] || a[1] - b[1],
  );
  const cross: (
    o: [number, number],
    a: [number, number],
    b: [number, number],
  ) => number = (
    o: [number, number],
    a: [number, number],
    b: [number, number],
  ): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half: (list: [number, number][]) => [number, number][] = (
    list: [number, number][],
  ): [number, number][] => {
    const out: [number, number][] = [];
    for (const p of list) {
      while (
        out.length >= 2 &&
        cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
      )
        out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

/** Perimeter of a closed polygon. */
function perimeter(polygon: [number, number][]): number {
  let sum: number = 0;
  for (let i: number = 0; i < polygon.length; i++) {
    const a: [number, number] = polygon[i]!;
    const b: [number, number] = polygon[(i + 1) % polygon.length]!;
    sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return sum;
}
