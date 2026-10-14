import {
  AutoMovieArkitChannel,
  AutoMovieExpressionPreset,
} from "@automovie/interface";

/**
 * The ARKit eye channels each gaze preset expands to, with the factor its
 * intensity is multiplied by.
 *
 * Looking left turns the left eye outward and the right eye inward, and
 * looking right the reverse; up and down move both eyes alike. The viewer's
 * morph expansion and {@link resolveLookAt}'s eye-bone expansion both read this
 * table, so a gaze preset means the same channels whether it lands on morphs or
 * on bones.
 */
export const GAZE_PRESET_CHANNELS: Readonly<
  Record<
    Extract<
      AutoMovieExpressionPreset,
      "lookUp" | "lookDown" | "lookLeft" | "lookRight"
    >,
    readonly (readonly [AutoMovieArkitChannel, number])[]
  >
> = {
  lookUp: [
    ["eyeLookUpLeft", 1],
    ["eyeLookUpRight", 1],
  ],
  lookDown: [
    ["eyeLookDownLeft", 1],
    ["eyeLookDownRight", 1],
  ],
  lookLeft: [
    ["eyeLookOutLeft", 1],
    ["eyeLookInRight", 1],
  ],
  lookRight: [
    ["eyeLookInLeft", 1],
    ["eyeLookOutRight", 1],
  ],
};
