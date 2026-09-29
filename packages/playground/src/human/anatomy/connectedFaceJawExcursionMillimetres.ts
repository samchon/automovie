/**
 * Convert a supported mandibular protrusion or lateral-excursion weight into
 * millimetres at the incisal frame. The source's forward Z translation is the
 * protrusive component; the magnitude of head X is the left/right lateral
 * component. Its simultaneous vertical/forward components remain in the same
 * rigid motion when the edited millimetres lower to the original weight.
 * A study of young adults with ideal occlusion measured mean maximum
 * protrusion of 8.44 mm and lateral excursion of 7.54 mm
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC5432089/). Szentpetery's 600-person
 * study found substantial age and sex variation and warned against one
 * universal normal cutoff (https://www.jofph.com/articles/10.11607/jofph.7206).
 * The selected CC0 basis's 8.3 mm forward and 6.6 mm lateral endpoints are
 * source-authored supported displacements, not population limits or a measured
 * individual trajectory. This display conversion adds no free XYZ authoring.
 */
export function connectedFaceJawExcursionMillimetres(
  basis: {
    articulation?: {
      jaw: {
        protrusion: {
          channel: string;
          translation: readonly [number, number, number];
        };
        laterotrusion: {
          left: {
            channel: string;
            translation: readonly [number, number, number];
          };
          right: {
            channel: string;
            translation: readonly [number, number, number];
          };
        };
      };
    };
  },
  channel: string,
): number | null {
  const jaw = basis.articulation?.jaw;
  if (jaw === undefined) return null;
  const metres =
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
