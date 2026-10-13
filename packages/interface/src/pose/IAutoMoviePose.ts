import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieJointPose } from "./IAutoMovieJointPose";

/**
 * A single static full-body pose: a snapshot of the skeleton's articulation at one instant.
 *
 * A pose is **sparse**: `joints` lists only the bones that move away from their rest pose. Every unlisted bone stays at rest. This keeps what the LLM emits small and legible (a wave is a handful of joints, not all 55) and is the structured-output unit that the engine validates against the target skeleton's ROM before anything renders.
 *
 * A pose is also the building block of motion: a {@link IAutoMovieKeyframe} is a pose plus a timestamp.
 *
 * @evidence contracts/common.md#principled-implementation Sparse joint overrides compose with the target skeleton's rest hierarchy; validatePose resolves each bone, refuses duplicate articulation and checks the effective range-of-motion constraint, while an optional root transform moves the whole body separately.
 * @evidence contracts/common.md#clear-and-simple-design Skeleton identity, optional root placement and sparse joint angles separate rig selection, whole-body movement and articulation, and the same record is reused by static staging and timed keyframes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unlisted bones stay at rest rather than inheriting an unrelated previous pose; duplicate bone entries are conflicts instead of last-writer precedence, and root movement uses the declared transform rather than a performer-name offset.
 * @evidence contracts/common.md#meaningful-documentation States sparse rest behavior, target-rig validation, parent-space root placement and null identity, plus the single-entry rule for each articulated bone.
 * @author Samchon
 */
export interface IAutoMoviePose {
  /**
   * Which skeleton this pose articulates. The engine validates each joint against this rig's bones and ROM constraints.
   */
  skeleton: string;

  /**
   * Root placement of the whole character in its parent space. `null` = leave the root where it is (identity). Use this to plant, translate, or turn the whole body; per-joint bending is `joints`.
   */
  root: IAutoMovieTransform | null;

  /**
   * The articulated joints. Sparse: only bones that leave their rest pose appear. Each {@link IAutoMovieJointPose.bone} should appear at most once; the engine treats duplicates as a conflict.
   */
  joints: IAutoMovieJointPose[];
}
