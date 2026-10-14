import { IAutoMovieSubjectReviewTarget } from "@automovie/interface";
import { IAutoMovieSubjectInspectionPose } from "./IAutoMovieSubjectInspectionPose";
import { IAutoMovieSubjectInspectionDrawn } from "./IAutoMovieSubjectInspectionDrawn";
import { IAutoMovieSubjectInspectionRuntimeUnidentified } from "./IAutoMovieSubjectInspectionRuntimeUnidentified";
import { IAutoMovieSubjectInspectionRefusal } from "./IAutoMovieSubjectInspectionRefusal";

/**
 * Describe an optional host callback that draws one exact subject context and inspection pose.
 *
 * @evidence contracts/common.md#principled-implementation The input repeats project/production, compiled target/revision, plan viewpoint, pose and requested raster.
 * @evidence contracts/common.md#clear-and-simple-design Subject inspection is separate from the delivery frame adapter and its render-bundle receipts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No maintained product producer currently supplies this callback; supplied pixels/runtime are opaque host outcomes rather than core visual proof.
 * @evidence contracts/common.md#meaningful-documentation The callback returns drawn, refused or runtime-unidentified outcomes asynchronously and executes with the original service receiver.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Host drawing/encoding and runtime observation execute in the supplied callback, not this erased function type.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Any resident page reuse belongs to the host and is not implemented or proved by this signature.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The service retains the adapter for its lifetime; host pages/tasks and their disposal remain host-owned.
 *
 * @author Samchon
 */
export type AutoMovieProductionSubjectInspection = (input: {
  /** Active project root. */
  projectRoot: string;

  /** Active production namespace inside the project. */
  productionId: string;

  /** Current compile fingerprint the observation is derived from. */
  compileFingerprint: string;

  /** Compiled artifact and stable subject id being opened. */
  target: IAutoMovieSubjectReviewTarget;

  /** Revision of the compiled artifact the subject was read from. */
  revision: string;

  /** Planned viewpoint identity this pose answers. */
  viewpoint: string;

  /** Inspection-owned camera state to draw through. */
  pose: IAutoMovieSubjectInspectionPose;

  /** Requested pixel width. */
  width: number;

  /** Requested pixel height. */
  height: number;
}) => Promise<
  | IAutoMovieSubjectInspectionDrawn
  | IAutoMovieSubjectInspectionRefusal
  | IAutoMovieSubjectInspectionRuntimeUnidentified
>;
