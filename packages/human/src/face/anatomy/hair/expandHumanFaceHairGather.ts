import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairGather } from "../../structures/IAutoMovieHumanFaceHairGather";

/**
 * Convert named angular tie styling to the established scalp gathering fields. Optional tail spread must be supplied as a complete pair. The enclosing hair admission checks numerical limits and requires fully integrated gathered populations; this adapter neither changes guide policy nor finds the ray hit.
 *
 * @evidence contracts/common.md#principled-implementation Named angular and metric tie traits convert into the existing scalp gather fields.
 * @evidence contracts/common.md#clear-and-simple-design The adapter maps head-axis choices and units before existing hair admission and anchor resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partial spread pairs refuse; the adapter neither changes guide policy nor invents a ray hit or population.
 * @evidence contracts/common.md#meaningful-documentation Degrees become radians and millimetres become metres exactly once.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalar conversions and one closed-direction choice take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Scalp expansion and sparse trait edits share this gather conversion owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The output is an owned small record and caller named traits remain unchanged.
 */
export function expandHumanFaceHairGather(
  input: IAutoMovieHumanFaceHairGather,
): NonNullable<IAutoMovieHumanFaceHair.Layer["gather"]> {
  if (
    (input.spreadRadiusMm === undefined) !==
    (input.spreadReachMm === undefined)
  )
    throw new Error("Named hair tail spread requires both radius and reach.");
  const direction: [number, number, number] =
    input.tailDirection === "back"
      ? [0, 0, -1]
      : input.tailDirection === "front"
        ? [0, 0, 1]
        : input.tailDirection === "left"
          ? [1, 0, 0]
          : input.tailDirection === "right"
            ? [-1, 0, 0]
            : [0, -1, 0];
  return {
    anchor: {
      polar: (input.polarDegrees * Math.PI) / 180,
      azimuth: (input.azimuthDegrees * Math.PI) / 180,
    },
    radius: input.radiusMm / 1000,
    strength: input.strength,
    tail: {
      direction,
      spread:
        input.spreadRadiusMm === undefined
          ? undefined
          : {
              radius: input.spreadRadiusMm / 1000,
              reach: input.spreadReachMm! / 1000,
            },
    },
  };
}
