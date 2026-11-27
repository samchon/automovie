import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieImportedNodeBoneMapping } from "./IAutoMovieImportedNodeBoneMapping";

/**
 * Copied source binding produced by native adoption. This is deferred
 * conversion data, not an executable motion: a later conversion host must admit
 * interpolation and channel coverage. Current adoption tests inspect this
 * handoff; no production conversion reader is wired.
 */
export interface IAutoMovieExternalMotionNativeHandoff {
  /** Mode discriminator. */
  mode: "native";

  /** Deep copy of the decision's source rig, sharing nothing with it. */
  sourceRig: IAutoMovieSkeleton;

  /** Copy of the decision's mapping sorted by node id in code-unit order. */
  mapping: IAutoMovieImportedNodeBoneMapping[];
}
