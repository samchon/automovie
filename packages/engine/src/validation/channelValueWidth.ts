import { IAutoMovieChannel } from "@automovie/interface";
import { IAutoMovieNodeChannel } from "./IAutoMovieNodeChannel";
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
 * Read a channel's fixed component width, leaving weights and malformed shape undefined.
 *
 * @evidence contracts/common.md#principled-implementation Node translation/rotation/scale and pointer scalar/vector/quaternion widths come from the canonical channel arms after string and own-key admission; weights depends on a model's morph-target population and has no fixed width here.
 * @evidence contracts/common.md#clear-and-simple-design Sampler track shape, artifact shape and light value traversal share one width owner so their strides cannot drift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown kinds, non-object/null input, nonstring keys and inherited prototype spellings return undefined without key coercion. Ordinary stored JSON is the caller context; hostile property accessors can still execute while reading the record.
 * @evidence contracts/common.md#meaningful-documentation Documents width in scalars, unknown-record inspection, variable-width weights and the distinction between ordinary stored data and effectful property access.
 * @evidence contracts/performance.md#efficient-algorithms Fixed discriminator/table lookup takes constant scalar work with no keyframe traversal or output allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work One width table serves all consumers without per-track recomputation of shape formulas or cached mutable channel verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar or undefined should transfer; no channel record, model, keyframe array or host handle is retained.
 * @author Samchon
 */
export const channelValueWidth: (channel: unknown) => number | undefined = (channel: unknown): number | undefined => {
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
