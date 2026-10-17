import {
  IAutoMovieSweep,
  IAutoMovieSweepSection,
  sampleAutoMovieSweepSection,
} from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { profileAutoMovieHumanHead } from "./profileAutoMovieHumanHead";

/**
 * Loft the head's sections into one sweep from just under the vertex to the neck-top ring.
 *
 * The sections lie in a family of planes, each level in the left-right direction: horizontal over the vault, as head breadth and length are measured, and from the eyes down turning toward the mandibular plane, in which the neck-top ring lies, so the face and the occiput reach the ring together. A plane is fixed by its heights at the front and the back of the head, both falling monotonically, so no two planes cross inside the head. Each section is a superellipse through the guides where they meet its plane: the midline front and back, and the frontal outline's half-breadth at its depth, which is the section's centre; its front and back quadrants take the guides' exponents. The last section is the ring itself, the smooth closed curve through its limit points.
 *
 * The spine is the line of the planes' points at the ring origin's depth, its parameter `u` running from the top section (0) to the ring (1); `v` turns about it from the posterior midline (0) over the left (0.25) and the face (0.5) to the right (0.75), so the face lies away from the seam.
 *
 * @param props The head frame, the guides, the ring's origin and limit points in the head frame
 * @returns The sweep in the model frame and metres, and the plane family in the head frame
 */
export function sweepAutoMovieHumanHead(props: {
  frame: frameAutoMovieHumanHead.IFrame;
  profile: profileAutoMovieHumanHead.IProfile;
  ring: {
    origin: IAutoMovieVector3;
    normal: IAutoMovieVector3;
    limit: IAutoMovieVector3[];
  };
  tilt: number;
  blend: number;
  relief: (p: IAutoMovieVector3) => number;
}): sweepAutoMovieHumanHead.IOutput {
  const {
    frame,
    profile,
    ring,
  }: {
    frame: frameAutoMovieHumanHead.IFrame;
    profile: profileAutoMovieHumanHead.IProfile;
    ring: {
      origin: IAutoMovieVector3;
      normal: IAutoMovieVector3;
      limit: IAutoMovieVector3[];
    };
    tilt: number;
    blend: number;
    relief: (p: IAutoMovieVector3) => number;
  } = props;
  // the spine runs from under the vertex to the ring's origin
  const spineAt: (level: number) => number = (level: number): number =>
    frame.vertex.z + (ring.origin.z - frame.vertex.z) * level;
  // the ring plane as y = y0 + slope z
  const ringSlope: number = -ring.normal.z / ring.normal.y;
  const ringY0: number = ring.origin.y - ringSlope * ring.origin.z;
  const start: number = profile.top - TOP_DROP;
  const tilt: number = props.tilt;
  const plane: (level: number) => sweepAutoMovieHumanHead.IPlane = (
    level: number,
  ): sweepAutoMovieHumanHead.IPlane => {
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
  const axes: (p: sweepAutoMovieHumanHead.IPlane) => {
    origin: IAutoMovieVector3;
    a: IAutoMovieVector3;
    b: IAutoMovieVector3;
    n: IAutoMovieVector3;
  } = (
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
  const meet: (
    p: sweepAutoMovieHumanHead.IPlane,
    g: (y: number) => number,
  ) => number = (
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
  const ringAxes: {
    origin: IAutoMovieVector3;
    a: IAutoMovieVector3;
    b: IAutoMovieVector3;
    n: IAutoMovieVector3;
  } = axes(plane(1));
  const ringSection: IAutoMovieSweepSection = closedCurve(
    ring.limit.map((q: IAutoMovieVector3): { x: number; y: number } => {
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
    let lo: number = HORIZONTAL;
    let hi: number = 1;
    for (let k: number = 0; k < 50; ++k) {
      const m: number = (lo + hi) / 2;
      if (meet(plane(m), profile.front) > y) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const turn: number = levelAt(props.blend);
  const featureWeight: (level: number) => number = (level: number): number => {
    const t: number = Math.min(1, Math.max(0, (level - turn) / (1 - turn)));
    return 1 - t * t * (3 - 2 * t);
  };
  const sectionOf: (level: number) => IAutoMovieSweepSection = (
    level: number,
  ): IAutoMovieSweepSection => {
    const toward: number = 1 - featureWeight(level);
    const block: IAutoMovieSweepSection.ISuperellipse = blockOf(level);
    const ax: {
      origin: IAutoMovieVector3;
      a: IAutoMovieVector3;
      b: IAutoMovieVector3;
      n: IAutoMovieVector3;
    } = axes(plane(level));
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
  const blockOf: (level: number) => IAutoMovieSweepSection.ISuperellipse = (
    level: number,
  ): IAutoMovieSweepSection.ISuperellipse => {
    const p: sweepAutoMovieHumanHead.IPlane = plane(level);
    const ax: {
      origin: IAutoMovieVector3;
      a: IAutoMovieVector3;
      b: IAutoMovieVector3;
      n: IAutoMovieVector3;
    } = axes(p);
    const inPlane: (q: IAutoMovieVector3) => number = (
      q: IAutoMovieVector3,
    ): number =>
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
  // the guides' sections reach down to the plane through gnathion; the ring closes the rest
  const end: number = levelAt(profile.chin);
  const levels: number[] = [
    ...Array.from(
      { length: STATIONS },
      (_: unknown, k: number): number => (end * k) / (STATIONS - 1),
    ),
    1,
  ];
  const planes: sweepAutoMovieHumanHead.IPlane[] = levels.map(plane);
  const origins: IAutoMovieVector3[] = planes.map(
    (p: sweepAutoMovieHumanHead.IPlane): IAutoMovieVector3 => axes(p).origin,
  );
  const shares: number[] = chordShares(origins);
  const last: number = levels.length - 1;
  const model: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    frameAutoMovieHumanHead.toModel(
      { ...frame, origin: AutoMovieHumanVector.of(0, 0, 0) },
      v,
    );
  const sweep: IAutoMovieSweep = {
    // Each station already owns the anatomical cutting plane.
    orientation: "fixed",
    spine: {
      points: origins.map(
        (o: IAutoMovieVector3): IAutoMovieVector3 =>
          toMetres(frameAutoMovieHumanHead.toModel(frame, o)),
      ),
      normal: model(AutoMovieHumanVector.of(0, 0, -1)),
    },
    stations: levels.map(
      (level: number, k: number): IAutoMovieSweep.IStation => {
        const ax: {
          origin: IAutoMovieVector3;
          a: IAutoMovieVector3;
          b: IAutoMovieVector3;
          n: IAutoMovieVector3;
        } = axes(planes[k]!);
        return {
          at: shares[k]!,
          section: k === last ? ringSection : sectionOf(level),
          rotation: quaternionOf(model(ax.a), model(ax.b), model(ax.n)),
        };
      },
    ),
  };
  return {
    sweep,
    planes,
    shares,
    plane,
    levels,
    featureWeight: (u: number): number => {
      let k: number = 0;
      while (k + 2 < shares.length && u > shares[k + 1]!) ++k;
      const t: number = Math.min(
        1,
        Math.max(0, (u - shares[k]!) / (shares[k + 1]! - shares[k]!)),
      );
      return featureWeight(levels[k]! + t * (levels[k + 1]! - levels[k]!));
    },
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

    /** Shared facial support, zero at the neck-top boundary, evaluated at a physical spine address. */
    featureWeight: (u: number) => number;

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

const toMetres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
  p: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

/** Each point's share of the polyline's chord length. */
const chordShares: (points: IAutoMovieVector3[]) => number[] = (
  points: IAutoMovieVector3[],
): number[] => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < points.length; ++k)
    lengths.push(
      lengths[k - 1]! +
        AutoMovieHumanVector.distance(points[k - 1]!, points[k]!),
    );
  const total: number = lengths[lengths.length - 1]!;
  return lengths.map((l: number): number => l / total);
};

/** A closed polygon sampled from the centripetal-free uniform Catmull-Rom curve through points, eight samples per span. */
const closedCurve: (
  points: Array<{ x: number; y: number }>,
) => IAutoMovieSweepSection = (
  points: Array<{ x: number; y: number }>,
): IAutoMovieSweepSection => {
  const n: number = points.length;
  const out: Array<{ x: number; y: number }> = [];
  for (let k: number = 0; k < n; ++k) {
    const p0: { x: number; y: number } = points[(k + n - 1) % n]!;
    const p1: { x: number; y: number } = points[k]!;
    const p2: { x: number; y: number } = points[(k + 1) % n]!;
    const p3: { x: number; y: number } = points[(k + 2) % n]!;
    for (let i: number = 0; i < 8; ++i) {
      const t: number = i / 8;
      const t2: number = t * t;
      const t3: number = t2 * t;
      const w0: number = -0.5 * t3 + t2 - 0.5 * t;
      const w1: number = 1.5 * t3 - 2.5 * t2 + 1;
      const w2: number = -1.5 * t3 + 2 * t2 + 0.5 * t;
      const w3: number = 0.5 * t3 - 0.5 * t2;
      out.push({
        x: w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
        y: w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y,
      });
    }
  }
  // counterclockwise in the plane
  let area: number = 0;
  for (let k: number = 0; k < out.length; ++k) {
    const a: { x: number; y: number } = out[k]!;
    const b: { x: number; y: number } = out[(k + 1) % out.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return { type: "polygon", points: area >= 0 ? out : out.reverse() };
};

/** The unit quaternion of the rotation whose matrix columns are `x`, `y`, `z`. */
const quaternionOf: (
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
) => IAutoMovieQuaternion = (
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const trace: number = x.x + y.y + z.z;
  if (trace > 0) {
    const s: number = Math.sqrt(trace + 1) * 2;
    return {
      w: s / 4,
      x: (y.z - z.y) / s,
      y: (z.x - x.z) / s,
      z: (x.y - y.x) / s,
    };
  }
  if (x.x > y.y && x.x > z.z) {
    const s: number = Math.sqrt(1 + x.x - y.y - z.z) * 2;
    return {
      w: (y.z - z.y) / s,
      x: s / 4,
      y: (y.x + x.y) / s,
      z: (z.x + x.z) / s,
    };
  }
  if (y.y > z.z) {
    const s: number = Math.sqrt(1 + y.y - x.x - z.z) * 2;
    return {
      w: (z.x - x.z) / s,
      x: (y.x + x.y) / s,
      y: s / 4,
      z: (z.y + y.z) / s,
    };
  }
  const s: number = Math.sqrt(1 + z.z - x.x - y.y) * 2;
  return {
    w: (x.y - y.x) / s,
    x: (z.x + x.z) / s,
    y: (z.y + y.z) / s,
    z: s / 4,
  };
};
