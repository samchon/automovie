import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairGather } from "../../structures/IAutoMovieHumanFaceHairGather";

/**
 * Convert named angular tie styling to the established scalp gathering fields.
 * Optional tail spread must be supplied as a complete pair. The enclosing hair
 * admission checks numerical limits and requires fully integrated gathered
 * populations; this adapter neither changes guide policy nor finds the ray hit.
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
