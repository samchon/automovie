import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Head and shoulder landmarks of a calibrated body that the shape law's
 * length and width rules read, measured on the lofted sections in world
 * heights.
 *
 * A framed or lifted section does not lie at its station's height: the
 * lower head's sections tilt forward, and a shape basis lifts sections off
 * their planes (on m1 the shoulder chain's top ring rises 10 to 20 mm
 * unevenly). Every height here is therefore a world height, and every
 * width is taken over the head's surface points within 0.5 mm of it.
 *
 * - Eye level: the mean height of the two eyeball centres.
 * - Head centre: the middle head's section centroid at eye level.
 * - Menton: the lowest point of the lower head within 8 mm of the midline
 *   and more than 20 mm in front of the head centre, the chin's underside.
 * - Neck base and lower-face top: the mean heights of the shoulder chain's
 *   top ring and of the lower head's top ring (below the nose).
 * - Face widths at three heights, as twice the largest lateral distance
 *   from the head centre among surface points more than 25 mm in front of
 *   it, so the auricles (attached to the middle head's sections, about the
 *   centre's depth) never count: minimum frontal width 25 mm above eye
 *   level, bizygomatic width 15 mm below it, bigonial width 25 mm above
 *   the menton over the whole section (the jaw angles lie at the centre's
 *   depth). The heights are conventions placing each landmark in its
 *   region on an adult face; the widths are measured there.
 * - Head breadth: the full lateral extent 45 mm above eye level, above
 *   the auricles; head length: the largest front-to-back extent of the
 *   middle and upper head between eye level and 60 mm above it.
 * - Acromion level: the station where the shoulder chain is widest,
 *   between 30 mm above its axillary ring and 10 mm below its top.
 */
export namespace AutoMovieHumanBodyLandmarks {
  /** Landmarks of one calibration, mm, registered frame. */
  export interface ILandmarks {
    /** Eye level. */
    eye: number;

    /** Head centre `[x, z]` at eye level. */
    centre: [number, number];

    /** Menton height. */
    menton: number;

    /** Neck base height: the shoulder chain's top ring. */
    neck: number;

    /** Lower-face top height: the lower head's top ring. */
    face: number;

    /** Heights of the frontal, zygomatic and gonial widths. */
    heights: { frontal: number; zygomatic: number; gonial: number };

    /** Widths at those heights. */
    widths: { frontal: number; zygomatic: number; gonial: number };

    /** Head breadth. */
    breadth: number;

    /** Head length. */
    length: number;

    /** Station of the widest shoulder section. */
    acromion: number;

    /** Shoulder width there: the shoulder chain's lateral extent. */
    shoulder: number;
  }

  /**
   * Measure a calibration's landmarks.
   *
   * @param calibration Calibration with `upper`, `head.lower`,
   *   `head.middle` and `head.upper` chains and two eyes.
   */
  export function measure(
    calibration: IAutoMovieHumanBodyCalibration,
  ): ILandmarks {
    const named: Map<string, IAutoMovieHumanLoftChain> = new Map(
      calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    const eye: number =
      calibration.eyes.reduce(
        (sum: number, e: IAutoMovieHumanBodyCalibration.IEye): number =>
          sum + e.centre[1],
        0,
      ) / calibration.eyes.length;
    const middle: IAutoMovieHumanLoftChain = named.get("head.middle")!;
    const axis: [number, number, number] = AutoMovieHumanLoftChain.axis(
      middle,
      clamp(middle, eye),
    );
    const centre: [number, number] = [axis[0], axis[2]];

    // The head's surface points, every 0.5 mm of station.
    const points: [number, number, number][] = [
      "head.lower",
      "head.middle",
      "head.upper",
    ].flatMap((n: string): [number, number, number][] => {
      const chain: IAutoMovieHumanLoftChain = named.get(n)!;
      const out: [number, number, number][] = [];
      for (let s: number = bottom(chain); s <= top(chain); s += 0.5)
        out.push(...AutoMovieHumanLoftChain.ring(chain, s, PHASES));
      return out;
    });

    // Chin: lowest front midline point.
    let menton: number = Infinity;
    for (const p of points)
      if (Math.abs(p[2] - centre[1]) < 8 && p[0] > centre[0] + 20)
        menton = Math.min(menton, p[1]);

    const heights: ILandmarks["heights"] = {
      frontal: eye + 25,
      zygomatic: eye - 15,
      gonial: menton + 25,
    };
    const widths: ILandmarks["widths"] = {
      frontal: width(points, heights.frontal, centre, 25),
      zygomatic: width(points, heights.zygomatic, centre, 25),
      gonial: width(points, heights.gonial, centre, -Infinity),
    };
    let length: number = 0;
    for (const n of ["head.middle", "head.upper"]) {
      const chain: IAutoMovieHumanLoftChain = named.get(n)!;
      for (let s: number = bottom(chain); s <= top(chain); s += 1) {
        const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
          chain,
          s,
          PHASES,
        );
        if (
          !ring.some(
            (p: [number, number, number]): boolean =>
              p[1] >= eye && p[1] <= eye + 60,
          )
        )
          continue;
        const x: number[] = ring.map(
          (p: [number, number, number]): number => p[0],
        );
        length = Math.max(length, Math.max(...x) - Math.min(...x));
      }
    }

    // Shoulders: the widest section of the shoulder chain.
    const upper: IAutoMovieHumanLoftChain = named.get("upper")!;
    let acromion: number = bottom(upper) + 30;
    let shoulder: number = 0;
    for (let s: number = bottom(upper) + 30; s <= top(upper) - 10; s += 1) {
      const z: number[] = AutoMovieHumanLoftChain.ring(upper, s, PHASES).map(
        (p: [number, number, number]): number => p[2],
      );
      const w: number = Math.max(...z) - Math.min(...z);
      if (w > shoulder) {
        shoulder = w;
        acromion = s;
      }
    }
    return {
      eye,
      centre,
      menton,
      neck: level(upper, top(upper)),
      face: level(named.get("head.lower")!, top(named.get("head.lower")!)),
      heights,
      widths,
      breadth: width(points, eye + 45, centre, -Infinity),
      length,
      acromion,
      shoulder,
    };
  }

  /**
   * Twice the largest lateral distance from the head centre among surface
   * points within 0.5 mm of height y that lie more than `front` mm in front
   * of the centre.
   */
  export function width(
    points: readonly (readonly [number, number, number])[],
    y: number,
    centre: readonly [number, number],
    front: number,
  ): number {
    let w: number = 0;
    for (const p of points)
      if (Math.abs(p[1] - y) < 0.5 && p[0] > centre[0] + front)
        w = Math.max(w, 2 * Math.abs(p[2] - centre[1]));
    return w;
  }
}

/** Uniform phases of a measured section. */
const PHASES: number[] = Array.from(
  { length: 256 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 256,
);

/** Mean height of a chain's ring at a station. */
function level(chain: IAutoMovieHumanLoftChain, s: number): number {
  const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
    chain,
    s,
    PHASES,
  );
  return (
    ring.reduce(
      (sum: number, p: [number, number, number]): number => sum + p[1],
      0,
    ) / ring.length
  );
}

/** Bottom station of a chain. */
function bottom(chain: IAutoMovieHumanLoftChain): number {
  return chain.layers[0]!.y;
}

/** Top station of a chain. */
function top(chain: IAutoMovieHumanLoftChain): number {
  return chain.layers[chain.layers.length - 1]!.y;
}

/** A station clamped into a chain. */
function clamp(chain: IAutoMovieHumanLoftChain, s: number): number {
  return Math.min(top(chain), Math.max(bottom(chain), s));
}
