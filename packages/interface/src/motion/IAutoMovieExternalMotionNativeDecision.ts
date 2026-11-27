import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieImportedNodeBoneMapping } from "./IAutoMovieImportedNodeBoneMapping";

/**
 * Native use replays the inspected node tracks on the source rig the author
 * declares; ingest infers no rig and matches no names.
 * `AutoMovieIngestExternalModel.adoptMotion` borrows this record, validates mapped parents
 * and rests by its fixed TRS composition, and returns copies. Constraints and
 * unmapped rests remain unchecked; noncommuting helper scale/rotation loses
 * shear in that representation. The decision itself does not execute playback.
 */
export interface IAutoMovieExternalMotionNativeDecision {
  /** Mode discriminator. */
  mode: "native";

  /** Inspected take id such as `clip_0`. */
  take: string;

  /**
   * Source skeleton with a non-blank id, unique bones including `hips`, and,
   * for every mapped bone, the parent and rest the inspected hierarchy implies
   * with exact number equality.
   */
  sourceRig: IAutoMovieSkeleton;

  /**
   * Non-empty node-to-bone mapping that covers every node the take animates;
   * ingest never derives it from names.
   */
  mapping: IAutoMovieImportedNodeBoneMapping[];
}
