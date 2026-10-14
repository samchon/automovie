import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IConnectedBodyPreviewResult } from "@automovie/human/body/runtime/IConnectedBodyPreviewResult";

/**
 * The part of a built person preview the person panel reads: how many material regions the prepared or displayed model has, and on an explicit check the body skin's crossings and humeral-head reading. The viewport owns the prepared frame behind it. A count also exists on construction drafts and is not proof of accepted history. Optional or null diagnostics remain absent/unavailable rather than zero crossings; the anatomy and ground-support records retain the body producer's geometric qualification.
 *
 * @evidence contracts/common.md#principled-implementation Panel status reads the prepared person's material-region count and explicit body-build diagnostics without changing their optional or unavailable meaning.
 * @evidence contracts/common.md#clear-and-simple-design This narrow reporting view leaves complete document/admission state with the panel and prepared GPU-frame ownership with the viewport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Region count is not an admission verdict, absent crossings are not reported clear and geometric support is not promoted to clinical anatomical validity.
 * @evidence contracts/common.md#meaningful-documentation The comment explains prepared/draft reporting, optional diagnostic semantics, body-producer qualification and separate frame ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface implements no material counting, crossing analysis, anatomy read or foot-support algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reporting fields declare no geometry result reuse across different checked builds.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Diagnostic data sit on a viewport-owned frame; this view acquires no GPU handle or independently owned task.
 *
 * @author Samchon
 */
export interface IConnectedPersonModel {
  /** Material regions of the built person. */
  parts: number;

  /** Body skin crossings, when a check asked for them. */
  crossings?: IAutoMovieModelCrossing[] | null;

  /** Humeral-head reading, when a check asked for it. */
  anatomy?: IConnectedBodyPreviewResult["anatomy"];

  /** Geometric foot-to-ground readings requested on the same body build. */
  groundSupport?: IConnectedBodyPreviewResult["groundSupport"];
}
