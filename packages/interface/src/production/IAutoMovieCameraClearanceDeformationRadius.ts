import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Model-rest bounds used to derive a pose-independent camera-clearance radius. */
export namespace IAutoMovieCameraClearanceDeformationRadius {
  /**
   * Borrowed axis-aligned rest-pose box in model-space metres, before node placement or scale.
   * 
   * `extent` is the model's rest-pose box from {@link computeModelRestExtent}. A rest point `p` bound at a joint whose root-to-joint chain length is `c` lies at most `|p| + c` from that joint; after any joint rotations the joint stays within `c` of the root, so the posed point stays within `|p| + 2c` of the origin. Non-negative normalized skin weights blend such bounded positions convexly, so the same radius holds skinned vertices as well as parts rigidly attached to a bone. `c` is the longest chain that reaches a bone some part rides or some skin influences; bone rest scale is ignored because neither engine forward kinematics nor the viewer applies it. A model with no skeleton answers the farthest rest corner alone.
   * 
   * The caller must have validated the model with `validateModel`, which guarantees closed parent links, finite rest translations and skin joint names that exist. Throws an `Error` naming the rig or model when an otherwise finite chain or radius overflows to infinity.
   * External bytes and renderer-only deformation are outside the resulting radius. The clearance compiler supplies a non-null rest extent; this shape does not encode an empty model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents model-space corners, borrowing, rest-geometry scope, validation premises and overflow refusal.
   * @evidence contracts/development/design.md#principled-representation Two metre-valued corners bound rest geometry; ordered finite coordinates and agreement with the validated model are caller premises, not enforced by the structural type.
   * @evidence contracts/development/design.md#minimal-and-owned-surface cameraClearanceDeformationRadius reads only these corners while the model separately supplies the rig; no camera-space or runtime renderer data enters the contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The box measures supplied geometry and is not itself a deformation proof; the engine adds twice the influenced rig-chain reach to its farthest origin distance.
   */
  export type IExtent = {
    /** Component-wise lower rest-geometry corner in model-space metres; read without mutation. */
    min: IAutoMovieVector3;

    /** Component-wise upper rest-geometry corner in model-space metres; each component is at least the corresponding minimum. */
    max: IAutoMovieVector3;
  };
}
