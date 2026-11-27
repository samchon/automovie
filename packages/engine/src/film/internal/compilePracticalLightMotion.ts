import type {
  AutoMovieLightProperty,
  IAutoMovieClip,
  IAutoMovieCompilePracticalLightMotion,
  IAutoMovieNodeChannel,
  IAutoMovieQuaternion,
  IAutoMovieSampledChannel,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { Quaternion } from "../../math/Quaternion";
import { channelKey } from "../../resolve/internal/channelKey";
import { LIGHT_CHANNEL_PROPERTIES } from "../../resolve/constants/LIGHT_CHANNEL_PROPERTIES";
import { formatLightPointer } from "../../resolve/internal/formatLightPointer";
import { sampleClipSequence } from "../../resolve/internal/sampleClipSequence";
import { placeTransformedPoint } from "./placeTransformedPoint";

/** Model-local forward axis of an emitter's contact frame. */
const EMITTER_FORWARD: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The spotlight model projects along its local negative Z. */
const SPOT_FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };

/**
 * Bake the position, aim and optional switching of a practical light from a
 * prop's existing motion. Darius Khondji describes using the actors'
 * flashlights as visible sources in [American Cinematographer's account of
 * Seven](https://theasc.com/article/seven-cinematography-khondji-fincher/).
 *
 * Place the emitter at each requested instant using the same shot-local
 * object-motion sampler as baked prop placement. Translation, rotation and
 * scale inherit the staged prop values until their respective channels begin.
 * Emit linear position and spot rotation tracks for resolveShotLighting.
 * Alignment is exact at the bake samples and interpolated between samples.
 * Intensity switches at exact interval boundaries independently of frame
 * spacing. A light whose source is a flame carries the flame's flicker instead:
 * one `step` intensity track on the flame's key grid, `I_on · A(t) / Ā` inside
 * `on` and 0 outside, whether or not `on` is given. A moving prop requires
 * explicit sample times. performShot calls this compiler after collecting
 * coupling and authored object clips, then passes the serializable result
 * through the existing shot light-motion path.
 */
export function compilePracticalLightMotion(
  input: IAutoMovieCompilePracticalLightMotion,
): IAutoMovieClip {
  const {
    id,
    duration,
    light,
    prop,
    emitter,
    objectMotions,
    on,
  }: typeof input = input;
  if (light.type !== "point" && light.type !== "spot")
    throw new Error("a practical light must be a point or spot");
  if (duration <= 0)
    throw new Error("practical light duration must be finite and positive");
  if (light.intensity < 0)
    throw new Error("practical light intensity must be finite and nonnegative");
  if (on !== undefined && !(0 <= on[0] && on[0] < on[1] && on[1] <= duration))
    throw new Error(
      "practical light interval must satisfy 0 <= start < end <= duration",
    );

  const propClips: IAutoMovieClip[] = (objectMotions ?? []).filter(
    (clip: IAutoMovieClip): boolean =>
      clip.tracks.some(
        (track: IAutoMovieTrack): boolean =>
          track.channel.kind === "node" &&
          track.channel.node === prop.id &&
          track.channel.path !== "weights",
      ),
  );
  if (propClips.length > 0 && !input.sampleTimes?.length)
    throw new Error(
      "practical light sample times are required for a moving prop",
    );

  const times: number[] = [
    ...new Set([0, duration, ...(input.sampleTimes ?? []), ...(on ?? [])]),
  ];
  if (times.some((time: number): boolean => !(0 <= time && time <= duration)))
    throw new Error("practical light sample times must lie in [0, duration]");
  times.sort((a: number, b: number): number => a - b);

  // Preserve emitter roll while adapting spot forward. Positive scale can tilt the beam.
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    emitter.frame.rotation,
    EMITTER_FORWARD,
  );
  const emitterRotation: IAutoMovieQuaternion = Quaternion.multiply(
    emitter.frame.rotation,
    AutoMovieEngineKinematics.aimRotation(SPOT_FORWARD, EMITTER_FORWARD),
  );
  const positions: number[] = [];
  const rotations: number[] = [];
  for (const time of times) {
    const world: IAutoMovieTransform = practicalPropWorld(
      prop,
      propClips,
      time,
    );
    const position: IAutoMovieVector3 = placeTransformedPoint(
      world,
      emitter.frame.translation,
    );
    positions.push(position.x, position.y, position.z);
    if (light.type === "spot") {
      const scaled: IAutoMovieVector3 = {
        x: forward.x * world.scale.x,
        y: forward.y * world.scale.y,
        z: forward.z * world.scale.z,
      };
      const rotation: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(
          world.rotation,
          Quaternion.multiply(AutoMovieEngineKinematics.aimRotation(forward, scaled), emitterRotation),
        ),
      );
      rotations.push(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }

  const tracks: IAutoMovieTrack[] = [
    practicalTrack(light.id, "position", times, positions, "linear"),
  ];
  if (light.type === "spot")
    tracks.push(
      practicalTrack(light.id, "rotation", times, rotations, "linear"),
    );
  if (input.flicker !== undefined) {
    // The flame's own grid carries the flicker and the switching together.
    const { times: keys, areas, inside, mean } = input.flicker;
    tracks.push(
      practicalTrack(
        light.id,
        "intensity",
        keys,
        areas.map((area: number, index: number): number =>
          inside[index] ? (light.intensity * area) / mean : 0,
        ),
        "step",
      ),
    );
  } else if (on !== undefined) {
    const [start, end]: typeof on = on;
    tracks.push(
      practicalTrack(
        light.id,
        "intensity",
        start === 0 ? [0, end] : [0, start, end],
        start === 0 ? [light.intensity, 0] : [0, light.intensity, 0],
        "step",
      ),
    );
  }
  return { id, name: null, duration, loop: false, tracks };
}

/** Overlay the canonical started object channels independently on staged TRS. */
function practicalPropWorld(
  prop: IAutoMovieCompilePracticalLightMotion["prop"],
  clips: readonly IAutoMovieClip[],
  time: number,
): IAutoMovieTransform {
  if (clips.length === 0) return prop.transform;
  const sampled: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(
    clips,
    time,
  );
  const read: (path: IAutoMovieNodeChannel["path"]) => number[] | undefined = (
    path: IAutoMovieNodeChannel["path"],
  ): number[] | undefined =>
    sampled.get(channelKey({ kind: "node", node: prop.id, path }))?.value;
  const translation: number[] | undefined = read("translation");
  const rotation: number[] | undefined = read("rotation");
  const scale: number[] | undefined = read("scale");
  return {
    translation:
      translation === undefined
        ? prop.transform.translation
        : { x: translation[0]!, y: translation[1]!, z: translation[2]! },
    rotation:
      rotation === undefined
        ? prop.transform.rotation
        : {
            x: rotation[0]!,
            y: rotation[1]!,
            z: rotation[2]!,
            w: rotation[3]!,
          },
    scale:
      scale === undefined
        ? prop.transform.scale
        : { x: scale[0]!, y: scale[1]!, z: scale[2]! },
  };
}

/** Build a standard pointer track using the same property widths as admission. */
function practicalTrack(
  light: string,
  property: AutoMovieLightProperty,
  times: readonly number[],
  values: number[],
  interpolation: IAutoMovieTrack["interpolation"],
): IAutoMovieTrack {
  return {
    channel: {
      kind: "pointer",
      pointer: formatLightPointer(light, property),
      valueType: LIGHT_CHANNEL_PROPERTIES[property].valueType,
    },
    times: [...times],
    values,
    interpolation,
  };
}
