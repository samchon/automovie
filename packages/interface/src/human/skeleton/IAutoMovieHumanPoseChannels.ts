import type { IAutoMovieHumanRigControls } from "./IAutoMovieHumanRigControls";

/** Type contracts exchanged by AutoMovieHumanPoseChannels; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanPoseChannels {
  /** The canonical table has finite paths/joints, clinical signs and sourced ranges.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The canonical table has finite paths/joints, clinical signs and sourced ranges.
   * @evidence contracts/development/design.md#principled-representation The canonical table has finite paths/joints, clinical signs and sourced ranges. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanPoseChannels.Channel is the canonical exchange used by AutoMovieHumanPoseChannels, rows.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanPoseChannels, rows for the canonical table has finite paths/joints, clinical signs and sourced ranges.
   */
  export type Channel = readonly [
    path: IAutoMovieHumanRigControls.ChannelTemplate,
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

  /** Canonical generating inputs supply all finger and toe joint spellings.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Canonical generating inputs supply all finger and toe joint spellings.
   * @evidence contracts/development/design.md#principled-representation Canonical generating inputs supply all finger and toe joint spellings. Alternatives are `<side>${"Index" | "Middle" | "Ring" | "Little"}${"Proximal" | "Intermediate" | "Distal"}`; `<side>Toe${2 | 3 | 4 | 5}${"Proximal" | "Intermediate" | "Distal"}`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanPoseChannels.GeneratedJoint is the canonical exchange used by IAutoMovieHumanPoseChannels.Channel.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by IAutoMovieHumanPoseChannels.Channel for canonical generating inputs supply all finger and toe joint spellings.
   */
  export type GeneratedJoint =
    | `<side>${"Index" | "Middle" | "Ring" | "Little"}${"Proximal" | "Intermediate" | "Distal"}`
    | `<side>Toe${2 | 3 | 4 | 5}${"Proximal" | "Intermediate" | "Distal"}`;
}
