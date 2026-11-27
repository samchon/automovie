import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieImportedNodeBoneMapping } from "./IAutoMovieImportedNodeBoneMapping";

/**
 * Inputs copied after adoption's mapped-basis and retarget-field checks. Source
 * conversion and source-target compatibility remain later host obligations;
 * this record performs neither. Current adoption tests inspect the copied
 * handoff, and no production conversion reader is wired.
 */
export interface IAutoMovieExternalMotionRetargetHandoff {
  /** Mode discriminator. */
  mode: "retarget";

  /** Deep copy of the decision's source rig, sharing nothing with it. */
  sourceRig: IAutoMovieSkeleton;

  /** Copy of the decision's mapping sorted by node id in code-unit order. */
  mapping: IAutoMovieImportedNodeBoneMapping[];

  /**
   * The decision's dimensionless root-translation multiplier, checked finite
   * and positive.
   */
  translationScale: number;

  /** The decision's target identity, checked non-blank but not resolved. */
  target: string;
}
