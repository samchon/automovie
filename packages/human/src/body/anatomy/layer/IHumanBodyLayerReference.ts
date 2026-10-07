import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One oriented sheet that internal parts must stay inside.
 *
 * A reference is a skin surface or a face derived from one, such as the
 * fascial face under the subcutaneous layer. It may be open: a body's faces
 * are open at the collar, where the head's skin continues them.
 *
 * @evidence contracts/common.md#principled-implementation The reader is given the surface itself, so a derived face is judged by the same instrument as a skin.
 * @evidence contracts/common.md#clear-and-simple-design A name for the report and the mesh that is measured.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference is implied; a reading names every sheet it measured against.
 * @evidence contracts/common.md#meaningful-documentation States what a reference may be and why it may be open.
 * @evidence contracts/modeling.md#spatial-conventions The mesh is metres in the frame of the parts read against it, oriented outward.
 * @evidence contracts/modeling.md#shared-boundaries The sheet is the boundary the measured parts share with the layer outside them.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A reference defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A reference carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A reference is measured, not emitted.
 * @evidenceExclude contracts/modeling.md#rendered-observation A reference owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The surface's owner holds its anatomical grounds.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader's admission owner decides.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A reference is no authoring input.
 * @author Samchon
 */
export interface IHumanBodyLayerReference {
  /** Name the reading reports this sheet under. */
  name: string;

  /** Outward-oriented surface, possibly open. */
  mesh: IAutoMovieMesh;
}
