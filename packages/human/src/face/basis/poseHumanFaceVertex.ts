import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceSurfaceAttachment as IAutoMovieHumanFaceSurfaceAttachmentImported } from "../../index";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";

/**
 * Pose one resident vertex of a basis surface from a given rest position by
 * the surface's attachments, exactly as the whole-surface pose moves it.
 *
 * Only the attachment rows naming this vertex apply, through the same
 * blended rigid motion `poseHumanFaceSurface` uses, so a measure that needs a
 * few posed points runs before the surfaces are posed. A vertex without
 * attachment rows keeps its rest position. Blended rigid posing is affine in
 * the rest position, which the closure ratio relies on.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation A selected vertex's sparse owner weights are remapped to vertex zero and passed to the same affine attachment blend as whole-surface posing. Closure callers supply the same admitted attachments and model-metre motions; this performs no second endpoint evaluation.
 * @evidence contracts/common.md#clear-and-simple-design This accessor adapts one point to poseHumanFaceSurface rather than maintaining a second rigid-motion formula; an unattached point becomes a fresh vector directly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing motion retains the shared owner's refusal and no weight is guessed or clamped. A valid resident vertex and admitted sparse rows remain caller premises, not independent anatomy or collision guarantees.
 * @evidence contracts/common.md#meaningful-documentation The accessor consumes a rest-space point and returns its performed model-metre vector, preserving the caller's source arrays and shared attachment semantics.
 * @evidence contracts/performance.md#efficient-algorithms Each call scans A attachment row entries to find this vertex and poses one remapped point; repeated margin callers therefore still pay their actual A-per-point cost. Temporary support follows the matching owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Whole-surface posing owns the blend formula; this one-point request reuses no result across different points or motions and mutates no source attachment row.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Remapped rows and the one-point buffer are invocation-local; only the fresh vector transfers to the caller, with no retained cache or external handle.
 */
export function poseHumanFaceVertex(
  surface: IAutoMovieHumanFaceBasisSurface,
  vertex: number,
  local: readonly number[],
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): IAutoMovieVector3 {
  const rows: { owner: string; rows: number[] }[] = (
    surface.attachments ?? []
  ).flatMap(
    (
      attachment: IAutoMovieHumanFaceSurfaceAttachmentImported,
    ): { owner: string; rows: number[] }[] => {
      for (let i: number = 0; i < attachment.rows.length; i += 2)
        if (attachment.rows[i] === vertex)
          return [
            { owner: attachment.owner, rows: [0, attachment.rows[i + 1]] },
          ];
      return [];
    },
  );
  const posed: readonly number[] =
    rows.length === 0 ? local : poseHumanFaceSurface(local, rows, motions);
  return Vector3.create(posed[0], posed[1], posed[2]);
}
