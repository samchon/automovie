import {
  IAutoMovieChannel,
  type IAutoMovieNodeChannel,
} from "@automovie/interface";

type IAutoMoviePointerChannel = Extract<IAutoMovieChannel, { kind: "pointer" }>;

/**
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

/**
 * Read a channel's fixed component width, leaving weights and malformed shape
 * undefined.
 */
export const channelValueWidth: (channel: unknown) => number | undefined = (
  channel: unknown,
): number | undefined => {
  if (typeof channel !== "object" || channel === null) return undefined;
  const record: Record<string, unknown> = channel as Record<string, unknown>;
  if (record.kind === "node") {
    const key: unknown = record.path;
    return typeof key === "string" && Object.hasOwn(NODE_CHANNEL_WIDTHS, key)
      ? NODE_CHANNEL_WIDTHS[key as IAutoMovieNodeChannel["path"]]
      : undefined;
  }
  if (record.kind === "pointer") {
    const key: unknown = record.valueType;
    return typeof key === "string" && Object.hasOwn(CHANNEL_VALUE_WIDTHS, key)
      ? CHANNEL_VALUE_WIDTHS[key as IAutoMoviePointerChannel["valueType"]]
      : undefined;
  }
  return undefined;
};
