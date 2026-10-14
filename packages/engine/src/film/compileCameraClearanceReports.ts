import {
  IAutoMovieCamera,
  IAutoMovieCameraClearanceReport,
  IAutoMovieClip,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieShotCoverage,
  IAutoMovieSubjectBox,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieSampledChannel } from "../resolve/IAutoMovieSampledChannel";
import { channelKey } from "../resolve/channelKey";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { ViolationCollector } from "../validation/ViolationCollector";
import { validateModel } from "../validation/validateModel";
import { IAutoMovieCameraClearanceRuntime } from "./IAutoMovieCameraClearanceRuntime";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { cameraClearanceDeformationRadius } from "./cameraClearanceDeformationRadius";
import { cameraClearanceSampleTimes } from "./cameraClearanceSampleTimes";
import { computeModelRestExtent } from "./computeModelRestExtent";
import { evaluateCameraClearance } from "./evaluateCameraClearance";
import { foldRoot } from "./foldRoot";
import { nodeSubjectBox } from "./nodeSubjectBox";
import { resolveCameraAt } from "./resolveCameraAt";

/** One take's input to the evaluator. */
type IEvaluation = Parameters<typeof evaluateCameraClearance>[0];

/** One obstacle's world box at one instant, as the evaluator reads it. */
type IObstacleState = IEvaluation["samples"][number]["obstacles"][number];

/**
 * A staged node with its measured bound.
 *
 * @author Samchon
 */
interface IMeasuredObstacle {
  /** The staged node. */
  node: IAutoMovieScene["nodes"][number];

  /** World box of a node nothing animates, fixed for the whole shot. */
  bounds: IAutoMovieSubjectBox | null;

  /** Model-space radius holding the model in any pose, for a moving node. */
  radius: number;
}

/**
 * One camera that plays in the shot and declares a clearance envelope.
 *
 * @author Samchon
 */
interface ITake {
  /** The staged camera, with its envelope. */
  camera: IAutoMovieCamera;

  /** Index of the camera in the staged scene, for violation paths. */
  index: number;

  /** The take's camera clip, or null for a locked-off camera. */
  motion: IAutoMovieShot["cameraMotion"];
}

/**
 * Check that no camera body or parent rig in a performed shot touches a staged node, and return one clear report per envelope-bearing take.
 *
 * The hero take and every coverage take whose staged camera declares `clearance` are inspected; the others are skipped, and a shot with none returns `undefined` without reading `runtime`. Each such take is sampled at {@link cameraClearanceSampleTimes}, and every staged node is an obstacle: a node nothing animates is its rest box through its placement ({@link nodeSubjectBox}), and an animated one is a box around its current root holding {@link cameraClearanceDeformationRadius} scaled by its largest absolute scale component, which stays valid under any rotation or pose. {@link evaluateCameraClearance} then sweeps each interval.
 *
 * Every refusal is pushed to `out` with an author-facing path, and the result is then `undefined`: a hero or coverage camera the scene does not stage, a missing `runtime`, a sample rate that is not finite and positive, a stale geometry revision (one item per take, before any geometry is read), a morph-weight track, a node whose model is absent, fails `validateModel`, draws nothing or whose bound overflows, a motion the clock cannot bound, and every contact the evaluator finds. Items already in `out` belong to the caller and do not count as refusals here.
 *
 * @evidence contracts/common.md#principled-implementation Builds static boxes and moving root-centred deformation spheres from the validated portable part/proxy representation. Key refinement and interpolation admission supply endpoint-bound premises for represented motion, while morph weights are refused without an expansion bound. External asset bytes and renderer-only deformation are not inspected, and the evaluator's normalized-lerp limitation still applies.
 * @evidence contracts/common.md#clear-and-simple-design This adapter owns reading the shot, measuring obstacles and addressing violations, while the clock, the deformation bound and the interval sweep live in `cameraClearanceSampleTimes`, `cameraClearanceDeformationRadius` and `evaluateCameraClearance`, each a pure function reused by no other path; the split keeps the file under the size limit and each bound testable on its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no camera, node or model; an absent model, an unmeasurable bound or an unboundable motion is refused rather than skipped or given a stand-in size, and the collector baseline lets a caller pass a collector holding earlier items without them being read as clearance failures.
 * @evidence contracts/common.md#meaningful-documentation States which takes are inspected, when `runtime` is read, how each obstacle is bounded, every refusal and its effect on the return value, and that earlier collector items are the caller's.
 * @evidence contracts/performance.md#efficient-algorithms Validates and measures each staged node's model once, then caches obstacle states per distinct instant. State construction includes object clip-sequence sampling and actor sampleMotion work for animated nodes; each take also samples its camera and delegates the interval/part/obstacle sweep. Total cost includes those sampled track, pose and geometry populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Obstacle states depend only on the shot-local instant, the staged nodes and the shot's motions, which every take shares, so they are cached by exact instant across takes; the actor and object part of the clock is built once per call, and models are measured once per node rather than per take.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The obstacle-state cache and measured obstacles are locals released when the call returns, bounded by distinct instants across takes times staged nodes; returned reports are owned by the caller and hold only their sample times and findings, not the cached boxes.
 */
export function compileCameraClearanceReports(props: {
  /** The staged scene whose cameras and nodes are read. */
  scene: IAutoMovieScene;

  /** The hero camera and its compiled clip, or null for a locked-off camera. */
  hero: { camera: IAutoMovieCamera; motion: IAutoMovieShot["cameraMotion"] };

  /** The shot's coverage takes, each naming a staged camera. */
  coverage: readonly IAutoMovieShotCoverage[];

  /** Shot length in seconds. */
  duration: number;

  /** Actor motion per node id. */
  motions: Readonly<Record<string, IAutoMovieMotion>>;

  /** Object clips in producer order, which decides channel authority. */
  objectMotions: readonly IAutoMovieClip[];

  /** Runtime models the staged nodes name. */
  models: readonly IAutoMovieModel[];

  /** Builder-owned revision and clock, required once any take has an envelope. */
  runtime: IAutoMovieCameraClearanceRuntime | undefined;

  /** Collector that receives every refusal, after any items it already holds. */
  out: ViolationCollector;
}): IAutoMovieCameraClearanceReport[] | undefined {
  const baseline: number = props.out.items.length;
  function refused (): boolean { return props.out.items.length > baseline; }
  const cameraIndex: Map<string, number> = new Map(
    props.scene.cameras.map(
      (camera: IAutoMovieCamera, index: number): [string, number] => [
        camera.id,
        index,
      ],
    ),
  );
  const takes: ITake[] = [];
  function addTake (
    id: string,
    path: string,
    motion: IAutoMovieShot["cameraMotion"],
    supplied?: IAutoMovieCamera,
  ): void {
    const index: number | undefined = cameraIndex.get(id);
    if (index === undefined) {
      props.out.push(
        "type",
        path,
        `camera "${id}" must be a camera the scene stages`,
        id,
      );
      return;
    }
    const camera: IAutoMovieCamera =
      supplied === undefined ? props.scene.cameras[index]! : supplied;
    if (camera.clearance !== undefined) takes.push({ camera, index, motion });
  }
  addTake(
    props.hero.camera.id,
    "$input.hero.camera.id",
    props.hero.motion,
    props.hero.camera,
  );
  props.coverage.forEach((take: IAutoMovieShotCoverage, index: number): void =>
    addTake(take.camera, `$input.coverage[${index}].camera`, take.cameraMotion),
  );
  if (refused() || takes.length === 0) return undefined;
  const runtime: IAutoMovieCameraClearanceRuntime | undefined = props.runtime;
  if (runtime === undefined) {
    props.out.push(
      "type",
      "$input.cameraClearance",
      "a camera with a physical clearance envelope requires builder-owned geometry revision and fixed-clock context",
      undefined,
    );
    return undefined;
  }
  if (!(Number.isFinite(runtime.sampleRate) && runtime.sampleRate > 0)) {
    props.out.push(
      "range",
      "$input.cameraClearance.sampleRate",
      "camera clearance sample rate must be finite and greater than zero",
      runtime.sampleRate,
    );
    return undefined;
  }
  if (runtime.revision !== runtime.currentRevision) {
    for (const take of takes)
      props.out.push(
        "type",
        "$input.cameraClearance.currentRevision",
        `camera "${take.camera.id}" clearance read geometry revision "${runtime.revision}", but "${runtime.currentRevision}" is current; recompile against one current snapshot`,
        runtime.currentRevision,
      );
    return undefined;
  }

  props.objectMotions.forEach((clip: IAutoMovieClip, clipIndex: number): void =>
    clip.tracks.forEach((track: IAutoMovieTrack, trackIndex: number): void => {
      if (track.channel.kind === "node" && track.channel.path === "weights")
        props.out.push(
          "type",
          `$input.objectMotions[${clipIndex}].tracks[${trackIndex}].channel.path`,
          `camera clearance cannot conservatively bound morph weights in clip "${clip.id}" because the portable model carries no morph-target expansion envelope`,
          track.channel.path,
        );
    }),
  );
  if (refused()) return undefined;

  const measured: IMeasuredObstacle[] = measureObstacles(props);
  if (refused()) return undefined;

  let clockOf: (motion: IAutoMovieShot["cameraMotion"]) => number[];
  try {
    clockOf = cameraClearanceSampleTimes({
      duration: props.duration,
      sampleRate: runtime.sampleRate,
      motions: props.motions,
      objectMotions: props.objectMotions,
    });
  } catch (error) {
    for (const take of takes) refuseEvaluation(props.out, take, error);
    return undefined;
  }

  const states: Map<number, IObstacleState[]> = new Map();
  function obstaclesAt (time: number): IObstacleState[] {
    const cached: IObstacleState[] | undefined = states.get(time);
    if (cached !== undefined) return cached;
    const sampled: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(
      props.objectMotions,
      time,
    );
    const result: IObstacleState[] = measured.map(
      (obstacle: IMeasuredObstacle): IObstacleState => ({
        node: obstacle.node.id,
        bounds:
          obstacle.bounds ??
          movingBounds(obstacle, props.motions[obstacle.node.id], sampled, time),
      }),
    );
    states.set(time, result);
    return result;
  }

  const reports: IAutoMovieCameraClearanceReport[] = [];
  for (const take of takes) {
    let report: IAutoMovieCameraClearanceReport;
    try {
      report = evaluateCameraClearance({
        camera: take.camera.id,
        envelope: take.camera.clearance!,
        revision: runtime.revision,
        currentRevision: runtime.currentRevision,
        sampleRate: runtime.sampleRate,
        duration: props.duration,
        samples: clockOf(take.motion).map(
          (time: number): IEvaluation["samples"][number] => {
            const resolved: IAutoMovieResolvedCamera = resolveCameraAt(
                take.camera.transform,
                take.motion,
                take.camera.id,
                time,
              );
            return {
              time,
              camera: {
                translation: resolved.position,
                rotation: resolved.rotation,
                scale: take.camera.transform.scale,
              },
              obstacles: obstaclesAt(time),
            };
          },
        ),
      });
    } catch (error) {
      refuseEvaluation(props.out, take, error);
      continue;
    }
    for (const finding of report.findings)
      props.out.push(
        "range",
        `$staged.scene.cameras[${take.index}].clearance.${finding.part === "body" ? "body" : "parentRig"}`,
        `camera "${take.camera.id}" ${finding.part} contacts obstacle "${finding.obstacle}" over the inclusive interval [${finding.start}, ${finding.end}]s; change the path, rig, or scene clearance`,
        finding,
      );
    if (report.status === "clear") reports.push(report);
  }
  return refused() ? undefined : reports;
}

/**
 * Validate and bound every staged node once, pushing a refusal for each node whose model is absent, invalid, empty or unboundable.
 */
function measureObstacles (props: {
  scene: IAutoMovieScene;
  motions: Readonly<Record<string, IAutoMovieMotion>>;
  objectMotions: readonly IAutoMovieClip[];
  models: readonly IAutoMovieModel[];
  out: ViolationCollector;
}): IMeasuredObstacle[] {
  const models: Map<string, IAutoMovieModel> = new Map(
    props.models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
      model.id,
      model,
    ]),
  );
  const animated: Set<string> = new Set(Object.keys(props.motions));
  for (const clip of props.objectMotions)
    for (const track of clip.tracks)
      if (track.channel.kind === "node") animated.add(track.channel.node);

  const measured: IMeasuredObstacle[] = [];
  props.scene.nodes.forEach(
    (node: IAutoMovieScene["nodes"][number], index: number): void => {
      const model: IAutoMovieModel | undefined = models.get(node.model);
      const path: string = `$staged.scene.nodes[${index}].model`;
      if (model === undefined) {
        props.out.push(
          "type",
          path,
          `camera clearance cannot measure current obstacle "${node.id}" because model "${node.model}" is absent or has no geometry`,
          node.model,
        );
        return;
      }
      let extent: { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null;
      let radius: number = 0;
      try {
        const validation: IAutoMovieValidation = validateModel({
          model,
        });
        if (validation.success === false) {
          const first: (typeof validation.violations)[number] =
            validation.violations[0]!;
          throw new Error(
            `model contract fails at ${first.path}: ${first.expected}`,
          );
        }
        extent = computeModelRestExtent(model);
        if (extent !== null && animated.has(node.id))
          radius = cameraClearanceDeformationRadius(model, extent);
      } catch (error) {
        props.out.push(
          "type",
          path,
          `camera clearance cannot derive a conservative current bound for obstacle "${node.id}": ${safeThrownDescription(error)}`,
          node.model,
        );
        return;
      }
      if (extent === null) {
        props.out.push(
          "type",
          path,
          `camera clearance cannot measure current obstacle "${node.id}" because model "${node.model}" is absent or has no geometry`,
          node.model,
        );
        return;
      }
      measured.push({
        node,
        bounds: animated.has(node.id)
          ? null
          : nodeSubjectBox(node.transform, extent),
        radius,
      });
    },
  );
  return measured;
}

/**
 * The box around a moving node's current root that holds its deformation radius scaled by its largest absolute scale component.
 */
function movingBounds (
  obstacle: IMeasuredObstacle,
  actorMotion: IAutoMovieMotion | undefined,
  sampled: Map<string, IAutoMovieSampledChannel>,
  seconds: number,
): IAutoMovieSubjectBox {
  const node: IAutoMovieScene["nodes"][number] = obstacle.node;
  const base: IAutoMovieTransform =
    actorMotion === undefined
      ? node.transform
      : foldRoot(node.transform, sampleMotion(actorMotion, seconds).pose.root);
  const translation: number[] | undefined = sampled.get(
    channelKey({ kind: "node", node: node.id, path: "translation" }),
  )?.value;
  const scale: number[] | undefined = sampled.get(
    channelKey({ kind: "node", node: node.id, path: "scale" }),
  )?.value;
  const center: IAutoMovieVector3 =
    translation === undefined
      ? base.translation
      : { x: translation[0]!, y: translation[1]!, z: translation[2]! };
  const factor: number =
    scale === undefined
      ? Math.max(
          Math.abs(base.scale.x),
          Math.abs(base.scale.y),
          Math.abs(base.scale.z),
        )
      : Math.max(Math.abs(scale[0]!), Math.abs(scale[1]!), Math.abs(scale[2]!));
  const radius: number = obstacle.radius * factor;
  return {
    min: { x: center.x - radius, y: center.y - radius, z: center.z - radius },
    max: { x: center.x + radius, y: center.y + radius, z: center.z + radius },
  };
}

/** Address a take whose clock or evaluation threw. */
function refuseEvaluation (
  out: ViolationCollector,
  take: ITake,
  error: unknown,
): void { return out.push(
    "range",
    `$staged.scene.cameras[${take.index}].clearance`,
    `camera clearance could not evaluate its fixed-clock input: ${safeThrownDescription(error)}`,
    take.camera.clearance,
  ); }

/** Describe a thrown value without letting a hostile coercion escape. */
function safeThrownDescription (error: unknown): string {
  try {
    return String(error);
  } catch {
    return "an uninspectable thrown value";
  }
}
