import { IAutoMovieSweep, IAutoMovieSweepSection } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";

/**
 * Sweep one digit along its phalanges: a spine through its root, its joints and its tip, and a section at every station.
 *
 * Each section is a rounded box about the bone axis, two half-superellipses of their own depths, dorsal over the bone and palmar under it, because a digit carries its pads below and only skin and tendon above (Hyun et al. 2005 and Lee, Yoon and Kim 2006 sweep each digit the same way, a key section per joint). The section's first axis is `first`, the direction the digit's bridge loop starts from, and the pad lies `pad` radians counterclockwise from it, so one digit's sections are the same whichever way its loop is turned. Stations are placed by arc length along the joints; the tip closes in a dome of stations on a quarter circle, the last a small disc the cap patch closes.
 *
 * @param props The digit's joints, directions and stations, hand frame, millimetres
 * @returns The sweep in metres and the `u` of each station
 */
export function sweepAutoMovieHumanDigit(props: {
  points: IAutoMovieVector3[];
  first: IAutoMovieVector3;
  pad: number;
  stations: sweepAutoMovieHumanDigit.IStation[];
}): sweepAutoMovieHumanDigit.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const lengths: number[] = props.points
    .slice(1)
    .map((p: IAutoMovieVector3, i: number): number =>
      V.distance(props.points[i]!, p),
    );
  const total: number = lengths.reduce((a: number, b: number): number => a + b, 0);
  const tip: sweepAutoMovieHumanDigit.IStation =
    props.stations[props.stations.length - 1]!;
  // the dome: a quarter circle of the last station's mean half-size, down to a disc of a fifth of it
  const radius: number = Math.min(
    0.45 * total,
    (tip.breadth / 2 + (tip.dorsal + tip.palmar) / 2) / 2,
  );
  const dome: sweepAutoMovieHumanDigit.IStation[] = DOME.map(
    (angle: number): sweepAutoMovieHumanDigit.IStation => {
      const k: number = Math.max(0.2, Math.cos(angle));
      return {
        at: total - radius * (1 - Math.sin(angle)),
        breadth: tip.breadth * k,
        dorsal: tip.dorsal * k,
        palmar: tip.palmar * k,
        square: tip.square,
      };
    },
  );
  const stations: sweepAutoMovieHumanDigit.IStation[] = [
    ...props.stations.filter(
      (s: sweepAutoMovieHumanDigit.IStation): boolean =>
        s.at < total - radius - 1e-6,
    ),
    { ...tip, at: total - radius },
    ...dome.slice(1),
  ];
  const ats: number[] = stations.map(
    (s: sweepAutoMovieHumanDigit.IStation): number => s.at / total,
  );
  return {
    sweep: {
      spine: {
        points: props.points.map(metres),
        normal: props.first,
      },
      stations: stations.map(
        (s: sweepAutoMovieHumanDigit.IStation, k: number): IAutoMovieSweep.IStation => ({
          at: ats[k]!,
          section: section(s, props.pad),
        }),
      ),
    },
    at: ats,
    length: total,
    dome: radius,
  };
}
/** Station and output types of {@link sweepAutoMovieHumanDigit}. */
export namespace sweepAutoMovieHumanDigit {
  /**
   * One station of a digit.
   *
   * @author Samchon
   */
  export interface IStation {
    /** Arc length along the joints from the first point, millimetres. */
    at: number;

    /** Breadth across the flanks, millimetres. */
    breadth: number;

    /** Height of the dorsal surface above the bone axis, millimetres. */
    dorsal: number;

    /** Depth of the palmar surface below the bone axis, millimetres. */
    palmar: number;

    /** Superellipse exponent of the four quarters: 2 elliptic, larger toward a box. */
    square: number;
  }

  /**
   * The swept digit.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The sweep, metres. */
    sweep: IAutoMovieSweep;

    /** `u` of each of its stations. */
    at: number[];

    /** Spine length, millimetres. */
    length: number;

    /** Radius of the tip's dome, millimetres. */
    dome: number;
  }
}

/** Angles of the dome's stations from the tip's last full section toward its end, radians. */
const DOME: number[] = [0, Math.PI / 6, Math.PI / 3, (5 * Math.PI) / 12, Math.PI / 2];

/** Corners of each section polygon. */
const CORNERS: number = 48;

const metres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

/** The station's rounded box, its pad `pad` radians from the first axis, metres. */
const section = (
  s: sweepAutoMovieHumanDigit.IStation,
  pad: number,
): IAutoMovieSweepSection.IPolygon => ({
  type: "polygon",
  points: Array.from(
    { length: CORNERS },
    (_: unknown, k: number): IAutoMovieSweepSection.IPoint => {
      const t: number = (2 * Math.PI * k) / CORNERS;
      const c: number = Math.cos(t);
      const n: number = Math.sin(t);
      const e: number = 2 / s.square;
      // toward the pad and across, before the turn to the first axis
      const a: number =
        (c >= 0 ? s.palmar : s.dorsal) * Math.sign(c) * Math.pow(Math.abs(c), e);
      const b: number = (s.breadth / 2) * Math.sign(n) * Math.pow(Math.abs(n), e);
      return {
        x: (a * Math.cos(pad) - b * Math.sin(pad)) / 1000,
        y: (a * Math.sin(pad) + b * Math.cos(pad)) / 1000,
      };
    },
  ),
});
