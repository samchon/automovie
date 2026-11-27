import { AutoMovieEngineMotionSampling, AutoMovieEngineFilm, AutoMovieEngineScene } from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieDeliveryCrop,
  IAutoMovieMotion,
  IAutoMoviePlanPoseKeypointSidecarProps,
  IAutoMoviePlaybackLayer,
  IAutoMoviePlaybackTimeline,
  IAutoMoviePose,
  IAutoMoviePoseKeypointActor,
  IAutoMoviePoseKeypointFrame,
  IAutoMoviePoseKeypointSidecar,
  IAutoMovieScene,
  IAutoMovieSceneNode,
  IAutoMovieShot,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { frameTimes } from "./frameTimes.js";
import { shotBeat } from "../shotBeat.js";

/**
 * Plan the pose-keypoint sidecar of one sequence render.
 *
 * The cut is laid on the output clock by `sequenceTimeline`, the output frames
 * are the `frameTimes` schedule the render captures at `fps`, and on each frame
 * `playbackShownLayer` of `playbackLayersAt` finds the shot the picture shows
 * most of and its shot-local time: inside a fade or a dissolve the outgoing
 * shot before the midpoint and the incoming one from it. Every performance of
 * that shot whose motion, skeleton and scene node resolve is sampled at `max(0,
 * time - startOffset)`, and its joints are projected through the shot's camera
 * by `resolvePoseKeypoints` with the given aspect and crop. A frame whose scene
 * or camera does not resolve, and a performance without a motion or with an
 * unresolved reference, contribute no keypoints rather than throwing, so the
 * sidecar still covers every output frame; an unresolved cut shot is refused by
 * the timeline builder.
 *
 * When the scene declares fog, each actor also carries the fog transmittance at
 * the camera depth of its world root, its staged placement with the sampled
 * pose root folded in, through the engine's `sceneFogTransmittance`, the law
 * the viewer hands its shader. Throws for an `fps` that is not a finite
 * positive number, for a cut `sequenceTimeline` cannot lay out, and for a
 * runtime that rounds to zero frames. The host writes the result through
 * `renderPoseKeypointSidecar`.
 */
export const planPoseKeypointSidecar: (
  props: IAutoMoviePlanPoseKeypointSidecarProps,
) => IAutoMoviePoseKeypointSidecar = (
  props: IAutoMoviePlanPoseKeypointSidecarProps,
): IAutoMoviePoseKeypointSidecar => {
  if (props.fps <= 0)
    throw new Error(`fps must be a finite number > 0, but was ${props.fps}`);
  const timeline: IAutoMoviePlaybackTimeline = AutoMovieEngineFilm.sequenceTimeline(
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
  const frames: IAutoMoviePoseKeypointFrame[] = times.map(
    (time: number, frame: number): IAutoMoviePoseKeypointFrame => {
      const sample: IAutoMoviePlaybackLayer = AutoMovieEngineFilm.playbackShownLayer(
        AutoMovieEngineFilm.playbackLayersAt(props.sequence, timeline, time),
      );
      // sequenceTimeline already threw for any entry whose shot was not
      // provided, so every cursor sample names a known shot.
      const shot: IAutoMovieShot = shotById.get(sample.shot)!;
      let staging: IShotStaging | null | undefined = stagingByShot.get(shot.id);
      if (staging === undefined) {
        staging = stageShot(shot, sceneById);
        stagingByShot.set(shot.id, staging);
      }
      return {
        frame,
        beat: shotBeat(sample.shot),
        actors:
          staging === null ? [] : actorsAt(shot, staging, sample.time, lookups),
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
const stageShot: (
  shot: IAutoMovieShot,
  sceneById: ReadonlyMap<string, IAutoMovieScene>,
) => IShotStaging | null = (
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

/**
 * Project every resolvable performing actor of one shot at a shot-local
 * instant.
 */
const actorsAt: (
  shot: IAutoMovieShot,
  staging: IShotStaging,
  time: number,
  lookups: IPoseLookups,
) => IAutoMoviePoseKeypointActor[] = (
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
    const pose: IAutoMoviePose = AutoMovieEngineMotionSampling.sampleMotion(
      motion,
      Math.max(0, time - performance.startOffset),
    ).pose;
    const fog: IAutoMovieScene["fog"] = staging.scene.fog;
    actors.push({
      node: performance.node,
      keypoints: AutoMovieEngineFilm.resolvePoseKeypoints({
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
            atmosphere: AutoMovieEngineScene.sceneFogTransmittance(
              fog,
              cameraDepth(
                staging.camera,
                shot.cameraMotion,
                time,
                AutoMovieEngineFilm.foldRoot(node.transform, pose.root).translation,
              ),
            ),
          }),
    });
  }
  return actors;
};

/**
 * The distance of `point` along the camera's forward axis at `time`, the length
 * the fog is integrated over and what the fog shader interpolates as
 * `vFogDepth`.
 *
 * `projectToNdc` computes that depth as `-localZ` before its perspective
 * divide, so the frustum half-height and aspect, which only scale the discarded
 * `ndcX` and `ndcY`, are passed as 1.
 */
const cameraDepth: (
  camera: IAutoMovieCamera,
  cameraMotion: IAutoMovieShot["cameraMotion"],
  time: number,
  point: IAutoMovieVector3,
) => number = (
  camera: IAutoMovieCamera,
  cameraMotion: IAutoMovieShot["cameraMotion"],
  time: number,
  point: IAutoMovieVector3,
): number =>
  AutoMovieEngineFilm.projectToNdc(
    AutoMovieEngineFilm.resolveCameraAt(camera.transform, cameraMotion, camera.id, time),
    point,
    1,
    1,
  ).depth;
