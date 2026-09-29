/**
 * Read the physical rotation represented by one unit of a selected basis's
 * mandibular or ocular performance channel. This is a unit conversion for
 * the fine editor: the saved document still stores its basis weight, while a
 * human reads and enters degrees. Kim et al. measured ocular duction ranges
 * in 261 healthy people aged 5–91 by a modified limbus test
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC6707237/); the current CC0 basis
 * reaches only about 10–15 degrees per gaze endpoint, not that study's full
 * observed range. Demer and Clark found gaze-dependent translation and a
 * varying rotation centre (https://pubmed.ncbi.nlm.nih.gov/31239125/), so
 * displaying source degrees does not certify its fitted trajectory. The jaw
 * similarly couples its authored angular endpoint to translation; Lindauer
 * et al. observed both components (https://pubmed.ncbi.nlm.nih.gov/7771361/)
 * but this conversion does not extend that observation to the whole path.
 */
export function connectedFaceArticulationDegrees(
  basis: {
    articulation?: {
      jaw: { opening: { channel: string; degrees: number } };
      eyes: { gaze: { channel: string; degrees: number }[] }[];
    };
  },
  channel: string,
): number | null {
  const articulation = basis.articulation;
  if (articulation === undefined) return null;
  const degrees =
    articulation.jaw.opening.channel === channel
      ? articulation.jaw.opening.degrees
      : articulation.eyes
          .flatMap((eye) => eye.gaze)
          .find((gaze) => gaze.channel === channel)?.degrees;
  if (degrees === undefined) return null;
  if (!Number.isFinite(degrees) || degrees === 0)
    throw new Error("An articulated facial channel needs a nonzero angle.");
  return degrees;
}
