import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { IAutoMovieClipChannelGate } from "./IAutoMovieClipChannelGate";
import { IAutoMovieNodeChannel } from "./IAutoMovieNodeChannel";
import { NODE_CHANNEL_PATHS } from "./constants/NODE_CHANNEL_PATHS";
import { pushViolation } from "./pushViolation";

/**
 * Require node channels with translation/rotation/scale/weights paths, matching transform-clip appliers.
 *
 * @evidence contracts/common.md#principled-implementation Require node channels with translation/rotation/scale/weights paths, matching transform-clip appliers.
 * @evidence contracts/common.md#clear-and-simple-design NODE_CHANNEL_PATHS owns the accepted node property menu; light pointer tracks use a separate shot field gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All pointer tracks are refused on transform clips, while driver graph pointer semantics remain separate.
 * @evidence contracts/common.md#meaningful-documentation A custom channelGate replaces this policy rather than automatically extending it; exact kind/path faults are documented.
 * @evidence contracts/performance.md#efficient-algorithms Fixed kind/set checks take expected constant work apart from diagnostic serialization.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared node path vocabulary aligns sampling and application without caching graph existence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned fault rows escape; no scene node or host registry is captured.
 */
export const validateHonorableChannel: IAutoMovieClipChannelGate = (
  channel: Record<string, unknown>,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (channel.kind !== "node") {
    pushViolation(
      violations,
      "type",
      `${path}.kind`,
      `clip track channel kind must be "node"; the pipeline resolves node channels (translation/rotation/scale/weights) onto scene nodes and honors no other target on a transform clip (a light change belongs in the shot's lightMotions), but was ${JSON.stringify(channel.kind)}`,
      channel.kind,
    );
    return;
  }
  // The node arm's own address. `channelKey` builds `node:<id>:<path>` from the
  // same set and throws for anything outside it, so a track naming a property
  // like `opacity` used to validate clean here and take the sampler's throw
  // instead of a violation (#1353): the pointer arm was closed and the node
  // arm's unknown paths were left open, which is the same false green one
  // discriminator over.
  if (!NODE_CHANNEL_PATHS.has(channel.path as IAutoMovieNodeChannel["path"]))
    pushViolation(
      violations,
      "type",
      `${path}.path`,
      `clip track channel path must be one of ${[...NODE_CHANNEL_PATHS].join(", ")}; the pipeline writes no other property of a node, but was ${JSON.stringify(channel.path)}`,
      channel.path,
    );
};
