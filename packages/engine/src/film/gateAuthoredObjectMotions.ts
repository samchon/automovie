import {
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMovieNode,
  IAutoMoviePropSpec,
  IAutoMovieSceneNode,
  IAutoMovieTrack,
} from "@automovie/interface";

import { IAutoMovieProfileApplication } from "../resolve/IAutoMovieProfileApplication";
import { IAutoMovieResolveViolation } from "../resolve/IAutoMovieResolveViolation";
import { channelKey } from "../resolve/channelKey";
import { placementNodePrefix } from "../resolve/placementNodePrefix";
import { resolveFrame } from "../resolve/resolveFrame";
import { sceneToNodes } from "../resolve/sceneToNodes";
import { IAutoMovieClipChannelGate } from "../validation/IAutoMovieClipChannelGate";
import { IAutoMovieNodeChannel } from "../validation/IAutoMovieNodeChannel";
import { ViolationCollector } from "../validation/ViolationCollector";
import { NODE_CHANNEL_PATHS } from "../validation/constants/NODE_CHANNEL_PATHS";
import { pushViolation } from "../validation/pushViolation";
import { validateClipArtifact } from "../validation/validateClipArtifact";
import { validateHonorableChannel } from "../validation/validateHonorableChannel";
import { IAutoMovieObjectMotionGate } from "./IAutoMovieObjectMotionGate";
import { authoredRotationCriticalTimes } from "./authoredRotationCriticalTimes";
import { forgeProp } from "./forgeProp";

/**
 * Gate the object clips a shot's source authored, so a moving thing that is not a performer can reach a compiled shot.
 *
 * {@link builtOpeningPanelPlacements} promises that a door which swings on screen is an `objectMotions` clip over the panel node ids it answers with, and {@link IAutoMoviePropArticulation} promises that a prop's hinge is a lowered joint a clip drives. Both are one thing, a node in the staged graph turned over the shot's own clock: a building's panel is a staged set piece (`<environment>/<element>`) and a prop's leaf is a lowered articulation joint (`<placement>/<joint>`), so one channel serves both.
 *
 * Every clip first passes the transform-clip artifact rule with a channel gate that refuses, each with its own path and reason:
 *
 * - a node no shot staged, or a joint no staged prop declares, because a clip addressing nothing would be stored and rendered as silence;
 * - a node a performance already drives, because a transform clip written over a rig would fight the pose every frame;
 * - a channel a baked clip already drives, and an id a baked clip or an earlier authored clip already carries, because each channel and each clip id has one authority;
 * - a key outside `[0, duration]`, which no frame reads;
 * - `cubicspline` interpolation, because a spline's tangents can overshoot a travel bound between two keys that both satisfy it, and nothing downstream clamps an object clip.
 *
 * A scene whose lowered graph carries one id twice is refused at the gate's path, since no frame can be resolved for it. Only a prop `forgeProp` accepts contributes joints; its own refusals belong to `forgeProp` and the placement gate. When all of that passes and a staged prop binds an articulation profile, the clips resolve through {@link resolveFrame} at time `0`, at every authored key, at analytical quaternion-component extrema and just inside key boundaries. Periodic direct curves share their first-cycle bound. Profiles bind at their placement prefix, and a channel the clips drive past its declared travel is reported once, naming the profile. A channel a clip does not drive is never blamed, even if its rest pose breaches. An empty clip list answers no violations. The critical clock bounds directly interpolated components; it does not derive additional extrema for nonlinear channel-space driver combinations.
 *
 * @param gate The clips, the staged scene and what the shot already drives.
 * @returns The violations, empty when every clip is admitted.
 *
 * @evidence contracts/common.md#principled-implementation The same resolveFrame CONSTRAIN stage checks the opening, authored keys, one-sided boundaries and analytical rotation-component extrema supplied by authoredRotationCriticalTimes. Scalar linear/step interpolation stays within endpoint ranges; quaternion SLERP and normalized lerp can exceed endpoint component bounds, so their derivative roots are explicitly evaluated. The actual clip sequence decides authority at every clock, and floating clock rounding remains; nonlinear driver combinations have no additional stationary-point solver here.
 * @evidence contracts/common.md#clear-and-simple-design The artifact rule is `validateClipArtifact` with a shot-specific channel gate, channel identity is the sampler's own `channelKey`, the joint lowering is `sceneToNodes`, and the bound is `resolveFrame`, so this function only states which nodes and channels a shot admits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No door, prop, joint or shot is special-cased; every refusal is a stated rule, the channel key is built from validated fields rather than cast from an unchecked record, and a breach on an undriven channel is left to the prop's own gate instead of being blamed here.
 * @evidence contracts/common.md#meaningful-documentation States the two promises the gate fulfils, every refusal with its reason, the duplicate-id refusal, which props contribute joints, when and how the travel bound is measured, the one-report-per-channel rule, the undriven-channel exemption, and the empty-list answer.
 * @evidence contracts/performance.md#efficient-algorithms Typed outer clip/track records are a caller premise before post-validation reads. Artifact checks traverse clips, tracks and key components; forging every registry prop and sceneToNodes lowering add delegated model/graph costs. Profiled scenes add at most four rotation roots per segment and one-sided boundaries, then resolve the lowered graph, including drivers and constraints, once per distinct instant. Repeated direct loop curves share their first-cycle bound and sets deduplicate clocks and channel membership, without a fixed-rate sampling density.
 * @evidence contracts/performance.md#reuse-equivalent-work The lowered graph, the drivable set, the baked channel and id sets and the profile list are each built once per call and shared by every clip and every sampled instant, and distinct key times are deduplicated so one instant is resolved once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Every set, the lowered graph and the resolved frames are dropped on return; the caller owns the returned violations.
 */
export function gateAuthoredObjectMotions (
  gate: IAutoMovieObjectMotionGate,
): IAutoMovieConstraintViolation[] {
  const out: ViolationCollector = new ViolationCollector();
  if (gate.clips.length === 0) return out.items;

  const registry: Record<string, IAutoMoviePropSpec> = Object.create(null);
  for (const spec of gate.props ?? [])
    if (registry[spec.node] === undefined && forgeProp(spec).success)
      registry[spec.node] = spec;

  const placements: Set<string> = new Set(
    gate.scene.nodes.map((node: IAutoMovieSceneNode): string => node.id),
  );
  const staged: Set<string> = new Set([
    ...placements,
    ...gate.scene.cameras.map((camera: IAutoMovieCamera): string => camera.id),
    ...gate.scene.lights.map((light: IAutoMovieLight): string => light.id),
  ]);
  const lowered: IAutoMovieNode[] = sceneToNodes({
    scene: gate.scene,
    props: registry,
    allowPartialModels: true,
  });

  const seen: Set<string> = new Set();
  const collided: string[] = [];
  for (const node of lowered) {
    if (seen.has(node.id)) collided.push(node.id);
    seen.add(node.id);
  }
  if (collided.length !== 0)
    out.push(
      "type",
      gate.path,
      `the lowered scene carries ${collided[0]!} twice, so no object clip over this shot can be resolved; rename the colliding scene node or prop joint`,
      collided,
    );

  const drivable: Set<string> = new Set(
    lowered
      .map((node: IAutoMovieNode): string => node.id)
      .filter((id: string): boolean => !staged.has(id)),
  );
  for (const id of placements) if (!gate.performed.has(id)) drivable.add(id);
  // Keyed by channel rather than by node, the grain the sampler resolves at: a
  // baked flight owning a projectile's translation leaves its rotation free.
  const bakedChannels: Set<string> = new Set(
    gate.baked.flatMap((clip: IAutoMovieClip): string[] =>
      clip.tracks.map((track: IAutoMovieTrack): string =>
        channelKey(track.channel),
      ),
    ),
  );
  const bakedIds: Set<string> = new Set(
    gate.baked.map((clip: IAutoMovieClip): string => clip.id),
  );

  const channelGate: IAutoMovieClipChannelGate = (
    channel: Record<string, unknown>,
    channelPath: string,
    violations: IAutoMovieConstraintViolation[],
  ): void => {
    validateHonorableChannel(channel, channelPath, violations);
    const node: unknown = channel.node;
    if (channel.kind !== "node" || typeof node !== "string") return;
    if (!drivable.has(node)) {
      pushViolation(
        violations,
        "type",
        `${channelPath}.node`,
        gate.performed.has(node)
          ? `object motion node "${node}" is driven by this shot's performance; a performer moves off its rig, not off a transform clip`
          : `object motion node "${node}" is neither a staged scene node nor a lowered prop articulation joint of this shot`,
        node,
      );
      return;
    }
    // An unknown path was already refused by the honorable-channel rule and
    // has no canonical key to compare.
    const path: IAutoMovieNodeChannel["path"] =
      channel.path as IAutoMovieNodeChannel["path"];
    if (!NODE_CHANNEL_PATHS.has(path)) return;
    const key: string = channelKey({ kind: "node", node, path });
    if (bakedChannels.has(key))
      pushViolation(
        violations,
        "type",
        channelPath,
        `object motion channel "${key}" is already driven by a clip this shot baked; one channel carries one authority`,
        key,
      );
  };

  const ids: Map<string, number> = new Map();
  const times: Set<number> = new Set([0]);
  gate.clips.forEach((clip: IAutoMovieClip, index: number): void => {
    const path: string = `${gate.path}[${index}]`;
    validateClipArtifact(clip, path, out.items, channelGate);
    const first: number | undefined = ids.get(clip.id);
    if (first !== undefined)
      out.push(
        "type",
        `${path}.id`,
        `object motion clip id "${clip.id}" duplicates ${gate.path}[${first}].id`,
        clip.id,
      );
    else if (bakedIds.has(clip.id))
      out.push(
        "type",
        `${path}.id`,
        `object motion clip id "${clip.id}" collides with a clip this shot baked`,
        clip.id,
      );
    else ids.set(clip.id, index);

    clip.tracks.forEach((track: IAutoMovieTrack, trackIndex: number): void => {
      const trackPath: string = `${path}.tracks[${trackIndex}]`;
      if (track.interpolation === "cubicspline")
        out.push(
          "type",
          `${trackPath}.interpolation`,
          "an object motion track interpolates step or linear; a spline's tangents can leave a declared travel between two keys, and nothing clamps an object clip downstream",
          track.interpolation,
        );
      track.times.forEach((time: number, timeIndex: number): void => {
        if (Number.isFinite(time) && time >= 0 && time <= gate.duration) {
          times.add(time);
          return;
        }
        out.push(
          "range",
          `${trackPath}.times[${timeIndex}]`,
          `object motion key must land inside the shot's own clock of 0..${gate.duration}s`,
          time,
        );
      });
    });
  });
  if (out.items.length > 0) return out.items;

  const profiles: IAutoMovieProfileApplication[] = gate.scene.nodes.flatMap(
    (placement: IAutoMovieSceneNode): IAutoMovieProfileApplication[] => {
      const spec: IAutoMoviePropSpec | undefined = registry[placement.model];
      if (spec === undefined || spec.articulation === null) return [];
      return [
        {
          profile: spec.articulation.profile,
          binding: spec.articulation.binding,
          nodePrefix: placementNodePrefix(placement.id),
        },
      ];
    },
  );
  if (profiles.length === 0) return out.items;
  for (const time of authoredRotationCriticalTimes(gate.clips, gate.duration)) times.add(time);
  // Only the channels these clips drive: `resolveFrame` clamps every bound
  // profile, so a prop whose rest joint already sits outside its own travel
  // would breach here too, and that is its own gate's fault to report.
  const driven: Set<string> = new Set(
    gate.clips.flatMap((clip: IAutoMovieClip): string[] =>
      clip.tracks.map((track: IAutoMovieTrack): string =>
        channelKey(track.channel),
      ),
    ),
  );
  const reported: Set<string> = new Set();
  for (const seconds of [...times].sort(
    (left: number, right: number): number => left - right,
  )) {
    const violations: IAutoMovieResolveViolation[] = resolveFrame({
      nodes: lowered,
      clip: gate.clips,
      limits: [],
      profiles,
      seconds,
    }).violations;
    for (const violation of violations) {
      // One channel, one refusal: a hinge held past its travel breaches at
      // every sampled key, and the author corrects one number.
      if (!driven.has(violation.channel) || reported.has(violation.channel))
        continue;
      reported.add(violation.channel);
      out.push(
        "range",
        gate.path,
        `object motion drives "${violation.channel}" past the travel profile "${violation.profile}" declares for it`,
        violation.channel,
      );
    }
  }
  return out.items;
}
