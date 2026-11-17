import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieAngleRange } from "./IAutoMovieAngleRange";
import type { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";

/**
 * A rigid articulated tree in its owner's bone vocabulary.
 *
 * This representation is independent of normalized humanoid slots. The owner
 * supplies a closed bone union, explicit local axes and any measured degree
 * boxes. Null limits mean unknown/unconstrained; a null axis inside a provided
 * box is immobile. It describes rigid links, with unit scales, rather than a
 * deforming skin or a claim that a box reconstructs an animal's anatomy.
 *
 * @template Bone The owner's closed bone vocabulary.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the named tree, rigid-link premise, local frames, degree boxes and distinct null meanings without altering humanoid contracts.
 * @evidence contracts/development/design.md#principled-representation Stable names and parent-local rigid transforms define a generic FK tree; declared orthogonal axes give each joint's three rotations their meaning.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The animal producer owns names and anatomy while the engine owns tree admission and rigid composition; no species catalogue or humanoid default enters this type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown limits remain explicit instead of borrowing human ROM, and no humanoid finger slot substitutes for an animal joint.
 */
export interface IAutoMovieArticulatedRig<Bone extends string = string> {
  /** Stable rig identity, independent of a particular posed sample. */
  id: string;

  /** Nonempty unique joints, one connected parent-null root, in any order. */
  bones: {
    /** Semantic bone name from the owner's vocabulary. */
    bone: Bone;

    /** Parent bone, or null for the sole root. */
    parent: Bone | null;

    /** Parent-local neutral rigid transform; all three scales must be one. */
    rest: IAutoMovieTransform;

    /** Orthogonal local rotation axes and proximal/distal composition order. */
    axes: IAutoMovieJointAxes;

    /** Explicit per-axis degree boxes, or null when limits have not been measured. */
    limits: Record<
      "flexion" | "abduction" | "twist",
      IAutoMovieAngleRange | null
    > | null;
  }[];
}
