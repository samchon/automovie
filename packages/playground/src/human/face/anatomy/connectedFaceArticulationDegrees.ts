/**
 * Read the physical rotation represented by one unit of a selected basis's mandibular or ocular performance channel. This is a unit conversion for the fine editor: the saved document still stores its basis weight, while a human reads and enters degrees. Kim et al. measured ocular duction ranges in 261 healthy people aged 5–91 by a modified limbus test (https://pmc.ncbi.nlm.nih.gov/articles/PMC6707237/); this function instead reads the caller-selected source endpoint and does not substitute that population's observed range. Demer and Clark found gaze-dependent translation and a varying rotation centre (https://pubmed.ncbi.nlm.nih.gov/31239125/), so displaying source degrees does not certify its fitted trajectory. The jaw similarly couples its authored angular endpoint to translation; Lindauer et al. observed both components (https://pubmed.ncbi.nlm.nih.gov/7771361/) but this conversion does not extend that observation to the whole path.
 *
 * @evidence contracts/common.md#principled-implementation The selected source channel supplies signed nonzero degrees per authored endpoint weight; absent articulation or an unmatched channel has no conversion, while a matched nonfinite or zero angle refuses division into an invalid unit.
 * @evidence contracts/common.md#clear-and-simple-design One metadata reader supplies the fine editor's display conversion without changing canonical weights or implementing ocular/jaw trajectories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source endpoint angles are not extended to population or personal capacity, and missing articulation receives no guessed conversion.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies saved weights versus displayed degrees and distinguishes source endpoint conversion from cited observed ranges and full trajectories.
 * @evidence contracts/performance.md#efficient-algorithms A jaw match uses constant work; otherwise flattening g gaze records and finding one channel costs O(g) time and temporary references. The supported metadata is a small eye/gaze list rather than mesh vertices.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous metadata read coordinates no repeated numerical result cache; the control owner decides construction frequency for its immutable basis.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a scalar conversion escapes and temporary gaze references acquire no native or rendering handle.
 */
export function connectedFaceArticulationDegrees(
  basis: {
    /** Optional selected-source rigid articulation metadata; omission leaves every channel unconverted. */
    articulation?: {
      /** Mandibular opening endpoint, resolved before ocular channels. */
      jaw: {
        /** Source opening channel and signed endpoint angle. */
        opening: {
          /** Exact source channel identity. */
          channel: string;

          /** Signed degrees at unit weight; a matched zero or nonfinite value refuses. */
          degrees: number;
        };
      };

      /** Ordered source eyes; the first matching gaze channel supplies its conversion. */
      eyes: {
        /** Source gaze endpoints, without an inferred population range. */
        gaze: {
          /** Exact source channel identity. */
          channel: string;

          /** Signed degrees at unit weight; a matched zero or nonfinite value refuses. */
          degrees: number;
        }[];
      }[];
    };
  },
  channel: string,
): number | null {
  const articulation: (typeof basis)["articulation"] = basis.articulation;
  if (articulation === undefined) return null;
  const degrees: number | undefined =
    articulation.jaw.opening.channel === channel
      ? articulation.jaw.opening.degrees
      : articulation.eyes
          .flatMap(
            (
              eye: NonNullable<(typeof basis)["articulation"]>["eyes"][number],
            ): NonNullable<
              (typeof basis)["articulation"]
            >["eyes"][number]["gaze"] => eye.gaze,
          )
          .find(
            (
              gaze: NonNullable<
                (typeof basis)["articulation"]
              >["eyes"][number]["gaze"][number],
            ): boolean => gaze.channel === channel,
          )?.degrees;
  if (degrees === undefined) return null;
  if (!Number.isFinite(degrees) || degrees === 0)
    throw new Error("An articulated facial channel needs a nonzero angle.");
  return degrees;
}
