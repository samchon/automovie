import { AutoMovieViewAxis, AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmF1Pose } from "./AutoMovieHumanArmF1Pose";
import type { AutoMovieHumanArmLandmarks } from "./AutoMovieHumanArmLandmarks";
import type { AutoMovieHumanArmSegmentFrames } from "./AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewCurves } from "./AutoMovieHumanArmViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Knot = AutoMovieHumanArmViewCurves.IKnot;

/**
 * The arm's pure loft constructor: the view curves of the three segments
 * become one `IAutoMovieViewPart` lofted by the engine's view-to-section
 * operator (`AutoMovieViewLoft`), classic conic lofting. The course is the
 * engine's jointed axis from the dome pole (on the humerus axis at the
 * skin over the acromion, above GH) through the elbow centre and the wrist centre to
 * the palm pole (`AutoMovieViewAxis.jointed`), closed at both poles; its
 * station is the course arclength from the dome pole.
 * A flexed joint turns its section planes by a quintic angle whose midpoint
 * plane is the bisection plane of the two links (Thalmann, Shen and
 * Chauvineau 1996, section 2.1). The chart `u` is lateral and `v = u x t`.
 *
 * Station map. A neutral walk station on a straight run keeps its distance
 * from the segment's first centre; a joint knot sits at its turn's midpoint;
 * a site inside a turn (the wrist girth plane at stylion, 1.5 mm proximal of
 * the wrist centre) takes the station of the turn's section plane through
 * its own point on its bone line.
 * Outline jets carry the same station derivatives into the posed two-pole
 * angle by the chain rule (exact at neutral, where the maps coincide); at
 * a pole, where the station derivative vanishes, the angle jets scale by the
 * ratio of the posed and neutral pole-to-pole lengths, since the runs at both
 * poles are straight.
 * At a flexed joint the bend-plane extents of the joint section are those of
 * the two links' common section, stretched by `1 / cos(theta / 2)` about the
 * joint centre (Thalmann et al. 1996) and re-referred to the course origin.
 *
 * Turn half length. The sections turn over about one joint radius `r` (the
 * joint's largest half extent) either side of the bisection plane. A tube of
 * radius `r` about a course of curvature `k` is regular while `k r < 1`; the
 * quintic-angle turn of angle `theta` over `2 h` has peak curvature
 * `1.875 theta / (2 h)`, so `h = max(r, 1.875 theta r / (2 * 0.8))` also keeps
 * `k r <= 0.8`.
 */
export namespace AutoMovieHumanArmViewLoft {
  /** What the loft reads. */
  export interface IInput {
    /** View curves (pose independent). */
    curves: AutoMovieHumanArmViewCurves.IOutput;

    /** Frames at the pose to loft. */
    frames: AutoMovieHumanArmSegmentFrames.IOutput;

    /** Landmarks of the same person. */
    landmarks: AutoMovieHumanArmLandmarks.IOutput;

    /** Transform of the humerus frame into the world. */
    root: AutoMovieHumanArmCurveSpec.ITransform;

    /** Section control points (multiple of 4, at least 8). */
    order: number;

    /** Ring phases of the chain. */
    samples: number;

    /** Widest layer spacing, mm. */
    gap: number;

    /**
     * f1's own pose (`AutoMovieHumanArmF1Pose`): when given, the course is her
     * frame curve with its root on the trunk's port instead of the jointed
     * axis through the posed frames, and `root` is not read.
     */
    posed?: Pick<AutoMovieHumanArmF1Pose.IOutput, "axis" | "along">;
  }

  /** The lofted part. */
  export interface IOutput {
    /** The view part handed to the engine, or null when the course is inadmissible. */
    part: IAutoMovieViewPart | null;

    /** The engine's loft. */
    loft: AutoMovieViewLoft.IResult | null;

    /** World course centres: dome pole, elbow, wrist, palm pole. */
    centres: Vec3[];

    /** Posed station (course arclength from GH) of a neutral walk station. */
    station: (walk: number) => number;

    /** Posed course length, mm. */
    length: number;

    /** Admission notes of this constructor. */
    diagnostics: string[];
  }

  /** Build and loft the arm. */
  export function create(input: IInput): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const { curves, frames, landmarks, root } = input;
    const m: 1 | -1 = frames.medial;
    const P: AutoMovieHumanArmSegmentFrames.IPoints = frames.points;
    const toWorld: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => S.apply(root, p);
    const neutral: number[] = [landmarks.course.dome, landmarks.course.elbow, landmarks.course.wrist, landmarks.course.web];
    if (input.posed !== undefined) return posedLoft(input, input.posed, neutral);
    // The landmarks are built from the same posed frames, so their palm pole turns with the hand.
    const centres: Vec3[] = [toWorld(landmarks.points.dome), toWorld(P.elbow), toWorld(P.wrist), toWorld(landmarks.points.end)];
    const diagnostics: string[] = [];

    // Joint turns and their half lengths.
    const extentAt: (walk: number) => number = (walk: number): number =>
      Math.max(...AutoMovieHumanArmViewCurves.LABELS.map((l: AutoMovieHumanArmViewCurves.Label): number => AutoMovieHumanArmViewCurves.value(curves.outlines[l], walk, curves.end)[0]));
    const angles: number[] = [1, 2].map((i: number): number => {
      const a: Vec3 = S.unit(sub(centres[i]!, centres[i - 1]!));
      const b: Vec3 = S.unit(sub(centres[i + 1]!, centres[i]!));
      return Math.atan2(Math.hypot(...S.cross(a, b)), S.dot(a, b));
    });
    const halves: number[] = angles.map((theta: number, k: number): number => {
      const r: number = extentAt(neutral[k + 1]!) / Math.cos(theta / 2);
      // The sections turn over about one joint radius either side of the
      // bisection plane (Thalmann et al. 1996: from the link-end normal to
      // the joint's bisection plane near the joint), lengthened when the
      // regularity bound needs more; a rounding-level angle of a straight
      // joint keeps a positive but negligible turn.
      return theta > 1e-9 ? Math.max(r, (1.875 * theta * r) / (2 * 0.8)) : 1e-6;
    });
    const up: Vec3 = S.rotate(root, [0, 0, -m]);
    const axis: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(centres, halves, up);
    const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(centres, halves);
    if (typeof axis === "string" || typeof runs === "string") {
      diagnostics.push(`course: ${typeof axis === "string" ? axis : runs}`);
      return { part: null, loft: null, centres, station: (w: number): number => w, length: NaN, diagnostics };
    }
    const joint: (i: number) => number = (i: number): number => runs[i - 1]!.end + (runs[i]!.start - runs[i - 1]!.end) / 2;
    const station: (walk: number) => number = (walk: number): number => {
      const i: number = Math.min(2, Math.max(0, [1, 2, 3].findIndex((k: number): boolean => walk <= neutral[k]! + 1e-6)));
      const x: number = walk - neutral[i]!;
      const run: AutoMovieViewAxis.IRun = runs[i]!;
      if (i > 0 && Math.abs(x) < 1e-6) return joint(i);
      if (i < 2 && Math.abs(walk - neutral[i + 1]!) < 1e-6) return joint(i + 1);
      if (x >= run.from - 1e-6 && x <= run.to + 1e-6) return run.start + (Math.min(run.to, Math.max(run.from, x)) - run.from);
      // Inside a turn the site's own point on its bone line lies on exactly
      // one section plane of the turn: solve that plane's station by
      // bisection on its signed distance (the planes sweep monotonically).
      const site: Vec3 = add(centres[i]!, scale(S.unit(sub(centres[i + 1]!, centres[i]!)), x));
      const [lo, hi]: [number, number] = x < run.from ? [joint(i), run.start] : [run.end, joint(i + 1)];
      const side: (s: number) => number = (s: number): number => {
        const f: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(s);
        return S.dot(sub(site, f.origin), S.cross(f.v, f.u));
      };
      let a: number = lo;
      let b: number = hi;
      const fa: number = side(a);
      for (let k: number = 0; k < 60; ++k) {
        const mid: number = (a + b) / 2;
        if (side(mid) * fa > 0) a = mid;
        else b = mid;
      }
      return (a + b) / 2;
    };
    const Lp: number = runs[2]!.end;
    // The engine normalizes explicit jets by the whole parameter span: pi
    // for the two-pole angle (AutoMovieViewHermite).
    const span: number = Math.PI;
    const E: number = curves.end;
    const B: number = curves.start;
    // Near either pole a run is straight, so the posed and neutral angles
    // differ by the ratio of the pole-to-pole lengths: x_n = x_p sqrt(Lp / (E - B)).
    const near: number = Math.sqrt(Lp / (E - B));

    // Outlines in the posed two-pole angle, signed into the chart.
    const posterior: boolean = m > 0;
    const signed: (label: AutoMovieHumanArmViewCurves.Label, sign: 1 | -1, chart: "u" | "v", positive: boolean) => IAutoMovieViewPart.IOutline = (
      label: AutoMovieHumanArmViewCurves.Label,
      sign: 1 | -1,
      chart: "u" | "v",
      positive: boolean,
    ): IAutoMovieViewPart.IOutline => ({
      knots: curves.outlines[label].map((k: Knot): IAutoMovieViewPart.IKnot => {
        const s: number = station(k.walk);
        let value: number = k.value;
        let first: number = k.first;
        let second: number = k.second;
        const [nx, nxx]: [number, number] = AutoMovieHumanArmViewCurves.stationJet(k.q, E, B);
        if (Math.abs(nx) > 0) {
          // Neutral station jets by the chain rule, then the posed angle
          // x_p = 2 asin(sqrt(s / Lp)): y_x = y_s s_x, y_xx = y_ss s_x^2 + y_s s_xx.
          const ys: number = k.first / nx;
          const yss: number = (k.second - ys * nxx) / (nx * nx);
          const [px, pxx]: [number, number] = AutoMovieHumanArmViewCurves.stationJet(AutoMovieHumanArmViewCurves.parameter(s, Lp, 0), Lp, 0);
          first = ys * px;
          second = yss * px * px + ys * pxx;
        } else {
          first = k.first * near;
          second = k.second * near * near;
        }
        if (chart === "v") {
          const j: number = [1, 2].find((n: number): boolean => Math.abs(k.walk - neutral[n]!) < 1e-6) ?? 0;
          if (j > 0 && angles[j - 1]! > 1e-6) {
            const shift: number = S.dot(sub(axis.at(s).origin, centres[j]!), axis.at(s).v);
            value = value / Math.cos(angles[j - 1]! / 2) + (positive ? -shift : shift);
          }
        }
        return { site: k.site, station: s, value: sign * value, jet: { first: sign * first * span, second: sign * second * span * span } };
      }),
    });
    const front: IAutoMovieViewPart.IPair = { positive: signed("lateral", 1, "u", true), negative: signed("medial", -1, "u", false) };
    const side: IAutoMovieViewPart.IPair = {
      positive: signed(posterior ? "posterior" : "anterior", 1, "v", true),
      negative: signed(posterior ? "anterior" : "posterior", -1, "v", false),
    };
    // The four quarters' shoulders, one curve each in the part's guide order: the engine's "top" fullness.
    const quarter = (knots: readonly Knot[]): IAutoMovieViewPart.IOutline => ({
      knots: knots.map((k: Knot): IAutoMovieViewPart.IKnot => ({ site: k.site, station: station(k.walk), value: k.value })),
    });
    const shoulders: [IAutoMovieViewPart.IOutline, IAutoMovieViewPart.IOutline, IAutoMovieViewPart.IOutline, IAutoMovieViewPart.IOutline] = [
      quarter(curves.quarters[0]),
      quarter(curves.quarters[1]),
      quarter(curves.quarters[2]),
      quarter(curves.quarters[3]),
    ];

    // Layers: every knot station, each run between them cut into equal steps no wider than the gap.
    const keys: number[] = [];
    for (const s of [...Object.values(curves.outlines).flat(), ...curves.quarters.flat()].map((k: Knot): number => station(k.walk)).sort((a: number, b: number): number => a - b))
      if (keys.length === 0 || s - keys[keys.length - 1]! > 1e-6) keys.push(s);
    const stations: number[] = [keys[0]!];
    for (let i: number = 0; i + 1 < keys.length; ++i) {
      const n: number = Math.max(1, Math.ceil((keys[i + 1]! - keys[i]!) / input.gap));
      for (let j: number = 1; j <= n; ++j) stations.push(j === n ? keys[i + 1]! : keys[i]! + ((keys[i + 1]! - keys[i]!) * j) / n);
    }
    const part: IAutoMovieViewPart = {
      name: `arm.${m > 0 ? "left" : "right"}`,
      axis,
      stations,
      front,
      side,
      fullness: { kind: "top", shoulders },
      pole: "both",
      order: input.order,
      samples: input.samples,
    };
    return { part, loft: AutoMovieViewLoft.create(part), centres, station, length: Lp, diagnostics };
  }

  /**
   * The loft on f1's frame curve (`AutoMovieHumanArmF1Pose`). Her curve's
   * distance from GH is the neutral walk's (her bone lengths are the arm's
   * inputs: GH to the elbow centre and the elbow centre to the wrist zero
   * agree to 2e-9 mm, `node:arm-world`'s receipt); the view curves were
   * faired over her course (`AutoMovieHumanArmViewCurves` with `posed`: the
   * root's turn stretched to its arc), so a knot's station is its course walk
   * from the dome pole, `walk - B`, the course length is `E - B`, and every
   * jet passes unchanged; a reader's neutral landmark walk maps through
   * `along`. Her blended joint planes are the ones her sections were read on,
   * so no joint stretch applies.
   */
  function posedLoft(input: IInput, posed: Pick<AutoMovieHumanArmF1Pose.IOutput, "axis" | "along">, neutral: number[]): IOutput {
    const { curves, landmarks } = input;
    const m: 1 | -1 = input.frames.medial;
    // The view curves' walks are already her course's (`AutoMovieHumanArmViewCurves` with `posed`); a reader's neutral landmark walk maps through `along`.
    const A: number = landmarks.course.port;
    const B: number = curves.start;
    const E: number = curves.end;
    const Lp: number = E - B;
    const axis: AutoMovieViewAxis.IAxis = posed.axis(A - B);
    const knot: (walk: number) => number = (walk: number): number => walk - B;
    const station: (walk: number) => number = (walk: number): number => A + posed.along(walk - A) - B;
    const centres: Vec3[] = neutral.map((walk: number): Vec3 => [...axis.at(station(walk)).origin] as Vec3);
    // The engine normalizes explicit jets by the whole parameter span: pi for the two-pole angle (AutoMovieViewHermite).
    const span: number = Math.PI;
    const signed = (label: AutoMovieHumanArmViewCurves.Label, sign: 1 | -1): IAutoMovieViewPart.IOutline => ({
      knots: curves.outlines[label].map(
        (k: Knot): IAutoMovieViewPart.IKnot => ({ site: k.site, station: knot(k.walk), value: sign * k.value, jet: { first: sign * k.first * span, second: sign * k.second * span * span } }),
      ),
    });
    const posterior: boolean = m > 0;
    const front: IAutoMovieViewPart.IPair = { positive: signed("lateral", 1), negative: signed("medial", -1) };
    const side: IAutoMovieViewPart.IPair = { positive: signed(posterior ? "posterior" : "anterior", 1), negative: signed(posterior ? "anterior" : "posterior", -1) };
    const quarter = (knots: readonly Knot[]): IAutoMovieViewPart.IOutline => ({ knots: knots.map((k: Knot): IAutoMovieViewPart.IKnot => ({ site: k.site, station: knot(k.walk), value: k.value })) });
    const shoulders: [IAutoMovieViewPart.IOutline, IAutoMovieViewPart.IOutline, IAutoMovieViewPart.IOutline, IAutoMovieViewPart.IOutline] = [
      quarter(curves.quarters[0]),
      quarter(curves.quarters[1]),
      quarter(curves.quarters[2]),
      quarter(curves.quarters[3]),
    ];
    // Layers: every knot station, each run between them cut into equal steps no wider than the gap.
    const keys: number[] = [];
    for (const s of [...Object.values(curves.outlines).flat(), ...curves.quarters.flat()].map((k: Knot): number => knot(k.walk)).sort((a: number, b: number): number => a - b))
      if (keys.length === 0 || s - keys[keys.length - 1]! > 1e-6) keys.push(s);
    const stations: number[] = [keys[0]!];
    for (let i: number = 0; i + 1 < keys.length; ++i) {
      const n: number = Math.max(1, Math.ceil((keys[i + 1]! - keys[i]!) / input.gap));
      for (let j: number = 1; j <= n; ++j) stations.push(j === n ? keys[i + 1]! : keys[i]! + ((keys[i + 1]! - keys[i]!) * j) / n);
    }
    const part: IAutoMovieViewPart = {
      name: `arm.${m > 0 ? "left" : "right"}`,
      axis,
      stations,
      front,
      side,
      fullness: { kind: "top", shoulders },
      pole: "both",
      order: input.order,
      samples: input.samples,
    };
    return { part, loft: AutoMovieViewLoft.create(part), centres, station, length: Lp, diagnostics: [] };
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
