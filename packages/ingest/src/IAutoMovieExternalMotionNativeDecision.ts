import type { IAutoMovieSkeleton } from "@automovie/interface";

import type { IAutoMovieExternalMotionBoneMapping } from "./IAutoMovieExternalMotionBoneMapping";

/**
 * Native use replays the inspected node tracks on the source rig the author declares; ingest infers no rig and matches no names.
 *
 * @evidence contracts/common.md#principled-implementation Native use needs only the take, the author's source rig and the mapping, because the tracks replay on the rig the bytes describe and nothing is converted between skeletons.
 * @evidence contracts/common.md#clear-and-simple-design The native arm repeats the three shared fields rather than extending a base type, keeping each arm readable on its own at the cost of three duplicated property declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rig is not trusted blindly: adoption recomputes each mapped bone's parent and rest from the inspected nodes and requires exact equality.
 * @evidence contracts/common.md#meaningful-documentation The property comments state the take id form, the rig's id, uniqueness, hips and exact-basis requirements, and that the mapping must cover every animated node.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The decision is input data; validation cost is counted on `adoptAutoMovieExternalMotion`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No work is attached to the decision record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the decision; adoption deep-copies what it keeps, so the record's lifetime is the caller's.
 */
export interface IAutoMovieExternalMotionNativeDecision {
  /** Mode discriminator. */
  mode: "native";

  /** Inspected take id such as `clip_0`. */
  take: string;

  /** Source skeleton with a non-blank id, unique bones including `hips`, and, for every mapped bone, the parent and rest the inspected hierarchy implies with exact number equality. */
  sourceRig: IAutoMovieSkeleton;

  /** Non-empty node-to-bone mapping that covers every node the take animates; ingest never derives it from names. */
  mapping: IAutoMovieExternalMotionBoneMapping[];
}
