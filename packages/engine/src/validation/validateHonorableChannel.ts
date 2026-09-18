import { pushViolation } from "./pushViolation";
import { IAutoMovieNodeChannel } from "./IAutoMovieNodeChannel";
import { NODE_CHANNEL_PATHS } from "./NODE_CHANNEL_PATHS";
import { IAutoMovieClipChannelGate } from "./IAutoMovieClipChannelGate";

/**
 * A TRANSFORM clip's track must address a channel the pipeline can HONOR
 * (#1339).
 *
 * `IAutoMovieChannel` has two arms, and only one of them is applied when a shot
 * plays a transform clip. `resolveFrame` and the viewer's `applyObjectMotion`
 * each write node channels onto the node they name and `continue` past
 * everything else, so a pointer track (`/materials/2/baseColor`,
 * `/cameras/0/fovY`, a rig DOF) validated clean, persisted to
 * `shots/<beat>.json`, was read back unchanged by `getShot`, and then silently
 * did nothing: the committed artifact said the candle dims and the film never
 * dimmed it.
 *
 * A validator that passes an instruction no consumer executes is a false green,
 * and the guide corpus tells an agent to trust exactly this verdict. So the
 * artifact contract refuses what the pipeline cannot perform, naming the
 * supported set, rather than accepting and discarding it.
 *
 * The set widens where an applier lands, and only there: `lightMotions` carries
 * light pointers because {@link resolveShotLighting} writes them (#1348), and
 * this gate is unchanged because `applyObjectMotion` still does not. Widening
 * it here without an applier would restore the exact false green #1339 closed.
 *
 * The gate is scoped to CLIP TRACKS on purpose. The other user of
 * `IAutoMovieChannel` is the driver graph (a prop profile's `source`/`output`,
 * `IAutoMovieChannelLimit.channel`), where `resolve/drivers` does read pointer
 * keys out of the sampled map. Those stay untouched.
 *
 * Exported so a caller with a NARROWER rule can add to it rather than replace
 * it. Passing a gate of one's own opts out of this one entirely, and a shot
 * field that only meant to say "and it must be a node this shot staged" would
 * silently stop refusing pointer tracks and unknown node paths on the way.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validateHonorableChannel` reports a transform track whose channel kind or node path has no playback writer at that channel field.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validateHonorableChannel` retains the rejected channel discriminator and property address beside the transform-clip admission rule.
 */
export const validateHonorableChannel: IAutoMovieClipChannelGate = (
  channel,
  path,
  violations,
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
