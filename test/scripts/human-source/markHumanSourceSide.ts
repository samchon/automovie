import type { IHumanSourceGenerationSkin } from "./structures/IHumanSourceGenerationSkin.ts";

/**
 * Flag the original skin vertices touched by a triangle of one partition
 * label (0 head, 1 body). Vertices inserted by the neck cut (index at or past
 * `originalVertices`) are never flagged.
 */
export function markHumanSourceSide(
  skin: IHumanSourceGenerationSkin,
  label: 0 | 1,
): Uint8Array {
  const n = skin.originalVertices;
  const side = new Uint8Array(n);
  skin.labels.forEach((own, t) => {
    if (own === label)
      for (let k = 0; k < 3; k++)
        if (skin.triangles[3 * t + k] < n) side[skin.triangles[3 * t + k]] = 1;
  });
  return side;
}
