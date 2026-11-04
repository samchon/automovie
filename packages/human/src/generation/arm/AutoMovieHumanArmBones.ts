/**
 * The arm's bony landmarks and joint centres, placed from the glenohumeral
 * centre and the public lengths at their published definitions before any
 * skin exists, in the left frame (calibration millimetres).
 *
 * ANSUR II measures acromion-radiale (`upperArmLength`) and radiale-stylion
 * (`lowerArmLength`) with the arm hanging, each with a beam caliper parallel
 * to its segment's long axis. De Leva 1996 Table 2 places the joint centres
 * from those landmarks along the segment axis: the shoulder centre 33.7 (F) /
 * 34.5 (M) mm distal of the acromion and the elbow centre 13.9 / 14.3 mm
 * proximal of radiale, both read off acromion-radiale with the arm adducted,
 * whose Table 4 lengths are 322.7 and 330.5 mm; the wrist centre 1.5 mm distal
 * of stylion. As shares of the adducted acromion-radiale both sexes agree,
 * 0.1044 and 0.0432 (33.7 / 322.7 = 0.10443, 34.5 / 330.5 = 0.10439; 13.9 /
 * 322.7 = 0.04307, 14.3 / 330.5 = 0.04327), so one proportional rule holds for
 * every person and scales to children as de Leva's offsets scale with segment
 * length (`docs/anatomy/skeleton.md`).
 *
 * In the hanging arm acromion, shoulder centre, elbow centre and radiale are
 * collinear, so the humerus' joint-centre length is acromion-radiale less
 * both shares, `0.8524 AR`; a bone's length does not change with posture, so
 * the bind's A-pose keeps it. Radiale belongs to the radius and turns with the
 * forearm: it stands `0.0432 AR` past the elbow centre along the forearm, and
 * stylion radiale-stylion past radiale along it.
 */
export namespace AutoMovieHumanArmBones {
  /** One side's arm landmarks, left frame. */
  export interface IBones {
    /** Glenohumeral centre. */
    shoulder: Vec3;

    /** Elbow centre. */
    elbow: Vec3;

    /** Radiale, the radial head's upper edge, on the forearm's axis. */
    radiale: Vec3;

    /** Stylion, the radial styloid's tip, on the forearm's axis. */
    stylion: Vec3;

    /** Wrist centre, {@link STYLION_WRIST} past stylion. */
    wrist: Vec3;

    /** Unit direction of the humerus, shoulder to elbow. */
    upper: Vec3;

    /** Unit direction of the forearm, elbow to wrist. */
    lower: Vec3;

    /** Shoulder to elbow centre, mm. */
    humerus: number;

    /** Elbow centre to wrist centre, mm. */
    forearm: number;

    /** Acromion-radiale length the bones were placed for, mm. */
    acromionRadiale: number;
  }

  /**
   * The landmarks from the shoulder centre, the bind's bone directions and
   * the two lengths.
   *
   * @param shoulder Glenohumeral centre, left frame.
   * @param upper Unit direction of the humerus in the bind.
   * @param lower Unit direction of the forearm in the bind.
   * @param acromionRadiale Acromion-radiale length, mm.
   * @param radialeStylion Radiale-stylion length, mm.
   */
  export function place(
    shoulder: Vec3,
    upper: Vec3,
    lower: Vec3,
    acromionRadiale: number,
    radialeStylion: number,
  ): IBones {
    if (!(acromionRadiale > 0) || !(radialeStylion > 0))
      throw new Error("An arm needs positive acromion-radiale and radiale-stylion lengths");
    const humerus: number = (1 - ACROMION - RADIALE) * acromionRadiale;
    const elbow: Vec3 = plus(shoulder, scale(upper, humerus));
    const radiale: Vec3 = plus(elbow, scale(lower, RADIALE * acromionRadiale));
    const stylion: Vec3 = plus(radiale, scale(lower, radialeStylion));
    const wrist: Vec3 = plus(stylion, scale(lower, STYLION_WRIST));
    return {
      shoulder,
      elbow,
      radiale,
      stylion,
      wrist,
      upper,
      lower,
      humerus,
      forearm: RADIALE * acromionRadiale + radialeStylion + STYLION_WRIST,
      acromionRadiale,
    };
  }

  /**
   * The shoulder centre's distance below the acromion as a share of
   * acromion-radiale (de Leva 1996 Table 2 over Table 4's adducted length).
   */
  export const ACROMION: number = 0.1044;

  /** The elbow centre's distance proximal of radiale, same basis. */
  export const RADIALE: number = 0.0432;

  /** The wrist centre past stylion, mm (de Leva 1996 Table 2). */
  export const STYLION_WRIST: number = 1.5;
}

/** A point or direction. */
type Vec3 = [number, number, number];

function plus(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
