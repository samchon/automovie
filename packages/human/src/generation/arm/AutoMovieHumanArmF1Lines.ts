import { AutoMovieMeshCourse, type AutoMovieViewAxis, tessellateAutoMovieContourStrip64 } from "@automovie/engine";

import { AutoMovieHumanHandPalm } from "../hand/AutoMovieHumanHandPalm";
import { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";

/**
 * f1's arm lines: the control points of the arm's sparse 2D view curves for
 * the f1-only mission, extracted from the reference in her own pose by the
 * owner's two-step method (2026-11-08, `node:arm-world`, receipt
 * `.shots/f1_arm/world-2026-11-08T07-05-18-763Z`):
 *
 * 1. World lines: one frame curve carries her pose from GH (the trunk's S00
 *    shoulder port) to the palm: the upper arm on GH to her elbow centre
 *    (epicondyle midpoint by caliper) with the epicondyle line lateral, the
 *    forearm to her wrist zero with its roll turning linearly to the styloid
 *    line (her pronation, 92.5 degrees), the hand on her own axis (wrist zero
 *    to her mid-palm centroid), the joints blended over their mean radii
 *    (36 mm elbow, 24 mm wrist) so the planes turn through each bisecting
 *    plane. She is cut every 2 mm along it; each section enclosing the axis
 *    gives the four outline values and the four quarter shoulders. The eight
 *    series (a shoulder as its reach in mm) are reduced together to the fewest
 *    knots whose natural cubic spline holds every sample within 0.5 mm (largest
 *    0.495 mm), the joints and every extremum of prominence 0.5 mm pinned.
 * 2. Re-base: each knot's four world points re-expressed in the frame curve's
 *    zero frame at its station are the values below; mapping them back returns
 *    the world points to 2.7e-13 mm. The neutral pose is the straight,
 *    supinated arm of `AutoMovieHumanArmSegmentFrames`; her pose is the frame
 *    curve's (flexion 20.7, carrying -23.0, pronation 92.5, wrist flexion -5.8,
 *    deviation -10.6 degrees).
 *
 * Corrected by eye over the reference (the owner's order: her lofting has
 * hatching and holes): the samples at hand 7.4 to 17.4 mm (her wrist's
 * hatched band, jumps of 1.4 to 11.4 mm against their neighbours) are left
 * out, so the line runs from hand 5.4 to hand 19.4 over that band; the rail
 * takes her shape 15 mm below the axilla level scaled 0.9987 to the shoulder
 * port's 282.4 mm perimeter (the host-owned boundary).
 *
 * Each station gives the four outline values from the segment axis
 * (lateral, medial, anterior, posterior, mm) and each quarter's conic
 * shoulder (`AutoMovieViewSection`'s `rho`, named by its two guides). A
 * shoulder of 0 is a quarter whose boundary lies on its chord (her flat
 * dorsal-ulnar palm); shoulders are held inside [0.02, 0.98], the conic's open
 * interval, which keeps the quarter within 0.5 mm of her chord. A station's
 * `along` is millimetres from its segment's zero, or the landmark it stands at
 * (a joint station is owned by the proximal segment and stands at the distal
 * segment's zero). Past the distal palm (72.6 mm), where her section is her
 * separate fingers, the knuckles and the knuckle arc keep drawn values.
 */
export namespace AutoMovieHumanArmF1Lines {
  /** Restore authored tuple widths from the unchanged ordered JSON coefficients. */
  export function fixedInput(value: typeof import("./AutoMovieHumanArmF1LeftInputs.json")): IFixedSource {
    const point: typeof AutoMovieHumanHandPalm.fixedPoint = AutoMovieHumanHandPalm.fixedPoint;
    const frame: IFixedSource["wristFrame"] = {
      ...value.wristFrame, origin: point(value.wristFrame.origin), u: point(value.wristFrame.u), v: point(value.wristFrame.v),
    };
    return {
      ...value, rootNormal: point(value.rootNormal),
      sleeve: value.sleeve.map((row: typeof value.sleeve[number]): IFixedSource["sleeve"][number] => ({
        ...row, points: row.points.map(point), normal: point(row.normal), origin: point(row.origin),
      })),
      wrist: { ...value.wrist, points: value.wrist.points.map(point), normal: point(value.wrist.normal) },
      wristFrame: frame, palm: value.palm.map(AutoMovieHumanHandPalm.fixedSection),
    };
  }

  /** A point or direction in the fixed F1 capture world. */
  type V3 = [number, number, number];

  /** Locally owned mutable world-millimetre triangles, until the region is returned. */
  export interface IFixedMesh {
    /** Absolute millimetre positions, three numbers per vertex. */
    positions: number[];

    /** Three vertex indices per emitted triangle. */
    indices: number[];
  }

  /** One ordered, implicitly closed set of measured contour controls and its distal plane normal. */
  export interface IFixedRing {
    /** Absolute contour vertices in millimetres, without a repeated closing point. */
    points: V3[];

    /** Unit normal pointing along the measured distal course. */
    normal: V3;
  }

  /** Fixed F1 sleeve and its continuation into the open palm, measured in the original pose. */
  export interface IFixedSource {
    /** Distal normal of the body-owned exact armscye. */
    rootNormal: V3;

    /** Ordered measured ordinary sections between the shoulder and wrist. */
    sleeve: (IFixedRing & { station: number; origin: V3 })[];

    /** The exact shared wrist contour and its physical chart. */
    wrist: IFixedRing;

    /** Absolute frame of the 72-phase retained wrist seam. */
    wristFrame: ReturnType<AutoMovieViewAxis.IAxis["at"]>;

    /** Measured wrist-to-palm contour controls through the final single-loop plane. */
    palm: AutoMovieHumanHandPalm.IFixedSection[];
  }

  /** Use the original contour walks between the exact shared shoulder and wrist. */
  export function sleeve(
    shoulder: IFixedRing,
    rows: readonly IFixedRing[],
    wrist: IFixedRing,
  ): IFixedMesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const identity: Map<V3, number> = new Map();

    /** Read each original perimeter against its own measured distal normal. */
    const orientation: (ring: IFixedRing) => number = (ring: IFixedRing): number =>
      Math.sign(AutoMovieHumanArmCurveSpec.dot(AutoMovieMeshCourse.newell(ring.points), ring.normal));
    const sign: number = -orientation(wrist);
    if (sign === 0) throw new Error("The measured F1 wrist has no physical orientation");

    // Tessellate in the reference's physical metre chart. Retain the exact
    // absolute millimetre controls for the shared shoulder and wrist indices.
    const walks: V3[][] = [shoulder, ...rows, wrist].map((ring: IFixedRing): V3[] => {
      const points: V3[] = ring.points.map(([x, y, z]: V3): V3 => {
        const point: V3 = [x * 0.001, y * 0.001, -z * 0.001];
        identity.set(point, positions.push(x, y, z) / 3 - 1);
        return point;
      });
      return orientation(ring) === sign ? points : points.reverse();
    });
    for (let i: number = 1; i < walks.length; ++i)
      tessellateAutoMovieContourStrip64(walks[i - 1]!, walks[i]!, (a: V3, b: V3, c: V3): void => {
        indices.push(identity.get(a)!, identity.get(b)!, identity.get(c)!);
      }, (point: V3): string => String(identity.get(point)), ({ qualified, diagnostics }: Parameters<NonNullable<Parameters<typeof tessellateAutoMovieContourStrip64>[4]>>[0]): void => {
        if (!qualified) throw new Error(`F1 measured arm strip ${i} refused: ${diagnostics.join("; ")}`);
      });

    const last: number = positions.length / 3 - wrist.points.length;
    const direction: number = indices.findIndex((a: number, i: number): boolean => a === last &&
      indices[i - i % 3 + (i + 1) % 3] === last + 1);
    if (direction < 0)
      for (let i: number = 0; i < indices.length; i += 3)
        [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
    return { positions, indices };
  }

  /** One quarter's conic shoulder per pair of guides. */
  export interface IShoulders {
    /** Between the lateral and posterior guides. */
    lateralPosterior: number;

    /** Between the posterior and medial guides. */
    posteriorMedial: number;

    /** Between the medial and anterior guides. */
    medialAnterior: number;

    /** Between the anterior and lateral guides. */
    anteriorLateral: number;
  }

  /** One authored station. */
  export interface IStation {
    /** Its anatomical site. */
    site: string;

    /** Millimetres from the segment's zero along its axis, or the landmark it stands at. */
    along: number | "axilla level" | "elbow" | "wrist" | "knuckles";

    /** Outline values from the segment axis: lateral, medial, anterior, posterior, mm. */
    extents: [number, number, number, number];

    /** Quarter shoulders. */
    shoulders: IShoulders;
  }

  /** Quarter shoulders in the order lateral-posterior, posterior-medial, medial-anterior, anterior-lateral, held inside [0.02, 0.98]. */
  const q = (lp: number, pm: number, ma: number, al: number): IShoulders => {
    const hold = (x: number): number => Math.min(0.98, Math.max(0.02, x));
    return { lateralPosterior: hold(lp), posteriorMedial: hold(pm), medialAnterior: hold(ma), anteriorLateral: hold(al) };
  };

  /** The upper arm from GH. */
  export const HUMERUS: readonly IStation[] = [
    { site: "rail (axilla level)", along: "axilla level", extents: [39.16, 56.57, 56.09, 26.57], shoulders: q(0.2493, 0.2795, 0.5228, 0.42) },
    { site: "humerus 78.8", along: 78.8, extents: [39.31, 56.78, 56.31, 26.67], shoulders: q(0.2493, 0.2795, 0.5228, 0.42) },
    { site: "humerus 88.8", along: 88.8, extents: [37.05, 58.08, 55.22, 26.94], shoulders: q(0.2334, 0.3017, 0.5313, 0.3948) },
    { site: "humerus 112.8", along: 112.8, extents: [31.91, 59.44, 51.65, 29.23], shoulders: q(0.2144, 0.3575, 0.5484, 0.4254) },
    { site: "humerus 156.8", along: 156.8, extents: [29.05, 56.24, 46.59, 34.04], shoulders: q(0.244, 0.4195, 0.457, 0.4397) },
    { site: "humerus 184.8", along: 184.8, extents: [29.31, 52.99, 43.98, 35.99], shoulders: q(0.2638, 0.4702, 0.376, 0.4176) },
    { site: "humerus 218.8", along: 218.8, extents: [29.46, 48.97, 37.4, 37.47], shoulders: q(0.3328, 0.5133, 0.3685, 0.2485) },
    { site: "humerus 236.8", along: 236.8, extents: [30.84, 46.45, 33.18, 36.87], shoulders: q(0.392, 0.5474, 0.4091, 0.076) },
    { site: "humerus 252.8", along: 252.8, extents: [34.66, 42.62, 30.49, 35.07], shoulders: q(0.4182, 0.6104, 0.4504, 0.0968) },
    { site: "elbow (epicondyles, olecranon)", along: "elbow", extents: [37.18, 40.95, 28.14, 37.14], shoulders: q(0.3496, 0.6274, 0.4887, 0.2297) },
  ];

  /** The forearm from the elbow centre, supinated. */
  export const FOREARM: readonly IStation[] = [
    { site: "forearm 8.7", along: 8.7, extents: [38.25, 41.49, 25.85, 39.45], shoulders: q(0.2987, 0.4933, 0.4871, 0.351) },
    { site: "forearm 22.7", along: 22.7, extents: [38.6, 42.99, 22.28, 43.4], shoulders: q(0.2764, 0.4399, 0.4078, 0.5027) },
    { site: "forearm 30.7", along: 30.7, extents: [38.77, 43.38, 22.72, 45.22], shoulders: q(0.292, 0.4739, 0.2871, 0.5009) },
    { site: "forearm 52.7", along: 52.7, extents: [38.91, 41.21, 24.59, 46.69], shoulders: q(0.3643, 0.5716, 0.1029, 0.4497) },
    { site: "forearm 60.7", along: 60.7, extents: [38.77, 39.65, 24.69, 47.18], shoulders: q(0.3841, 0.5919, 0.0733, 0.4392) },
    { site: "forearm 88.7", along: 88.7, extents: [37.25, 32.92, 23.72, 48.46], shoulders: q(0.4319, 0.5958, 0.0181, 0.4392) },
    { site: "forearm 118.7", along: 118.7, extents: [36.01, 24.62, 21.73, 45.95], shoulders: q(0.4531, 0.5464, 0.0177, 0.4146) },
    { site: "forearm 174.7", along: 174.7, extents: [31.95, 16.54, 23.76, 35.06], shoulders: q(0.5427, 0.3123, 0.3609, 0.2931) },
    { site: "forearm 178.7", along: 178.7, extents: [31.76, 16.49, 23.72, 34.19], shoulders: q(0.5451, 0.2857, 0.3949, 0.2851) },
    { site: "forearm 202.7", along: 202.7, extents: [30.27, 17.98, 23.22, 27.83], shoulders: q(0.5498, 0.154, 0.5846, 0.2332) },
    { site: "wrist (styloids)", along: "wrist", extents: [28.57, 23.35, 20.71, 21.94], shoulders: q(0.536, 0.1924, 0.5929, 0.2419) },
  ];

  /** The hand from the wrist zero (extracted to the distal palm; the knuckles and their arc drawn). */
  export const HAND: readonly IStation[] = [
    { site: "hand 3.4", along: 3.4, extents: [28.02, 23.81, 20.29, 21.64], shoulders: q(0.5713, 0.1893, 0.5686, 0.2365) },
    { site: "hand 5.4", along: 5.4, extents: [27.97, 24.0, 20.07, 21.68], shoulders: q(0.5895, 0.1817, 0.5556, 0.2294) },
    { site: "hand 19.4", along: 19.4, extents: [30.71, 26.47, 19.49, 21.95], shoulders: q(0.7349, 0.1051, 0.4418, 0.1794) },
    { site: "hand 33.4", along: 33.4, extents: [35.18, 33.19, 20.19, 23.87], shoulders: q(0.8256, 0.1057, 0.4219, 0.1431) },
    { site: "hand 57.4", along: 57.4, extents: [41.17, 44.29, 22.5, 24.84], shoulders: q(0.8709, 0, 0.3833, 0.1134) },
    { site: "hand 65.4", along: 65.4, extents: [43.7, 47.81, 23.66, 24.68], shoulders: q(0.8743, 0, 0.2695, 0.105) },
    { site: "hand 72.6 (distal palm)", along: 72.6, extents: [45.88, 49.01, 24.66, 24.82], shoulders: q(0.8843, 0, 0.0719, 0.0929) },
    { site: "knuckles (drawn)", along: "knuckles", extents: [30.5, 46.0, 15.5, 15.5], shoulders: q(0.43, 0.43, 0.43, 0.43) },
    { site: "knuckle arc (drawn)", along: 102, extents: [24.0, 37.0, 12.0, 12.5], shoulders: q(0.4, 0.4, 0.4, 0.4) },
  ];
}
