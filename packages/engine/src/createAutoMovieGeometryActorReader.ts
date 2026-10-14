import {
  IAutoMovieCompiledShotSource,
  IAutoMovieGeometrySelector,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

import { placeTransformedPoint } from "./film/placeTransformedPoint";
import { IAutoMovieResolvedBone } from "./kinematics/IAutoMovieResolvedBone";
import { HUMANOID_JOINT_AXES } from "./kinematics/constants/HUMANOID_JOINT_AXES";
import { resolvePose } from "./kinematics/resolvePose";
import { sampleMotion } from "./motion/sampleMotion";
import { sampleClipSequence } from "./resolve/sampleClipSequence";

/**
 * Read actor roots, bones and pose summaries from borrowed compiled shots at shot-local seconds; ambiguous actors and unresolved records throw.
 *
 * @evidence contracts/common.md#principled-implementation Samples performance-local pose and object channels, resolves root-free FK, then applies pose-root rigid placement and node TRS as separate affine stages; pose-root scale is ignored consistently with resolvePose.
 * @evidence contracts/common.md#clear-and-simple-design One request-local reader shares actor lookup and sampling rules across reach, distance, pose, camera and effect queries; position exposes only the needed root point rather than a lossy composed TRS.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or multi-shot actors, missing models/motions/bones and out-of-range actor times refuse by name; no file-order winner or fabricated rig is selected.
 * @evidence contracts/common.md#meaningful-documentation States shot-local seconds, borrowed records, rigid pose-root semantics and lookup failures; methods describe selectors, exact root positions and pose summaries.
 * @evidence contracts/performance.md#efficient-algorithms Actor lookup scans selected shots and their nodes/models; bone selectors add motion/object-channel sampling and FK linear in rig bones. Pose summaries reuse one spatial sample rather than sampling pose twice.
 * @evidence contracts/performance.md#reuse-equivalent-work Methods share the supplied shot map but do not memoize mutable poses or channel samples; each requested time is sampled from current records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closures borrow the shot map for the reader's lifetime; per-call matches, poses and FK arrays become collectible on return or throw, with no handles or background tasks.
 */
export function createAutoMovieGeometryActorReader(
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
): {
  /** Resolve an authored point, landmark or actor/bone selector. */
  selector: (
    selector: IAutoMovieGeometrySelector,
    world: Pick<IAutoMovieWorldDesign, "landmarks"> | null,
    options?: { shot?: string; time?: number },
  ) => IAutoMovieVector3;

  /** Find exactly one actor and its model, optionally within one shot. */
  find: (actor: string, shot?: string) => ICompiledActor;

  /** Read node motion and pose-root placement at shot-local seconds. */
  spatial: typeof actorSpatialAt;

  /** Read the exact composed root position without flattening an affine basis. */
  position: typeof actorPositionAt;

  /** Summarize an actor's pose and root position at one time. */
  pose: (
    actor: string,
    shot: string | undefined,
    time: number,
  ) => Record<string, number | string | boolean>;
} {
  return {
    selector: (
      selector: IAutoMovieGeometrySelector,
      world: Pick<IAutoMovieWorldDesign, "landmarks"> | null,
      options?: { shot?: string; time?: number },
    ): IAutoMovieVector3 => resolveSelector(selector, world, shots, options),
    find: (actor: string, shot?: string): ICompiledActor =>
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
  const actor: ICompiledActor = findCompiledActor(
    shots,
    selector.actor,
    options.shot,
  );
  const spatial: IActorSpatialSample = actorSpatialAt(
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
  const bone: IAutoMovieResolvedBone | undefined = resolvePose(
    spatial.pose,
    actor.model.skeleton,
    HUMANOID_JOINT_AXES,
  ).find(
    (item: IAutoMovieResolvedBone): boolean => item.bone === selector.bone,
  );
  if (bone === undefined)
    throw new Error(
      `Actor "${selector.actor}" has no resolved bone "${selector.bone}". Correct the selector or rig.`,
    );
  const rootPoint: IAutoMovieVector3 =
    spatial.poseRoot === null
      ? bone.worldPosition
      : placeTransformedPoint(
          { ...spatial.poseRoot, scale: { x: 1, y: 1, z: 1 } },
          bone.worldPosition,
        );
  return placeTransformedPoint(spatial.nodeTransform, rootPoint);
};

interface ICompiledActor {
  /** Shot snapshot owning both the node and model. */
  compiled: IAutoMovieCompiledShotSource;

  /** Scene placement and authored pose/motion reference. */
  node: IAutoMovieCompiledShotSource["scene"]["nodes"][number];

  /** Resident model supplying the optional rig. */
  model: IAutoMovieCompiledShotSource["models"][number];
}

const findCompiledActor: (
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  actor: string,
  shotId?: string,
) => ICompiledActor = (
  shots: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  actor: string,
  shotId?: string,
): ICompiledActor => {
  const candidates: IAutoMovieCompiledShotSource[] =
    shotId === undefined
      ? [...shots.values()]
      : [shots.get(shotId)].filter(
          (
            value: IAutoMovieCompiledShotSource | undefined,
          ): value is IAutoMovieCompiledShotSource => value !== undefined,
        );
  const matches: ICompiledActor[] = [];
  for (const compiled of candidates) {
    const node: ICompiledActor["node"] | undefined = compiled.scene.nodes.find(
      (item: ICompiledActor["node"]): boolean => item.id === actor,
    );
    if (node === undefined) continue;
    const model: ICompiledActor["model"] | undefined = compiled.models.find(
      (item: ICompiledActor["model"]): boolean => item.id === node.model,
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
        .map((match: ICompiledActor): string => match.compiled.shot.id)
        .join(
          ", ",
        )}). Supply the shot id so geometry never depends on file order.`,
    );
  if (matches.length === 1) return matches[0]!;
  throw new Error(
    `Actor "${actor}" does not exist${shotId === undefined ? "" : ` in shot "${shotId}"`} in current compiled scenes. Compile the owning shot or correct the selector.`,
  );
};

const actorPoseAt: (
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
  skeleton: IAutoMovieSkeleton | null,
) => IAutoMoviePose = (
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
  skeleton: IAutoMovieSkeleton | null,
): IAutoMoviePose => {
  if (
    Number.isFinite(time) === false ||
    time < 0 ||
    time > compiled.shot.duration
  )
    throw new Error(
      `Actor sample time ${time} is outside shot "${compiled.shot.id}" duration 0..${compiled.shot.duration}. Choose a current in-range time.`,
    );
  const empty: () => IAutoMoviePose = (): IAutoMoviePose => ({
    skeleton: skeleton?.id ?? "unrigged",
    root: null,
    joints: [],
  });
  const node: ICompiledActor["node"] = compiled.scene.nodes.find(
    (item: ICompiledActor["node"]): boolean => item.id === actor,
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
  return sampleMotion(
    motion,
    performance === undefined
      ? time
      : Math.max(0, time - performance.startOffset),
  ).pose;
};

interface IActorSpatialSample {
  /** Sampled pose with root removed, ready for model-frame FK. */
  pose: IAutoMoviePose;

  /** World root point after node and rigid pose-root placement. */
  position: IAutoMovieVector3;

  /** Authored node TRS overridden by sampled object channels. */
  nodeTransform: IAutoMovieTransform;

  /** Sampled root's translation/rotation; root scale does not affect FK. */
  poseRoot: IAutoMovieTransform | null;
}

const actorSpatialAt: (
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
  skeleton: IAutoMovieSkeleton | null,
) => IActorSpatialSample = (
  compiled: IAutoMovieCompiledShotSource,
  actor: string,
  time: number,
  skeleton: IAutoMovieSkeleton | null,
): IActorSpatialSample => {
  const pose: IAutoMoviePose = actorPoseAt(compiled, actor, time, skeleton);
  const node: ICompiledActor["node"] = compiled.scene.nodes.find(
    (item: ICompiledActor["node"]): boolean => item.id === actor,
  )!;
  const sampled: ReturnType<typeof sampleClipSequence> = sampleClipSequence(
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
  const found: ICompiledActor = findCompiledActor(
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
  const found: ICompiledActor = findCompiledActor(shots, actor, shotId);
  const performance:
    | IAutoMovieCompiledShotSource["shot"]["performances"][number]
    | undefined = found.compiled.shot.performances.find(
    (
      item: IAutoMovieCompiledShotSource["shot"]["performances"][number],
    ): boolean => item.node === actor,
  );
  const spatial: IActorSpatialSample = actorSpatialAt(
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
