import {
  IAutoMovieActionCall,
  IAutoMovieBeatEndState,
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieCompiledFormation,
  IAutoMovieConstraintViolation,
  IAutoMovieFormationMotion,
  IAutoMovieInteractionEvent,
  IAutoMovieLight,
  IAutoMovieMotion,
  IAutoMoviePerformance,
  IAutoMovieQuaternion,
  IAutoMovieScript,
  IAutoMovieSceneNode,
  IAutoMovieShot,
  IAutoMovieShotPerformance,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieActionSynthesizer } from "../perform/IAutoMovieActionSynthesizer";
import { IAutoMovieCompiledPerformance } from "../perform/IAutoMovieCompiledPerformance";
import { IAutoMovieMaskedContent } from "../perform/IAutoMovieMaskedContent";
import { compilePerformance } from "../perform/compilePerformance";
import { scenePlacements } from "../perform/scenePlacements";
import { sampleFormationMotion } from "../sampleFormationMotion";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { transformFormationPoint } from "../transformFormationPoint";
import { ViolationCollector } from "../validation/ViolationCollector";
import { appendLightMotionsArtifact } from "../validation/appendLightMotionsArtifact";
import { validateMotion } from "../validation/validateMotion";
import { validateShotArtifact } from "../validation/validateShotArtifact";
import { IAutoMoviePerformedShot } from "./IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";
import { IPerformShotActionPlan } from "./IPerformShotActionPlan";
import { IPerformShotCoverageJob } from "./IPerformShotCoverageJob";
import { IPerformShotGateContext } from "./IPerformShotGateContext";
import { IPerformShotProps } from "./IPerformShotProps";
import { compileCameraClearanceReports } from "./compileCameraClearanceReports";
import { compilePerformShotCameras } from "./compilePerformShotCameras";
import { compilePerformShotLaunches } from "./compilePerformShotLaunches";
import { coupleObjects } from "./coupleObjects";
import { createPerformShotSubjectFramer } from "./createPerformShotSubjectFramer";
import { gateAuthoredObjectMotions } from "./gateAuthoredObjectMotions";
import { gatePerformShotActions } from "./gatePerformShotActions";
import { gatePerformShotBlocking } from "./gatePerformShotBlocking";
import { gatePerformShotCamera } from "./gatePerformShotCamera";
import { gatePerformShotFrameOverlaps } from "./gatePerformShotFrameOverlaps";
import { gatePerformShotRegionOverlaps } from "./gatePerformShotRegionOverlaps";
import { plantPerformShotStanceFeet } from "./plantPerformShotStanceFeet";
import { validatePerformShotId } from "./validatePerformShotId";

/** Event order at one instant: cause before effect, pickup before release. */
const EVENT_KIND_ORDER: Record<IAutoMovieInteractionEvent["kind"], number> = {
  contact: 0,
  hit: 1,
  fall: 2,
  grab: 3,
  attach: 4,
  detach: 5,
  release: 6,
};

/**
 * Fold one beat's action calls into an {@link IAutoMovieShot} through
 * {@link compilePerformance}, gating both sides of the seam.
 *
 * The performing list is `revise.final` when the revise pass produced one and
 * `draft` otherwise. The stages run in order, and the first stage group that
 * reports a violation returns every violation of that group and stops:
 *
 * 1. Input: unique script beat ids, the shot's `lightMotions` against the
 *    staged lights, a planned beat, a positive duration, every action by
 *    {@link gatePerformShotActions}, the live camera's moves by
 *    {@link gatePerformShotFrameOverlaps}, same-actor content overlaps by
 *    {@link gatePerformShotRegionOverlaps}, the blocking by
 *    {@link gatePerformShotBlocking}, and the cameras by
 *    {@link gatePerformShotCamera}.
 * 2. Launches: each flight is solved and its recoil scheduled by
 *    {@link compilePerformShotLaunches}.
 * 3. Performance: the stage list compiles, stance feet are planted by
 *    {@link plantPerformShotStanceFeet}, every channel a region mask would drop
 *    is reported at the author's `region` (or `onHit`) field, and every clip
 *    must pass `validateMotion` against its rig.
 * 4. Coupling: per-beat `attachTo` handoffs and staged mounts are baked by
 *    {@link coupleObjects}.
 * 5. Authored object clips are gated by {@link gateAuthoredObjectMotions}.
 * 6. Cameras: the live camera's move and each coverage take compile through
 *    the framing grammar, subjects measured by
 *    {@link createPerformShotSubjectFramer}, and any physical clearance
 *    envelope is checked by {@link compileCameraClearanceReports}.
 *
 * A shot with no `frame` action is locked off on the scene's first camera.
 * Positional targets resolve against every staged placement, cameras
 * included, so an actor may look down the lens, but a camera performs nothing
 * except `frame`. Only a camera subject may name a formation. The assembled
 * shot is finally checked against the shot artifact contract; every
 * author-reachable failure is refused above with a path, so a failure there is
 * an engine defect and throws an `Error` instead of blaming the author.
 *
 * @evidence contracts/common.md#principled-implementation A staged pipeline in which each stage only runs on input the previous stages proved, so synthesis never sees a malformed request and compilers never see an unresolved target; the producer then checks its own output against the same artifact contract the commit gate applies, and throws because reaching a failure there means a missing gate rather than an authoring fault.
 * @evidence contracts/common.md#clear-and-simple-design This function owns the stage order, the shared gate context and the assembly; each gate and compile stage lives in its own module with its own contract, so the function reads as a sequence of named stages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No beat, actor, camera or prop is special-cased; every refusal carries a path into the author's input, and the artifact check throws rather than downgrading an engine defect into an authoring violation.
 * @evidence contracts/common.md#meaningful-documentation States which list performs, every stage in order with its owner, the stop-at-first-failing-group rule, the locked-off fallback, how cameras and formations may be targeted, and when and why it throws; each input field documents its meaning and what omitting it does.
 * @evidence contracts/performance.md#efficient-algorithms Linear in actions and actors for the gates, plus synthesis, the launch solves, stance planting per gait-bearing actor, the camera compiles and one artifact validation; the costly synthesis runs at most once per action and actor.
 * @evidence contracts/performance.md#reuse-equivalent-work Synthesis is memoized per action object and actor, so the overlap gate, the launch probe and the performance compile share one clip per pair; the staged lookup tables are built once into the gate context, and model extents once per node in the subject framer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synthesis memo is a `WeakMap` keyed by the caller's action objects and is dropped with the call, as are the gate context and the framer; the caller owns the returned shot, motions and plants.
 */
export function performShot (props: IPerformShotProps): IAutoMoviePerformedShot {
  const staged: IAutoMovieStagedSet.ISuccess = props.staged;
  const performance: IAutoMoviePerformance = props.performance;
  const skeleton: (node: string) => IAutoMovieSkeleton | null = props.skeleton;
  const out: ViolationCollector = new ViolationCollector();
  const failure: () => IAutoMoviePerformedShot.IFailure = (): IAutoMoviePerformedShot.IFailure => ({
    success: false,
    violations: out.items,
  });
  const formationMotions: readonly IAutoMovieFormationMotion[] =
    props.formationMotions ?? [];
  const formationById: Map<string, IAutoMovieCompiledFormation> = new Map(
    (props.formations ?? []).map(
      (
        formation: IAutoMovieCompiledFormation,
      ): [string, IAutoMovieCompiledFormation] => [formation.id, formation],
    ),
  );
  const synthesize: IAutoMovieActionSynthesizer = memoizeSynthesis(
    props.synthesize,
    props.previous,
  );
  const rotations: Map<string, IAutoMovieQuaternion> = new Map(
    staged.scene.nodes.map(
      (node: IAutoMovieSceneNode): [string, IAutoMovieQuaternion] => [
        node.id,
        node.transform.rotation,
      ],
    ),
  );
  const context: IPerformShotGateContext = {
    out,
    staged,
    performance,
    base:
      performance.revise.final !== null ? "$input.revise.final" : "$input.draft",
    skeleton,
    hasActorContext: props.hasActorContext,
    gaits: props.gaits,
    nodeIds: new Set(rotations.keys()),
    cameraIds: new Set(
      staged.scene.cameras.map((camera: IAutoMovieCamera): string => camera.id),
    ),
    nodePositions: scenePlacements(staged.scene),
    formationById,
    formationPoints: new Map(
      [...formationById].map(
        ([id, formation]: [string, IAutoMovieCompiledFormation]): [
          string,
          IAutoMovieVector3,
        ] => [
          id,
          transformFormationPoint(
            formation.centroid,
            formation.anchor,
            sampleFormationMotion(formationMotions, id, 0),
            formation.facingDeg,
          ),
        ],
      ),
    ),
    targetAt: props.targetAt,
  };

  // 1. Input.
  const beat: IAutoMovieScript["beats"][number] | undefined = gateScript(
    context,
    props.script,
  );
  const lightMotions: IAutoMovieClip[] | undefined =
    props.lightMotions === undefined ? undefined : [...props.lightMotions];
  appendLightMotionsArtifact(
    lightMotions,
    "$input.lightMotions",
    new Map(
      staged.scene.lights.map(
        (light: IAutoMovieLight): [string, IAutoMovieLight["type"]] => [
          light.id,
          light.type,
        ],
      ),
    ),
    out.items,
  );
  validatePerformShotId(out, performance.beat, "$input.beat", "beat id");
  if (beat === undefined)
    out.push(
      "type",
      "$input.beat",
      `beat "${performance.beat}" must be one of the script's beats`,
      performance.beat,
    );
  if (!Number.isFinite(performance.duration) || !(performance.duration > 0))
    out.push(
      "range",
      "$input.duration",
      `shot duration must be a finite number > 0 seconds, but was ${performance.duration}`,
      performance.duration,
    );
  const actions: IAutoMovieActionCall[] =
    performance.revise.final ?? performance.draft;
  const plan: IPerformShotActionPlan = gatePerformShotActions(context, actions);
  gatePerformShotFrameOverlaps(context, plan.frames);
  gatePerformShotRegionOverlaps(context, actions, synthesize);
  if (props.blocking !== undefined)
    gatePerformShotBlocking(
      context,
      props.blocking,
      plan.stageActions,
      plan.frames,
    );
  const cameras: {
    liveCamera: string | null;
    coverageJobs: IPerformShotCoverageJob[];
  } = gatePerformShotCamera(context, {
    liveCamera: plan.liveCamera,
    frames: plan.frames,
    coverage: props.blocking?.coverage ?? [],
  });
  if (out.items.length > 0) return failure();

  // 2. Launches.
  const launched: {
    clips: IAutoMovieClip[];
    events: IAutoMovieInteractionEvent[];
  } = compilePerformShotLaunches(context, plan, synthesize, rotations);
  if (out.items.length > 0) return failure();
  const objectMotions: IAutoMovieClip[] = launched.clips;
  const events: IAutoMovieInteractionEvent[] = launched.events;

  // 3. Performance.
  const compiled: IAutoMovieCompiledPerformance = compilePerformance(
    plan.stageActions,
    synthesize,
  );
  const motions: Record<string, IAutoMovieMotion> = compiled.performances;
  const plants: IAutoMoviePerformedShot.ISuccess["plants"] =
    plantPerformShotStanceFeet({
      staged,
      motions,
      previous: props.previous,
      skeleton,
      jointAxes: props.jointAxes,
      restFrames: props.restFrames,
    });
  for (const drop of compiled.masked)
    out.push(
      "type",
      plan.stageActionPaths[drop.action]!,
      `${drop.actor}'s clip authors ${maskedContent(drop)}, which the "${drop.region}" body region does not carry, so the performance would drop that content; set region to one that owns it ("fullBody" owns every bone and the root, only "face" carries an expression), or move the content to its own action`,
      drop.region,
    );
  for (const [node, motion] of Object.entries(motions)) {
    const rig: IAutoMovieSkeleton | null = skeleton(node);
    if (rig === null) continue;
    const validated: ReturnType<typeof validateMotion> = validateMotion({
      motion,
      skeleton: rig,
    });
    if (validated.success === false)
      for (const violation of validated.violations)
        out.items.push({
          ...violation,
          path: violation.path.replace("$input", `$compiled["${node}"]`),
        });
  }
  if (out.items.length > 0) return failure();

  // 4. Coupling, now that the parents' poses have compiled.
  const coupled: ReturnType<typeof coupleObjects> = coupleObjects({
    attachments: plan.attachments,
    mounts: staged.mounts,
    scene: staged.scene,
    motions,
    skeleton,
    jointAxes: props.jointAxes,
    restFrames: props.restFrames,
    duration: performance.duration,
  });
  objectMotions.push(...coupled.clips);
  events.push(...coupled.events);
  out.items.push(...coupled.violations);
  if (out.items.length > 0) return failure();

  // 5. Authored object clips, once the performed and baked nodes are settled.
  const authored: readonly IAutoMovieClip[] = props.objectMotions ?? [];
  out.items.push(
    ...gateAuthoredObjectMotions({
      scene: staged.scene,
      props: props.props,
      clips: authored,
      baked: objectMotions,
      performed: new Set(Object.keys(motions)),
      duration: performance.duration,
      path: "$input.objectMotions",
    }),
  );
  if (out.items.length > 0) return failure();
  objectMotions.push(...authored);

  // 6. Cameras.
  const liveCamera: string = cameras.liveCamera!;
  const camera: Pick<
    IAutoMovieShot,
    "cameraMotion" | "cameraIntent" | "coverage" | "cameraClearance"
  > = compilePerformShotCameras(context, {
    liveCamera,
    frames: plan.frames,
    coverageJobs: cameras.coverageJobs,
    scope: props.shotId ?? performance.beat,
    aspect:
      props.frameFormat === undefined ||
      !(props.frameFormat.width > 0) ||
      !(props.frameFormat.height > 0)
        ? undefined
        : props.frameFormat.width / props.frameFormat.height,
    models: props.models,
    formationMotions,
    motions,
    objectMotions,
    rotations,
    runtime: props.cameraClearance,
  });
  if (out.items.length > 0) return failure();

  // Keys keep their historical order, because the artifact is serialized.
  const shot: IAutoMovieShot = {
    id: props.shotId ?? `shot:${performance.beat}`,
    name: beat!.name,
    scene: staged.scene.id,
    camera: liveCamera,
    cameraMotion: camera.cameraMotion,
    performances: Object.entries(motions).map(
      ([node, motion]: [string, IAutoMovieMotion]): IAutoMovieShotPerformance => ({
        node,
        motion: motion.id,
        startOffset: 0,
      }),
    ),
    objectMotions,
    ...(lightMotions === undefined ? {} : { lightMotions }),
    events: [...events].sort(
      (a: IAutoMovieInteractionEvent, b: IAutoMovieInteractionEvent): number =>
        a.time - b.time ||
        EVENT_KIND_ORDER[a.kind] - EVENT_KIND_ORDER[b.kind] ||
        compareCodeUnits(a.id, b.id),
    ),
    cameraIntent: camera.cameraIntent,
    coverage: camera.coverage,
    ...(camera.cameraClearance === undefined
      ? {}
      : { cameraClearance: camera.cameraClearance }),
    duration: performance.duration,
  };

  const assembled: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      shot,
      staged.scene,
      new Set(
        Object.values(motions).map(
          (motion: IAutoMovieMotion): string => motion.id,
        ),
      ),
    );
  if (assembled.success === false)
    throw new Error(
      `performShot produced a shot that violates the shot artifact contract, which is an engine defect rather than an authoring fault: ${assembled.violations
        .slice(0, 5)
        .map(
          (item: IAutoMovieConstraintViolation): string =>
            `${item.kind} at ${item.path}: ${item.expected}`,
        )
        .join("; ")}`,
    );
  return { success: true, shot, motions, plants };
}

/**
 * Refuse duplicate script beat ids and answer the beat the performance names,
 * the first declaration of its id.
 */
function gateScript (
  context: IPerformShotGateContext,
  script: IAutoMovieScript,
): IAutoMovieScript["beats"][number] | undefined {
  const first: Map<string, number> = new Map();
  script.beats.forEach(
    (beat: IAutoMovieScript["beats"][number], index: number): void => {
      const existing: number | undefined = first.get(beat.id);
      if (existing === undefined) first.set(beat.id, index);
      else
        context.out.push(
          "type",
          `$script.beats[${index}].id`,
          `script beat id "${beat.id}" is duplicated; first declared at $script.beats[${existing}].id`,
          beat.id,
        );
    },
  );
  const index: number | undefined = first.get(context.performance.beat);
  return index === undefined ? undefined : script.beats[index];
}

/**
 * The synthesizer once per action object and actor, with the prior beat state
 * bound, so every stage that needs a clip shares one.
 */
function memoizeSynthesis (
  synthesize: IAutoMovieActionSynthesizer,
  previous: IAutoMovieBeatEndState | null | undefined,
): IAutoMovieActionSynthesizer {
  const cache: WeakMap<
    IAutoMovieActionCall,
    Map<string, IAutoMovieMotion | null>
  > = new WeakMap();
  return (
    action: IAutoMovieActionCall,
    actor: string,
  ): IAutoMovieMotion | null => {
    let byActor: Map<string, IAutoMovieMotion | null> | undefined =
      cache.get(action);
    if (byActor === undefined) {
      byActor = new Map();
      cache.set(action, byActor);
    }
    if (byActor.has(actor)) return byActor.get(actor)!;
    const motion: IAutoMovieMotion | null = synthesize(action, actor, previous);
    byActor.set(actor, motion);
    return motion;
  };
}

/** What a masked clip authored that its region drops, in words. */
function maskedContent (drop: IAutoMovieMaskedContent): string { return [
    ...(drop.bones.length > 0 ? [`the bones ${drop.bones.join(", ")}`] : []),
    ...(drop.root ? ["a root displacement"] : []),
    ...(drop.expression ? ["an expression"] : []),
  ].join(" and "); }
