import type { IAutoMovieJointConstraint } from "../skeleton/IAutoMovieJointConstraint";
import type { IAutoMovieViolationCollector } from "../validation/IAutoMovieViolationCollector";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";
import type { IAutoMovieJointRotationFrame } from "./IAutoMovieJointRotationFrame";

/**
 * Append axis range/ROM violations and a combined swing violation to the caller's collector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States degree-frame admission, null/rest meaning, diagnostic paths and append-only collector ownership.
 * @evidence contracts/development/design.md#principled-representation Canonical clinical joint angles and admitted ROM share one bone frame; optional rig data supplies the swing-twist interpretation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface validateJointRom delegates the shared range scan and appends to the caller's canonical violation collector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Constraint admission is separate; null/zero immobile axes are valid and violations preserve authored values instead of clamping angles.
 */
export namespace IAutoMovieValidateJointRom {
  /**
   * Append axis range/ROM violations and a combined swing violation to the caller's collector. Null angles mean rest and contribute zero to swing; immobile axes admit null/zero. Field paths and degree overshoots preserve correction provenance, while constraint admission is separate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States degree-frame admission, null/rest meaning, diagnostic paths and append-only collector ownership.
   * @evidence contracts/development/design.md#principled-representation Canonical clinical joint angles and admitted ROM share one bone frame; optional rig data supplies the swing-twist interpretation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface validateJointRom delegates the shared range scan and appends to the caller's canonical violation collector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Constraint admission is separate; null/zero immobile axes are valid and violations preserve authored values instead of clamping angles.
   */
  export type IProps = {
    /** Borrowed joint angles in the constraint's degree frame; null means rest. */
    joint: IAutoMovieJointPose;

    /** Admitted finite ordered axis intervals and optional coupled swing policy. */
    constraint: IAutoMovieJointConstraint;

    /** Base JSON address; axis or swing suffixes identify each reported fault. */
    path: string;

    /** Caller-owned append-only diagnostic sink, advanced by this validation. */
    collector: IAutoMovieViolationCollector;

    /** The bone's frame as the caller's rig resolves it, for a joint gated by swing and twist; the humanoid tables' when absent. */
    rig?: IAutoMovieJointRotationFrame;
  };
}
