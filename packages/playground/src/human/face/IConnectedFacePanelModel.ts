import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type {
  IAutoMovieHumanFaceContactSummary,
  summarizeHumanFaceArticulation,
} from "@automovie/human";

/**
 * What the connected face panel reads of a built model: its part count and, when the viewport measured them, articulation, contact and crossings.
 *
 * Missing optional readings mean the model did not supply them; null contact or crossing readings mean unavailable rather than zero contact or an empty crossing list. An empty crossing list is an actual supplied reading with no reported incidences. These numerical summaries do not establish clinical validity.
 *
 * @evidence contracts/common.md#principled-implementation The model projection separates material-region count from optional numerical articulation, contact and triangle-incidence summaries, preserving absent and unavailable readings instead of converting them to successful zero values.
 * @evidence contracts/common.md#clear-and-simple-design The panel consumes only display and inspection summaries while the owning builder and renderer keep mesh and resource details.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reading is fabricated when not supplied, and triangle incidence or resolved contact is not presented as validated personal anatomy.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes undefined, null and empty crossing results and explains the numerical summaries' clinical limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This panel-facing result type selects no articulation, contact or crossing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record carries supplied readings but owns no source-neutral comparison cache or repeated build reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The projection declares ordinary summaries rather than worker or GPU ownership; the prepared model's viewport owns actual frame lifetime.
 *
 * @author Samchon
 */
export interface IConnectedFacePanelModel {
  /** The number of material regions drawn. */
  parts: number;

  /** The articulation summary, when measured. */
  articulation?: ReturnType<typeof summarizeHumanFaceArticulation>;

  /** Supplied contact summary; null is unavailable and undefined is unsupplied. */
  contact?: IAutoMovieHumanFaceContactSummary | null;

  /** Supplied triangle incidences; null is unavailable, undefined is unsupplied and an empty array reports none. */
  crossings?: IAutoMovieModelCrossing[] | null;
}
