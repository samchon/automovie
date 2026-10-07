import type { IAutoMovieHumanPersonBoneFrame } from "./IAutoMovieHumanPersonBoneFrame";
import type { IAutoMovieHumanPersonHeadAnchor } from "./IAutoMovieHumanPersonHeadAnchor";

/**
 * What the head transform is built from: the face frame's anchor in the
 * neutral and shaped bodies, and the head bone's shaped rest and posed frames.
 *
 * @evidence contracts/common.md#principled-implementation The shape carry needs the anchor's displacement and the pose needs the bone's change of frame; nothing else.
 * @evidence contracts/common.md#clear-and-simple-design Three named fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All values come from the body's evaluation.
 * @evidence contracts/common.md#meaningful-documentation States each field's role.
 * @evidence contracts/modeling.md#spatial-conventions Metres and world orientations in the shared frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The props are not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The props emit no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The props build no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The props carry no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The props admit nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props are derived.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadTransformProps {
  /** The face frame's anchor, neutral and shaped. */
  anchor: IAutoMovieHumanPersonHeadAnchor;

  /** The head bone's shaped rest frame. */
  rest: IAutoMovieHumanPersonBoneFrame;

  /** The head bone's posed frame. */
  posed: IAutoMovieHumanPersonBoneFrame;
}
