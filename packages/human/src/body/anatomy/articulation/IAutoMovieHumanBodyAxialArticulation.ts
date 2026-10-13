/**
 * Midline lumbosacral or pubic connection outside the left/right limb pairs.
 *
 * The lumbar spine transfers load to sacrum and paired coxal bones meet at pubic symphysis. These named surfaces cannot be represented by a single `leftHip` or `rightHip` rotation, and none is a user-authored 3D point.
 *
 * @evidence contracts/common.md#principled-implementation Two discriminated records represent the distinct lumbosacral and bilateral pubic surface pairs; midline connections remain separate from unilateral limb rotation.
 * @evidence contracts/common.md#clear-and-simple-design The axial union holds only its two named anatomical connections rather than overloading left or right hip fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit surface identities preserve midline anatomy without inventing a user-authored point or hiding it behind one hip transform.
 * @evidence contracts/common.md#meaningful-documentation The description identifies load transfer and the pubic connection's bilateral ownership; inline members explain relationship selection and source-owned contact addresses.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Midline connection literals describe allowed records without selecting an axial-motion numerical method.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work These axial relationship branches hold no memoized connection solve or repeated-request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The axial declaration contains no attachment allocation, retained graph or resource release responsibility.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAxialArticulation =
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "lumbosacral";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: "lumbarL5";

        /** Source-owned contact surface address on this bone. */
        readonly site: "inferiorEndplate";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: "sacrum";

        /** Source-owned contact surface address on this bone. */
        readonly site: "superiorS1Endplate";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "pubicSymphysis";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: "leftCoxalBone";

        /** Source-owned contact surface address on this bone. */
        readonly site: "pubicSymphysealSurface";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Bone identity in the common anatomical source graph. */
        readonly structure: "rightCoxalBone";

        /** Source-owned contact surface address on this bone. */
        readonly site: "pubicSymphysealSurface";
      };
    };
