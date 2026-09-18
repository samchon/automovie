import type { IAutoMovieAcousticResponseProfile, IAutoMovieCompiledShotSource, IAutoMovieFilmTimeline, IAutoMovieProductionSoundPlan, IAutoMovieShotContract, IAutoMovieSoundPropagationProfile } from "@automovie/interface";
import { resolveCameraAt } from "../film/resolveCameraAt";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { deriveAutoMovieSoundPropagation } from "./soundPropagation";
import { compareCodeUnits } from "../text/compareCodeUnits";

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
