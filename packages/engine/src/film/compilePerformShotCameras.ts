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
  IAutoMovieShot,
  IAutoMovieShotCoverage,
} from "@automovie/interface";

import { compileCameraClearanceReports } from "./compileCameraClearanceReports";
import { compileCameraCoverage } from "./compileCameraCoverage";
import { compileCameraMove } from "./compileCameraMove";
import { compilePerformShotFocusPull } from "./compilePerformShotFocusPull";
import { createPerformShotSubjectFramer } from "./createPerformShotSubjectFramer";
import { resolvedPerformShotPoint } from "./resolvedPerformShotPoint";

/**
 * Compile the camera fields of a performed shot: the live camera's move, its per-span intent, one alternate take per coverage job, and the clearance reports.
 *
 * The live camera's `frame` moves, already sorted by start, compile through {@link compileCameraMove} into the clip `cam:<scope>`; with no move the camera is locked off and the clip is null. Each move's intent carries its framing, move, focal length and focus, ordinary focus resolved to the opening point the input gate accepted. An authored focus pull resolves two lens marks after actor and object motion are compiled. A downstream host reads the intent independently of the camera path. Each coverage job plays its one framing across the whole beat from its own staged camera, as the clip `cam:<scope>:<camera>`, so a host can cut to the angle at any instant, with no focus or focal length invented for it. Every subject is measured by one {@link createPerformShotSubjectFramer}, so hero and coverage frame the same subject. {@link compileCameraClearanceReports} then reports any take whose physical envelope is obstructed into the context's collector.
 *
 * @param context The shot's staged tables and collector.
 * @param props.liveCamera The live camera id the camera gate settled.
 * @param props.frames The live camera's moves, sorted by start.
 * @param props.coverageJobs The coverage takes the camera gate admitted.
 * @param props.scope Clip id scope: the shot id when given, else the beat id.
 * @param props.aspect Frame width over height, or undefined for a square fit.
 * @param props.models Compiler-owned models of the staged nodes, if any.
 * @param props.formationMotions The shot's compact formation cues.
 * @param props.motions The compiled actor clips by node id.
 * @param props.objectMotions Every object clip in producer order.
 * @param props.rotations Each staged node's world rotation, by id.
 * @param props.runtime The clearance runtime, when the caller supplied one.
 * @returns The shot's camera fields.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Every take compiles through the one framing grammar with its own staged camera as the parameter, so the side the director staged is the side the angle plays from; subjects come from one framer and lens marks from the positional target gate at their individual cue times.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The camera stage of `performShot` in one place, delegating the solve to `compileCameraMove` and `compileCameraCoverage`, measurement to the subject framer and obstruction to `compileCameraClearanceReports`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Hero and coverage are compiled by the same grammar and framer; a coverage take gets no invented lens intent, and an obstructed take is reported rather than nudged.
 * @evidence contracts/development/common.md#meaningful-documentation States each compiled field, the clip id formats, the locked-off case, what an intent carries and who reads it, how coverage plays, the shared framer, and where clearance refusals go.
 * @evidence contracts/development/implementation.md#efficient-algorithms One camera compile per take plus one subject measurement per frame move and coverage job, with model extents memoized across takes by the framer, and the clearance sweep's own cost.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One framer is built per shot and shared by every take, so a subject's model extent is measured once however many cameras frame it.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The framer and its memo are dropped on return; the caller owns the returned clips, intents, takes and reports.
 */
export function compilePerformShotCameras(
  context: IAutoMovieEnginePerformShotGateContext,
  props: IAutoMovieCompilePerformShotCameras.IProps,
): Pick<
  IAutoMovieShot,
  "cameraMotion" | "cameraIntent" | "coverage" | "cameraClearance"
> {
  const duration: number = context.performance.duration;
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
    aspect: props.aspect,
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
        aspect: props.aspect,
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
          ...(pull === null ? {} : { focusPull: pull.focusPull }),
        };
      },
    ),
    coverage,
    ...(cameraClearance === undefined ? {} : { cameraClearance }),
  };
}
