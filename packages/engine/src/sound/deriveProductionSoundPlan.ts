import type { IAutoMovieAcousticResponseProfile, IAutoMovieCompiledShotSource, IAutoMovieFilmTimeline, IAutoMovieFormationBounds, IAutoMovieProductionSoundPlan, IAutoMovieShotContract, IAutoMovieSoundPropagationProfile, IAutoMovieVector3 } from "@automovie/interface";
import { resolveCameraAt } from "../film/resolveCameraAt";
import { sampleFormationMotion } from "../sampleFormationMotion";
import { transformFormationBounds } from "../transformFormationBounds";
import { transformFormationPoint } from "../transformFormationPoint";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { deriveAutoMovieSoundPropagation } from "./deriveAutoMovieSoundPropagation";

/**
 * Lower semantic shot events, authored score cues, and shared caption timing
 * into one immutable sound plan on the finished-film clock.
 *
 * Each event's source is the extended incoherent mass its subjects add up to
 * ({@link resolveSourceMass}), not a bare point: the plan carries how many
 * members sound ({@link IAutoMovieProductionSoundEvent.memberCount}), how far
 * they are spread ({@link IAutoMovieProductionSoundEvent.spreadRadiusMeters}),
 * and the `sqrt(N)` level that many uncorrelated sources produce
 * ({@link IAutoMovieProductionSoundEvent.densityGain}), so a mass sounds like a
 * mass and a crowd's size is audible rather than assumed. A lone actor is a
 * one-member mass of zero radius and plans exactly as it always did.
 *
 * @evidence requirements/sound/event-cues-and-timing.md#sound-event-derived-timing Places each semantic sound occurrence on the finished-film clock.
 * @evidence requirements/sound/scope-and-identity.md#sound-emission-presentation Keeps the semantic emission frame while an optional propagation receipt carries a separate listener-arrival frame.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-kind-and-event-timing Lowers authored and event-derived sources into one ordered sound plan.
 * @evidence requirements/sound/spatialization-and-propagation.md#sound-extended-group-sources Aggregates resolved formation members into centroid, spread, and density gain.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-extended-group-source-aggregation Implements the bounded group-source reduction before mixing.
 */
export const deriveProductionSoundPlan = (props: {
  timeline: IAutoMovieFilmTimeline;
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;
  /** Explicit production-owned direct-path model, when selected. */
  propagationProfile?: IAutoMovieSoundPropagationProfile;
  /** Explicit production-owned room-response source, when selected. */
  acousticProfile?: IAutoMovieAcousticResponseProfile;
}): IAutoMovieProductionSoundPlan => {
  const events: IAutoMovieProductionSoundPlan["events"] = [];
  props.timeline.segments.forEach((segment, segmentIndex) => {
    const contract = props.contracts.get(segment.shot);
    const compiled = props.compiled.get(segment.shot);
    if (contract === undefined || compiled === undefined)
      throw new Error(
        `Sound planning requires current contract and compiled source for shot "${segment.shot}".`,
      );
    const camera = compiled.scene.cameras.find(
      (candidate) => candidate.id === compiled.shot.camera,
    );
    if (camera === undefined)
      throw new Error(
        `Sound planning cannot find shot "${segment.shot}" camera "${compiled.shot.camera}".`,
      );
    for (const sample of compiled.eventSamples) {
      const event = contract.events.find(
        (candidate) => candidate.id === sample.id,
      );
      if (event === undefined)
        throw new Error(
          `Compiled shot "${segment.shot}" sampled undeclared event "${sample.id}".`,
        );
      const sourceFrame = Math.round(sample.time * props.timeline.fps);
      if (
        sourceFrame < segment.sourceInFrame ||
        sourceFrame >= segment.sourceOutFrame
      )
        continue;
      const frame = segment.startFrame + sourceFrame - segment.sourceInFrame;
      const listener = resolveCameraAt(
        camera.transform,
        compiled.shot.cameraMotion,
        camera.id,
        sample.time,
      );
      const mass = resolveSourceMass(compiled, event.subjects, sample.time);
      const emitter = mass.centroid;
      const delta = Vector3.subtract(emitter, listener.position);
      const distanceMeters = Vector3.length(delta);
      const local = Quaternion.rotateVector(
        Quaternion.inverse(listener.rotation),
        delta,
      );
      // The listener is not `distanceMeters` from a source that has size: it is
      // that far from the CENTROID. Substituting the root-mean-square
      // source/listener distance is the whole of the extended-source model, and
      // it serves the pan and the attenuation from one number.
      const spreadRadiusMeters = Math.sqrt(mass.variance);
      const rmsDistanceMeters = Math.hypot(distanceMeters, spreadRadiusMeters);
      events.push({
        id: `${segmentIndex}:${segment.shot}:${event.id}`,
        shot: segment.shot,
        event: event.id,
        kind: event.kind,
        frame,
        timeSeconds: frame / props.timeline.fps,
        emitter,
        listener: listener.position,
        distanceMeters,
        memberCount: mass.count,
        spreadRadiusMeters,
        densityGain: Math.sqrt(mass.count),
        pan: clamp(local.x / Math.max(rmsDistanceMeters, 1e-9), -1, 1),
        attenuation: 1 / (1 + 0.08 * rmsDistanceMeters * rmsDistanceMeters),
        ...(props.propagationProfile === undefined
          ? {}
          : {
              propagation: deriveAutoMovieSoundPropagation({
                distanceMeters: rmsDistanceMeters,
                emissionFrame: frame,
                segmentEndFrame: segment.endFrame,
                fps: props.timeline.fps,
                totalFrames: props.timeline.totalFrames,
                profile: props.propagationProfile,
              }),
            }),
        seed: soundSeed(
          `${props.timeline.inputFingerprint}|${segmentIndex}|${segment.shot}|${event.id}|${frame}`,
        ),
      });
    }
  });
  return {
    version: 1,
    inputFingerprint: props.timeline.inputFingerprint,
    fps: props.timeline.fps,
    frameRate: props.timeline.frameRate,
    totalFrames: props.timeline.totalFrames,
    sampleRate: 48_000,
    channels: 2,
    ...(props.propagationProfile === undefined
      ? {}
      : {
          propagationProfile: clonePropagationProfile(props.propagationProfile),
        }),
    ...(props.acousticProfile === undefined
      ? {}
      : { acousticProfile: cloneAcousticProfile(props.acousticProfile) }),
    events: events.sort(
      (left, right) =>
        left.frame - right.frame || compareCodeUnits(left.id, right.id),
    ),
    cues: props.timeline.tracks.audio.map((cue) => ({
      id: cue.id,
      asset: cue.asset,
      startFrame: cue.startFrame,
      durationFrames: cue.durationFrames,
      sourceOffsetFrame: cue.sourceOffsetFrame,
      sourceDurationFrames: cue.sourceDurationFrames,
      gain: cue.gain,
      fadeInFrames: cue.fadeInFrames,
      fadeOutFrames: cue.fadeOutFrames,
      bus: cue.bus,
      seed: soundSeed(
        `${props.timeline.inputFingerprint}|cue|${cue.id}|${cue.asset}`,
      ),
    })),
    dialogue: props.timeline.tracks.captions.map((line) => ({ ...line })),
  };
};

/**
 * One subject's contribution to an event's sound source: where its members are
 * centered, how many there are, and how far they lie from that center.
 *
 * `variance` is the MEAN SQUARED radius in m^2, not the radius, because that is
 * the quantity that composes: variances of disjoint groups add by weight, radii
 * do not.
 */
interface IAutoMovieSoundMass {
  centroid: IAutoMovieVector3;
  count: number;
  variance: number;
}

/**
 * Where an event's sound comes from, how much of it there is, and how far it is
 * spread: the extended incoherent source its subjects add up to.
 *
 * A subject is a scene node (one member, no size), a formation, or an instance
 * set (a member count and a compiled bounding box). Only the count and the box
 * are read, never the individual slots: a compact formation deliberately never
 * stores its members, and a source that had to expand a hundred thousand of
 * them to be heard would not be heard at all.
 *
 * ## Combining subjects
 *
 * Each member is one equal, mutually uncorrelated source, so the group's
 * acoustic center is the member-count-weighted mean of the subject centroids,
 * not their arithmetic mean. The unweighted mean was the second half of the
 * scale defect: an event naming one figure and the crowd behind it emitted from
 * the empty midpoint between them, as though the crowd were one person.
 *
 * The combined spread follows by the parallel-axis identity, which makes it
 * exact rather than approximate:
 *
 *     variance = sum_i n_i * (variance_i + |centroid_i - centroid|^2) / sum_i n_i
 *
 * ## A group's own radius
 *
 * The compiled runtime publishes a member count and an axis-aligned box, so the
 * members are taken as uniformly distributed over that box, the only
 * distribution its two facts support. For a uniform box with half-extents `h`,
 * the mean squared distance from the center is `(hx^2 + hy^2 + hz^2)/3`, one
 * third of the squared half-diagonal.
 *
 * A formation's box is transformed by its live cue first
 * ({@link transformFormationBounds}), because a cue that rescales spacing
 * changes the crowd's size, and a crowd closing ranks should tighten in the mix
 * exactly as it tightens on screen.
 *
 * Throwing when nothing resolves also covers the degenerate group: a subject
 * table that names only empty sets contributes no sources, and no sources is
 * silence, which is a contradiction in an event the contract says is audible.
 */
const resolveSourceMass = (
  compiled: IAutoMovieCompiledShotSource,
  subjects: readonly string[],
  time: number,
): IAutoMovieSoundMass => {
  const sampled = sampleClipSequence(compiled.shot.objectMotions, time);
  const resolved = subjects.flatMap((subject): IAutoMovieSoundMass[] => {
    const node = compiled.scene.nodes.find(
      (candidate) => candidate.id === subject,
    );
    if (node !== undefined) {
      const translation = sampled.get(`node:${subject}:translation`)?.value;
      return [
        {
          centroid:
            translation === undefined
              ? node.transform.translation
              : { x: translation[0]!, y: translation[1]!, z: translation[2]! },
          count: 1,
          variance: 0,
        },
      ];
    }
    const formation = compiled.formations.find(
      (candidate) => candidate.id === subject,
    );
    if (formation !== undefined) {
      const motion = sampleFormationMotion(
        compiled.formationMotions ?? [],
        formation.id,
        time,
      );
      return [
        {
          centroid: transformFormationPoint(
            formation.centroid,
            formation.anchor,
            motion,
            formation.facingDeg,
          ),
          count: formation.count,
          variance: boxVariance(
            transformFormationBounds(
              formation.bounds,
              formation.anchor,
              motion,
              formation.facingDeg,
            ),
          ),
        },
      ];
    }
    const instances = compiled.instanceSets.find(
      (candidate) => candidate.id === subject,
    );
    return instances === undefined
      ? []
      : [
          {
            centroid: instances.centroid,
            count: instances.count,
            variance: boxVariance(instances.bounds),
          },
        ];
  });
  const count = resolved.reduce((sum, mass) => sum + mass.count, 0);
  if (count === 0)
    throw new Error(
      `Sound event in shot "${compiled.shot.id}" has no spatially resolved subject among ${subjects.join(", ")}.`,
    );
  const centroid = Vector3.scale(
    resolved.reduce(
      (sum, mass) => Vector3.add(sum, Vector3.scale(mass.centroid, mass.count)),
      Vector3.create(),
    ),
    1 / count,
  );
  const variance =
    resolved.reduce((sum, mass) => {
      const offset = Vector3.length(Vector3.subtract(mass.centroid, centroid));
      return sum + mass.count * (mass.variance + offset * offset);
    }, 0) / count;
  return { centroid, count, variance };
};

/**
 * The mean squared distance from the center of an axis-aligned box to a point
 * drawn uniformly inside it: `(hx^2 + hy^2 + hz^2)/3` over its half-extents.
 *
 * Each axis is independent and uniform over `[-h, h]`, whose second moment is
 * `h^2/3`; summing the three gives the whole. A degenerate box (one slot, or a
 * line of them) correctly yields zero on the collapsed axes, so a single-member
 * formation is a point source and mixes exactly as it did before size existed.
 */
const boxVariance = (bounds: IAutoMovieFormationBounds): number => {
  const x = (bounds.max.x - bounds.min.x) / 2;
  const y = (bounds.max.y - bounds.min.y) / 2;
  const z = (bounds.max.z - bounds.min.z) / 2;
  return (x * x + y * y + z * z) / 3;
};

/** Defensively retain the exact selected propagation profile in the plan. */
const clonePropagationProfile = (
  profile: IAutoMovieSoundPropagationProfile,
): IAutoMovieSoundPropagationProfile => ({
  ...profile,
  distanceGain: { ...profile.distanceGain },
  spectral: { ...profile.spectral },
  assumptions: [...profile.assumptions],
});

/** Defensively retain the exact selected room-response source in the plan. */
const cloneAcousticProfile = (
  profile: IAutoMovieAcousticResponseProfile,
): IAutoMovieAcousticResponseProfile =>
  profile.kind === "derived-room-analysis"
    ? { ...profile }
    : {
        ...profile,
        roomMappings: profile.roomMappings.map((mapping) => ({ ...mapping })),
        ...(profile.provider === undefined
          ? {}
          : { provider: { ...profile.provider } }),
      };

const soundSeed = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; ++index) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;
