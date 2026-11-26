import type { IAutoMovieSkeleton } from "../../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieImportedNodeBoneMapping } from "../IAutoMovieImportedNodeBoneMapping";

/**
 * Retarget use declares the source rig, the mapping and the target identity, so
 * the engine pass that later retargets the take guesses none of them.
 * `AutoMovieIngestExternalModel.adoptMotion` borrows this record and copies an admitted
 * receipt. Mapped parents/rests use its fixed TRS composition, which drops
 * shear from noncommuting helper scale/rotation; constraints and unmapped rests
 * remain unchecked. Source conversion and destination compatibility need a
 * later host.
 */
export interface IAutoMovieExternalMotionRetargetDecision {
  /** Mode discriminator. */
  mode: "retarget";

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

  /**
   * Dimensionless multiplier for source root translation in metres; finite and
   * positive, with no inferred default.
   */
  translationScale: number;

  /** Non-blank target rig or actor identity, resolved after ingest. */
  target: string;
}
