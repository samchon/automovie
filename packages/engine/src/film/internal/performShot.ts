import type {
  IAutoMovieActionCall,
  IAutoMovieActionSynthesizer,
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledPerformance,
  IAutoMovieConstraintViolation,
  IAutoMovieCoupleObjects,
  IAutoMovieEnginePerformShotActionPlan,
  IAutoMovieEnginePerformShotGateContext,
  IAutoMovieFormationMotion,
  IAutoMovieInteractionEvent,
  IAutoMovieLight,
  IAutoMovieMotion,
  IAutoMoviePerformShotCoverageJob,
  IAutoMoviePerformShotProps,
  IAutoMoviePerformance,
  IAutoMoviePerformedShot,
  IAutoMovieQuaternion,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieShot,
  IAutoMovieShotPerformance,
  IAutoMovieSkeleton,
  IAutoMovieStagedSet,
  IAutoMovieValidation,
  IAutoMovieVector3,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { prepareSkeletonPoseResolution } from "../../kinematics/prepareSkeletonPoseResolution";
import { compilePerformance } from "../../perform/compilePerformance";
import { scenePlacements } from "../../perform/scenePlacements";
import { sampleFormationMotion } from "../../populationRuntime/formation/sampleFormationMotion";
import { transformFormationPoint } from "../../populationRuntime/formation/internal/transformFormationPoint";
import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { admitShotEditorialMarkers } from "../../validation/internal/admitShotEditorialMarkers";
import { appendLightMotionsArtifact } from "../../validation/appendLightMotionsArtifact";
import { appendPolygonBodyCuesArtifact } from "../../validation/internal/appendPolygonBodyCuesArtifact";
import { describeInvalidValue } from "../../validation/describeInvalidValue";
import { validateShotArtifact } from "../../validation/internal/validateShotArtifact";
import { admitPerformShotSurfaces } from "./admitPerformShotSurfaces";
import { compileCameraClearanceReports } from "./compileCameraClearanceReports";
import { compilePerformShotCameras } from "./compilePerformShotCameras";
import { compilePerformShotLaunches } from "./compilePerformShotLaunches";
import { compilePerformShotPracticalLights } from "./compilePerformShotPracticalLights";
import { copyPolygonBodyCue } from "./copyPolygonBodyCue";
import { coupleObjects } from "./coupleObjects";
import { createPerformShotSubjectFramer } from "./createPerformShotSubjectFramer";
import { admitPerformShotFlames } from "../flame/internal/admitPerformShotFlames";
import { gateAuthoredObjectMotions } from "./gateAuthoredObjectMotions";
import { gatePerformShotActions } from "./gatePerformShotActions";
import { gatePerformShotBlocking } from "./gatePerformShotBlocking";
import { gatePerformShotCamera } from "./gatePerformShotCamera";
import { gatePerformShotCompiledMotions } from "./gatePerformShotCompiledMotions";
import { gatePerformShotFrameOverlaps } from "./gatePerformShotFrameOverlaps";
import { gatePerformShotRegionOverlaps } from "./gatePerformShotRegionOverlaps";
import { gatePerformShotScript } from "./gatePerformShotScript";
import { memoizePerformShotSynthesis } from "./memoizePerformShotSynthesis";
import { plantPerformShotStanceFeet } from "./plantPerformShotStanceFeet";

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
 * 1. Input: unique script beat ids, the shot's `lightMotions` against the staged
 *    lights and its polygon body cues against staged rigs, flame cues by
 *    {@link admitPerformShotFlames}, a planned beat, a positive duration,
 *    authored editorial markers, every action by {@link gatePerformShotActions},
 *    the live camera's moves by {@link gatePerformShotFrameOverlaps}, same-actor
 *    content overlaps by {@link gatePerformShotRegionOverlaps}, the blocking by
 *    {@link gatePerformShotBlocking}, the cameras by
 *    {@link gatePerformShotCamera}, and then practical surface and surface
 *    graphic tracks against the staged nodes, the registered models and the
 *    live camera that gate chose by {@link admitPerformShotSurfaces}, so a feed
 *    of the shot's own camera is an authoring finding.
 * 2. Launches: each flight is solved and its recoil scheduled by
 *    {@link compilePerformShotLaunches}.
 * 3. Performance: the stage list compiles, stance feet are planted by
 *    {@link plantPerformShotStanceFeet}, every channel a region mask would drop
 *    is reported at the author's `region` (or `onHit`) field, and every clip
 *    must pass `validateMotion` against its rig, both by
 *    {@link gatePerformShotCompiledMotions}.
 * 4. Coupling: per-beat `attachTo` handoffs and staged mounts are baked by
 *    {@link coupleObjects}.
 * 5. Authored object clips are gated by {@link gateAuthoredObjectMotions}.
 * 6. Practical lights bind staged emitters to the final object clips and share
 *    light channel admission with authored clips.
 * 7. Cameras: the live camera's move and each coverage take compile through the
 *    framing grammar, subjects measured by
 *    {@link createPerformShotSubjectFramer}, and any physical clearance envelope
 *    is checked by {@link compileCameraClearanceReports}.
 *
 * A shot with no frame action is locked off on the scene's first camera.
 * Positional targets resolve against every staged placement, cameras included,
 * so an actor may look down the lens, but a camera performs only frame. Only a
 * camera subject may name a formation. The assembled artifact is checked
 * independently and a failure throws as a compilation defect. This does not
 * prove every possible authored failure was located earlier: typed outer
 * containers, generated event-id collisions, mutable callbacks and downstream
 * arithmetic remain distinct exception boundaries.
 */
export function performShot(
  props: IAutoMoviePerformShotProps,
): IAutoMoviePerformedShot {
  const staged: IAutoMovieStagedSet.ISuccess = props.staged;
  const performance: IAutoMoviePerformance = props.performance;
  const skeleton: (node: string) => IAutoMovieSkeleton | null = props.skeleton;
  const out: IAutoMovieViolationCollector =
    new AutoMovieEngineViolationCollector();
  const failure: () => IAutoMoviePerformedShot.IFailure =
    (): IAutoMoviePerformedShot.IFailure => ({
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
  const synthesize: IAutoMovieActionSynthesizer = memoizePerformShotSynthesis(
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
  const context: IAutoMovieEnginePerformShotGateContext = {
    out,
    staged,
    performance,
    base:
      performance.revise.final !== null
        ? "$input.revise.final"
        : "$input.draft",
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
  const beat: IAutoMovieScript["beats"][number] | undefined =
    gatePerformShotScript(context, props.script);
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
  if (beat === undefined)
    out.push(
      "type",
      "$input.beat",
      `beat "${describeInvalidValue(performance.beat)}" must be one of the script's beats`,
      performance.beat,
    );
  if (!(performance.duration > 0))
    out.push(
      "range",
      "$input.duration",
      `shot duration must be a finite number > 0 seconds, but was ${describeInvalidValue(performance.duration)}`,
      performance.duration,
    );
  const editorialMarkers: IAutoMovieShot["editorialMarkers"] =
    admitShotEditorialMarkers(
      performance.editorialMarkers,
      performance.duration,
      out.items,
    );
  appendPolygonBodyCuesArtifact(
    props.polygonBodyCues,
    staged.scene.nodes,
    performance.duration,
    out,
    skeleton,
  );
  const polygonBodyCues: IAutoMovieShot["polygonBodyCues"] =
    out.items.length === 0
      ? props.polygonBodyCues?.map(copyPolygonBodyCue)
      : undefined;
  const flames: IAutoMovieShot["flames"] = admitPerformShotFlames(
    props,
    staged.scene.nodes,
    performance.duration,
    out,
  );
  const actions: IAutoMovieActionCall[] =
    performance.revise.final ?? performance.draft;
  const plan: IAutoMovieEnginePerformShotActionPlan = gatePerformShotActions(
    context,
    actions,
  );
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
    coverageJobs: IAutoMoviePerformShotCoverageJob[];
  } = gatePerformShotCamera(context, {
    liveCamera: plan.liveCamera,
    frames: plan.frames,
    coverage: props.blocking?.coverage ?? [],
  });
  // Surfaces come after the camera gate, so a feed of the live camera it chose
  // is refused here as an authoring finding.
  const surfaces: Pick<
    IAutoMovieShot,
    "practicalSurfaces" | "surfaceGraphics" | "fonts"
  > = admitPerformShotSurfaces(
    props,
    staged.scene.nodes,
    performance.duration,
    out,
    {
      ids: context.cameraIds,
      ...(cameras.liveCamera === null ? {} : { shot: cameras.liveCamera }),
    },
  );
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
    plantPerformShotStanceFeet(
      {
        staged,
        motions,
        previous: props.previous,
        skeleton,
        jointAxes: props.jointAxes,
        restFrames: props.restFrames,
      },
      { duration: performance.duration, out },
    );
  gatePerformShotCompiledMotions(
    out,
    compiled,
    plan.stageActionPaths,
    skeleton,
  );
  if (out.items.length > 0) return failure();

  // 4. Admitted parent rigs can prepare only their demanded attachment ancestry.
  const coupled: IAutoMovieCoupleObjects.IResult = coupleObjects({
    attachments: plan.attachments,
    mounts: staged.mounts,
    scene: staged.scene,
    motions,
    skeleton,
    jointAxes: props.jointAxes,
    restFrames: props.restFrames,
    prepareRig: prepareSkeletonPoseResolution,
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

  // 6. Bind practical lights to the completed object clips.
  const resolvedLightMotions: IAutoMovieClip[] | undefined =
    compilePerformShotPracticalLights(props, objectMotions, lightMotions, out);
  if (out.items.length > 0) return failure();

  // 7. Cameras.
  const liveCamera: string = cameras.liveCamera!;
  const camera: Pick<
    IAutoMovieShot,
    "cameraMotion" | "cameraIntent" | "coverage" | "cameraClearance"
  > = compilePerformShotCameras(context, {
    liveCamera,
    frames: plan.frames,
    coverageJobs: cameras.coverageJobs,
    scope: props.shotId ?? performance.beat,
    frameFormat: props.frameFormat,
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
      ([node, motion]: [
        string,
        IAutoMovieMotion,
      ]): IAutoMovieShotPerformance => ({
        node,
        motion: motion.id,
        startOffset: 0,
      }),
    ),
    objectMotions,
    ...(resolvedLightMotions === undefined
      ? {}
      : { lightMotions: resolvedLightMotions }),
    ...surfaces,
    ...(flames === undefined ? {} : { flames }),
    ...(polygonBodyCues === undefined ? {} : { polygonBodyCues }),
    events: [...events].sort(
      (a: IAutoMovieInteractionEvent, b: IAutoMovieInteractionEvent): number =>
        a.time - b.time ||
        EVENT_KIND_ORDER[a.kind] - EVENT_KIND_ORDER[b.kind] ||
        AutoMovieEngineText.compareCodeUnits(a.id, b.id),
    ),
    ...(editorialMarkers === undefined ? {} : { editorialMarkers }),
    cameraIntent: camera.cameraIntent,
    coverage: camera.coverage,
    ...(camera.cameraClearance === undefined
      ? {}
      : { cameraClearance: camera.cameraClearance }),
    duration: performance.duration,
  };

  const assembled: IAutoMovieValidation = validateShotArtifact(
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
