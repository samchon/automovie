import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanPersonFaceRest } from "./IAutoMovieHumanPersonFaceRest";

/**
 * What forming a one-skin person's posed skin reads from one evaluation: the
 * face producer's skin, the head carry, the body's rest of the shared and
 * band vertices, its bones and its posed skin.
 *
 * @evidence contracts/common.md#principled-implementation Exactly the per-document values the forming step reads, each produced by its own owner.
 * @evidence contracts/common.md#clear-and-simple-design Five fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The body's rest and posing are the body builder's own, never recomputed.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#spatial-conventions Metres; the shift is the head carry's rest-frame translation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The frame defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The frame carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The frame emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The forming step owns the boundary rule.
 * @evidenceExclude contracts/modeling.md#rendered-observation The frame is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The frame carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The frame admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The frame converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinFrame {
  /** The face producer's evaluated skin of the face view, by skin vertex. */
  faceRest: IAutoMovieHumanPersonFaceRest;

  /** The head carry's rest-frame translation, XYZ metres. */
  shift: readonly number[];

  /** The body's shaped rest of the plan's rest rows, three numbers per row. */
  bodyRest: readonly number[];

  /** The body's bones by bone. */
  bones: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBuild["bones"][number]>;

  /** The body builder's posed skin positions. */
  bodyPosed: readonly number[];
}
