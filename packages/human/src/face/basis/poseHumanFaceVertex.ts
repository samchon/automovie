import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

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
 */
export function poseHumanFaceVertex(
  surface: IAutoMovieHumanFaceBasisSurface,
  vertex: number,
  local: readonly number[],
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): IAutoMovieVector3 {
  const rows = (surface.attachments ?? []).flatMap((attachment) => {
    for (let i = 0; i < attachment.rows.length; i += 2)
      if (attachment.rows[i] === vertex)
        return [{ owner: attachment.owner, rows: [0, attachment.rows[i + 1]] }];
    return [];
  });
  const posed =
    rows.length === 0 ? local : poseHumanFaceSurface(local, rows, motions);
  return Vector3.create(posed[0], posed[1], posed[2]);
}
