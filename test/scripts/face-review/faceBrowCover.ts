import type { IFaceLikenessMask } from "./faceLikenessMasks";

/**
 * How far a brow raise carries the brow, over the eyes' outer canthal
 * width: the basis's largest brow raise, 5.97 mm (`browOuterUp` on the
 * brow card at full weight), over the neutral face's outer canthal width,
 * 85.4 mm (twice the lateral canthus's 42.7 mm in the face-breadth frame).
 */
export const FACE_BROW_TRAVEL = 0.07;

/**
 * The upper contour of each brow in the detector's mesh, by the subject's
 * own side (the image's right is the subject's left).
 */
export const FACE_BROW_CONTOURS = {
  left: [300, 293, 334, 296, 336],
  right: [70, 63, 105, 66, 107],
} as const;

/**
 * How much of the band above each brow a photograph's hair covers.
 *
 * A brow raise is read from where the brow stands; where a fringe hangs
 * over the brow, the fringe's edge and a raised brow look alike, and the
 * detector reads the edge. Each upper-contour landmark is sampled at one to
 * four brow travels (`FACE_BROW_TRAVEL` of the outer canthal distance,
 * landmarks 33 and 263) above it: the first is where a raised brow's edge
 * would stand, the others the forehead above, which a fringe covers too,
 * since it falls from the hairline, while hair in the first band alone is
 * a thick brow itself. The result is each side's share of samples on hair
 * (a sample outside the mask is not hair). Pure.
 */
export function faceBrowCover(props: {
  hair: IFaceLikenessMask;
  landmarks: readonly (readonly number[])[];
  /** The image the landmarks are placed in, pixels. */
  width: number;
  height: number;
}): { left: number; right: number } {
  const { hair, landmarks } = props;
  const eye = [landmarks[33]!, landmarks[263]!];
  const reach = Math.hypot(
    eye[0]![0]! - eye[1]![0]!,
    eye[0]![1]! - eye[1]![1]!,
  );
  const share = (contour: readonly number[]) => {
    let covered = 0;
    let samples = 0;
    for (const index of contour)
      for (let k = 1; k <= 4; ++k) {
        const [x, y] = landmarks[index]!;
        const px = Math.floor((x! * hair.width) / props.width);
        const py = Math.floor(
          ((y! - k * FACE_BROW_TRAVEL * reach) * hair.height) / props.height,
        );
        ++samples;
        if (
          px >= 0 &&
          py >= 0 &&
          px < hair.width &&
          py < hair.height &&
          hair.data[py * hair.width + px] === 1
        )
          ++covered;
      }
    return covered / samples;
  };
  return {
    left: share(FACE_BROW_CONTOURS.left),
    right: share(FACE_BROW_CONTOURS.right),
  };
}

/**
 * The brow units a photograph cannot show: on a side where hair covers
 * more than half the band above the brow (`faceBrowCover`), that side's
 * outer raise and lowering, and the inner raise, which moves both brows
 * and is read from both, when either side is covered.
 */
export function faceBrowUnobservable(cover: {
  left: number;
  right: number;
}): string[] {
  const units: string[] = [];
  for (const side of ["left", "right"] as const)
    if (cover[side] > 0.5) {
      const Side = side === "left" ? "Left" : "Right";
      units.push(`browOuterUp${Side}`, `browDown${Side}`);
    }
  if (units.length > 0) units.push("browInnerUp");
  return units;
}
