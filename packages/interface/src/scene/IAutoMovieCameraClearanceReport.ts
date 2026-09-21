import { IAutoMovieCameraClearanceFinding } from "./IAutoMovieCameraClearanceFinding";

/**
 * Reproducible physical-clearance result for one realized camera take.
 *
 * The report binds the ordered base-clock-plus-key sample plan used for
 * evaluation and the verdict that plan produced. A stale report is never a
 * clear report, even when its old geometry happened to contain no contact, and
 * only a clear report may be published, so the geometry a stored verdict was
 * measured from is always the one that was current at its gate.
 *
 * The two revision numbers an evaluation compares are its inputs rather than
 * its result, so they stay on the runtime the caller supplies. A report that
 * recorded them would make a compiled take's bytes a function of the project
 * revision counter: publishing the take moves that counter, the next
 * derivation records the moved value, and regeneration never converges.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-spatial-geometry-revision Prevents clearance measured from an obsolete scene revision from becoming current evidence.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Carries the deterministic sample plan and addressed contact set used to admit or refuse the take.
 * @author Samchon
 */
export interface IAutoMovieCameraClearanceReport {
  /** Scene camera identity evaluated. */
  camera: string;

  /** Endpoint-inclusive inspection samples per second. */
  sampleRate: number;

  /** Exact ordered fixed-clock and causal sample instants evaluated. */
  sampleTimes: number[];

  /** Exact number of adjacent carried sample intervals evaluated. */
  intervals: number;

  /** Whether current geometry was clear, blocked, or stale. */
  status: "clear" | "blocked" | "stale";

  /** Stable interval-ordered contacts; empty for clear and stale reports. */
  findings: IAutoMovieCameraClearanceFinding[];
}
