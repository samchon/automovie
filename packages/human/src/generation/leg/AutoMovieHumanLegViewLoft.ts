import { AutoMovieSolidChain, AutoMovieViewLoft, type IAutoMovieLoftChain, type IAutoMovieLoftRelief, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanLegCourse } from "./AutoMovieHumanLegCourse";
import { AutoMovieHumanLegPatella } from "./AutoMovieHumanLegPatella";
import { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";
import type { AutoMovieHumanLegSegmentFrames } from "./AutoMovieHumanLegSegmentFrames";
import type { AutoMovieHumanLegSole } from "./AutoMovieHumanLegSole";
import { AutoMovieHumanLegViewCurves } from "./AutoMovieHumanLegViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Knot = AutoMovieHumanLegViewCurves.IKnot;

/**
 * The leg's pure loft constructor: the view curves of the thigh, shank and
 * foot become one `IAutoMovieViewPart` lofted by the engine's view-to-section
 * operator (`AutoMovieViewLoft`), classic conic lofting, as the arm's. The
 * course is the jointed axis through the port (the open proximal end, pending
 * f1_trunk's hip band), the knee centre, IM and the toe-web pole
 * (`AutoMovieHumanLegCourse`); its station is the course arclength from the
 * port. The chart `u` is lateral and `v = u x t`: posterior on the thigh and
 * shank and plantar on the foot, so the side pair carries the calf, Achilles,
 * heel and sole as one line and the shin, instep and dorsum as the other.
 *
 * Station map and jets as in the arm loft: a neutral walk station on a
 * straight run keeps its distance from its segment's first centre, a joint
 * knot sits at its turn's midpoint, and outline jets carry the same station
 * derivatives into the posed root parameter by the chain rule. At a turned
 * joint the bend-plane extents of the joint knot are the common section's,
 * stretched by `1 / cos(theta / 2)` about the joint centre and re-referred to
 * the course origin (`AutoMovieHumanLegCourse.bisection`). The ankle turns at
 * neutral (the shank meets the foot), so its joint knots already carry their
 * actual extents on the neutral bisection plane (rule `actual ...`), like
 * the turn's other datums; for a pose they are taken back to the common
 * extent by the neutral turn and stretched by the posed one. The knee turns
 * only when flexed.
 */
export namespace AutoMovieHumanLegViewLoft {
  /** What the loft reads. */
  export interface IInput {
    /** View curves (pose independent). */
    curves: AutoMovieHumanLegViewCurves.IOutput;

    /** Frames at the pose to loft. */
    frames: AutoMovieHumanLegSegmentFrames.IOutput;

    /** Landmarks of the same person at the same pose. */
    landmarks: AutoMovieHumanLegLandmarks.IOutput;

    /** Transform of the femur frame into the world. */
    root: AutoMovieHumanArmCurveSpec.ITransform;

    /** Section control points (multiple of 4, at least 8). */
    order: number;

    /** Ring phases of the chain. */
    samples: number;

    /** Sex control (the patella footprint row). */
    sex: number;

    /** Calibration mm per world mm. */
    scale: number;

    /** Widest layer spacing, mm. */
    gap: number;
  }

  /** The lofted part. */
  export interface IOutput {
    /** The view part handed to the engine, or null when the course is inadmissible. */
    part: IAutoMovieViewPart | null;

    /** The engine's loft. */
    loft: AutoMovieViewLoft.IResult | null;

    /** World course centres: port, knee centre, IM, toe-web pole. */
    centres: Vec3[];

    /** The posed course. */
    course: AutoMovieHumanLegCourse.IOutput;

    /** Posed station (course arclength from the port) of a neutral walk station. */
    station: (walk: number) => number;

    /** Admission notes of this constructor. */
    diagnostics: string[];
  }

  /** Build and loft the leg. */
  export function create(input: IInput): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const { curves, frames, landmarks, root } = input;
    const m: 1 | -1 = frames.medial;
    const P: AutoMovieHumanLegSegmentFrames.IPoints = frames.points;
    const toWorld: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => S.apply(root, p);
    // The landmarks are built from the same posed frames, so their pole turns with the foot.
    const centres: Vec3[] = [toWorld(landmarks.points.port), toWorld(P.knee), toWorld(P.im), toWorld(landmarks.points.web)];
    const neutral: number[] = [curves.start, landmarks.course.knee, landmarks.course.im, curves.end];
    const diagnostics: string[] = [];

    // Inner extents: the concave side of each turn (the side the course turns toward).
    const valueAt: (label: AutoMovieHumanLegViewCurves.Label, walk: number) => number = (label: AutoMovieHumanLegViewCurves.Label, walk: number): number =>
      AutoMovieHumanLegViewCurves.value(curves.outlines[label], walk, curves.end)[0];
    const anteriorAt: Vec3[] = [S.rotate(root, S.rotate(frames.femur.relative, [1, 0, 0])), S.rotate(root, frames.chain(frames.tibia.name, S.IDENTITY).axes[0])];
    const inner: number[] = [1, 2].map((i: number): number => {
      const a: Vec3 = S.unit(sub(centres[i]!, centres[i - 1]!));
      const b: Vec3 = S.unit(sub(centres[i + 1]!, centres[i]!));
      const toward: number = S.dot(sub(b, a), anteriorAt[i - 1]!);
      // The turn's length reads the common (unstretched) extent: an actual joint extent is taken back by the neutral turn.
      const common: (label: AutoMovieHumanLegViewCurves.Label, positive: boolean) => number = (label: AutoMovieHumanLegViewCurves.Label, positive: boolean): number => {
        const knot: Knot | undefined = curves.outlines[label].find((k: Knot): boolean => Math.abs(k.walk - neutral[i]!) < 1e-6);
        if (knot === undefined || !knot.rule.startsWith("actual")) return valueAt(label, neutral[i]!);
        return (knot.value - AutoMovieHumanLegCourse.bisection(curves.course, i, curves.centres[i]!, 0, positive)) * Math.cos((curves.course.angles[i - 1] ?? 0) / 2);
      };
      const ant: number = common("anterior", m < 0);
      const post: number = common("posterior", m > 0);
      return Math.abs(toward) < 1e-9 ? Math.max(ant, post) : toward > 0 ? ant : post;
    });
    // The femur's lead-in turn from the host loop's normal into the femur axis (the femur frame's bend does not move with the knee or the ankle).
    const course: AutoMovieHumanLegCourse.IOutput = AutoMovieHumanLegCourse.create(centres, neutral, inner, S.rotate(root, [0, 0, -m]), { centre: toWorld(landmarks.bend.point), walk: landmarks.bend.walk, inner: landmarks.bend.inner });
    if (course.axis === null) return { part: null, loft: null, centres, course, station: course.station, diagnostics: [...course.diagnostics] };
    const Lp: number = course.length;
    const span: number = Math.sqrt(Lp);

    // Outlines in the posed root parameter, signed into the chart.
    const posterior: boolean = m > 0;
    const signed: (label: AutoMovieHumanLegViewCurves.Label, sign: 1 | -1, chart: "u" | "v", positive: boolean) => IAutoMovieViewPart.IOutline = (
      label: AutoMovieHumanLegViewCurves.Label,
      sign: 1 | -1,
      chart: "u" | "v",
      positive: boolean,
    ): IAutoMovieViewPart.IOutline => ({
      knots: curves.outlines[label].map((k: Knot): IAutoMovieViewPart.IKnot => {
        const s: number = course.station(k.walk);
        let value: number = k.value;
        let first: number = k.first;
        let second: number = k.second;
        if (k.q < 0) {
          // Neutral station jets, then the posed root parameter: s = Lp - q^2.
          const ys: number = k.first / (-2 * k.q);
          const yss: number = (k.second + 2 * ys) / (4 * k.q * k.q);
          const qp: number = -Math.sqrt(Math.max(0, Lp - s));
          first = ys * (-2 * qp);
          second = yss * 4 * qp * qp - 2 * ys;
        }
        if (chart === "v") {
          const j: number = [1, 2].find((n: number): boolean => Math.abs(k.walk - neutral[n]!) < 1e-6) ?? 0;
          if (j > 0 && k.rule.startsWith("actual")) {
            // An actual extent on the neutral bisection plane: back to the common extent by the neutral turn, then stretched for the posed turn.
            const neutralAngle: number = curves.course.angles[j - 1] ?? 0;
            const offset: number = AutoMovieHumanLegCourse.bisection(curves.course, j, curves.centres[j]!, 0, positive);
            value = AutoMovieHumanLegCourse.bisection(course, j, centres[j]!, (value - offset) * Math.cos(neutralAngle / 2), positive);
          } else if (j > 0) value = AutoMovieHumanLegCourse.bisection(course, j, centres[j]!, value, positive);
        }
        return { site: k.site, station: s, value: sign * value, jet: { first: sign * first * span, second: sign * second * span * span } };
      }),
    });
    const front: IAutoMovieViewPart.IPair = { positive: signed("lateral", 1, "u", true), negative: signed("medial", -1, "u", false) };
    const side: IAutoMovieViewPart.IPair = {
      positive: signed(posterior ? "posterior" : "anterior", 1, "v", true),
      negative: signed(posterior ? "anterior" : "posterior", -1, "v", false),
    };
    const shoulder: IAutoMovieViewPart.IOutline = {
      knots: curves.fullness.map((k: Knot): IAutoMovieViewPart.IKnot => ({ site: k.site, station: course.station(k.walk), value: k.value })),
    };
    // The flat sole's plantar-quarter departures (AutoMovieHumanLegSole), held flat at each knot (zero slopes), so they never overshoot between knots.
    const departures: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> = curves.sole.departures.map(
      (list: AutoMovieHumanLegSole.IKnot[]): IAutoMovieViewPart.IOutline => ({
        knots: list.map((k: AutoMovieHumanLegSole.IKnot): IAutoMovieViewPart.IKnot => ({ site: k.site, station: course.station(k.walk), value: k.value, jet: { first: 0, second: 0 } })),
      }),
    ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

    // Layers: every knot station, each run between them cut into equal steps no wider than the gap.
    const keys: number[] = [];
    for (const s of [...[...Object.values(curves.outlines).flat(), ...curves.fullness].map((k: Knot): number => k.walk), ...curves.sole.departures.flat().map((k: AutoMovieHumanLegSole.IKnot): number => k.walk)].map((w: number): number => course.station(w)).sort((a: number, b: number): number => a - b))
      if (keys.length === 0 || s - keys[keys.length - 1]! > 1e-6) keys.push(s);
    const stations: number[] = [keys[0]!];
    for (let i: number = 0; i + 1 < keys.length; ++i) {
      const n: number = Math.max(1, Math.ceil((keys[i + 1]! - keys[i]!) / input.gap));
      for (let j: number = 1; j <= n; ++j) stations.push(j === n ? keys[i + 1]! : keys[i]! + ((keys[i + 1]! - keys[i]!) * j) / n);
    }
    diagnostics.push(...course.diagnostics);
    const part: IAutoMovieViewPart = {
      name: `leg.${m > 0 ? "left" : "right"}`,
      axis: course.axis,
      stations,
      front,
      side,
      fullness: { kind: "shoulder", shoulder, departures },
      pole: "top",
      order: input.order,
      samples: input.samples,
    };
    // The patella's skin relief on the knee's front (AutoMovieHumanLegPatella), carried by the chain so its surface and rings read it.
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    const mid: number = course.station(AutoMovieHumanLegLandmarks.get(landmarks, "midpatella").walk);
    // Only when the view curves carry the patella (their mid-patella fullness then closes the knee tape over it).
    const patella: IAutoMovieLoftRelief | null = curves.patella === null ? null : AutoMovieHumanLegPatella.relief({
      station: mid,
      phase: posterior ? (3 * Math.PI) / 2 : Math.PI / 2,
      radius: valueAt("anterior", AutoMovieHumanLegLandmarks.get(landmarks, "midpatella").walk),
      axis: S.rotate(root, S.rotate(frames.femur.relative, [1, 0, 0])),
      sex: curves.patella.sex,
      scale: curves.patella.scale,
    });
    const chain: IAutoMovieLoftChain | null = loft.chain === null || patella === null ? loft.chain : { ...loft.chain, reliefs: [...(loft.chain.reliefs ?? []), patella] };
    const surface: IAutoMovieSolidSurface | null = chain === null || patella === null ? loft.surface : AutoMovieSolidChain.surface(chain);
    return { part, loft: { ...loft, chain, surface }, centres, course, station: course.station, diagnostics };
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
