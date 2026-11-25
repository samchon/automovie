import type { IAutoMovieSoftBodyDomain } from "./IAutoMovieSoftBodyDomain";
import type { IAutoMovieWearableSoftFrame } from "./IAutoMovieWearableSoftFrame";

/**
 * Complete primary-motion history and admission slot for one wearable cloth
 * replay.
 */
export namespace IAutoMovieSimulateWearableSoftBody {
  /**
   * Borrowed domain and absolute primary-motion snapshots for resolving moving
   * anchors/body capsules and replaying cloth from rest. The resolver checks
   * the subject slot, target step, inclusive frame coverage, frame indices and
   * nonblank unique node/actor ids. Every required bone must resolve uniquely.
   * Used anchor transforms require finite positions/offsets and unit
   * quaternions within 1e-6 squared-length error; offsets rotate and translate
   * without scale. Resolved boundary vectors and capsule radii are admitted
   * before integration.
   *
   * General domain admission is the caller's responsibility. At least one
   * moving anchor or body capsule is required. Missing/duplicate targets,
   * invalid steps/slots or boundary values, unknown named states and
   * integration failures throw. Inputs are unchanged and unretained; returned
   * state arrays and budget measurements are fresh. This resolver has portable
   * test consumers and no production/viewer live host.
   */
  export type IProps = {
    /**
     * Caller-admitted cloth definition containing at least one bound anchor or
     * body capsule; supplies the fixed seconds-per-step clock and maximum
     * step.
     */
    domain: IAutoMovieSoftBodyDomain;

    /**
     * Nonnegative safe integer absolute target step, at most
     * domain.solver.maxSteps; zero still requires the initial motion snapshot.
     */
    step: number;

    /**
     * Exactly step + 1 read-only snapshots in order 0 through step; frame i
     * must name step i and supply every referenced node/actor/bone. No
     * interpolation or retention occurs.
     */
    frames: readonly IAutoMovieWearableSoftFrame[];

    /**
     * Nonnegative safe integer slot chosen by the host, strictly below
     * maxSubjects; not an index into frames or actor arrays.
     */
    subjectIndex: number;

    /**
     * Nonnegative safe integer live-subject ceiling; zero admits no subject.
     * This call checks its slot only and reserves no global resource.
     */
    maxSubjects: number;

    /**
     * Named held-anchor state applied from the start of replay; omission/null
     * means base targets. Unknown names throw; resolved moving anchors override
     * their initial static targets.
     */
    state?: string | null | undefined;
  };
}
