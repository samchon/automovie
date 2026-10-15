import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieMotion,
  IAutoMovieProfileBinding,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieRetargetContactProps } from "./IAutoMovieRetargetContactProps";

/**
 * Input for {@link retargetHumanoidMotion}.
 * Clinical joint values remain degrees. Root translation and contacts scale
 * between the rigs' model units; their authored quaternion facing is retained.
 * Inputs are borrowed and must remain unchanged while the operation runs.
 *
 * @evidence contracts/common.md#principled-implementation Requires the source motion and both normalized skeletons, with explicit clinical axes, rest frames and optional semantic bindings for rig differences; rootScale is supplied or derived from their resolved rest heights.
 * @evidence contracts/common.md#clear-and-simple-design Rig facts, explicit scale and contact policy remain named inputs to one retarget operation rather than being inferred from imported node names or hidden host state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing required bones and invalid scales are runtime refusals; optional maps use the documented humanoid conventions rather than asset-specific repairs.
 * @evidence contracts/common.md#meaningful-documentation Gives joint units, translation conversion, unchanged facing, borrowing, default tables, binding roles and the contact-enabled default.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input interface selects no traversal or solve; retargetHumanoidMotion and preserveRetargetContacts own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed rig inputs do not establish equivalence across calls, and the interface promises no cached retargeted motion.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns motion, skeleton and optional table lifetimes; no task or native workspace is acquired by constructing these props.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanoidRetargetProps {
  /** Clip authored on `source`. */
  motion: IAutoMovieMotion;

  /** Skeleton the clip was authored against. */
  source: IAutoMovieSkeleton;

  /** Skeleton the clip should play on. */
  target: IAutoMovieSkeleton;

  /** Optional source profile binding carrying semantic slot -> node ids. */
  sourceBinding?: IAutoMovieProfileBinding;

  /** Optional target profile binding carrying semantic slot -> node ids. */
  targetBinding?: IAutoMovieProfileBinding;

  /**
   * Optional source clinical axes; defaults to the humanoid table, under any
   * axes the source bones declare.
   */
  sourceJointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /**
   * Optional target clinical axes; defaults to the humanoid table, under any
   * axes the target bones declare.
   */
  targetJointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional source rest frames; defaults to the humanoid table. */
  sourceRestFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;

  /** Optional target rest frames; defaults to the humanoid table. */
  targetRestFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;

  /**
   * Extra bones, such as a reach end effector, that must exist on both rigs.
   */
  requiredBones?: readonly AutoMovieHumanoidBone[];

  /**
   * Explicit root translation scale; omitted means target height / source
   * height.
   */
  rootScale?: number;

  /**
   * Contact policy for the contact-preserving pass. Omitted runs the pass with
   * humanoid legs and no declared hand contact.
   */
  contacts?: IAutoMovieRetargetContactProps;

  /** Optional id for the retargeted clip. */
  id?: string;
}
