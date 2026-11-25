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

    /**
     * Explicit per-axis degree boxes, or null when limits have not been
     * measured.
     */
    limits: Record<
      "flexion" | "abduction" | "twist",
      IAutoMovieAngleRange | null
    > | null;
  }[];
}
