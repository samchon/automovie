import type {
  AutoMovieHumanoidBone,
  IAutoMovieAttachment,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMoviePoseResolution,
  IAutoMovieResolvedBone,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonPoseResolution,
  IAutoMovieSkeletonTopology,
  IAutoMovieTransform,
} from "@automovie/interface";

import { prepareSkeletonPoseResolution as prepareSkeletonPoseResolutionImplementation } from "./internal/prepareSkeletonPoseResolution";
import { resolveAttachment as resolveAttachmentImplementation } from "./internal/resolveAttachment";

/** Prepared skeleton-pose readers and rigid bone attachments. */
export namespace AutoMovieEngineSkeletonPose {
  /** A staged tuple value read while constructing a prepared rig. */
  export type ITupleRead = IAutoMovieSkeletonPoseResolution.ITupleRead;
  /** A reader that stages skeleton tuple values for fixed-rig preparation. */
  export type ITupleReader = IAutoMovieSkeletonPoseResolution.ITupleReader;
  /** Immutable prepared forward-kinematics readers for one skeleton. */
  export type IRig = IAutoMovieSkeletonPoseResolution.IRig;
  /** One source pose admitted by a prepared skeleton rig. */
  export type IReading = IAutoMovieSkeletonPoseResolution.IReading;
  /** A prepared rig view limited to a fixed set of requested bones. */
  export type IBoneDemand = IAutoMovieSkeletonPoseResolution.IBoneDemand;

  /** Prepare reusable forward-kinematics readers for one fixed skeleton. */
  export function prepareSkeletonPoseResolution(
    skeleton: IAutoMovieSkeleton,
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
    topology?: IAutoMovieSkeletonTopology,
  ): IRig {
    return prepareSkeletonPoseResolutionImplementation.run(
      skeleton,
      jointAxes,
      restFrames,
      topology,
    );
  }

  /** Admit a complete source pose against the prepared rig. */
  export function admitPreparedSkeletonPoseSource(
    rig: IRig,
    pose: IAutoMoviePose,
    operation?: IAutoMoviePoseResolution,
  ): boolean {
    return prepareSkeletonPoseResolutionImplementation.admitSource(
      rig,
      pose,
      operation,
    );
  }

  /** Return fresh rest-pose frames from a prepared rig. */
  export function preparedSkeletonRest(rig: IRig): IAutoMovieResolvedBone[] {
    return prepareSkeletonPoseResolutionImplementation.rest(rig);
  }

  /** Resolve a child transform rigidly coupled to a posed parent bone. */
  export function resolveAttachment(
    parentPose: IAutoMoviePose,
    parentSkeleton: IAutoMovieSkeleton,
    attachment: IAutoMovieAttachment,
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
    prepared?: IBoneDemand,
    resolution?: IAutoMoviePoseResolution,
  ): IAutoMovieTransform {
    return resolveAttachmentImplementation.run(
      parentPose,
      parentSkeleton,
      attachment,
      jointAxes,
      restFrames,
      prepared,
      resolution,
    );
  }
}
