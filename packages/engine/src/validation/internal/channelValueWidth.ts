import type {
  IAutoMovieChannel,
  IAutoMovieNodeChannel,
} from "@automovie/interface";

/*
 * Read a channel's fixed component width, leaving weights undefined.
 */
export function channelValueWidth(
  channel: IAutoMovieChannel,
): number | undefined {
  return channel.kind === "node"
    ? NODE_CHANNEL_WIDTHS[channel.path]
    : CHANNEL_VALUE_WIDTHS[channel.valueType];
}

type IAutoMoviePointerChannel = Extract<IAutoMovieChannel, { kind: "pointer" }>;

/*
 * Per-keyframe value width of the channels that fix one. `weights` is absent
 * from both tables on purpose: a morph-target vector is as wide as the model
 * has targets, so no width can be asserted for it.
 */
const NODE_CHANNEL_WIDTHS: Partial<
  Record<IAutoMovieNodeChannel["path"], number>
> = {
  translation: 3,
  rotation: 4,
  scale: 3,
};

const CHANNEL_VALUE_WIDTHS: Partial<
  Record<IAutoMoviePointerChannel["valueType"], number>
> = {
  scalar: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
  quaternion: 4,
};
