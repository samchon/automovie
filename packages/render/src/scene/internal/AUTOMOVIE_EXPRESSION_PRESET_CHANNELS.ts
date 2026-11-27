import { AutoMovieEngineGazePresetChannels } from "@automovie/engine";
import type {
  AutoMovieArkitChannel,
  AutoMovieExpressionPreset,
} from "@automovie/interface";

/*
 * The ARKit channels each expression preset drives on a VRM or imported model,
 * with the factor its intensity is multiplied by.
 *
 * `applyExpression` writes a preset's channels at its intensity, and
 * `visemeChannelWeights` sums the five mouth presets' channels by
 * viseme weight, so both read one table. The gaze rows are the engine's, shared
 * with its eye-bone gaze.
 */
export const AUTOMOVIE_EXPRESSION_PRESET_CHANNELS: Readonly<
  Partial<
    Record<
      AutoMovieExpressionPreset,
      readonly (readonly [AutoMovieArkitChannel, number])[]
    >
  >
> = {
  happy: [
    ["mouthSmileLeft", 1],
    ["mouthSmileRight", 1],
    ["cheekSquintLeft", 0.35],
    ["cheekSquintRight", 0.35],
  ],
  angry: [
    ["browDownLeft", 1],
    ["browDownRight", 1],
    ["eyeSquintLeft", 0.35],
    ["eyeSquintRight", 0.35],
  ],
  sad: [
    ["mouthFrownLeft", 0.75],
    ["mouthFrownRight", 0.75],
    ["browInnerUp", 0.45],
  ],
  relaxed: [
    ["eyeSquintLeft", 0.25],
    ["eyeSquintRight", 0.25],
    ["mouthSmileLeft", 0.2],
    ["mouthSmileRight", 0.2],
  ],
  surprised: [
    ["browInnerUp", 1],
    ["eyeWideLeft", 0.8],
    ["eyeWideRight", 0.8],
    ["jawOpen", 0.75],
  ],
  aa: [["jawOpen", 1]],
  ih: [
    ["jawOpen", 0.35],
    ["mouthSmileLeft", 0.45],
    ["mouthSmileRight", 0.45],
  ],
  ou: [
    ["mouthFunnel", 0.8],
    ["mouthPucker", 0.55],
  ],
  ee: [
    ["mouthSmileLeft", 0.75],
    ["mouthSmileRight", 0.75],
  ],
  oh: [
    ["jawOpen", 0.6],
    ["mouthFunnel", 0.75],
  ],
  blink: [
    ["eyeBlinkLeft", 1],
    ["eyeBlinkRight", 1],
  ],
  blinkLeft: [["eyeBlinkLeft", 1]],
  blinkRight: [["eyeBlinkRight", 1]],
  // The gaze rows are shared with the engine's eye-bone gaze.
  ...AutoMovieEngineGazePresetChannels,
};
