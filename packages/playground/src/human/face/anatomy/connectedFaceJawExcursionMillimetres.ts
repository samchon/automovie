/**
 * Convert a supported mandibular protrusion or lateral-excursion weight into millimetres at the incisal frame. The source's forward Z translation is the protrusive component; the magnitude of head X is the left/right lateral component. Its simultaneous vertical/forward components remain in the same rigid motion when the edited millimetres lower to the original weight. A study of young adults with ideal occlusion measured mean maximum protrusion of 8.44 mm and lateral excursion of 7.54 mm (https://pmc.ncbi.nlm.nih.gov/articles/PMC5432089/). Szentpetery's 600-person study found substantial age and sex variation and warned against one universal normal cutoff (https://www.jofph.com/articles/10.11607/jofph.7206). Endpoint distances are read from the caller-selected basis rather than fixed to one published basis; they are source-authored supported displacements, not population limits or a measured individual trajectory. This display conversion adds no free XYZ authoring.
 *
 * @evidence contracts/common.md#principled-implementation Protrusion uses the source forward-Z component and laterotrusion the magnitude of source head-X, with metre-to-millimetre conversion and positive finite matched-distance admission; unmatched metadata returns null.
 * @evidence contracts/common.md#clear-and-simple-design One channel metadata conversion serves display while authored weight preserves the full coupled rigid translation and the Human owner builds its motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source components are not universal normal cutoffs or personal trajectories, and absent supported motion receives no fabricated distance or free XYZ coordinate.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies coordinate components, units, retained coupled motion and the difference between cited population values and source-authored endpoints.
 * @evidence contracts/performance.md#efficient-algorithms At most three named channel comparisons and one scalar component conversion cost constant time and storage independent of mesh or document size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous immutable metadata lookup has no numerical request cache or shared asynchronous work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar distance or null escapes without retaining source arrays or acquiring any worker or GPU handle.
 */
export function connectedFaceJawExcursionMillimetres(
  basis: {
    /** Optional selected-source rigid articulation; absent metadata has no distance conversion. */
    articulation?: {
      /** Named mandibular translation endpoints in the source head frame. */
      jaw: {
        /** Forward excursion, whose positive Z component supplies millimetres at unit weight. */
        protrusion: {
          /** Exact source protrusion channel identity. */
          channel: string;

          /** Coupled X/Y/Z displacement in metres; conversion reads Z without changing the other components. */
          translation: readonly [number, number, number];
        };

        /** Side excursions, whose absolute X component supplies millimetres at unit weight. */
        laterotrusion: {
          /** Source's left excursion endpoint. */
          left: {
            /** Exact source left-excursion channel identity. */
            channel: string;

            /** Coupled X/Y/Z displacement in metres; conversion reads absolute X. */
            translation: readonly [number, number, number];
          };

          /** Source's right excursion endpoint. */
          right: {
            /** Exact source right-excursion channel identity. */
            channel: string;

            /** Coupled X/Y/Z displacement in metres; conversion reads absolute X. */
            translation: readonly [number, number, number];
          };
        };
      };
    };
  },
  channel: string,
): number | null {
  const jaw: NonNullable<(typeof basis)["articulation"]>["jaw"] | undefined = basis.articulation?.jaw;
  if (jaw === undefined) return null;
  const metres: number | null =
    jaw.protrusion.channel === channel
      ? jaw.protrusion.translation[2]
      : jaw.laterotrusion.left.channel === channel
        ? Math.abs(jaw.laterotrusion.left.translation[0])
        : jaw.laterotrusion.right.channel === channel
          ? Math.abs(jaw.laterotrusion.right.translation[0])
          : null;
  if (metres === null) return null;
  if (!Number.isFinite(metres) || metres <= 0)
    throw new Error("A mandibular excursion needs a positive named distance.");
  return metres * 1000;
}
