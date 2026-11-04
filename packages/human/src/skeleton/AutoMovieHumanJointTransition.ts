import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";

/**
 * A joint's transition piece: the skin between two rigid shaft pieces, its
 * half width per sector round the joint.
 *
 * Two bones blended as dual quaternions about their joint turn a point by
 * phi(w), whose slope at an even share is `4 tan(theta / 4)` for the joint's
 * turn theta (derived from the normalized blend of Kavan 2008). Skin rho from
 * the joint then stretches by `1 + rho |dphi/dw| |grad w|` on the opening side
 * and turns over on the closing side once that term passes 1. Skin tears past
 * a principal stretch of 2 (Ní Annaidh 2012), so a step of peak slope `SLOPE`
 * per half width h keeps the bound where `h >= 4 tan(theta / 4) SLOPE rho /
 * (STRETCH - 1)`. Each sector round the joint reads its own farthest skin, so
 * a thin side turns on a short ramp and only the thick side gets the length
 * its stretch needs; two harmonics of the angle carry the sectors, raised by
 * their largest shortfall so the profile covers every sector.
 */
export namespace AutoMovieHumanJointTransition {
  /** A half width by the angle about a plane's normal. */
  export interface ISectors {
    /** First axis square to the normal, where the angle is zero. */
    u: Math3D.Vector;

    /** Second axis square to the normal, a quarter turn on. */
    v: Math3D.Vector;

    /** Mean, then cosine and sine of the angle and of twice it, metres. */
    terms: [number, number, number, number, number];

    /** Least half width, metres. */
    least: number;

    /** Greatest half width, metres. */
    most: number;
  }

  /** What one transition is measured from. */
  export interface IMeasure {
    /** Skin samples, metres, three numbers each. */
    points: Float64Array;

    /** Whether a sample belongs to the joint's two bones and side. */
    held: (index: number) => boolean;

    /** The plane's point, metres. */
    at: Math3D.Vector;

    /** The plane's unit normal toward the child. */
    normal: Math3D.Vector;

    /** The joint's largest turn from the bind, radians. */
    turn: number;

    /** Least half width, metres. */
    least: number;

    /** Greatest half width, metres. */
    most: number;
  }

  /**
   * Principal stretch a ramp may give the skin at its joint's whole turn. Skin
   * fails in tension at a strain of 0.54 +- 0.17 (Ní Annaidh 2012), so 2 is a
   * tear for nearly all of it.
   */
  export const STRETCH: number = 2;

  /**
   * Sectors a ramp's farthest skin is read in round its joint, 30 degrees
   * each (convention): enough to separate the opening and closing sides of a
   * hinge and the front and back of the hip, which two harmonics then carry.
   */
  export const SECTORS: number = 12;

  /**
   * Measure a transition's half width per sector.
   *
   * @param input The samples, the plane and the joint's turn.
   * @returns The sector profile; its `most` is the widest sector's half.
   */
  export function measure(input: IMeasure): ISectors {
    const n: Math3D.Vector = input.normal;
    const a: Math3D.Vector = Math.abs(n[0]) < 0.9 ? FORWARD : LEFT;
    const u: Math3D.Vector = Math3D.unit(
      Math3D.sub(a, Math3D.times(n, dot(a, n))),
    );
    const v: Math3D.Vector = cross(n, u);
    const most: number = Math.max(input.least, input.most);
    // Half width per metre of rho that holds the stretch bound (derived): the
    // step's peak slope SLOPE/h times the blend's angular slope 4 tan(theta/4)
    // times rho stays at STRETCH - 1. Rho is read square to the normal, in the
    // registered frame, metres; the result feeds the plane's step through `half`.
    const gain: number =
      (4 * Math.tan(input.turn / 4) * AutoMovieHumanSkinStep.SLOPE) /
      (STRETCH - 1);
    const points: Float64Array = input.points;
    let widest: number = input.least;
    let bins: number[] = [];
    for (let pass: number = 0; pass < 2; pass++) {
      const rho: number[] = new Array<number>(SECTORS).fill(0);
      for (let i: number = 0; i < points.length / 3; i++) {
        if (!input.held(i)) continue;
        const r: Math3D.Vector = [
          points[3 * i]! - input.at[0],
          points[3 * i + 1]! - input.at[1],
          points[3 * i + 2]! - input.at[2],
        ];
        if (Math.abs(dot(r, n)) > AutoMovieHumanSkinStep.LEVEL * widest)
          continue;
        const x: number = dot(r, u);
        const y: number = dot(r, v);
        const k: number =
          Math.floor(
            ((Math.atan2(y, x) + 2 * Math.PI) / (2 * Math.PI)) * SECTORS,
          ) % SECTORS;
        rho[k] = Math.max(rho[k]!, Math.hypot(x, y));
      }
      // A sector with no skin of its own takes the widest's.
      const fill: number = Math.max(...rho);
      bins = rho.map((r: number): number =>
        Math.min(most, Math.max(input.least, gain * (r > 0 ? r : fill))),
      );
      widest = Math.max(...bins);
    }
    const terms: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    bins.forEach((h: number, k: number): void => {
      const phi: number = ((k + 0.5) / SECTORS) * 2 * Math.PI;
      terms[0] += h / SECTORS;
      terms[1] += (2 * h * Math.cos(phi)) / SECTORS;
      terms[2] += (2 * h * Math.sin(phi)) / SECTORS;
      terms[3] += (2 * h * Math.cos(2 * phi)) / SECTORS;
      terms[4] += (2 * h * Math.sin(2 * phi)) / SECTORS;
    });

    // Two harmonics round a sector's peak off, so the profile rises by its
    // largest shortfall and covers every sector's need.
    let short: number = 0;
    bins.forEach((h: number, k: number): void => {
      const phi: number = ((k + 0.5) / SECTORS) * 2 * Math.PI;
      short = Math.max(short, h - evaluate(terms, phi));
    });
    terms[0] += short;
    return { u, v, terms, least: input.least, most: Math.min(most, widest) };
  }

  /**
   * A transition's half width toward a point.
   *
   * @param sectors The transition's profile.
   * @param r The point from the plane's point, metres.
   * @returns The half width in that sector, metres.
   */
  export function half(sectors: ISectors, r: Math3D.Vector): number {
    const phi: number = Math.atan2(dot(r, sectors.v), dot(r, sectors.u));
    return Math.min(
      sectors.most,
      Math.max(sectors.least, evaluate(sectors.terms, phi)),
    );
  }
}

/** Two harmonics at an angle. */
function evaluate(
  t: readonly [number, number, number, number, number],
  phi: number,
): number {
  return (
    t[0] +
    t[1] * Math.cos(phi) +
    t[2] * Math.sin(phi) +
    t[3] * Math.cos(2 * phi) +
    t[4] * Math.sin(2 * phi)
  );
}

function dot(a: Math3D.Vector, b: Math3D.Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Math3D.Vector, b: Math3D.Vector): Math3D.Vector {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Forward in the registered frame. */
const FORWARD: Math3D.Vector = [1, 0, 0];

/** The figure's left in the registered frame. */
const LEFT: Math3D.Vector = [0, 0, 1];
