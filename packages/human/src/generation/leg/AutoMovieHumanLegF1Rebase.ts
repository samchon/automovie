type V3 = [number, number, number];

/**
 * f1's world-matched leg lines re-based into the leg's zero frames (the
 * owner's world-match method, 2026-11-08): the lines are first authored as
 * absolute world points on her reference in her own stance (shank abducted,
 * feet as placed, `AutoMovieHumanLegF1World`), then each point is written in
 * the frame of the segment it lies on, from that segment's zero: the femur
 * from the hip centre, the tibia from the knee centre. The frames' axes come
 * from her bone landmarks in that stance (ISB 2002: the femur's long axis hip
 * centre to knee centre, the tibia's knee centre to IM; anterior the world's
 * forward made normal to the long axis; lateral normal to both, away from the
 * midsagittal plane). The leg's own neutral frames then set the angles, so
 * her stance never enters the leg.
 */
export namespace AutoMovieHumanLegF1Rebase {
  /** One segment's zero frame, world. */
  export interface IFrame {
    /** The zero: the hip centre or the knee centre. */
    zero: V3;

    /** Unit distal long axis. */
    distal: V3;

    /** Unit anterior axis. */
    anterior: V3;

    /** Unit lateral axis (away from the midsagittal plane). */
    lateral: V3;
  }

  /** One re-based point of a line. */
  export interface IKnot {
    /** The segment it lies on. */
    segment: "femur" | "tibia" | "foot";

    /** Walk from the segment's zero along its distal axis, mm. */
    at: number;

    /** Its extent from the long axis along the line's own direction, mm. */
    value: number;

    /** Its coordinate along the frame's third axis (anterior for the lateral and medial lines, lateral for the anterior and posterior lines), mm: the silhouette point's place around the axis, kept so the change of frame is rigid and exact. */
    across: number;

    /** Its level's site name, or an empty string between sites. */
    level: string;
  }

  /** The leg's four lines and the direction each extent is read along. */
  export type Label = "lateral" | "medial" | "anterior" | "posterior";

  /** The femur's and the tibia's zero frames from the hip centre, the knee centre and IM in her stance; `side` is the lateral sign of world Z. */
  export function frames(landmarks: Readonly<Record<"hip" | "knee" | "im", V3>>, side: 1 | -1): { femur: IFrame; tibia: IFrame } {
    const frame: (zero: V3, end: V3) => IFrame = (zero: V3, end: V3): IFrame => {
      const distal: V3 = unit(sub(end, zero));
      const forward: V3 = [1, 0, 0];
      const anterior: V3 = unit(sub(forward, scale(distal, dot(forward, distal))));
      const across: V3 = unit(cross(distal, anterior));
      const lateral: V3 = across[2] * side > 0 ? across : scale(across, -1);
      return { zero, distal, anterior, lateral };
    };
    return { femur: frame(landmarks.hip, landmarks.knee), tibia: frame(landmarks.knee, landmarks.im) };
  }

  /** The direction a line's extent is read along in a frame. */
  export function direction(frame: IFrame, label: Label): V3 {
    if (label === "lateral") return frame.lateral;
    if (label === "medial") return scale(frame.lateral, -1);
    if (label === "anterior") return frame.anterior;
    return scale(frame.anterior, -1);
  }

  /** The frame's third axis for a line: anterior for the lateral and medial lines, lateral for the anterior and posterior lines. */
  export function across(frame: IFrame, label: Label): V3 {
    return label === "lateral" || label === "medial" ? frame.anterior : frame.lateral;
  }

  /** Re-base one line's world points (one per level) into the segment frames, every coordinate of each point (a rigid change of frame): above the knee centre's level the femur's, below it the tibia's. */
  export function convert(points: readonly V3[], levels: readonly string[], label: Label, f: { femur: IFrame; tibia: IFrame }): IKnot[] {
    return points.map((p: V3, k: number): IKnot => {
      const segment: "femur" | "tibia" = p[1] >= f.tibia.zero[1] ? "femur" : "tibia";
      const frame: IFrame = f[segment];
      const r: V3 = sub(p, frame.zero);
      return { segment, at: dot(r, frame.distal), value: dot(r, direction(frame, label)), across: dot(r, across(frame, label)), level: levels[k] ?? "" };
    });
  }

  /** A re-based knot placed back in the frames of her stance (the equivalence check): the zero plus its three frame coordinates. */
  export function restore(knot: IKnot, label: Label, f: { femur: IFrame; tibia: IFrame }): V3 {
    return place(knot, label, knot.segment === "foot" ? f.tibia : f[knot.segment]);
  }

  /** A re-based knot placed in one frame: the zero plus its three frame coordinates. */
  export function place(knot: IKnot, label: Label, frame: IFrame): V3 {
    return add(add(add(frame.zero, scale(frame.distal, knot.at)), scale(direction(frame, label), knot.value)), scale(across(frame, label), knot.across));
  }

  /** The foot's zero frame at IM in her stance: distal along her foot's course (IM toward the toe-web pole), anterior the dorsal side (the vertical made normal to it), lateral normal to both. */
  export function foot(im: V3, course: V3, side: 1 | -1): IFrame {
    const distal: V3 = unit(course);
    const up: V3 = [0, 1, 0];
    const anterior: V3 = unit(sub(up, scale(distal, dot(up, distal))));
    const normal: V3 = unit(cross(distal, anterior));
    return { zero: im, distal, anterior, lateral: normal[2] * side > 0 ? normal : scale(normal, -1) };
  }

  /** Re-base foot points into the foot frame (every coordinate, rigid): the lateral and medial outlines, the dorsal profile as `anterior`, the plantar as `posterior`. */
  export function convertFoot(points: readonly V3[], label: Label, frame: IFrame): IKnot[] {
    return points.map((p: V3): IKnot => {
      const r: V3 = sub(p, frame.zero);
      return { segment: "foot", at: dot(r, frame.distal), value: dot(r, direction(frame, label)), across: dot(r, across(frame, label)), level: "" };
    });
  }

  /**
   * The ankle's common anterior half extent at IM from her front-ankle
   * juncture: the point where her surface crosses the ray from IM in the
   * bisection plane of the shank and the foot course, toward the bend's inner
   * side (the talus' front under the extensor tendons), its distance `J`
   * along that ray times `cos(theta / 2)`, theta the turn from the tibia's
   * distal axis to the foot's course: the value the leg's course stretches
   * back by `1 / cos(theta / 2)` onto its own bisection plane
   * (`AutoMovieHumanLegCourse.bisection`, Thalmann et al. 1996).
   */
  export function ankleAnterior(juncture: V3, tibia: IFrame, footFrame: IFrame): number {
    const ray: V3 = unit(sub(footFrame.distal, tibia.distal));
    const theta: number = Math.acos(Math.max(-1, Math.min(1, dot(tibia.distal, footFrame.distal))));
    return dot(sub(juncture, footFrame.zero), ray) * Math.cos(theta / 2);
  }

  /** The unit ray of the front-ankle juncture from IM: the bisection plane's direction toward the bend's inner side. */
  export function junctureRay(tibia: IFrame, footFrame: IFrame): V3 {
    return unit(sub(footFrame.distal, tibia.distal));
  }
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function unit(a: V3): V3 {
  const n: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / n, a[1] / n, a[2] / n];
}
