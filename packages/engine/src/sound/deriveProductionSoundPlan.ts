import { IAutoMovieAcousticResponseProfile, IAutoMovieCompiledShotSource, IAutoMovieFilmTimeline, IAutoMovieFormationBounds, IAutoMovieProductionSoundPlan, IAutoMovieShotContract, IAutoMovieSoundPropagationProfile, IAutoMovieVector3, IAutoMovieFilmTimelineSegment, IAutoMovieCamera, IAutoMovieShotEventContract, IAutoMovieProductionSoundEvent, IAutoMovieSceneNode, IAutoMovieCompiledFormation, IAutoMovieCompiledInstanceSet } from "@automovie/interface";
import { resolveCameraAt } from "../film/resolveCameraAt";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { sampleFormationMotion } from "../sampleFormationMotion";
import { transformFormationBounds } from "../transformFormationBounds";
import { transformFormationPoint } from "../transformFormationPoint";
import { deriveAutoMovieSoundPropagation } from "./deriveAutoMovieSoundPropagation";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { IAutoMovieResolvedCamera } from "../film/IAutoMovieResolvedCamera";
import { IAutoMovieSampledChannel } from "../resolve/IAutoMovieSampledChannel";
import { IAutoMovieSampledFormationMotion } from "../IAutoMovieSampledFormationMotion";
/**
 * Lower semantic shot events and authored cues/dialogue onto one finished-film sound clock.
 *
 * @evidence contracts/common.md#principled-implementation Event trim joins use the film frame clock; subject masses combine count-weighted centroids and parallel-axis variance, approximating formations/instances as uniform axis-aligned boxes. sqrt(memberCount), RMS distance, softened attenuation and clamped pan are declared source-model choices, not measured member distributions.
 * @evidence contracts/common.md#clear-and-simple-design The plan owner joins current shot contract/compiled source and camera sampling, while propagation is optional receipt derivation; acousticProfile is copied into the plan but does not derive per-event acoustic responses here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown individual subjects are skipped if another resolves, but zero total resolved mass throws. Missing compiled evidence/camera/events throws, and finite assumptions do not establish byte provenance or universal cross-host transcendental identity.
 * @evidence contracts/common.md#meaningful-documentation Documents event/cue/dialogue clocks, spatial approximation and fresh arrays; static resolved camera positions can be borrowed in event.listener, so the plan is not deeply immutable. Production delivery validation consumes this planner to compare expected plans.
 * @evidence contracts/performance.md#efficient-algorithms For E event samples, each event can scan declared events, subject node/formation/instance lists and object motions; camera/source sampling plus final O(E log E) sort dominate, and event/cue/dialogue arrays use O(E+C+L) storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Current contract/source maps share identity lookup and one camera/source mass serves each event's pan/attenuation/optional propagation; all object motions are still sampled per resolved event, with no cross-event pose cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh plan arrays and copied profiles, while listener positions may retain static camera translations; local mass parts and sampled channels leave scope, and no audio assets or decoder handles are acquired.
 * @author Samchon
 */
export const deriveProductionSoundPlan: (props: { timeline: IAutoMovieFilmTimeline; contracts: ReadonlyMap<string, IAutoMovieShotContract>; compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>; propagationProfile?: IAutoMovieSoundPropagationProfile | undefined; acousticProfile?: IAutoMovieAcousticResponseProfile | undefined; }) => IAutoMovieProductionSoundPlan = (props: {
  timeline: IAutoMovieFilmTimeline;
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;
  /** Explicit production-owned direct-path model, when selected. */
  propagationProfile?: IAutoMovieSoundPropagationProfile;
  /** Explicit production-owned room-response source, when selected. */
  acousticProfile?: IAutoMovieAcousticResponseProfile;
}): IAutoMovieProductionSoundPlan => {
  const events: IAutoMovieProductionSoundPlan["events"] = [];
  props.timeline.segments.forEach((segment: IAutoMovieFilmTimelineSegment, segmentIndex: number): void => {
    const contract: IAutoMovieShotContract | undefined = props.contracts.get(segment.shot);
    const compiled: IAutoMovieCompiledShotSource | undefined = props.compiled.get(segment.shot);
    if (contract === undefined || compiled === undefined)
      throw new Error(
        `Sound planning requires current contract and compiled source for shot "${segment.shot}".`,
      );
    const camera: IAutoMovieCamera | undefined = compiled.scene.cameras.find(
      (candidate: IAutoMovieCamera): boolean => candidate.id === compiled.shot.camera,
    );
    if (camera === undefined)
      throw new Error(
        `Sound planning cannot find shot "${segment.shot}" camera "${compiled.shot.camera}".`,
      );
    for (const sample of compiled.eventSamples) {
      const event: IAutoMovieShotEventContract | undefined = contract.events.find(
        (candidate: IAutoMovieShotEventContract): boolean => candidate.id === sample.id,
      );
      if (event === undefined)
        throw new Error(
          `Compiled shot "${segment.shot}" sampled undeclared event "${sample.id}".`,
        );
      const sourceFrame: number = Math.round(sample.time * props.timeline.fps);
      if (
        sourceFrame < segment.sourceInFrame ||
        sourceFrame >= segment.sourceOutFrame
      )
        continue;
      const frame: number = segment.startFrame + sourceFrame - segment.sourceInFrame;
      const listener: IAutoMovieResolvedCamera = resolveCameraAt(
        camera.transform,
        compiled.shot.cameraMotion,
        camera.id,
        sample.time,
      );
      const mass: IAutoMovieSoundMass = resolveSourceMass(compiled, event.subjects, sample.time);
      const emitter: IAutoMovieVector3 = mass.centroid;
      const delta: IAutoMovieVector3 = Vector3.subtract(emitter, listener.position);
      const distanceMeters: number = Vector3.length(delta);
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(listener.rotation),
        delta,
      );
      // The listener is not `distanceMeters` from a source that has size: it is
      // that far from the CENTROID. Substituting the root-mean-square
      // source/listener distance is the whole of the extended-source model, and
      // it serves the pan and the attenuation from one number.
      const spreadRadiusMeters: number = Math.sqrt(mass.variance);
      const rmsDistanceMeters: number = Math.hypot(distanceMeters, spreadRadiusMeters);
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
      (left: IAutoMovieProductionSoundEvent, right: IAutoMovieProductionSoundEvent): number =>
        left.frame - right.frame || compareCodeUnits(left.id, right.id),
    ),
    cues: props.timeline.tracks.audio.map((cue: { id: string; asset: string; sourceDurationFrames: number; sourceOffsetFrame: number; startFrame: number; durationFrames: number; gain: number; fadeInFrames: number; fadeOutFrames: number; bus: "dialogue" | "music" | "effects" | "ambience"; }): { id: string; asset: string; startFrame: number; durationFrames: number; sourceOffsetFrame: number; sourceDurationFrames: number; gain: number; fadeInFrames: number; fadeOutFrames: number; bus: "dialogue" | "music" | "effects" | "ambience"; seed: number; } => ({
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
    dialogue: props.timeline.tracks.captions.map((line: { id: string; text: string; language: string; speaker?: string | undefined; startFrame: number; endFrame: number; }): { id: string; text: string; language: string; speaker?: string | undefined; startFrame: number; endFrame: number; } => ({ ...line })),
  };
};

/**
 * One subject's contribution to an event's sound source: where its members are
 * centered, how many there are, and how far they lie from that center.
 *
 * Variance is a modeled mean squared radius in square metres; group values
 * use a uniform-box approximation and combine by the parallel-axis identity.
 */
interface IAutoMovieSoundMass {
  /** Modeled centre in the shot's world metre frame; temporary subject records may borrow it. */
  centroid: IAutoMovieVector3;

  /** Equal-source member count supplied by the compiled subject. */
  count: number;

  /** Modeled mean squared radius about centroid, in square metres. */
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
 * The model treats each member as one equal, mutually uncorrelated source and
 * combines subject centroids by member count.
 *
 * Given each modeled group variance, the parallel-axis identity combines it:
 *
 *     variance = sum_i n_i * (variance_i + |centroid_i - centroid|^2) / sum_i n_i
 *
 * ## A group's own radius
 *
 * The compiled runtime publishes a member count and an axis-aligned box, so the
 * members are approximated as uniformly distributed over that box. Count and
 * bounds alone do not determine an actual distribution. For half-extents `h`,
 * the mean squared distance from the center is `(hx^2 + hy^2 + hz^2)/3`, one
 * third of the squared half-diagonal.
 *
 * A formation's box is transformed by its live cue first
 * ({@link transformFormationBounds}), because a cue that rescales spacing
 * changes the bounding-box approximation used by the mix.
 *
 * Throwing when nothing resolves also covers the degenerate group: a subject
 * table that names only empty sets contributes no sources, and no sources is
 * silence, which is a contradiction in an event the contract says is audible.
 */
const resolveSourceMass: (compiled: IAutoMovieCompiledShotSource, subjects: readonly string[], time: number) => IAutoMovieSoundMass = (
  compiled: IAutoMovieCompiledShotSource,
  subjects: readonly string[],
  time: number,
): IAutoMovieSoundMass => {
  const sampled: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(compiled.shot.objectMotions, time);
  const resolved: IAutoMovieSoundMass[] = subjects.flatMap((subject: string): IAutoMovieSoundMass[] => {
    const node: IAutoMovieSceneNode | undefined = compiled.scene.nodes.find(
      (candidate: IAutoMovieSceneNode): boolean => candidate.id === subject,
    );
    if (node !== undefined) {
      const translation: number[] | undefined = sampled.get(`node:${subject}:translation`)?.value;
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
    const formation: IAutoMovieCompiledFormation | undefined = compiled.formations.find(
      (candidate: IAutoMovieCompiledFormation): boolean => candidate.id === subject,
    );
    if (formation !== undefined) {
      const motion: IAutoMovieSampledFormationMotion = sampleFormationMotion(
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
    const instances: IAutoMovieCompiledInstanceSet | undefined = compiled.instanceSets.find(
      (candidate: IAutoMovieCompiledInstanceSet): boolean => candidate.id === subject,
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
  const count: number = resolved.reduce((sum: number, mass: IAutoMovieSoundMass): number => sum + mass.count, 0);
  if (count === 0)
    throw new Error(
      `Sound event in shot "${compiled.shot.id}" has no spatially resolved subject among ${subjects.join(", ")}.`,
    );
  const centroid: IAutoMovieVector3 = Vector3.scale(
    resolved.reduce(
      (sum: IAutoMovieVector3, mass: IAutoMovieSoundMass): IAutoMovieVector3 => Vector3.add(sum, Vector3.scale(mass.centroid, mass.count)),
      Vector3.create(),
    ),
    1 / count,
  );
  const variance: number =
    resolved.reduce((sum: number, mass: IAutoMovieSoundMass): number => {
      const offset: number = Vector3.length(Vector3.subtract(mass.centroid, centroid));
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
 * line of them) contributes zero on collapsed axes; a single member whose
 * bounds include visible geometry can still have nonzero modeled spread.
 */
const boxVariance: (bounds: IAutoMovieFormationBounds) => number = (bounds: IAutoMovieFormationBounds): number => {
  const x: number = (bounds.max.x - bounds.min.x) / 2;
  const y: number = (bounds.max.y - bounds.min.y) / 2;
  const z: number = (bounds.max.z - bounds.min.z) / 2;
  return (x * x + y * y + z * z) / 3;
};

/** Defensively retain the exact selected propagation profile in the plan. */
const clonePropagationProfile: (profile: IAutoMovieSoundPropagationProfile) => IAutoMovieSoundPropagationProfile = (
  profile: IAutoMovieSoundPropagationProfile,
): IAutoMovieSoundPropagationProfile => ({
  ...profile,
  distanceGain: { ...profile.distanceGain },
  spectral: { ...profile.spectral },
  assumptions: [...profile.assumptions],
});

/** Defensively retain the exact selected room-response source in the plan. */
const cloneAcousticProfile: (profile: IAutoMovieAcousticResponseProfile) => IAutoMovieAcousticResponseProfile = (
  profile: IAutoMovieAcousticResponseProfile,
): IAutoMovieAcousticResponseProfile =>
  profile.kind === "derived-room-analysis"
    ? { ...profile }
    : {
        ...profile,
        roomMappings: profile.roomMappings.map((mapping: { source: string; listener: string; response: string; }): { source: string; listener: string; response: string; } => ({ ...mapping })),
        ...(profile.provider === undefined
          ? {}
          : { provider: { ...profile.provider } }),
      };

/** Fold UTF-16 code units through 32bit FNV arithmetic to seed the procedural palette; collisions are allowed and this value does not certify plan or asset identity. */
const soundSeed: (value: string) => number = (value: string): number => {
  let hash: number = 0x811c9dc5;
  for (let index: number = 0; index < value.length; ++index) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** Clip the calculated pan to the declared scalar interval; NaN remains NaN for malformed spatial arithmetic rather than being replaced by a plausible direction. */
const clamp: (value: number, minimum: number, maximum: number) => number = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
