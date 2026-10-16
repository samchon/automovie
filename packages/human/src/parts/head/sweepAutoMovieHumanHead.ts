import {
  IAutoMovieSweep,
  IAutoMovieSweepSection,
  interpolateAutoMovieMonotone,
  sampleAutoMovieSweepSection,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";

import { AUTOMOVIE_HUMAN_NECK_COLUMN } from "../../junction/AUTOMOVIE_HUMAN_NECK_COLUMN";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { profileAutoMovieHumanHead } from "./profileAutoMovieHumanHead";
import { sectionAutoMovieHumanHeadRing } from "./sectionAutoMovieHumanHeadRing";

/**
 * Loft the head and upper neck through the mandibular and cervical guides to the neck tube cut.
 *
 * Horizontal vault sections turn toward the mandibular plane below the eyes. That plane's section is an internal guide without pinned cage points; sections then turn toward the neck-axis cut. Their anterior profile passes from the chin to a geometric guide on the anterior neck column, halfway between its mandibular-plane intersection and the unchanged circumference proxy plane. The guide is a construction partition, not a measured hyoid or cervicomental landmark. The whole jaw floor and cervical turn stay within one mass, rather than across a part boundary.
 *
 * Each plane is level from left to right and interpolates its two sagittal coefficients. Above the jaw its superellipse follows the existing facial and vault guides. Below it, per-direction monotone curves pass through the mandibular outline, the neck column at the cervical guide and the final shared tube section. Physical chord lengths parameterize the completed sweep; chart allocation and station count do not set anatomical dimensions.
 *
 * @param props Head frame and guides, internal mandibular section, shared neck section and neck mean radius
 * @returns Sweep in model metres, its section planes and anatomical station addresses
 */
export function sweepAutoMovieHumanHead(props: {
  frame: frameAutoMovieHumanHead.IFrame;
  profile: profileAutoMovieHumanHead.IProfile;
  ring: {
    origin: IAutoMovieVector3;
    normal: IAutoMovieVector3;
    limit: IAutoMovieVector3[];
  };
  neck: {
    origin: IAutoMovieVector3;
    normal: IAutoMovieVector3;
    controls: IAutoMovieVector3[];
    reference: IAutoMovieVector3;
  };
  fit: { origin: IAutoMovieVector3; normal: IAutoMovieVector3; limit: IAutoMovieVector3[] };
  support: number;
  mean: number;
  cervical: IAutoMovieVector3;
  cervicalCentre: IAutoMovieVector3;
  tilt: number;
  blend: number;
  relief: (p: IAutoMovieVector3) => number;
}): sweepAutoMovieHumanHead.IOutput {
  const { frame, profile, ring }: typeof props = props;
  // the spine runs from under the vertex to the ring's origin
  const spineAt: (level: number) => number = (level: number): number =>
    frame.vertex.z + (ring.origin.z - frame.vertex.z) * level;
  // the ring plane as y = y0 + slope z
  const ringSlope: number = -ring.normal.z / ring.normal.y;
  const ringY0: number = ring.origin.y - ringSlope * ring.origin.z;
  const start: number = profile.top - TOP_DROP;
  const tilt: number = props.tilt;
  const upperPlane: (level: number) => sweepAutoMovieHumanHead.IPlane = (level: number): sweepAutoMovieHumanHead.IPlane => {
    if (level <= HORIZONTAL) {
      const f: number = Math.pow(level / HORIZONTAL, VAULT_SPACING);
      const y: number = start + (tilt - start) * f;
      return { y0: y, slope: 0, spine: spineAt(level) };
    }
    const t: number = (level - HORIZONTAL) / (1 - HORIZONTAL);
    const front: number = tilt + (ringY0 + ringSlope * REACH - tilt) * t;
    const back: number = tilt + (ringY0 - ringSlope * REACH - tilt) * t;
    const slope: number = (front - back) / (2 * REACH);
    return { y0: (front + back) / 2, slope, spine: spineAt(level) };
  };
  const neckSlope: number = -props.neck.normal.z / props.neck.normal.y;
  const neckY0: number = props.neck.origin.y - neckSlope * props.neck.origin.z;
  // Chart allocation changes no geometry: physical chord shares parameterize
  // the completed sweep after these section planes have been evaluated.
  const upperEnd: number = STATIONS / (STATIONS + LOWER_STATIONS);
  const neckAxis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(frame.headJoint, [frame.neckJoint, -1]),
  );
  const neckFront: IAutoMovieVector3 = props.neck.reference;
  const neckAcross: IAutoMovieVector3 = AutoMovieHumanVector.cross(neckAxis, neckFront);
  const columnCentre: IAutoMovieVector3 = props.cervicalCentre;
  const nodes: IAutoMovieVector3[] = [ring.origin, columnCentre, props.fit.origin, props.neck.origin];
  const lowerShares: number[] = chordShares(nodes);
  const lowerPlanes: sweepAutoMovieHumanHead.IPlane[] = nodes.map(
    (origin: IAutoMovieVector3, index: number): sweepAutoMovieHumanHead.IPlane =>
      index === 0 ? {y0: ringY0, slope: ringSlope, spine: ring.origin.z} :
        {y0: origin.y - neckSlope * origin.z, slope: neckSlope, spine: origin.z});
  const plane: (level: number) => sweepAutoMovieHumanHead.IPlane = (level: number): sweepAutoMovieHumanHead.IPlane => {
    if (level <= upperEnd) return upperPlane(level / upperEnd);
    const t: number = (level - upperEnd) / (1 - upperEnd);
    if (lowerShares && lowerPlanes) {
      let i: number = 0;
      while (i + 2 < lowerShares.length && t > lowerShares[i + 1]!) ++i;
      const f: number = (t - lowerShares[i]!) / (lowerShares[i + 1]! - lowerShares[i]!);
      const a: sweepAutoMovieHumanHead.IPlane = lowerPlanes[i]!;
      const b: sweepAutoMovieHumanHead.IPlane = lowerPlanes[i + 1]!;
      return {y0: a.y0 + (b.y0-a.y0)*f, slope: a.slope + (b.slope-a.slope)*f, spine: a.spine + (b.spine-a.spine)*f};
    }
    return {
      y0: ringY0 + (neckY0 - ringY0) * t,
      slope: ringSlope + (neckSlope - ringSlope) * t,
      spine: ring.origin.z + (props.neck.origin.z - ring.origin.z) * t,
    };
  };
  const cervical: IAutoMovieVector3 = props.cervical;
  const cervicalShare: number = lowerShares ? lowerShares[1]! :
    (cervical.y - ringY0 - ringSlope * cervical.z) /
    (neckY0 + neckSlope * cervical.z - ringY0 - ringSlope * cervical.z);
  if (!(cervicalShare > 0 && cervicalShare < 1))
    throw new Error(
      "Cervical guide must lie between the mandible and neck tube cut",
    );
  const cervicalLevel: number = upperEnd + (1 - upperEnd) * cervicalShare;
  const fitLevel: number = upperEnd + (1-upperEnd) * lowerShares[2]!;
  const supportLevel: number = fitLevel! + (1-fitLevel!) * (1-props.support / AutoMovieHumanVector.distance(props.fit.origin, props.neck.origin));
  const axes: (p: sweepAutoMovieHumanHead.IPlane) => { origin: IAutoMovieVector3; a: IAutoMovieVector3; b: IAutoMovieVector3; n: IAutoMovieVector3; } = (
    p: sweepAutoMovieHumanHead.IPlane,
  ): {
    origin: IAutoMovieVector3;
    a: IAutoMovieVector3;
    b: IAutoMovieVector3;
    n: IAutoMovieVector3;
  } => {
    const a: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      AutoMovieHumanVector.of(0, -p.slope, -1),
    );
    const b: IAutoMovieVector3 = AutoMovieHumanVector.of(1, 0, 0);
    return {
      origin: AutoMovieHumanVector.of(0, p.y0 + p.slope * p.spine, p.spine),
      a,
      b,
      n: AutoMovieHumanVector.cross(a, b),
    };
  };
  // where a guide at depth g(y) meets the plane: y = y0 + slope g(y)
  const meet: (p: sweepAutoMovieHumanHead.IPlane, g: (y: number) => number) => number = (
    p: sweepAutoMovieHumanHead.IPlane,
    g: (y: number) => number,
  ): number => {
    let lo: number = profile.chin - 60;
    let hi: number = profile.top;
    for (let k: number = 0; k < 60; ++k) {
      const m: number = (lo + hi) / 2;
      if (m - (p.y0 + p.slope * g(m)) > 0) hi = m;
      else lo = m;
    }
    return (lo + hi) / 2;
  };
  const ringAxes: { origin: IAutoMovieVector3; a: IAutoMovieVector3; b: IAutoMovieVector3; n: IAutoMovieVector3; } = axes(plane(upperEnd));
  const ringSection: IAutoMovieSweepSection = sectionAutoMovieHumanHeadRing(
    ring.limit.map((q: IAutoMovieVector3): { x: number; y: number; } => {
      const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(q, [
        ringAxes.origin,
        -1,
      ]);
      return {
        x: metres(AutoMovieHumanVector.dot(d, ringAxes.a)),
        y: metres(AutoMovieHumanVector.dot(d, ringAxes.b)),
      };
    }),
  );
  const ringRadii: number[] = sampleAutoMovieSweepSection({
    section: ringSection,
    count: DIRECTIONS,
  });
  // where the lower head starts turning into the ring: the plane through stomion
  const levelAt: (y: number) => number = (y: number): number => {
    let lo: number = HORIZONTAL * upperEnd;
    let hi: number = upperEnd;
    for (let k: number = 0; k < 50; ++k) {
      const m: number = (lo + hi) / 2;
      if (meet(plane(m), profile.front) > y) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const turn: number = levelAt(props.blend);
  const sectionOf: (level: number) => IAutoMovieSweepSection = (level: number): IAutoMovieSweepSection => {
    const t: number = Math.min(
      1,
      Math.max(0, (level - turn) / (upperEnd - turn)),
    );
    const toward: number = t * t * (3 - 2 * t);
    const block: IAutoMovieSweepSection.ISuperellipse = blockOf(level);
    const ax: { origin: IAutoMovieVector3; a: IAutoMovieVector3; b: IAutoMovieVector3; n: IAutoMovieVector3; } = axes(plane(level));
    // the features and masses move the block-out along each direction from the spine
    const radii: number[] = sampleAutoMovieSweepSection({
      section: block,
      count: DIRECTIONS,
    }).map((r: number, d: number): number => {
      const angle: number = (2 * Math.PI * d) / DIRECTIONS;
      const mm: number = r * 1000;
      const p: IAutoMovieVector3 = AutoMovieHumanVector.offset(
        ax.origin,
        [ax.a, mm * Math.cos(angle)],
        [ax.b, mm * Math.sin(angle)],
      );
      return (
        (1 - toward) * metres(Math.max(MINIMUM, mm + props.relief(p))) +
        toward * ringRadii[d]!
      );
    });
    return { type: "radial", radii };
  };
  const blockOf: (level: number) => IAutoMovieSweepSection.ISuperellipse = (level: number): IAutoMovieSweepSection.ISuperellipse => {
    const p: sweepAutoMovieHumanHead.IPlane = plane(level);
    const ax: { origin: IAutoMovieVector3; a: IAutoMovieVector3; b: IAutoMovieVector3; n: IAutoMovieVector3; } = axes(p);
    const inPlane: (q: IAutoMovieVector3) => number = (q: IAutoMovieVector3): number =>
      AutoMovieHumanVector.dot(
        AutoMovieHumanVector.offset(q, [ax.origin, -1]),
        ax.a,
      );
    const yf: number = meet(p, profile.front);
    const yb: number = meet(p, profile.back);
    const yw: number = meet(p, profile.lateral);
    const xf: number = inPlane(
      AutoMovieHumanVector.of(0, yf, profile.front(yf)),
    );
    const xb: number = inPlane(
      AutoMovieHumanVector.of(0, yb, profile.back(yb)),
    );
    const xw: number = inPlane(
      AutoMovieHumanVector.of(0, yw, profile.lateral(yw)),
    );
    const half: number = Math.max(MINIMUM, profile.breadth(yw));
    const nf: number = profile.frontExponent(yf);
    const nb: number = profile.backExponent(yb);
    return {
      type: "superellipse",
      right: metres(Math.max(MINIMUM, xb - xw)),
      up: metres(half),
      left: metres(Math.max(MINIMUM, xw - xf)),
      down: metres(half),
      exponents: [nb, nf, nf, nb],
      centre: { x: metres(xw), y: 0 },
    };
  };
  // Jawline, cervical turn and tube cut are stations within one head mass.
  const end: number = levelAt(profile.chin);
  const upperLevels: number[] = Array.from(
    { length: STATIONS },
    (_: unknown, k: number): number =>
      k === STATIONS - 1 ? end : (end * k) / (STATIONS - 1),
  );
  const lowerLevels: number[] = Array.from(
    { length: LOWER_STATIONS + 1 },
    (_: unknown, k: number): number =>
      upperEnd + ((1 - upperEnd) * k) / LOWER_STATIONS,
  );
  const levels: number[] = [...upperLevels, ...lowerLevels, cervicalLevel, supportLevel, ...(fitLevel === undefined ? [] : [fitLevel])]
    .sort((a: number, b: number): number => a - b)
    .filter(
      (x: number, k: number, all: number[]): boolean =>
        k === 0 || x - all[k - 1]! > 1e-10,
    );
  const neckAxes: ReturnType<typeof axes> = axes(plane(1));
  const neckSection: IAutoMovieSweepSection = {type: "bspline", points:
    props.neck.controls.map((q: IAutoMovieVector3): { x: number; y: number; } => {
      const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(q, [
        neckAxes.origin,
        -1,
      ]);
      return {
        x: metres(AutoMovieHumanVector.dot(d, neckAxes.a)),
        y: metres(AutoMovieHumanVector.dot(d, neckAxes.b)),
      };
    }),
  };
  const neckRadii: number[] = sampleAutoMovieSweepSection({
    section: neckSection,
    count: DIRECTIONS,
  });
  const fitRadii: number[] | undefined = props.fit && fitLevel !== undefined ? (() : number[] => {
    const ax: ReturnType<typeof axes> = axes(plane(fitLevel));
    return sampleAutoMovieSweepSection({section: sectionAutoMovieHumanHeadRing(props.fit!.limit.map(
      (q: IAutoMovieVector3): {x: number; y: number} => {
        const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(q, [ax.origin, -1]);
        return {x: metres(AutoMovieHumanVector.dot(d, ax.a)), y: metres(AutoMovieHumanVector.dot(d, ax.b))};
      })), count: DIRECTIONS});
  })() : undefined;
  const cervicalAxes: ReturnType<typeof axes> = axes(plane(cervicalLevel));
  const lowerProfiles: Array<(level: number) => number> = ringRadii.map(
    (r: number, d: number): ((level: number) => number) => {
      const angle: number = (2 * Math.PI * d) / DIRECTIONS;
      const direction: IAutoMovieVector3 = AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(0, 0, 0),
        [cervicalAxes.a, Math.cos(angle)],
        [cervicalAxes.b, Math.sin(angle)],
      );
      const front: number = AutoMovieHumanVector.dot(direction, neckFront);
      const depth: number =
        (front >= 0
          ? AUTOMOVIE_HUMAN_NECK_COLUMN.front
          : AUTOMOVIE_HUMAN_NECK_COLUMN.back) * props.mean;
      const across: number = AUTOMOVIE_HUMAN_NECK_COLUMN.across * props.mean;
      const radius: number =
        1 /
        Math.sqrt(
          (front * front) / (depth * depth) +
            (AutoMovieHumanVector.dot(direction, neckAcross) ** 2) / (across * across),
        );
      const anchors: Array<[number, number]> = [[upperEnd, r], [cervicalLevel, metres(radius)], [supportLevel, neckRadii[d]!], [1, neckRadii[d]!]];
      if (fitLevel !== undefined && fitRadii) anchors.push([fitLevel, fitRadii[d]!]);
      anchors.sort((a: [number,number], b: [number,number]): number => a[0]-b[0]);
      return interpolateAutoMovieMonotone({
        knots: anchors.map((a: [number, number]): number => a[0]),
        values: anchors.map((a: [number, number]): number => a[1]),
      });
    },
  );
  const lowerSection: (level: number) => IAutoMovieSweepSection = (level: number): IAutoMovieSweepSection => ({
    type: "radial",
    radii: lowerProfiles.map((f: (level: number) => number): number =>
      f(level),
    ),
  });
  const planes: sweepAutoMovieHumanHead.IPlane[] = levels.map(plane);
  const origins: IAutoMovieVector3[] = planes.map((p: sweepAutoMovieHumanHead.IPlane): IAutoMovieVector3 => axes(p).origin);
  const shares: number[] = chordShares(origins);
  const last: number = levels.length - 1;
  const model: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 =>
    frameAutoMovieHumanHead.toModel(
      { ...frame, origin: AutoMovieHumanVector.of(0, 0, 0) },
      v,
    );
  const sweep: IAutoMovieSweep = {
    spine: {
      points: origins.map((o: IAutoMovieVector3): IAutoMovieVector3 =>
        toMetres(frameAutoMovieHumanHead.toModel(frame, o)),
      ),
      normal: model(AutoMovieHumanVector.of(0, 0, -1)),
    },
    stations: levels.map(
      (level: number, k: number): IAutoMovieSweep.IStation => {
        const ax: { origin: IAutoMovieVector3; a: IAutoMovieVector3; b: IAutoMovieVector3; n: IAutoMovieVector3; } = axes(planes[k]!);
        return {
          at: shares[k]!,
          section:
            k === last
              ? neckSection
              : level > upperEnd
                ? lowerSection(level)
                : level === upperEnd
                  ? ringSection
                  : sectionOf(level),
          rotation: quaternionFromAutoMovieBasis(model(ax.a), model(ax.b), model(ax.n)),
        };
      },
    ),
  };
  const address: (level: number) => number = (level: number): number => {
    let i: number = 0;
    while (i+2 < levels.length && level > levels[i+1]!) ++i;
    const f: number = (level-levels[i]!) / (levels[i+1]!-levels[i]!);
    return shares[i]! + (shares[i+1]!-shares[i]!) * f;
  };
  return {
    sweep,
    planes,
    shares,
    plane,
    levels,
    jaw: address(end),
    cervical: address(cervicalLevel),
    fit: address(fitLevel!),
    support: address(supportLevel),
  };
}
/** Output types of {@link sweepAutoMovieHumanHead}. */
export namespace sweepAutoMovieHumanHead {
  /**
   * One section plane in the head frame: `y = y0 + slope z`, level in `x`.
   *
   * @author Samchon
   */
  export interface IPlane {
    /** Height where the plane crosses the frontal plane of tragion, millimetres. */
    y0: number;

    /** Rise per millimetre forward, negative where the face is lower than the back. */
    slope: number;

    /** Depth of the spine's point in the plane, millimetres. */
    spine: number;
  }

  /**
   * The lofted sweep and its planes.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The sweep, model frame, metres. */
    sweep: IAutoMovieSweep;

    /** Each station's plane, head frame. */
    planes: IPlane[];

    /** Each station's `u` on the spine. */
    shares: number[];

    /** The plane at a level of the family from 0 (the top section) to 1 (the ring). */
    plane: (level: number) => IPlane;

    /** Spine parameter of the jawline guide. */
    jaw: number;

    /** Spine parameter of the cervical turn guide. */
    cervical: number;

    /** Spine address of the unchanged circumference-fit plane. */
    fit: number;

    /** Spine address of the head-side shared collar support plane. */
    support: number;

    /** Each station's level. */
    levels: number[];
  }
}

/** The top section lies this far under the vertex, millimetres; the cap closes the rest. */
const TOP_DROP: number = 2;

/** Stations of the loft. */
const STATIONS: number = 56;

/** Share of the levels that are horizontal, over the vault. */
const HORIZONTAL: number = 0.36;

/** Exponent spacing the horizontal levels closer under the vertex, where the vault turns fastest. */
const VAULT_SPACING: number = 1.6;

/** Depth in front of and behind tragion at which a plane's front and back heights are read, millimetres. */
const REACH: number = 100;

/** Directions each section is sampled in, the engine's own count. */
const DIRECTIONS: number = 512;

/** Smallest half-axis, millimetres. */
const MINIMUM: number = 0.5;

const metres: (mm: number) => number = (mm: number): number => mm / 1000;

const toMetres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

/** Each point's share of the polyline's chord length. */
const chordShares: (points: IAutoMovieVector3[]) => number[] = (points: IAutoMovieVector3[]): number[] => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < points.length; ++k)
    lengths.push(
      lengths[k - 1]! +
        AutoMovieHumanVector.distance(points[k - 1]!, points[k]!),
    );
  const total: number = lengths[lengths.length - 1]!;
  return lengths.map((l: number): number => l / total);
};

/** Stations resolving the jaw floor and upper neck inside the head mass. */
const LOWER_STATIONS: number = 8;
