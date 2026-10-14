import {
  IAutoMoviePlaybackSample,
  IAutoMoviePlaybackTimeline,
  foldRoot,
  playbackCursor,
  projectToNdc,
  resolveCameraAt,
  resolvePoseKeypoints,
  sampleMotion,
  sceneFogTransmittance,
  sequenceTimeline,
} from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieDeliveryCrop,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieScene,
  IAutoMovieSceneNode,
  IAutoMovieSequence,
  IAutoMovieShot,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePoseKeypointActor } from "./IAutoMoviePoseKeypointActor";
import type { IAutoMoviePoseKeypointFrame } from "./IAutoMoviePoseKeypointFrame";
import type { IAutoMoviePoseKeypointSidecar } from "./IAutoMoviePoseKeypointSidecar";
import { frameTimes } from "./frameTimes";
import { shotBeat } from "./shotBeat";

/**
 * Plan the pose-keypoint sidecar of one sequence render.
 *
 * The cut is laid on the output clock by `sequenceTimeline`, the output frames are the `frameTimes` schedule the render captures at `fps`, and a forward `playbackCursor` finds the live shot and its shot-local time on each frame. Every performance of that shot whose motion, skeleton and scene node resolve is sampled at `max(0, time - startOffset)`, and its joints are projected through the shot's camera by `resolvePoseKeypoints` with the given aspect and crop. A frame whose scene or camera does not resolve, and a performance without a motion or with an unresolved reference, contribute no keypoints rather than throwing, so the sidecar still covers every output frame; an unresolved cut shot is refused by the timeline builder.
 *
 * When the scene declares fog, each actor also carries the fog transmittance at the camera depth of its world root, its staged placement with the sampled pose root folded in, through the engine's `sceneFogTransmittance`, the law the viewer hands its shader. Throws for an `fps` that is not a finite positive number, for a cut `sequenceTimeline` cannot lay out, and for a runtime that rounds to zero frames. The host writes the result through `renderPoseKeypointSidecar`.
 *
 * @evidence contracts/common.md#principled-implementation Frames use frameTimes' independently computed binary64 i/fps schedule, whose positive clock supplies the non-decreasing queries the forward cursor requires. Motion sampling, projection and fog use engine functions. Camera depth is projectToNdc's pre-divide depth, unaffected by the discarded frustum-scaled coordinates, so unit frustum arguments preserve that depth; root-sampled fog approximates depth variation across each actor.
 * @evidence contracts/common.md#clear-and-simple-design The planner owns only the frame walk and the per-actor record, the clock, shot resolution, sampling, projection and fog are the engine's, and the beat label is `shotBeat`, shared with the caption plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolvable references contribute nothing rather than a placeholder, `atmosphere` is omitted for a fogless scene rather than written as a default, and no shot, actor or fixture is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the clock, how each frame's shot and each actor's pose are resolved, what is skipped rather than refused, when and how `atmosphere` is derived, every refusal, and who writes the file, and each property states its role and unit.
 * @evidence contracts/performance.md#efficient-algorithms Initial maps index all supplied shots, scenes, motions and skeletons, including unused extras, while timeline and cursor work costs O(E + F) for E cut entries and F output samples. Each first-live shot scans its scene's cameras and indexes that scene's nodes; different shots sharing a scene rebuild that node index. Every frame scans its live shot's performances, and each resolved actor pays sampleMotion's key/joint/expression work plus resolvePoseKeypoints' forward kinematics, joint projection and camera-clip sampling. Fog requests sample the camera again per actor. These delegated populations drive cost beyond a constant per-performance bound, and none of the input arrays or output populations is capped here.
 * @evidence contracts/performance.md#reuse-equivalent-work A shot's staging, its scene, camera and node index, is resolved once per call and shared by all its frames, which is equivalent because the inputs are immutable for the call and the staging depends only on the shot's `scene` and `camera` ids; the cache is dropped on return.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local maps reference every supplied shot, scene, motion and skeleton; at most one staging entry per supplied shot also holds a camera and node map, which can repeat one scene's node population across shots. The F-time schedule, motion samples and projection intermediates become collectable when their calls finish. The caller retains every returned frame, actor and keypoint, with no frame or population cap here; no native handle or background task is acquired.
 * @author Samchon
 */
export const planPoseKeypointSidecar: (props: {
    sequence: IAutoMovieSequence;
    shots: IAutoMovieShot[];
    scenes: readonly IAutoMovieScene[];
    motions: readonly IAutoMovieMotion[];
    skeletons: readonly IAutoMovieSkeleton[];
    fps: number;
    aspect?: number;
    crop?: IAutoMovieDeliveryCrop;
}) => IAutoMoviePoseKeypointSidecar = (props: {
  /** The cut being rendered. */
  sequence: IAutoMovieSequence;

  /** Every shot the cut references; extra shots are ignored. */
  shots: IAutoMovieShot[];

  /** The staged scenes the shots play over. */
  scenes: readonly IAutoMovieScene[];

  /** The motions the shots' performances reference. */
  motions: readonly IAutoMovieMotion[];

  /** The skeletons the motions target. */
  skeletons: readonly IAutoMovieSkeleton[];

  /** Output frames per second, the render clock, not necessarily `sequence.fps`. */
  fps: number;

  /** Render aspect, width over height; `resolvePoseKeypoints` assumes 16/9 when omitted. */
  aspect?: number;

  /** Normalized delivery crop the keypoints are expressed in; the whole frame when omitted. */
  crop?: IAutoMovieDeliveryCrop;
}): IAutoMoviePoseKeypointSidecar => {
  if (Number.isFinite(props.fps) === false || props.fps <= 0)
    throw new Error(`fps must be a finite number > 0, but was ${props.fps}`);
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    props.sequence,
    props.shots,
  );
  const times: number[] = frameTimes(props.fps, timeline.runtime);
  if (times.length === 0)
    throw new Error(
      `planPoseKeypointSidecar requires at least one frame; fps ${props.fps} and duration ${timeline.runtime} produced zero frames`,
    );
  const shotById: Map<string, IAutoMovieShot> = new Map(
    props.shots.map((shot: IAutoMovieShot): [string, IAutoMovieShot] => [
      shot.id,
      shot,
    ]),
  );
  const sceneById: Map<string, IAutoMovieScene> = new Map(
    props.scenes.map((scene: IAutoMovieScene): [string, IAutoMovieScene] => [
      scene.id,
      scene,
    ]),
  );
  const lookups: IPoseLookups = {
    motionById: new Map(
      props.motions.map(
        (motion: IAutoMovieMotion): [string, IAutoMovieMotion] => [
          motion.id,
          motion,
        ],
      ),
    ),
    skeletonById: new Map(
      props.skeletons.map(
        (skeleton: IAutoMovieSkeleton): [string, IAutoMovieSkeleton] => [
          skeleton.id,
          skeleton,
        ],
      ),
    ),
    aspect: props.aspect,
    crop: props.crop,
  };
  const stagingByShot: Map<string, IShotStaging | null> = new Map();
  const cursor: (seconds: number) => IAutoMoviePlaybackSample = playbackCursor(
    props.sequence,
    timeline,
  );
  const frames: IAutoMoviePoseKeypointFrame[] = times.map(
    (time: number, frame: number): IAutoMoviePoseKeypointFrame => {
      const sample: IAutoMoviePlaybackSample = cursor(time);
      // sequenceTimeline already threw for any entry whose shot was not
      // provided, so every cursor sample names a known shot.
      const shot: IAutoMovieShot = shotById.get(sample.shot)!;
      let staging: IShotStaging | null | undefined = stagingByShot.get(
        shot.id,
      );
      if (staging === undefined) {
        staging = stageShot(shot, sceneById);
        stagingByShot.set(shot.id, staging);
      }
      return {
        frame,
        beat: shotBeat(sample.shot),
        actors:
          staging === null
            ? []
            : actorsAt(shot, staging, sample.time, lookups),
      };
    },
  );
  return {
    target: props.sequence.id,
    fps: props.fps,
    frameCount: frames.length,
    frames,
  };
};

/** The call-wide lookups every frame's actor projection reads. */
interface IPoseLookups {
  motionById: ReadonlyMap<string, IAutoMovieMotion>;
  skeletonById: ReadonlyMap<string, IAutoMovieSkeleton>;
  aspect: number | undefined;
  crop: IAutoMovieDeliveryCrop | undefined;
}

/** A shot's resolved scene, camera and node index, shared by all its frames. */
interface IShotStaging {
  scene: IAutoMovieScene;
  camera: IAutoMovieCamera;
  nodeById: ReadonlyMap<string, IAutoMovieSceneNode>;
}

/** Resolve a shot's scene and camera, or null when either is missing. */
const stageShot: (shot: IAutoMovieShot, sceneById: ReadonlyMap<string, IAutoMovieScene>) => IShotStaging | null = (
  shot: IAutoMovieShot,
  sceneById: ReadonlyMap<string, IAutoMovieScene>,
): IShotStaging | null => {
  const scene: IAutoMovieScene | undefined = sceneById.get(shot.scene);
  const camera: IAutoMovieCamera | undefined = scene?.cameras.find(
    (candidate: IAutoMovieCamera): boolean => candidate.id === shot.camera,
  );
  if (scene === undefined || camera === undefined) return null;
  return {
    scene,
    camera,
    nodeById: new Map(
      scene.nodes.map(
        (node: IAutoMovieSceneNode): [string, IAutoMovieSceneNode] => [
          node.id,
          node,
        ],
      ),
    ),
  };
};

/** Project every resolvable performing actor of one shot at a shot-local instant. */
const actorsAt: (shot: IAutoMovieShot, staging: IShotStaging, time: number, lookups: IPoseLookups) => IAutoMoviePoseKeypointActor[] = (
  shot: IAutoMovieShot,
  staging: IShotStaging,
  time: number,
  lookups: IPoseLookups,
): IAutoMoviePoseKeypointActor[] => {
  const actors: IAutoMoviePoseKeypointActor[] = [];
  for (const performance of shot.performances) {
    if (performance.motion === null) continue;
    const motion: IAutoMovieMotion | undefined = lookups.motionById.get(
      performance.motion,
    );
    const node: IAutoMovieSceneNode | undefined = staging.nodeById.get(
      performance.node,
    );
    if (motion === undefined || node === undefined) continue;
    const skeleton: IAutoMovieSkeleton | undefined = lookups.skeletonById.get(
      motion.skeleton,
    );
    if (skeleton === undefined) continue;
    const pose: IAutoMoviePose = sampleMotion(
      motion,
      Math.max(0, time - performance.startOffset),
    ).pose;
    const fog: IAutoMovieScene["fog"] = staging.scene.fog;
    actors.push({
      node: performance.node,
      keypoints: resolvePoseKeypoints({
        pose,
        skeleton,
        node,
        camera: staging.camera,
        cameraMotion: shot.cameraMotion,
        time,
        aspect: lookups.aspect,
        crop: lookups.crop,
      }),
      // Spread only when the scene declares fog, so a fogless scene's sidecar
      // carries no `atmosphere` key at all. The depth sample is the actor's
      // world root, its staged placement with the sampled pose root folded
      // in, because the staged placement alone would keep the atmosphere an
      // actor had at frame zero while its clip carries it away.
      ...(fog === undefined || fog === null
        ? {}
        : {
            atmosphere: sceneFogTransmittance(
              fog,
              cameraDepth(
                staging.camera,
                shot.cameraMotion,
                time,
                foldRoot(node.transform, pose.root).translation,
              ),
            ),
          }),
    });
  }
  return actors;
};

/**
 * The distance of `point` along the camera's forward axis at `time`, the
 * length the fog is integrated over and what the fog shader interpolates as
 * `vFogDepth`.
 *
 * `projectToNdc` computes that depth as `-localZ` before its perspective
 * divide, so the frustum half-height and aspect, which only scale the
 * discarded `ndcX` and `ndcY`, are passed as 1.
 */
const cameraDepth: (camera: IAutoMovieCamera, cameraMotion: IAutoMovieShot["cameraMotion"], time: number, point: IAutoMovieVector3) => number = (
  camera: IAutoMovieCamera,
  cameraMotion: IAutoMovieShot["cameraMotion"],
  time: number,
  point: IAutoMovieVector3,
): number =>
  projectToNdc(
    resolveCameraAt(camera.transform, cameraMotion, camera.id, time),
    point,
    1,
    1,
  ).depth;
