import { IAutoMovieSweepSection } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_WRIST_SECTION } from "../../junction/AUTOMOVIE_HUMAN_WRIST_SECTION";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * The palm as a slab between two height fields over the hand's plane, and its slices by the palm sweep's station planes.
 *
 * In the hand frame (`x` distal, `y` palmar, `z` radial, millimetres) the palm spans from its ulnar to its radial border at each level `x`, and across that span the normalised position `ζ` runs from -1 at the ulnar border to 1 at the radial one. Its palmar surface lies `y = h_p(x) · s(ζ) · (1 + relief)` and its dorsal surface `y = -h_d(x) · s(ζ) · (1 + rise) + loss`, where `s(ζ) = (1 - |ζ|^n)^(1/n)` is a superellipse profile that rounds both borders and squares toward the knuckles as `n` grows from 2 at the wrist to `2 + arch` at the metacarpal heads.
 *
 * The block-out terms carry the calibrated form of the earlier hand: the borders widen from the wrist ellipse to metacarpale II and V by `1 - (1 - λ)^widen` of the level `λ = x / heads`; the thickness at the heads is the depth at which the section's own superellipse encloses the measured hand circumference, its dorsal share bounded by the metacarpal heads' dorsal radius and capsule; the thenar eminence rises over the radial palm and falls toward the heads, the hypothenar over the ulnar palm, and the hollow lies between them, each a Gaussian in `ζ` whose amplitude is a share of the palmar height (`AUTOMOVIE_HUMAN_HAND_SHAPE.palm`). Beyond the heads the borders run to the index and little fingers' outer flanks, the palmar side thins to the pads at the fingers' bases and the dorsal side rises over each knuckle.
 *
 * A station plane contains the palmar direction and is turned about it by `tilt` toward the knuckle line, so a slice samples the two fields along the plane's radial axis; the result is a polygon in the plane's own coordinates, palmar first and radial second, centred on the slice's middle, star-shaped about it as a sweep by direction needs.
 *
 * @param props The hand and its measurements
 * @returns The palm's field
 */
export function sliceAutoMovieHumanPalm(props: {
  hand: readAutoMovieHumanHand.IHand;
  breadth: number;
  length: number;
  wristCircumference: number;
  dorsalFat: number;
}): sliceAutoMovieHumanPalm.IField {
  const F: typeof AUTOMOVIE_HUMAN_HAND_FORM = AUTOMOVIE_HUMAN_HAND_FORM;
  const P: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.palm =
    AUTOMOVIE_HUMAN_HAND_SHAPE.palm;
  const hand: readAutoMovieHumanHand.IHand = props.hand;
  const b: number = props.breadth;
  const L: number = props.length;
  const fingers: readAutoMovieHumanHand.IDigit[] = FINGERS.map(
    (f: readAutoMovieHumanHand.IFinger): readAutoMovieHumanHand.IDigit =>
      hand.fingers[f],
  );
  const widths: number[] = FINGERS.map(
    (f: readAutoMovieHumanHand.IFinger): number => F.fingers[f].pip * b,
  );
  const aw: number =
    (AUTOMOVIE_HUMAN_WRIST_SECTION.breadth * props.wristCircumference) / 2;
  const cw: number = aw * AUTOMOVIE_HUMAN_WRIST_SECTION.depth;
  const thickness: number = enclose(b / 2, 2 + P.arch, F.circumference * b);
  const heads: number = hand.metacarpaleII.x;
  const base: number = hand.thumb.points[0]!.x;
  // the knuckle line through the index and little metacarpophalangeal joints
  const index: IAutoMovieVector3 = fingers[0]!.points[0]!;
  const little: IAutoMovieVector3 = fingers[3]!.points[0]!;
  const slope: number = (index.x - little.x) / (index.z - little.z);
  const knuckle = (z: number): number => index.x + (z - index.z) * slope;
  const tilt: number = Math.atan(slope);
  // beyond the heads the borders run to the outer fingers' flanks over a tenth of the hand length
  const flank: { radial: number; ulnar: number } = {
    radial: index.z + 0.55 * widths[0]!,
    ulnar: little.z - 0.55 * widths[3]!,
  };
  const level = (x: number): number => Math.min(1, Math.max(0, x / heads));
  const beyond = (x: number): number =>
    smooth(Math.min(1, Math.max(0, (x - heads) / (0.1 * L))));
  const edges = (x: number): { ulnar: number; radial: number } => {
    const w: number = 1 - Math.pow(1 - level(x), P.widen);
    const radial: number = aw + (hand.metacarpaleII.z - aw) * w;
    const ulnar: number = -aw + (hand.metacarpaleV.z + aw) * w;
    const k: number = beyond(x);
    return {
      radial: radial + (flank.radial - radial) * k,
      ulnar: ulnar + (flank.ulnar - ulnar) * k,
    };
  };
  const zeta = (x: number, z: number): number => {
    const e = edges(x);
    return (2 * z - e.radial - e.ulnar) / (e.radial - e.ulnar);
  };
  // each finger's line across the heads, in the normalised breadth
  const lines: number[] = fingers.map(
    (f: readAutoMovieHumanHand.IDigit): number =>
      (2 * f.points[0]!.z - hand.metacarpaleII.z - hand.metacarpaleV.z) /
      (hand.metacarpaleII.z - hand.metacarpaleV.z),
  );
  const profile = (x: number, ζ: number): number => {
    const n: number = 2 + P.arch * level(x);
    return Math.pow(
      Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(ζ)), n)),
      1 / n,
    );
  };
  const dorsalHeight = (x: number): number =>
    cw + (thickness * P.dorsal - cw) * level(x);
  const palmarDepth = (x: number): number =>
    (cw + (thickness * (1 - P.dorsal) - cw) * level(x)) *
    (1 - (1 - P.pad) * beyond(x));
  const gauss = (d: number, sigma: number): number =>
    Math.exp(-((d / sigma) ** 2));
  // the share of the way from the carpometacarpal line to the heads, and the thenar's rise from the wrist
  const along = (x: number): number =>
    Math.min(1, Math.max(0, (x - base) / (heads - base)));
  const rise = (x: number): number =>
    smooth(Math.min(1, Math.max(0, x / base)));
  const relief = (x: number, ζ: number): number => {
    const t: number = along(x);
    const arc: number = Math.sin(t * Math.PI);
    return (
      P.thenar * (1 - t) * rise(x) * gauss(ζ - lines[0]!, 0.3) -
      P.hollow * arc * gauss(ζ - (lines[1]! + lines[2]!) / 2, 0.35) +
      P.hypothenar *
        Math.max(arc, 0.6 * (1 - t) * rise(x)) *
        gauss(ζ - lines[3]!, 0.25) +
      P.border * arc * gauss(ζ + 0.9, 0.12)
    );
  };
  const loss: number = Math.max(0, F.dorsalFat - props.dorsalFat);
  // each knuckle's crest over its metacarpal head, the middle one highest
  const crest = (x: number, z: number): number =>
    fingers.reduce(
      (sum: number, f: readAutoMovieHumanHand.IDigit, i: number): number =>
        sum +
        (P.knuckle * (i === 1 ? P.middleKnuckle : 1) - 1) *
          gauss(z - f.points[0]!.z, 0.45 * widths[i]!) *
          gauss(x - f.points[0]!.x, 0.06 * L),
      0,
    );
  const palmar = (x: number, z: number): number => {
    const ζ: number = zeta(x, z);
    return palmarDepth(x) * profile(x, ζ) * (1 + relief(x, ζ));
  };
  const dorsal = (x: number, z: number): number => {
    const ζ: number = zeta(x, z);
    // the lost fat thins the back of the hand over the metacarpals, fading with the profile to the borders and never past half its height
    const p: number = profile(x, ζ);
    return (
      -dorsalHeight(x) * p * (1 + crest(x, z)) +
      Math.min(loss * level(x), 0.5 * dorsalHeight(x)) * p
    );
  };

  const slice = (
    plane: sliceAutoMovieHumanPalm.IPlane,
  ): sliceAutoMovieHumanPalm.ISlice => {
    const axis: IAutoMovieVector3 = AutoMovieHumanVector.of(
      Math.sin(plane.tilt),
      0,
      Math.cos(plane.tilt),
    );
    const at = (s: number): { x: number; z: number } => ({
      x: plane.origin + s * axis.x,
      z: s * axis.z,
    });
    // the borders along the plane's radial axis, where |ζ| reaches 1
    const border = (sign: 1 | -1): number => {
      let lo: number = 0;
      let hi: number = sign * 4 * L;
      for (let k: number = 0; k < 60; ++k) {
        const mid: number = (lo + hi) / 2;
        const p = at(mid);
        if (sign * zeta(p.x, p.z) < 1) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    const radial: number = border(1);
    const ulnar: number = border(-1);
    const middle: number = (radial + ulnar) / 2;
    const m = at(middle);
    const height: number = (palmar(m.x, m.z) + dorsal(m.x, m.z)) / 2;
    const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(m.x, height, m.z);
    // samples across, denser toward the borders where the outline turns
    const across: number[] = Array.from(
      { length: SAMPLES + 1 },
      (_: unknown, k: number): number =>
        ulnar +
        ((radial - ulnar) * (1 - Math.cos((Math.PI * k) / SAMPLES))) / 2,
    );
    const point = (s: number, y: number): IAutoMovieSweepSection.IPoint => ({
      x: y - height,
      y: s - middle,
    });
    const polygon: IAutoMovieSweepSection.IPoint[] = [
      ...across.map((s: number): IAutoMovieSweepSection.IPoint => {
        const p = at(s);
        return point(s, palmar(p.x, p.z));
      }),
      ...across
        .slice(1, -1)
        .reverse()
        .map((s: number): IAutoMovieSweepSection.IPoint => {
          const p = at(s);
          return point(s, dorsal(p.x, p.z));
        }),
    ];
    return {
      centre,
      axis,
      section: { type: "polygon", points: polygon },
      palmar: (s: number): IAutoMovieVector3 => {
        const p = at(middle + s);
        return AutoMovieHumanVector.of(p.x, palmar(p.x, p.z), p.z);
      },
      dorsal: (s: number): IAutoMovieVector3 => {
        const p = at(middle + s);
        return AutoMovieHumanVector.of(p.x, dorsal(p.x, p.z), p.z);
      },
      half: { radial: radial - middle, ulnar: middle - ulnar },
    };
  };
  return {
    thickness,
    tilt,
    knuckle,
    edges,
    palmar,
    dorsal,
    slice,
  };
}
/** Field, plane and slice types of {@link sliceAutoMovieHumanPalm}. */
export namespace sliceAutoMovieHumanPalm {
  /**
   * The palm's two height fields and its slicer.
   *
   * @author Samchon
   */
  export interface IField {
    /** Thickness of the palm at the metacarpal heads, millimetres. */
    thickness: number;

    /** Angle of the knuckle line from the hand's radial axis toward its distal axis, radians; the index's knuckle lies distal of the little finger's. */
    tilt: number;

    /**
     * Level of the knuckle line at a radial position.
     *
     * @param z Radial position, millimetres
     * @returns Its `x` on the line through the index's and little finger's metacarpophalangeal joints
     */
    knuckle(z: number): number;

    /**
     * Ulnar and radial borders at a level.
     *
     * @param x Level, millimetres
     * @returns Their `z`
     */
    edges(x: number): { ulnar: number; radial: number };

    /**
     * Palmar surface.
     *
     * @param x Level
     * @param z Radial position
     * @returns Its `y`, millimetres
     */
    palmar(x: number, z: number): number;

    /**
     * Dorsal surface.
     *
     * @param x Level
     * @param z Radial position
     * @returns Its `y`, millimetres, negative toward the back of the hand
     */
    dorsal(x: number, z: number): number;

    /**
     * Slice the palm by a station plane.
     *
     * @param plane The plane
     * @returns The section and where it lies
     */
    slice(plane: IPlane): ISlice;
  }

  /**
   * A station plane: through `(origin, 0, 0)`, containing the palmar direction, its radial axis turned `tilt` toward distal.
   *
   * @author Samchon
   */
  export interface IPlane {
    /** Where the plane crosses the hand's axis, millimetres. */
    origin: number;

    /** Turn of its radial axis toward distal, radians. */
    tilt: number;
  }

  /**
   * One slice of the palm.
   *
   * @author Samchon
   */
  export interface ISlice {
    /** The slice's middle, the sweep's spine point, hand frame. */
    centre: IAutoMovieVector3;

    /** The plane's radial axis, hand frame, unit. */
    axis: IAutoMovieVector3;

    /** The outline in the plane: `x` palmar and `y` radial from the centre, millimetres, counterclockwise. */
    section: IAutoMovieSweepSection.IPolygon;

    /**
     * Point of the palmar surface in the plane.
     *
     * @param s Radial offset from the centre along the plane, millimetres
     * @returns The point, hand frame
     */
    palmar(s: number): IAutoMovieVector3;

    /**
     * Point of the dorsal surface in the plane.
     *
     * @param s Radial offset from the centre along the plane, millimetres
     * @returns The point, hand frame
     */
    dorsal(s: number): IAutoMovieVector3;

    /** Distance of the radial and ulnar borders from the centre along the plane, millimetres. */
    half: { radial: number; ulnar: number };
  }
}

/** The four fingers, radial to ulnar. */
const FINGERS: readAutoMovieHumanHand.IFinger[] = [
  "Index",
  "Middle",
  "Ring",
  "Little",
];

/** Samples across each face of a slice. */
const SAMPLES: number = 48;

/** Smoothstep from 0 to 1. */
const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * Thickness of a superellipse of a given half breadth and exponent whose perimeter is a given length, by bisection on the perimeter of 256 chords.
 *
 * @param half Half breadth, millimetres
 * @param exponent Superellipse exponent, 2 for an ellipse
 * @param perimeter Perimeter to enclose, millimetres
 * @returns Full thickness, millimetres
 */
const enclose = (half: number, exponent: number, perimeter: number): number => {
  const length = (depth: number): number => {
    let sum: number = 0;
    let px: number = half;
    let py: number = 0;
    for (let i: number = 1; i <= 256; ++i) {
      const t: number = (2 * Math.PI * i) / 256;
      const c: number = Math.cos(t);
      const s: number = Math.sin(t);
      const x: number =
        half * Math.sign(c) * Math.pow(Math.abs(c), 2 / exponent);
      const y: number =
        depth * Math.sign(s) * Math.pow(Math.abs(s), 2 / exponent);
      sum += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    return sum;
  };
  let lo: number = 0;
  let hi: number = 2 * half;
  for (let k: number = 0; k < 50; ++k) {
    const mid: number = (lo + hi) / 2;
    if (length(mid) < perimeter) lo = mid;
    else hi = mid;
  }
  return lo + hi;
};
