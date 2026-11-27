import type {
  IAutoMovieCompileAttach,
  IAutoMovieCoupleObjects,
} from "@automovie/interface";

import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";

/** Type-only props owned by the engine film's named operations. */
export namespace AutoMovieEngineFilmTypes {
  /** The attachment props with an optional prepared parent rig. */
  export interface ICompileAttachProps extends IAutoMovieCompileAttach.IProps {
    /**
     * Explicit immutable snapshot of this exact parent rig and clinical
     * mappings, kept unchanged throughout the bake. Omission preserves raw full
     * FK.
     */
    poseResolution?: prepareSkeletonPoseResolution.IRig;
  }

  /** The coupling props with an optional parent-rig preparer. */
  export interface ICoupleObjectsProps extends IAutoMovieCoupleObjects.IProps {
    /**
     * Prepare unchanged parent rig inputs for demanded attachment FK; omitted,
     * preserve the raw baker's full live admission.
     */
    prepareRig?: typeof prepareSkeletonPoseResolution;
  }
}