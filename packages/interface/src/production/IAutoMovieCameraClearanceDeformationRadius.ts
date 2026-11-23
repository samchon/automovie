import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Model-rest bounds used to derive a pose-independent camera-clearance radius. */
export namespace IAutoMovieCameraClearanceDeformationRadius {
  /**
   * Borrowed axis-aligned rest-pose box in model-space metres, before node
   * placement or scale.
   *
   * `extent` is the model's rest-pose box from {@link computeModelRestExtent}. A
   * rest point `p` bound at a joint whose root-to-joint chain length is `c`
   * lies at most `|p| + c` from that joint; after any joint rotations the joint
   * stays within `c` of the root, so the posed point stays within `|p| + 2c` of
   * the origin. Non-negative normalized skin weights blend such bounded
   * positions convexly, so the same radius holds skinned vertices as well as
   * parts rigidly attached to a bone. `c` is the longest chain that reaches a
   * bone some part rides or some skin influences; bone rest scale is ignored
   * because neither engine forward kinematics nor the viewer applies it. A
   * model with no skeleton answers the farthest rest corner alone.
   *
   * The caller must have validated the model with `validateModel`, which
   * guarantees closed parent links, finite rest translations and skin joint
   * names that exist. Throws an `Error` naming the rig or model when an
   * otherwise finite chain or radius overflows to infinity. External bytes and
   * renderer-only deformation are outside the resulting radius. The clearance
   * compiler supplies a non-null rest extent; this shape does not encode an
   * empty model.
   */
  export type IExtent = {
    /**
     * Component-wise lower rest-geometry corner in model-space metres; read
     * without mutation.
     */
    min: IAutoMovieVector3;

    /**
     * Component-wise upper rest-geometry corner in model-space metres; each
     * component is at least the corresponding minimum.
     */
    max: IAutoMovieVector3;
  };
}
