import type { IAutoMovieJointConstraint } from "../skeleton/IAutoMovieJointConstraint";
import type { IAutoMovieViolationAppendSink } from "../validation/IAutoMovieViolationAppendSink";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";
import type { IAutoMovieJointRotationFrame } from "./IAutoMovieJointRotationFrame";

/**
 * Append axis range/ROM violations and a combined swing violation to the
 * caller's collector.
 */
export namespace IAutoMovieValidateJointRom {
  /**
   * Append axis range/ROM violations and a combined swing violation to the
   * caller's collector. Null angles mean rest and contribute zero to swing;
   * immobile axes admit null/zero. Field paths and degree overshoots preserve
   * correction provenance, while constraint admission is separate.
   */
  export type IProps = {
    /** Borrowed joint angles in the constraint's degree frame; null means rest. */
    joint: IAutoMovieJointPose;

    /** Admitted finite ordered axis intervals and optional coupled swing policy. */
    constraint: IAutoMovieJointConstraint;

    /** Base JSON address; axis or swing suffixes identify each reported fault. */
    path: string;

    /** Caller-owned append-only diagnostic sink, advanced by this validation. */
    collector: IAutoMovieViolationAppendSink;

    /**
     * The bone's frame as the caller's rig resolves it, for a joint gated by
     * swing and twist; the humanoid tables' when absent.
     */
    rig?: IAutoMovieJointRotationFrame;
  };
}
