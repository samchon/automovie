import type {
  IAutoMovieCompileAttach,
  IAutoMovieCoupleObjects,
  IAutoMovieEnginePerformShotGateContext,
  IAutoMovieScene,
} from "@automovie/interface";

import type { AutoMovieEngineSkeletonPose } from "../kinematics/AutoMovieEngineSkeletonPose";

/** Type-only props owned by the engine film's named operations. */
export namespace AutoMovieEngineFilmTypes {
  /** Staged inputs for framing one gated camera subject. */
  export type ICreatePerformShotSubjectFramerContext = Pick<
    IAutoMovieEnginePerformShotGateContext,
    "nodePositions" | "formationById" | "formationPoints" | "skeleton" | "targetAt"
  > & {
    /** The admitted node placements. */
    staged: { scene: Pick<IAutoMovieScene, "nodes"> };
  };

  /** Staged inputs for reading an already-gated target at shot opening. */
  export type IResolvedPerformShotPointContext = Pick<
    IAutoMovieEnginePerformShotGateContext,
    "targetAt" | "nodePositions" | "formationPoints"
  >;

  /** The attachment props with an optional prepared parent rig. */
  export interface ICompileAttachProps extends IAutoMovieCompileAttach.IProps {
    /**
     * Explicit immutable snapshot of this exact parent rig and clinical
     * mappings, kept unchanged throughout the bake. Omission preserves raw full
     * FK.
     */
    poseResolution?: AutoMovieEngineSkeletonPose.IRig;
  }

  /** The coupling props with an optional parent-rig preparer. */
  export interface ICoupleObjectsProps extends IAutoMovieCoupleObjects.IProps {
    /**
     * Prepare unchanged parent rig inputs for demanded attachment FK; omitted,
     * preserve the raw baker's full live admission.
     */
    prepareRig?: typeof AutoMovieEngineSkeletonPose.prepareSkeletonPoseResolution;
  }
}