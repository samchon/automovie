import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import type { IHumanFaceContactBounds } from "./IHumanFaceContactBounds";

/**
 * One compiled rest or performed contact sheet and its pruning bounds.
 * The engine query owns nearest features, signed distance and open-sheet rims.
 *
 * @evidence contracts/common.md#principled-implementation The original collider, witness or affine-floor values are carried without changing the signed query, movement budget or staged commit.
 * @evidence contracts/common.md#clear-and-simple-design One named record owns this contact-query role and its actual consumer reuses that identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation Members state the existing quantity, unit and source or state ownership.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres and unit directions retain the contact owner's frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing query data and creates no independent part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Retains derived contact data without defining a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing contact and collider owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing contact configuration owner retains all bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Preserves existing derived numerical context without introducing authoring values or a conversion.
 * @author Samchon
 */
export interface IHumanFaceContactGeometry extends IHumanFaceContactBounds {
  /** Signed query compiled from this state's actual collider coordinates. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
}
