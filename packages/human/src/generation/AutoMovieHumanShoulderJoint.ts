/** A calibration-mm point or a dimensionless frame direction. */
type Vec3 = [number, number, number];

/**
 * Campbell et al. 2009's male-population generic GH offset [12,-49,6] mm,
 * transferred from their measured AcrLR/triad to an explicitly authored
 * acromion and frontal shoulder chord. Neither input is their measured marker
 * frame: acromion AP is a retained skin prior and neck is an internal overlap.
 * The AP long bar and frontal short bar below are construction conventions.
 * Public bideltoid is deliberately absent from this placement law.
 */
export namespace AutoMovieHumanShoulderJoint {
  /** A right-handed canonical-right frame, reflected only after placement. */
  export interface IPlacement {
    /** Generated joint centre in the caller's sided calibration frame. */
    centre: Vec3;
    /** Canonical-right AP, superior and medial axes; not measured AcrCS. */
    axes: [Vec3, Vec3, Vec3];
    /** Acromion-to-GH projection along the straight downward measuring axis. */
    projection: number;
  }

  /**
   * Place the population/frame-transfer proxy once, without skin feedback.
   * Physical publication millimetres receive calibration scale exactly once.
   * The frontal chord must point outward and have nonzero length; malformed
   * frames are refused rather than replaced by a world-axis fallback.
   *
   * @param acromion Authored sided acromial point, calibration mm; not measured AcrLR.
   * @param neck Same side's internal neck-overlap support, calibration mm; not measured Acr2.
   * @param scale Calibration millimetres per physical publication millimetre.
   * @param side Left+1 or right-1; the canonical-right frame is built before reflecting the result.
   * @returns Generated centre, canonical-right axes and downward measuring projection; no skin input is read.
   */
  export function of(acromion: readonly number[], neck: readonly number[], scale: number, side: 1 | -1 = 1): IPlacement {
    if (acromion.length !== 3 || neck.length !== 3 || ![...acromion, ...neck, scale].every(Number.isFinite) || !(scale > 0))
      throw new Error("Shoulder generic transfer needs finite points and positive calibration scale");
    const a: Vec3 = [acromion[0]!, acromion[1]!, -side * acromion[2]!];
    const n: Vec3 = [neck[0]!, neck[1]!, -side * neck[2]!];
    const dy: number = a[1] - n[1];
    const dz: number = a[2] - n[2];
    const length: number = Math.hypot(dy, dz);
    if (!(dz < 0) || !(length > 0)) throw new Error("Shoulder frontal chord must point outward from the internal neck overlap");
    const x: Vec3 = [1, 0, 0];
    const y: Vec3 = [0, -dz / length, dy / length];
    const z: Vec3 = [0, -y[2], y[1]];
    const right: Vec3 = a.map((value: number, c: number): number => value + scale * (12 * x[c]! - 49 * y[c]! + 6 * z[c]!)) as Vec3;
    const centre: Vec3 = [right[0], right[1], -side * right[2]];
    return { centre, axes: [x, y, z], projection: acromion[1]! - centre[1] };
  }
}
