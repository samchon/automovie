/**
 * Midline lumbosacral or pubic connection outside the left/right limb pairs.
 *
 * The lumbar spine transfers load to sacrum and paired coxal bones meet at
 * pubic symphysis. These named surfaces cannot be represented by a single
 * `leftHip` or `rightHip` rotation, and none is a user-authored 3D point.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAxialArticulation =
  | {
      readonly joint: "lumbosacral";
      readonly surfaceA: {
        readonly structure: "lumbarL5";
        readonly site: "inferiorEndplate";
      };
      readonly surfaceB: {
        readonly structure: "sacrum";
        readonly site: "superiorS1Endplate";
      };
    }
  | {
      readonly joint: "pubicSymphysis";
      readonly surfaceA: {
        readonly structure: "leftCoxalBone";
        readonly site: "pubicSymphysealSurface";
      };
      readonly surfaceB: {
        readonly structure: "rightCoxalBone";
        readonly site: "pubicSymphysealSurface";
      };
    };
