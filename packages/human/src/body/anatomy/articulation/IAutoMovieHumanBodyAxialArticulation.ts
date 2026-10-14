/**
 * Midline lumbosacral or pubic connection outside the left/right limb pairs.
 *
 * The lumbar spine transfers load to sacrum and paired coxal bones meet at pubic symphysis. These named surfaces cannot be represented by a single `leftHip` or `rightHip` rotation, and none is a user-authored 3D point. This conceptual relation vocabulary does not register actual SourceRig nodes or sites: its `lumbarL5` name differs from the source bone identifier `l5`, and this type supplies no correspondence or resolved surface geometry.
 *
 * @evidence contracts/common.md#principled-implementation Two discriminated records represent the distinct lumbosacral and bilateral pubic surface pairs; midline connections remain separate from unilateral limb rotation.
 * @evidence contracts/common.md#clear-and-simple-design The axial union holds only its two named anatomical connections rather than overloading left or right hip fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conceptual surface names do not certify actual source registration or geometry and do not invent a user-authored point or hide midline anatomy behind one hip transform.
 * @evidence contracts/common.md#meaningful-documentation The description identifies load transfer, bilateral pubic ownership and the lumbar naming/correspondence gap; members describe conceptual structure/site pairs.
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
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: "lumbarL5";

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "inferiorEndplate";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: "sacrum";

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "superiorS1Endplate";
      };
    }
  | {
      /** Selects the opposing-surface relationship without prescribing its motion model. */
      readonly joint: "pubicSymphysis";

      /** First named contact member; ordering does not imply a proximal bone. */
      readonly surfaceA: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: "leftCoxalBone";

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "pubicSymphysealSurface";
      };

      /** Opposing named contact member, sharing laterality where the pair is lateral. */
      readonly surfaceB: {
        /** Named anatomical structure in this relation vocabulary. */
        readonly structure: "rightCoxalBone";

        /** Named contact surface; this declaration supplies no source registration. */
        readonly site: "pubicSymphysealSurface";
      };
    };
