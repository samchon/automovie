import {
  IAutoMovieCompiledShotSource,
  type IAutoMovieGeometryActorReader,
  IAutoMovieGeometrySelector,
  IAutoMoviePose,
  type IAutoMovieResolvedBone,
  type IAutoMovieSampledChannel,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

import { placeTransformedPoint } from "./film/internal/placeTransformedPoint";
import { HUMANOID_JOINT_AXES } from "./kinematics/constants/HUMANOID_JOINT_AXES";
import { resolvePose } from "./kinematics/internal/resolvePose";
import { Transform } from "./math/Transform";
import { sampleMotion } from "./motion/sampleMotion";
import { sampleClipSequence } from "./resolve/internal/sampleClipSequence";

/**
 * Read actor roots, bones and pose summaries from borrowed compiled shots at
 * shot-local seconds; ambiguous actors and unresolved records throw.
 */
export function createAutoMovieGeometryActorReader(
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
): IAutoMovieGeometryActorReader {
  return {
    selector: (
      selector: IAutoMovieGeometrySelector,
      world: Pick<IAutoMovieWorldDesign, "landmarks"> | null,
      options?: { shot?: string; time?: number },
    ): IAutoMovieVector3 => resolveSelector(selector, world, shots, options),
    find: (
      actor: string,
      shot?: string,
    ): IAutoMovieGeometryActorReader.ICompiledActor =>
      findCompiledActor(shots, actor, shot),
    spatial: actorSpatialAt,
    position: actorPositionAt,
    pose: (
      actor: string,
      shot: string | undefined,
      time: number,
    ): Record<string, number | string | boolean> =>
      sampleActorPose(shots, actor, shot, time),
  };
}
const resolveSelector: (
  selector: IAutoMovieGeometrySelector,
  world: Pick<IAutoMovieWorldDesign, "landmarks"> | null,
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  options?: { shot?: string; time?: number },
) => IAutoMovieVector3 = (
  selector: IAutoMovieGeometrySelector,
  world: Pick<IAutoMovieWorldDesign, "landmarks"> | null,
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  options: { shot?: string; time?: number } = {},
): IAutoMovieVector3 => {
  if (selector.kind === "point") return selector.position;
  if (selector.kind === "landmark") {
    const landmark: IAutoMovieWorldDesign["landmarks"][number] | undefined =
      world?.landmarks.find(
        (item: IAutoMovieWorldDesign["landmarks"][number]): boolean =>
          item.id === selector.landmark,
      );
    if (landmark === undefined)
      throw new Error(
        `Landmark "${selector.landmark}" does not exist. Inspect current world landmarks.`,
      );
    return landmark.position;
  }
  const actor: IAutoMovieGeometryActorReader.ICompiledActor = findCompiledActor(
    shots,
    selector.actor,
    options.shot,
  );
  const spatial: IAutoMovieGeometryActorReader.ISpatialSample = actorSpatialAt(
    actor.compiled,
    selector.actor,
    options.time ?? 0,
    actor.model.skeleton,
  );
  if (selector.bone === undefined) return spatial.position;
  if (actor.model.skeleton === null)
    throw new Error(
      `Actor "${selector.actor}" has no skeleton, so bone "${selector.bone}" cannot resolve.`,
    );
  const [bone]: IAutoMovieResolvedBone[] = resolvePose(
    spatial.pose,
    actor.model.skeleton,
    HUMANOID_JOINT_AXES,
    undefined,
    undefined,
    undefined,
    new Set([selector.bone]),
  );
  if (bone === undefined)
    throw new Error(
      `Actor "${selector.actor}" has no resolved bone "${selector.bone}". Correct the selector or rig.`,
    );
  const rootPoint: IAutoMovieVector3 =
    spatial.poseRoot === null
      ? bone.worldPosition
      : placeTransformedPoint(
          Transform.of(spatial.poseRoot.translation, spatial.poseRoot.rotation),
          bone.worldPosition,
        );
  return placeTransformedPoint(spatial.nodeTransform, rootPoint);
};

const findCompiledActor: (
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  actor: string,
  shotId?: string,
) => IAutoMovieGeometryActorReader.ICompiledActor = (
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  actor: string,
  shotId?: string,
): IAutoMovieGeometryActorReader.ICompiledActor => {
  const candidates: IAutoMovieCompiledShotSource[] =
    shotId === undefined
      ? [...shots.values()]
      : [shots.get(shotId)].flatMap(
          (
            value: IAutoMovieCompiledShotSource | undefined,
          ): IAutoMovieCompiledShotSource[] =>
            value === undefined ? [] : [value],
        );
  const matches: IAutoMovieGeometryActorReader.ICompiledActor[] = [];
  for (const compiled of candidates) {
    const node:
      | IAutoMovieGeometryActorReader.ICompiledActor["node"]
      | undefined = compiled.scene.nodes.find(
      (item: IAutoMovieGeometryActorReader.ICompiledActor["node"]): boolean =>
        item.id === actor,
    );
    if (node === undefined) continue;
    const model:
      | IAutoMovieGeometryActorReader.ICompiledActor["model"]
      | undefined = compiled.models.find(
      (item: IAutoMovieGeometryActorReader.ICompiledActor["model"]): boolean =>
        item.id === node.model,
    );
    if (model === undefined)
      throw new Error(
        `Actor "${actor}" references missing model "${node.model}" in shot "${compiled.shot.id}". Recompile corrected source.`,
      );
    matches.push({ compiled, node, model });
  }
  if (matches.length > 1)
    throw new Error(
      `Actor "${actor}" appears in multiple compiled shots (${matches
        .map(
          (match: IAutoMovieGeometryActorReader.ICompiledActor): string =>
            match.compiled.shot.id,
        )
        .join(
          ", ",
        )}). Supply the shot id so geometry never depends on file order.`,
    );
  if (matches.length === 1) return matches[0]!;
  throw new Error(
    `Actor "${actor}" does not exist${shotId === undefined ? "" : ` in shot "${shotId}"`} in current compiled scenes. Compile the owning shot or correct the selector.`,
  );
};

function actorPoseAt(
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
  skeleton: IAutoMovieSkeleton | null,
): IAutoMoviePose {
  if (time < 0 || time > compiled.shot.duration)
    throw new Error(
      `Actor sample time ${time} is outside shot "${compiled.shot.id}" duration 0..${compiled.shot.duration}. Choose a current in-range time.`,
    );
  const empty: () => IAutoMoviePose = (): IAutoMoviePose => ({
    skeleton: skeleton?.id ?? "unrigged",
    root: null,
    joints: [],
  });
  const node: IAutoMovieGeometryActorReader.ICompiledActor["node"] =
    compiled.scene.nodes.find(
      (item: IAutoMovieGeometryActorReader.ICompiledActor["node"]): boolean =>
        item.id === actor,
    )!;
  const performance:
    | IAutoMovieCompiledShotSource["shot"]["performances"][number]
    | undefined = compiled.shot.performances.find(
    (
      item: IAutoMovieCompiledShotSource["shot"]["performances"][number],
    ): boolean => item.node === actor,
  );
  const motionId: string | null =
    performance === undefined ? node.motion : performance.motion;
  if (motionId === null) return node.pose ?? empty();
  const motion: IAutoMovieCompiledShotSource["motions"][number] | undefined =
    compiled.motions.find(
      (item: IAutoMovieCompiledShotSource["motions"][number]): boolean =>
        item.id === motionId,
    );
  if (motion === undefined)
    throw new Error(
      `Actor "${actor}" references missing motion "${motionId}". Recompile the shot source.`,
    );
  return sampleMotion.pose(
    motion,
    performance === undefined
      ? time
      : Math.max(0, time - performance.startOffset),
  );
}

const actorSpatialAt: (
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
  skeleton: IAutoMovieSkeleton | null,
) => IAutoMovieGeometryActorReader.ISpatialSample = (
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
  skeleton: IAutoMovieSkeleton | null,
): IAutoMovieGeometryActorReader.ISpatialSample => {
  const pose: IAutoMoviePose = actorPoseAt(compiled, actor, time, skeleton);
  const node: IAutoMovieGeometryActorReader.ICompiledActor["node"] =
    compiled.scene.nodes.find(
      (item: IAutoMovieGeometryActorReader.ICompiledActor["node"]): boolean =>
        item.id === actor,
    )!;
  const sampled: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(
    compiled.shot.objectMotions,
    time,
  );
  const translation: number[] | undefined = sampled.get(
    `node:${actor}:translation`,
  )?.value;
  const rotation: number[] | undefined = sampled.get(
    `node:${actor}:rotation`,
  )?.value;
  const scale: number[] | undefined = sampled.get(`node:${actor}:scale`)?.value;
  const nodeTransform: IAutoMovieTransform = {
    translation:
      translation === undefined
        ? node.transform.translation
        : {
            x: translation[0]!,
            y: translation[1]!,
            z: translation[2]!,
          },
    rotation:
      rotation === undefined
        ? node.transform.rotation
        : {
            x: rotation[0]!,
            y: rotation[1]!,
            z: rotation[2]!,
            w: rotation[3]!,
          },
    scale:
      scale === undefined
        ? node.transform.scale
        : { x: scale[0]!, y: scale[1]!, z: scale[2]! },
  };
  return {
    pose: { ...pose, root: null },
    nodeTransform,
    poseRoot: pose.root,
    position:
      pose.root === null
        ? nodeTransform.translation
        : placeTransformedPoint(nodeTransform, pose.root.translation),
  };
};

const actorPositionAt: (
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
) => IAutoMovieVector3 = (
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
): IAutoMovieVector3 => {
  const found: IAutoMovieGeometryActorReader.ICompiledActor = findCompiledActor(
    new Map([[compiled.shot.id, compiled]]),
    actor,
    compiled.shot.id,
  );
  return actorSpatialAt(compiled, actor, time, found.model.skeleton).position;
};

const sampleActorPose: (
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  actor: string,
  shotId: string | undefined,
  time: number,
) => Record<string, number | string | boolean> = (
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  actor: string,
  shotId: string | undefined,
  time: number,
): Record<string, number | string | boolean> => {
  const found: IAutoMovieGeometryActorReader.ICompiledActor = findCompiledActor(
    shots,
    actor,
    shotId,
  );
  const performance:
    | IAutoMovieCompiledShotSource["shot"]["performances"][number]
    | undefined = found.compiled.shot.performances.find(
    (
      item: IAutoMovieCompiledShotSource["shot"]["performances"][number],
    ): boolean => item.node === actor,
  );
  const spatial: IAutoMovieGeometryActorReader.ISpatialSample = actorSpatialAt(
    found.compiled,
    actor,
    time,
    found.model.skeleton,
  );
  return {
    shot: found.compiled.shot.id,
    actor,
    held:
      (performance === undefined ? found.node.motion : performance.motion) ===
      null,
    rootX: spatial.position.x,
    rootY: spatial.position.y,
    rootZ: spatial.position.z,
    jointCount: spatial.pose.joints.length,
  };
};
