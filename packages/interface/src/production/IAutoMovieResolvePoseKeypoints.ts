import type { IAutoMovieDeliveryCrop } from "../cinematics/IAutoMovieDeliveryCrop";
import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieCamera } from "../scene/IAutoMovieCamera";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/** Pose, world placement and lens inputs for normalized joint projection. */
export namespace IAutoMovieResolvePoseKeypoints {
  /**
   * Project one posed actor's joints to normalized 2D frame keypoints, the
   * OpenPose-style conditioning automovie can emit exactly because it knows
   * every bone's 3D position.
   *
   * Forward kinematics resolves the pose in rig space, the actor's staged node
   * transform lifts each joint into scene world with the renderer's TRS order,
   * and the live camera, sampled at `time`, projects it through an optional
   * delivery crop. `x` grows rightward and `y` downward from the frame's
   * top-left corner, both in `[0, 1]` inside the frame. A joint behind the
   * camera, outside the clip range or outside the frame is still projected,
   * never clamped, because a clamped point reads as a false edge keypoint, and
   * is flagged `inFrame: false`. A requested joint the rig does not have yields
   * no keypoint. The order follows joints. FK uses default engine joint axes
   * and rest frames; coincidence with a renderer requires those same
   * conventions, and these numerical outputs establish no observed rendered
   * pixels.
   */
  export type IProps = {
    /** The actor's pose at this instant. */
    pose: IAutoMoviePose;

    /** The actor's skeleton. */
    skeleton: IAutoMovieSkeleton;

    /** The actor's staged scene-node placement, in world space. */
    node: IPropsNode;

    /** The live camera. */
    camera: IAutoMovieCamera;

    /** The camera's move; omit or pass `null` for a static camera. */
    cameraMotion?: IAutoMovieShot["cameraMotion"];

    /**
     * Shot-local camera sample seconds, default zero. This does not resample
     * pose; the caller must supply the actor pose for the same instant. A
     * moving camera delegates time admission to sampleClip; a static camera
     * does not read this value.
     */
    time?: number;

    /**
     * Positive width/height ratio before delivery crop, default 16/9.
     * Finiteness and positivity are caller premises; this function does not
     * independently validate the ratio.
     */
    aspect?: number;

    /**
     * Optional normalized delivery crop; omitted projects the full raster.
     * projectToNdc applies the crop after lens projection and delegates crop
     * admission to deliveryCropNdc.
     */
    crop?: IAutoMovieDeliveryCrop;

    /**
     * Requested joint order, with duplicates preserved. Omitted uses
     * AutoMovieEngineDefaultKeypointBones; an empty list emits none and absent rig bones are
     * skipped.
     */
    joints?: readonly AutoMovieHumanoidBone[];
  };

  /** The node object of {@link IProps}. */
  export type IPropsNode = {
    /**
     * Borrowed actor model-to-world TRS; translation is metres, scale is
     * dimensionless and rotation uses the scene quaternion convention.
     */
    transform: IAutoMovieTransform;
  };
}
