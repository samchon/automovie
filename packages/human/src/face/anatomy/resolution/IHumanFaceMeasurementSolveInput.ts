import type { IAutoMovieHumanFaceBasisChannel } from "../../structures/IAutoMovieHumanFaceBasisChannel";
import type { IHumanFaceMeasurement } from "./IHumanFaceMeasurement";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * One face measurement target to solve onto the existing channels the measurement lists.
 *
 * `read` measures the editor's current document with one channel's weight replaced, on the same final surface the builder emits, so the inverse is judged on the real output. `weights` holds the document's current weight of each listed channel; an omitted channel is at zero.
 *
 * @evidence contracts/common.md#principled-implementation A registered target supplies actual one-channel trial reads while preserving the document's other existing weights.
 * @evidence contracts/common.md#clear-and-simple-design Channels and current weights constrain the shared one-dimensional inverse's permitted motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex/unlisted channel may be invented, report-only and non-millimetre targets refuse in the solver.
 * @evidence contracts/common.md#meaningful-documentation Target/read values use measurement units and omitted channel weight is the existing zero convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Actual callback geometry cost and bracket/channel search belong to the solver and reader owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared measurement/channel metadata drives each trial without expected-geometry fixtures.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous solver borrows registry/weights/callback and retains no trial context after returning its solution.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementSolveInput {
  /** The registered measurement the target names. */
  measurement: IHumanFaceMeasurement;

  /** Requested value in the measurement's unit. */
  target: number;

  /** The basis channels, from which the measurement's listed channels are taken. */
  channels: readonly IAutoMovieHumanFaceBasisChannel[];

  /** The document's current weight of each listed channel; omitted is zero. */
  weights: Readonly<Record<string, number>>;

  /**
   * Measure the current document with one channel at one weight.
   *
   * @evidence contracts/common.md#principled-implementation Actual document geometry supplies one trial read while the caller preserves every other channel weight.
   * @evidence contracts/common.md#clear-and-simple-design The registered instrument and shared inverse remain separate from this editor-owned geometry callback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing instrument returns a gap rather than a requested value; sampled numerical agreement does not establish clinical accuracy.
   * @evidence contracts/common.md#meaningful-documentation Channel identity and its trial weight select actual current geometry, with output in the instrument's declared unit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Trial geometry construction and measurement traversal execute in the supplied editor callback.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The inverse reuses the registered instrument and document state while each changed trial requires its actual geometry read.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous solver borrows this callback; its closure retains editor state only for the caller's chosen lifetime.
   */
  read: (channel: string, weight: number) => number | IHumanFaceMeasurementGap;
}
