import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";
import type { AutoMovieHumanLegSegmentFrames } from "./AutoMovieHumanLegSegmentFrames";
import type { AutoMovieHumanLegViewCurves } from "./AutoMovieHumanLegViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The leg's segments for its view curves: the femur, the tibia and the foot,
 * each with its own zero on the neutral walk (hip centre, knee centre, IM),
 * the walk interval it owns and its view directions in its own frame (distal
 * along its course link, lateral the subject's lateral with its distal part
 * removed, anterior completing the frame; on the foot anterior is dorsal).
 */
export namespace AutoMovieHumanLegViewSegments {
  /** The three segments of a leg. */
  export function create(frames: AutoMovieHumanLegSegmentFrames.IOutput, landmarks: AutoMovieHumanLegLandmarks.IOutput): AutoMovieHumanLegViewCurves.ISegment[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const m: 1 | -1 = frames.medial;
    const c: AutoMovieHumanLegLandmarks.IOutput["course"] = landmarks.course;
    const toTibia: AutoMovieHumanArmCurveSpec.ITransform = S.inverse(frames.tibia.relative);
    const toFoot: AutoMovieHumanArmCurveSpec.ITransform = S.compose(S.inverse(frames.foot.relative), toTibia);
    const P: AutoMovieHumanLegSegmentFrames.IPoints = frames.points;
    const directions: (distalF: Vec3, map: AutoMovieHumanArmCurveSpec.ITransform) => [Vec3, Vec3, Vec3] = (distalF: Vec3, map: AutoMovieHumanArmCurveSpec.ITransform): [Vec3, Vec3, Vec3] => {
      const dd: Vec3 = S.unit(S.rotate(map, distalF));
      const l0: Vec3 = S.rotate(map, [0, 0, -m]);
      const l: Vec3 = S.unit(sub(l0, scale(dd, S.dot(l0, dd))));
      return [dd, l, scale(S.cross(dd, l), m)];
    };
    // The femur runs from the hip centre to the knee centre (her own joint centres when authored: the axis her lines were re-based along, AutoMovieHumanLegF1Rebase).
    const [fd, fl, fa]: [Vec3, Vec3, Vec3] = directions(S.unit(sub(P.knee, P.hip)), S.IDENTITY);
    const [td, tl, ta]: [Vec3, Vec3, Vec3] = directions(S.unit(sub(P.im, P.knee)), toTibia);
    const [pd, pl, pa]: [Vec3, Vec3, Vec3] = directions(S.unit(sub(landmarks.points.web, P.im)), toFoot);
    return [
      { name: "femur", frame: frames.femur.name, walk: 0, interval: [c.port, c.knee], origin: [0, 0, 0], distal: fd, lateral: fl, anterior: fa },
      { name: "tibia", frame: frames.tibia.name, walk: c.knee, interval: [c.knee, c.im], origin: S.apply(toTibia, P.knee), distal: td, lateral: tl, anterior: ta },
      { name: "foot", frame: frames.foot.name, walk: c.im, interval: [c.im, c.web], origin: S.apply(toFoot, P.im), distal: pd, lateral: pl, anterior: pa },
    ];
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
