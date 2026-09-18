import { IAutoMovieNodeChannel } from "./IAutoMovieNodeChannel";
import { IAutoMoviePointerChannel } from "@automovie/interface";

/**
 * The per-keyframe value width this channel fixes, or `undefined` when it fixes
 * none (a `weights` channel, or a channel too malformed to read one from).
 *
 * Total over `unknown`: the gate reads channels off stored JSON, where the
 * discriminator itself may be anything.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `channelValueWidth` derives the required component count used to refuse a mismatched track payload.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `channelValueWidth` returns only the per-key stride fixed by the declared node property or pointer type.
 */
export const channelValueWidth = (channel: unknown): number | undefined => {
  if (typeof channel !== "object" || channel === null) return undefined;
  const record = channel as Record<string, unknown>;
  if (record.kind === "node")
    return NODE_CHANNEL_WIDTHS[record.path as IAutoMovieNodeChannel["path"]];
  if (record.kind === "pointer")
    return CHANNEL_VALUE_WIDTHS[
      record.valueType as IAutoMoviePointerChannel["valueType"]
    ];
  return undefined;
};
