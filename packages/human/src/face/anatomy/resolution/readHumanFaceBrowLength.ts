import type { IAutoMovieHumanFacePeriocular as ImportedIAutoMovieHumanFacePeriocular, IAutoMovieHumanFacePeriocularComponent as ImportedIAutoMovieHumanFacePeriocularComponent } from "@automovie/human";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * The medial-to-lateral extent of one eyebrow on the build's final surface, in millimetres: the head-frame X extent of that side's posed brow card vertices, the frontal-projection length of the card that stands for the mature brow hair. A basis without the periocular registration returns its gap.
 *
 * @evidence contracts/common.md#principled-implementation Final registered card vertices' head-X extent supplies frontal projected brow length.
 * @evidence contracts/common.md#clear-and-simple-design This instrument reports the source envelope rather than individual mature shaft-path length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing registration/empty vertices give gaps and replaced source-card reads refuse instead of staying falsely current.
 * @evidence contracts/common.md#meaningful-documentation Head-metre X extent converts once to millimetres.
 * @evidence contracts/performance.md#efficient-algorithms Each registered brow vertex is read once followed by linear extrema reductions.
 * @evidence contracts/performance.md#reuse-equivalent-work The same context's actual current vertices supply both extrema without rest-geometry fallback.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary X array is per-call and only the scalar or gap escapes.
 *
 * @author Samchon
 */
export function readHumanFaceBrowLength(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
): number | IHumanFaceMeasurementGap {
  const periocular: ImportedIAutoMovieHumanFacePeriocular | undefined = context.basis.periocular;
  if (periocular === undefined)
    return {
      reason: "missing registration: the basis's periocular registration",
    };
  const brow: ImportedIAutoMovieHumanFacePeriocularComponent = periocular[side].brow;
  const xs: number[] = brow.vertices.map(
    (vertex: number): number => context.point(brow.surface, vertex).x,
  );
  if (xs.length === 0)
    return { reason: `missing registration: the ${side} brow has no vertices` };
  return (Math.max(...xs) - Math.min(...xs)) * 1000;
}
