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
 * @evidence contracts/common.md#principled-implementation The vertex passes through poseHumanFaceSurface with only its own rows, so the point equals the whole-surface pose.
 * @evidence contracts/common.md#clear-and-simple-design One owner for posing single vertices, shared by the aperture and closure measures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No approximate skinning; an owner without motion refuses in poseHumanFaceSurface.
 * @evidence contracts/common.md#meaningful-documentation States the equivalence with the whole-surface pose, the unattached case and the affine property.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres in the Y-up head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The posed surfaces are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input.
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
