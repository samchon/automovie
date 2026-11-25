import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanShoulderJoint,
} from "@automovie/interface";

/**
 * Campbell et al. 2009's male-population generic GH offset [12,-49,6] mm,
 * transferred from their measured AcrLR/triad to an explicitly authored
 * acromion and frontal projection of the shoulder chord. The AP long bar
 * and projected frontal short bar approximate the measured marker frame.
 * Public bideltoid is deliberately absent from this placement law.
 */
export namespace AutoMovieHumanShoulderJoint {
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
  export function of(
    acromion: readonly number[],
    neck: readonly number[],
    scale: number,
    side: 1 | -1 = 1,
  ): IAutoMovieHumanShoulderJoint.IPlacement {
    if (
      acromion.length !== 3 ||
      neck.length !== 3 ||
      ![...acromion, ...neck, scale].every(Number.isFinite) ||
      !(scale > 0)
    )
      throw new Error(
        "Shoulder generic transfer needs finite points and positive calibration scale",
      );
    const a: AutoMovieVector3Tuple = [
      acromion[0]!,
      acromion[1]!,
      -side * acromion[2]!,
    ];
    const n: AutoMovieVector3Tuple = [neck[0]!, neck[1]!, -side * neck[2]!];
    const dy: number = a[1] - n[1];
    const dz: number = a[2] - n[2];
    const length: number = Math.hypot(dy, dz);
    if (!(dz < 0) || !(length > 0))
      throw new Error(
        "Shoulder frontal chord must point outward from the internal neck overlap",
      );
    const x: AutoMovieVector3Tuple = [1, 0, 0];
    const y: AutoMovieVector3Tuple = [0, -dz / length, dy / length];
    const z: AutoMovieVector3Tuple = [0, -y[2], y[1]];
    const right: AutoMovieVector3Tuple = a.map(
      (value: number, c: number): number =>
        value + scale * (12 * x[c]! - 49 * y[c]! + 6 * z[c]!),
    ) as AutoMovieVector3Tuple;
    const centre: AutoMovieVector3Tuple = [
      right[0],
      right[1],
      -side * right[2],
    ];
    return { centre, axes: [x, y, z], projection: acromion[1]! - centre[1] };
  }
}
