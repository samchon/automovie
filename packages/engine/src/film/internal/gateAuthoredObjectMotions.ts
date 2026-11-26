import {
  IAutoMovieCamera,
  type IAutoMovieChannel,
  IAutoMovieClip,
  type IAutoMovieClipChannelGate,
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMovieNode,
  type IAutoMovieObjectMotionGate,
  type IAutoMovieProfileApplication,
  IAutoMoviePropSpec,
  type IAutoMovieResolveViolation,
  IAutoMovieSceneNode,
  IAutoMovieTrack,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { channelKey } from "../../resolve/channelKey";
import { placementNodePrefix } from "../../resolve/placementNodePrefix";
import { resolveFrame } from "../../resolve/resolveFrame";
import { sceneToNodes } from "../../resolve/sceneToNodes";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { pushViolation } from "../../validation/pushViolation";
import { validateClipArtifact } from "../../validation/validateClipArtifact";
import { validateHonorableChannel } from "../../validation/validateHonorableChannel";
import { authoredRotationCriticalTimes } from "./authoredRotationCriticalTimes";
import { forgeProp } from "./forgeProp";

/**
 * Gate the object clips a shot's source authored, so a moving thing that is not
 * a performer can reach a compiled shot.
 *
 * {@link builtOpeningPanelPlacements} promises that a door which swings on
 * screen is an `objectMotions` clip over the panel node ids it answers with,
 * and {@link IAutoMoviePropArticulation} promises that a prop's hinge is a
 * lowered joint a clip drives. Both are one thing, a node in the staged graph
 * turned over the shot's own clock: a building's panel is a staged set piece
 * (`<environment>/<element>`) and a prop's leaf is a lowered articulation joint
 * (`<placement>/<joint>`), so one channel serves both.
 *
 * Every clip first passes the transform-clip artifact rule with a channel gate
 * that refuses, each with its own path and reason:
 *
 * - A node no shot staged, or a joint no staged prop declares, because a clip
 *   addressing nothing would be stored and rendered as silence;
 * - A node a performance already drives, because a transform clip written over a
 *   rig would fight the pose every frame;
 * - A channel a baked clip already drives, and an id a baked clip or an earlier
 *   authored clip already carries, because each channel and each clip id has
 *   one authority;
 * - A key outside `[0, duration]`, which no frame reads;
 * - `cubicspline` interpolation, because a spline's tangents can overshoot a
 *   travel bound between two keys that both satisfy it, and nothing downstream
 *   clamps an object clip.
 *
 * A scene whose lowered graph carries one id twice is refused at the gate's
 * path, since no frame can be resolved for it. Only a prop `forgeProp` accepts
 * contributes joints; its own refusals belong to `forgeProp` and the placement
 * gate. When all of that passes and a staged prop binds an articulation
 * profile, the clips resolve through {@link resolveFrame} at time `0`, at every
 * authored key, at analytical quaternion-component extrema and just inside key
 * boundaries. Periodic direct curves share their first-cycle bound. Profiles
 * bind at their placement prefix, and a channel the clips drive past its
 * declared travel is reported once, naming the profile. A channel a clip does
 * not drive is never blamed, even if its rest pose breaches. An empty clip list
 * answers no violations. The critical clock bounds directly interpolated
 * components; it does not derive additional extrema for nonlinear channel-space
 * driver combinations.
 *
 * @param gate The clips, the staged scene and what the shot already drives.
 * @returns The violations, empty when every clip is admitted.
 */
export function gateAuthoredObjectMotions(
  gate: IAutoMovieObjectMotionGate,
): IAutoMovieConstraintViolation[] {
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
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
    channel: IAutoMovieChannel,
    channelPath: string,
    violations: IAutoMovieConstraintViolation[],
  ): void => {
    validateHonorableChannel(channel, channelPath, violations);
    if (channel.kind !== "node") return;
    const node: string = channel.node;
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
    const key: string = channelKey(channel);
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
        if (time >= 0 && time <= gate.duration) {
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
  for (const time of authoredRotationCriticalTimes(gate.clips, gate.duration))
    times.add(time);
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
