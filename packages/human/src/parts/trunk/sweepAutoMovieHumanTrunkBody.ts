import { IAutoMovieSweep, IAutoMovieSweepSection, compileAutoMovieSweep } from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { featureAutoMovieHumanTrunk } from "./featureAutoMovieHumanTrunk";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";
import { sectionAutoMovieHumanTrunkCrotch } from "./sectionAutoMovieHumanTrunkCrotch";

/**
 * The trunk's own sweep, from the crotch up to the neck-base ring, with the spine parameters where the shoulder band opens and closes.
 *
 * Stations stand at the crotch, at even steps from the buttock level to the axilla, at even steps on to the shoulder line, then on the trapezius slope and at the neck ring. Anthropometry measures every trunk section in a level plane, so up to the axilla each station lies level whatever the spine's bend, under the sweep's fixed orientation so the planes stay level between stations too. The neck ring leans forward, its front at the jugular notch below the shoulder line and its back at cervicale above it, so above the axilla the planes lean progressively toward the ring's, as the clavicles lie lower than the trapezius; each such section is read where its plane meets the level profile. The crotch section is the outer contour of the two thighs (`sectionAutoMovieHumanTrunkCrotch`), its front raised to the thighs' fronts at their rings where those stand further forward, since the thigh's front runs straight or forward from the groin to mid-thigh in standing.
 *
 * @param props.frame The side's trunk frame
 * @param props.profile The trunk's level sections
 * @param props.neck The neck-base ring
 * @param props.thighs The two mid-thigh rings
 * @returns The sweep in metres, the spine parameters of the axilla and shoulder line, and the contour of the two thighs at the crotch and at the gluteal furrow, millimetres
 */
export function sweepAutoMovieHumanTrunkBody(props: {
  frame: IAutoMovieHumanTrunkFrame;
  profile: profileAutoMovieHumanTrunk.IProfile;
  neck: IAutoMovieHumanRingShape;
  thighs: IAutoMovieHumanRingShape[];
}): sweepAutoMovieHumanTrunkBody.IOutput {
  const { frame, profile, neck } = props;
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const shoulderLine: number = frame.acromion.y;
  const levels: number[] = [
    L.crotch,
    ...Array.from({ length: STEPS + 1 }, (_: unknown, k: number): number => L.buttock + ((L.axilla - L.buttock) * k) / STEPS),
    ...Array.from(
      { length: UPPER_STEPS },
      (_: unknown, k: number): number => L.axilla + ((shoulderLine - L.axilla) * (k + 1)) / UPPER_STEPS,
    ),
  ];
  const lean = (y: number): number =>
    y <= L.axilla ? 0 : NECK_TILT.shoulder * Math.min(1, (y - L.axilla) / (shoulderLine - L.axilla));
  const thighFront: number = Math.max(
    ...props.thighs.flatMap((t: IAutoMovieHumanRingShape): number[] => t.positions.map((p: IAutoMovieVector3): number => p.z)),
  );
  const contour = (y: number): sweepAutoMovieHumanTrunkBody.IContour => {
    const front: number = Math.max(profile.front(y), thighFront);
    return { centre: (front + profile.back(y)) / 2, depth: (front - profile.back(y)) / 2, half: profile.half(y) };
  };
  const crotch: sweepAutoMovieHumanTrunkBody.IContour = contour(L.crotch);
  const tilt = (share: number): IAutoMovieQuaternion => {
    const a: IAutoMovieQuaternion = S.HORIZONTAL;
    let b: IAutoMovieQuaternion = S.ringRotation(neck, 0);
    if (a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w < 0) b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
    const q: IAutoMovieQuaternion = {
      x: a.x + (b.x - a.x) * share,
      y: a.y + (b.y - a.y) * share,
      z: a.z + (b.z - a.z) * share,
      w: a.w + (b.w - a.w) * share,
    };
    const n: number = Math.hypot(q.x, q.y, q.z, q.w);
    return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n };
  };
  // the profile's front and back where a plane through a centre meets them: the plane's height changes with depth by its
  // slope, so the profile is read at the height the plane reaches there
  const reach = (centre: IAutoMovieVector3, rotation: IAutoMovieQuaternion): { front: number; back: number; slope: number } => {
    const normal: IAutoMovieVector3 = S.rotate(rotation, { x: 0, y: 0, z: 1 });
    const slope: number = normal.z / normal.y;
    const meet = (read: (y: number) => number): number => {
      let z: number = read(centre.y);
      for (let k: number = 0; k < 8; ++k) z = read(centre.y - slope * (z - centre.z));
      return z;
    };
    return { front: meet(profile.front), back: meet(profile.back), slope };
  };
  const stations: Array<{ centre: IAutoMovieVector3; section: IAutoMovieSweepSection; rotation: IAutoMovieQuaternion }> =
    levels.map((y: number, k: number) => {
      if (k === 0)
        return {
          centre: AutoMovieHumanVector.of(0, y, crotch.centre),
          section: sectionAutoMovieHumanTrunkCrotch({
            depth: crotch.depth,
            half: crotch.half,
            exponent: S.FORK_EXPONENT,
            medial: S.MEDIAL_EXPONENT,
            recess: AUTOMOVIE_HUMAN_TRUNK_FORM.crotch.recess * frame.buttock.depth,
          }),
          rotation: S.HORIZONTAL,
        };
      const widest: number = profile.widest(y);
      const half: number = y >= shoulderLine - 1 ? Math.max(profile.half(L.axilla), frame.acromion.x - 15) : profile.half(y);
      const square: { front: number; back: number } = profile.squareness(y);
      const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(0, y, widest);
      const rotation: IAutoMovieQuaternion = lean(y) > 0 ? tilt(lean(y)) : S.HORIZONTAL;
      const plane: { front: number; back: number; slope: number } = lean(y) > 0 ? reach(centre, rotation) : { front: profile.front(y), back: profile.back(y), slope: 0 };
      const stretch: number = Math.hypot(1, plane.slope);
      return {
        centre,
        rotation,
        section: {
          type: "superellipse",
          right: S.metres(Math.max(20, (plane.front - widest) * stretch)),
          up: S.metres(half),
          left: S.metres(Math.max(20, (widest - plane.back) * stretch)),
          down: S.metres(half),
          exponents: [square.front, square.back, square.back, square.front],
        },
      };
    });
  // the trapezius slope, in the neck ring's own plane, its front and back where that plane meets the profile
  const shoulder: { centre: IAutoMovieVector3; section: IAutoMovieSweepSection } = stations[stations.length - 1]!;
  const neckOrigin: IAutoMovieVector3 = neck.frame.origin;
  const slopeY: number = shoulderLine + SLOPE * (neckOrigin.y - shoulderLine);
  const neckHalf: number = (neck.radii[neck.count / 4]! + neck.radii[(3 * neck.count) / 4]!) / 2;
  const slopeCentre: IAutoMovieVector3 = AutoMovieHumanVector.of(0, slopeY, (shoulder.centre.z + neckOrigin.z) / 2);
  const slopeRotation: IAutoMovieQuaternion = tilt(NECK_TILT.slope);
  const slopePlane: { front: number; back: number; slope: number } = reach(slopeCentre, slopeRotation);
  const slopeStretch: number = Math.hypot(1, slopePlane.slope);
  const slopeHalf: number =
    neckHalf + SLOPE * (S.millimetres((shoulder.section as IAutoMovieSweepSection.ISuperellipse).up) - neckHalf);
  stations.push(
    {
      centre: slopeCentre,
      rotation: slopeRotation,
      section: {
        type: "superellipse",
        right: S.metres(Math.max(25, (slopePlane.front - slopeCentre.z) * slopeStretch)),
        up: S.metres(slopeHalf),
        left: S.metres(Math.max(25, (slopeCentre.z - slopePlane.back) * slopeStretch)),
        down: S.metres(slopeHalf),
        exponents: [2.2, 2.2, 2.2, 2.2],
      },
    },
    { centre: neckOrigin, section: S.ringSection(neck, 0), rotation: S.ringRotation(neck, 0) },
  );
  const points: IAutoMovieVector3[] = stations.map((s): IAutoMovieVector3 => S.toMetres(s.centre));
  const ats: number[] = S.chordShares(points);
  const bare: IAutoMovieSweep = {
    spine: { points, normal: { x: 0, y: 0, z: 1 } },
    orientation: "fixed",
    stations: stations.map(
      (s, k: number): IAutoMovieSweep.IStation => ({ at: ats[k]!, section: s.section, rotation: s.rotation }),
    ),
  };
  return {
    // the feature curves are located on the sweep their stations make
    sweep: { ...bare, features: featureAutoMovieHumanTrunk({ frame, profile, surface: compileAutoMovieSweep(bare) }) },
    // the axilla is the last of the even steps from the buttock level, the shoulder line the last level
    axilla: ats[STEPS + 1]!,
    shoulder: ats[levels.length - 1]!,
    crotch,
    furrow: contour(L.gluteal),
  };
}
/** Output types of {@link sweepAutoMovieHumanTrunkBody}. */
export namespace sweepAutoMovieHumanTrunkBody {
  /**
   * The trunk's sweep and the parameters its patches and tubes read.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The sweep, metres. */
    sweep: IAutoMovieSweep;

    /** Spine parameter of the axilla, where the shoulder band opens. */
    axilla: number;

    /** Spine parameter of the shoulder line, where the shoulder band closes. */
    shoulder: number;

    /** The two thighs' contour at the crotch. */
    crotch: IContour;

    /** The two thighs' contour at the gluteal furrow. */
    furrow: IContour;
  }

  /**
   * The outer contour of the two thighs side by side at one level, millimetres.
   *
   * @author Samchon
   */
  export interface IContour {
    /** Depth of the midline the contour is centred on. */
    centre: number;

    /** Half-depth. */
    depth: number;

    /** Half-breadth across both thighs. */
    half: number;
  }
}

/** Steps between the stations from the buttock level to the axilla, about 25 mm each in an adult. */
const STEPS: number = 16;

/** Steps between the stations from the axilla to the shoulder line, where the planes lean toward the neck ring's. */
const UPPER_STEPS: number = 4;

/** Share of the neck ring's lean the shoulder line's and the slope's planes take. */
const NECK_TILT = { shoulder: 0.8, slope: 1 } as const;

/** Where the slope station lies, as a share of the way from the shoulder line to the neck ring's origin. */
const SLOPE: number = 0.45;
