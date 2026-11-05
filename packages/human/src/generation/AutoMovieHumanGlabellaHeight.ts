import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";

/**
 * The glabella's height above the nasion on the midline profile, the
 * profile's knot above the nose's root, replacing the head prior's
 * `profile.glabella` read on the references.
 *
 * Source: Legan H.L. and Burstone C.J., "Soft tissue cephalometric analysis
 * for orthognathic surgery", J Oral Surg 38:744-751 (1980), as Celebi et al.
 * 2013 quote it (Sci World J 2013:806203, CC BY; `docs/sources/celebi-2013-legan-burstone-norms.md`):
 * the vertical height ratio of glabella to subnasale over subnasale to soft
 * menton is 1 in European-American adults (1.1 and 1.0, SD 0.1, in Turkish men
 * and women). Derivation: with the upper face (glabella to subnasale) equal to
 * the lower face (subnasale to menton), the glabella stands above the
 * subnasale by the lower face, and the nasion above it by the nasal height
 * (n-sn), so the glabella stands above the nasion by the lower face less the
 * nasal height, `(n-gn - n-sn) - n-sn`, the person's face height and nasal
 * height (FaceBase Euclidean distances). At the 3D Facial Norms' adult means
 * (Weinberg et al. 2016: n-gn 118.6 and 127.2, n-sn 54.7 and 56.6 mm, women
 * and men) this gives 9.2 and 14.0 mm, 0.08 and 0.11 of the face height,
 * beside 0.08 to 0.17 on the references the old prior read.
 *
 * Limits: the cephalometric ratio is of vertical projections, the inputs are
 * Euclidean distances, and gnathion stands for the soft menton, a few
 * millimetres apart; a face whose nose is longer than half its height gets no
 * glabella rise (held at zero) rather than a glabella under the nasion.
 */
export namespace AutoMovieHumanGlabellaHeight {
  /** Legan and Burstone's vertical height ratio, glabella to subnasale over subnasale to soft menton. */
  export const UPPER_OVER_LOWER: number = 1;

  /**
   * The glabella's height above the nasion.
   *
   * @param head The person's resolved head measures.
   * @returns Height, mm, zero or more.
   */
  export function of(head: IAutoMovieHumanHeadIdentity): number {
    const nasal: number = head.face.nose.height;
    const lower: number = head.faceHeight - nasal;
    return Math.max(0, UPPER_OVER_LOWER * lower - nasal);
  }
}
