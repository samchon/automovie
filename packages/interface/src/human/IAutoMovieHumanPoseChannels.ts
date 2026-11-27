import type { AutoMovieHumanPoseChannelTemplate } from "./AutoMovieHumanPoseChannelTemplate";

/**
 * Type contracts exchanged by AutoMovieHumanPoseChannels; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanPoseChannels {
  /**
   * The canonical table has finite paths/joints, clinical signs and sourced
   * ranges.
   */
  export type Channel = readonly [
    path: AutoMovieHumanPoseChannelTemplate,
    bone:
      | (
          | "<side>Eye"
          | "jaw"
          | "head"
          | "atlas"
          | "neck"
          | "<side>Shoulder"
          | "<side>Scapula"
          | "<side>UpperArm"
          | "<side>LowerArm"
          | "<side>Hand"
          | "<side>ThumbMetacarpal"
          | "<side>ThumbProximal"
          | "<side>ThumbDistal"
        )
      | (
          | "chest"
          | "spine"
          | "hips"
          | "<side>UpperLeg"
          | "<side>LowerLeg"
          | "<side>Foot"
          | "<side>Subtalar"
          | "<side>Midfoot"
          | "<side>HalluxProximal"
          | "<side>HalluxDistal"
        )
      | GeneratedJoint,
    axis: "flexion" | "abduction" | "twist" | "forward" | "lateral",
    sign: 1 | -1,
    min: number,
    max: number,
    world?: boolean,
  ];

  /** Canonical generating inputs supply all finger and toe joint spellings. */
  export type GeneratedJoint =
    | `<side>${"Index" | "Middle" | "Ring" | "Little"}${"Proximal" | "Intermediate" | "Distal"}`
    | `<side>Toe${2 | 3 | 4 | 5}${"Proximal" | "Intermediate" | "Distal"}`;
}
