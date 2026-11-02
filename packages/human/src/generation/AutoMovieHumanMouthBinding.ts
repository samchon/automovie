import type { IAutoMovieMeshSkin } from "@automovie/interface";

import type { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";

/**
 * Attachment of the generated oral lining around the tongue's base. Its
 * posterior section transfers from the molar station toward the moving
 * tongue base; the oropharyngeal ring and closing pole share the jaw binding.
 * The entrance keeps the skin's own weights, including every copied rim point.
 */
export namespace AutoMovieHumanMouthBinding {
  /**
   * Carry the posterior lining with the tongue while preserving its entrance.
   *
   * @param mouth Oral landmarks in calibration millimetres.
   * @param positions Lining vertices in model metres.
   * @param scale Model metres per calibration millimetre.
   * @param skin The ordinary place-based binding at those same vertices.
   * @returns The binding with a smooth molar-to-oropharynx transfer to the jaw.
   */
  export function lining(
    mouth: AutoMovieHumanMouth.IMouth,
    positions: readonly number[],
    scale: number,
    skin: IAutoMovieMeshSkin,
  ): IAutoMovieMeshSkin {
    const jaw: number = skin.joints.indexOf("jaw");
    if (jaw < 0) throw new Error("An oral lining needs the jaw in its skin joints");
    if (!(scale > 0) || !(mouth.molars.x > mouth.oropharynx.x))
      throw new Error("An oral lining needs an ordered molar-to-pharynx span");
    const boneIndices: number[] = [...skin.boneIndices];
    const weights: number[] = [...skin.weights];
    for (let v: number = 0; v < positions.length / 3; v++) {
      const u: number = Math.max(
        0,
        Math.min(
          1,
          (mouth.molars.x - positions[3 * v]! / scale) /
            (mouth.molars.x - mouth.oropharynx.x),
        ),
      );
      if (u === 0) continue;

      // A quintic transfer has zero first and second derivatives at both
      // attachments, so the transferred weights keep their endpoint jets.
      const share: number = u * u * u * (10 + u * (-15 + 6 * u));
      const byBone: Map<number, number> = new Map([[jaw, share]]);
      for (let k: number = 0; k < 4; k++) {
        const slot: number = 4 * v + k;
        const bone: number = skin.boneIndices[slot]!;
        const weight: number = (1 - share) * skin.weights[slot]!;
        if (weight > 0) byBone.set(bone, (byBone.get(bone) ?? 0) + weight);
      }
      const strongest: [number, number][] = [...byBone]
        .sort((a: [number, number], b: [number, number]): number =>
          b[1] - a[1] || a[0] - b[0],
        )
        .slice(0, 4);
      const total: number = strongest.reduce(
        (sum: number, entry: [number, number]): number => sum + entry[1],
        0,
      );
      for (let k: number = 0; k < 4; k++) {
        boneIndices[4 * v + k] = strongest[k]?.[0] ?? 0;
        weights[4 * v + k] = (strongest[k]?.[1] ?? 0) / total;
      }
    }
    return { ...skin, boneIndices, weights };
  }
}
