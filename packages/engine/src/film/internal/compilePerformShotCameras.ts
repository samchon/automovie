import {
  IAutoMovieActionTarget,
  IAutoMovieCamera,
  type IAutoMovieCameraFrameEntry,
  IAutoMovieCameraIntent,
  IAutoMovieClip,
  type IAutoMovieCompilePerformShotCameras,
  type IAutoMovieEnginePerformShotGateContext,
  type IAutoMovieFramedSubject,
  type IAutoMoviePerformShotCoverageJob,
  type IAutoMoviePerformShotFrameJob,
  IAutoMovieProductionFrameRate,
  IAutoMovieShot,
  IAutoMovieShotCoverage,
} from "@automovie/interface";

import { compileCameraClearanceReports } from "./compileCameraClearanceReports";
import { compileCameraCoverage } from "./compileCameraCoverage";
import { compileCameraMove } from "./compileCameraMove";
import { compilePerformShotFocusPull } from "../compilePerformShotFocusPull";
import { createPerformShotSubjectFramer } from "../createPerformShotSubjectFramer";
import { resolveProductionFrameRate } from "./resolveProductionFrameRate";
import { resolvedPerformShotPoint } from "../resolvedPerformShotPoint";

/**
 * Compile the camera fields of a performed shot: the live camera's move, its
 * per-span intent, one alternate take per coverage job, and the clearance
 * reports.
 *
 * The live camera's `frame` moves, already sorted by start, compile through
 * {@link compileCameraMove} into the clip `cam:<scope>`; with no move the camera
 * is locked off and the clip is null. Each move's intent carries its framing,
 * move, focal length and focus, ordinary focus resolved to the opening point
 * the input gate accepted. An authored focus pull resolves two lens marks after
 * actor and object motion are compiled. A downstream host reads the intent
 * independently of the camera path. Each coverage job plays its one framing
 * across the whole beat from its own staged camera, as the clip
 * `cam:<scope>:<camera>`, so a host can cut to the angle at any instant, with
 * no focus or focal length invented for it. Every subject is measured by one
 * {@link createPerformShotSubjectFramer}, so hero and coverage frame the same
 * subject. {@link compileCameraClearanceReports} then reports any take whose
 * physical envelope is obstructed into the context's collector.
 *
 * @param context The shot's staged tables and collector.
 * @param props.liveCamera The live camera id the camera gate settled.
 * @param props.frames The live camera's moves, sorted by start.
 * @param props.coverageJobs The coverage takes the camera gate admitted.
 * @param props.scope Clip id scope: the shot id when given, else the beat id.
 * @param props.frameFormat Delivery raster and clock: its width over height is
 *   the framing aspect, a non-positive side or none giving a square fit, and
 *   its `fps` and `frameRate` key the moving paths, the compiler's 24 fps
 *   fallback applying without `fps`. A rate `resolveProductionFrameRate`
 *   refuses is a `range` violation at `$input.frameFormat.fps`.
 * @param props.models Compiler-owned models of the staged nodes, if any.
 * @param props.formationMotions The shot's compact formation cues.
 * @param props.motions The compiled actor clips by node id.
 * @param props.objectMotions Every object clip in producer order.
 * @param props.rotations Each staged node's world rotation, by id.
 * @param props.runtime The clearance runtime, when the caller supplied one.
 * @returns The shot's camera fields.
 */
export function compilePerformShotCameras(
  context: IAutoMovieEnginePerformShotGateContext,
  props: IAutoMovieCompilePerformShotCameras.IProps,
): Pick<
  IAutoMovieShot,
  "cameraMotion" | "cameraIntent" | "coverage" | "cameraClearance"
> {
  const duration: number = context.performance.duration;
  const format: IAutoMovieCompilePerformShotCameras.IProps["frameFormat"] =
    props.frameFormat;
  const aspect: number | undefined =
    format === undefined || !(format.width > 0) || !(format.height > 0)
      ? undefined
      : format.width / format.height;
  const frameRate: IAutoMovieProductionFrameRate | undefined =
    deliveryFrameRate(context, format);
  const hero: IAutoMovieCamera = context.staged.scene.cameras.find(
    (camera: IAutoMovieCamera): boolean => camera.id === props.liveCamera,
  )!;
  const frame: (
    on: IAutoMovieActionTarget,
    start?: number,
  ) => IAutoMovieFramedSubject = createPerformShotSubjectFramer(context, props);
  const cameraMotion: IAutoMovieClip | null = compileCameraMove({
    clipId: `cam:${props.scope}`,
    camera: hero,
    entries: props.frames.map(
      (job: IAutoMoviePerformShotFrameJob): IAutoMovieCameraFrameEntry => ({
        action: job.action,
        subject: frame(job.action.on, job.action.start),
      }),
    ),
    shotDuration: duration,
    aspect,
    frameRate,
  });
  const coverage: IAutoMovieShotCoverage[] = props.coverageJobs.map(
    ({
      intent,
      camera,
    }: IAutoMoviePerformShotCoverageJob): IAutoMovieShotCoverage =>
      compileCameraCoverage({
        camera,
        clipId: `cam:${props.scope}:${camera.id}`,
        entries: [
          {
            action: {
              verb: "frame",
              actor: camera.id,
              start: 0,
              duration: "auto",
              framing: intent.framing,
              move: intent.move,
              on: intent.on,
            },
            subject: frame(intent.on),
            intent: {
              start: 0,
              framing: intent.framing,
              move: intent.move,
              focus: null,
              focalLength: null,
            },
          },
        ],
        shotDuration: duration,
        aspect,
        frameRate,
      }),
  );
  const cameraClearance: IAutoMovieShot["cameraClearance"] =
    compileCameraClearanceReports({
      scene: context.staged.scene,
      hero: { camera: hero, motion: cameraMotion },
      coverage,
      duration,
      motions: props.motions,
      objectMotions: props.objectMotions,
      models: props.models ?? [],
      runtime: props.runtime,
      out: context.out,
    });
  return {
    cameraMotion,
    cameraIntent: props.frames.map(
      (
        job: IAutoMoviePerformShotFrameJob,
        index: number,
      ): IAutoMovieCameraIntent => {
        const action: IAutoMoviePerformShotFrameJob["action"] = job.action;
        const pull: ReturnType<typeof compilePerformShotFocusPull> =
          action.focusPull === undefined
            ? null
            : compilePerformShotFocusPull(
                context,
                props,
                job,
                props.frames[index + 1]?.action.start ?? duration,
              );
        return {
          start: action.start,
          framing: action.framing,
          move: action.move,
          focus:
            action.focusPull !== undefined
              ? (pull?.focus ?? null)
              : action.focus === undefined
                ? null
                : resolvedPerformShotPoint(context, action.focus),
          focalLength: action.focalLength ?? null,
          ...(action.fNumber === undefined ? {} : { fNumber: action.fNumber }),
          ...(pull === null ? {} : { focusPull: pull.focusPull }),
        };
      },
    ),
    coverage,
    ...(cameraClearance === undefined ? {} : { cameraClearance }),
  };
}

/**
 * The exact delivery rate, or undefined when no `fps` is stated or it is
 * refused.
 */
function deliveryFrameRate(
  context: IAutoMovieEnginePerformShotGateContext,
  format: IAutoMovieCompilePerformShotCameras.IProps["frameFormat"],
): IAutoMovieProductionFrameRate | undefined {
  if (format?.fps === undefined) return undefined;
  try {
    return resolveProductionFrameRate({
      fps: format.fps,
      frameRate: format.frameRate,
    });
  } catch (error) {
    context.out.push(
      "range",
      "$input.frameFormat.fps",
      error instanceof Error ? error.message : String(error),
      format.fps,
    );
    return undefined;
  }
}
