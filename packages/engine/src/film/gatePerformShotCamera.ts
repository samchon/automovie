import {
  IAutoMovieBlockingCoverage,
  IAutoMovieCamera,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IPerformShotCoverageJob } from "./IPerformShotCoverageJob";
import { IPerformShotFrameJob } from "./IPerformShotFrameJob";
import { IPerformShotGateContext } from "./IPerformShotGateContext";
import { isFiniteStageVector3 } from "./staging/isFiniteStageVector3";
import { describeInvalidValue } from "../validation/describeInvalidValue";
import { resolvePerformShotTarget } from "./resolvePerformShotTarget";
import { validatePerformShotFraming } from "./validatePerformShotFraming";
import { validatePerformShotId } from "./validatePerformShotId";

/**
 * Settle the shot's cameras once the live one is elected: fall back to a camera when no `frame` action elected one, gate the blocking's coverage angles, and gate every camera a move is compiled from.
 *
 * 1. Without an elected camera, the scene's first camera is live and locked off, its id gated as non-blank because it becomes `shot.camera`; a scene with no camera cannot be framed.
 * 2. Each coverage intent must name a staged camera that is neither the live camera nor one an earlier intent named, state a usable framing and move, and favour a subject that resolves; a coverage camera never becomes a second live camera.
 * 3. The live camera, when a `frame` action moves it, and every coverage camera must have a vertical field of view in `(0, 180)` degrees and a finite position, because the framing solve divides by `tan(fovY / 2)`; a camera whose move is a `whip` must also carry a finite rotation, since a whip pans from it. An unused degenerate camera fails nothing.
 *
 * @param context The shot's staged tables and collector.
 * @param props.liveCamera The camera the frame actions elected, or null.
 * @param props.frames The frame jobs of the live camera.
 * @param props.coverage The blocking's coverage intents, or none.
 * @returns The live camera id, null only when the scene has no camera, and the coverage jobs that passed.
 *
 * @evidence contracts/common.md#principled-implementation Checks the framing solve's authored domain, a field of view strictly inside `(0, 180)` degrees, finite position and whip rotation components, while walking actual staged cameras. The interval makes the tangent positive and finite in exact arithmetic; this gate does not check derived binary64 representability, so an extremely small positive field of view can still underflow its half-angle to zero.
 * @evidence contracts/common.md#clear-and-simple-design All camera decisions that depend on the final election in one gate, after the action pass elects; framing vocabulary, ids and targets go through the shared `validatePerformShotFraming`, `validatePerformShotId` and `resolvePerformShotTarget`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every camera is held to the same domain whether hero or coverage, only cameras a move is compiled from are checked so an unused one never fails a shot, and the rotation is required only of a whip, the one move that reads it.
 * @evidence contracts/common.md#meaningful-documentation States the three steps with their rules, the fallback camera and why its id is gated, which cameras are checked and why the rotation is whip-only, and the returned values.
 * @evidence contracts/performance.md#efficient-algorithms For I coverage intents and C cameras, camera joins cost O(I*C + C); the elected hero can scan F frame jobs for a whip. Target resolution adds group-member and rig traversals or caller callback work, and diagnostics add authored text and conversion costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Gates one shot's cameras per call; the subject resolution reads the context's shared tables.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The covered-camera map is dropped on return; the caller owns the returned jobs, at most one per coverage intent.
 */
export function gatePerformShotCamera (
  context: IPerformShotGateContext,
  props: {
    liveCamera: string | null;
    frames: readonly IPerformShotFrameJob[];
    coverage: readonly IAutoMovieBlockingCoverage[];
  },
): { liveCamera: string | null; coverageJobs: IPerformShotCoverageJob[] } {
  const frames: readonly IPerformShotFrameJob[] = props.frames;
  let liveCamera: string | null = props.liveCamera;
  if (liveCamera === null) {
    const first: IAutoMovieCamera | undefined = context.staged.scene.cameras[0];
    if (first === undefined)
      context.out.push(
        "type",
        "$input",
        "the staged scene has no camera, so the shot cannot be framed",
        context.performance.beat,
      );
    else {
      validatePerformShotId(
        context.out,
        first.id,
        "$staged.scene.cameras[0].id",
        "the fallback camera id",
      );
      liveCamera = first.id;
    }
  }
  const coverageJobs: IPerformShotCoverageJob[] = gateCoverage(
    context,
    liveCamera,
    props.coverage,
  );
  const coverageCameras: Map<IAutoMovieCamera, IPerformShotCoverageJob> =
    new Map(
      coverageJobs.map(
        (
          job: IPerformShotCoverageJob,
        ): [IAutoMovieCamera, IPerformShotCoverageJob] => [job.camera, job],
      ),
    );
  context.staged.scene.cameras.forEach(
    (camera: IAutoMovieCamera, index: number): void => {
      const job: IPerformShotCoverageJob | undefined =
        coverageCameras.get(camera);
      const hero: boolean = frames.length > 0 && camera.id === liveCamera;
      if (job === undefined && !hero) return;
      validateFramingCamera(
        context,
        camera,
        `$staged.scene.cameras[${index}]`,
        job !== undefined
          ? job.intent.move === "whip"
          : frames.some(
              (entry: IPerformShotFrameJob): boolean =>
                entry.action.move === "whip",
            ),
      );
    },
  );
  return { liveCamera, coverageJobs };
}

/** Gate the blocking's coverage intents against the elected live camera. */
function gateCoverage (
  context: IPerformShotGateContext,
  liveCamera: string | null,
  coverage: readonly IAutoMovieBlockingCoverage[],
): IPerformShotCoverageJob[] {
  const jobs: IPerformShotCoverageJob[] = [];
  const covered: Map<string, number> = new Map();
  coverage.forEach((intent: IAutoMovieBlockingCoverage, index: number): void => {
    const path: string = `$blocking.coverage[${index}]`;
    validatePerformShotId(
      context.out,
      intent.camera,
      `${path}.camera`,
      "coverage camera id",
    );
    const camera: IAutoMovieCamera | undefined =
      context.staged.scene.cameras.find(
        (candidate: IAutoMovieCamera): boolean =>
          candidate.id === intent.camera,
      );
    if (camera === undefined)
      context.out.push(
        "type",
        `${path}.camera`,
        `a coverage camera must be a staged camera, but "${describeInvalidValue(intent.camera)}" is not`,
        intent.camera,
      );
    else if (intent.camera === liveCamera)
      context.out.push(
        "type",
        `${path}.camera`,
        `coverage plays ANOTHER angle of the beat, but "${describeInvalidValue(intent.camera)}" is already this shot's live camera`,
        intent.camera,
      );
    const first: number | undefined = covered.get(intent.camera);
    if (first !== undefined)
      context.out.push(
        "type",
        `${path}.camera`,
        `coverage camera id "${describeInvalidValue(intent.camera)}" is duplicated; first declared at $blocking.coverage[${first}].camera`,
        intent.camera,
      );
    else covered.set(intent.camera, index);
    const usable: { framed: boolean; moved: boolean } =
      validatePerformShotFraming(context.out, path, intent.framing, intent.move);
    const subject: IAutoMovieVector3 | null = resolvePerformShotTarget(
      context,
      {
        target: intent.on,
        path: `${path}.on`,
        label: "coverage target",
        subject: "a coverage subject",
        seconds: 0,
        formationsFramed: true,
      },
    );
    if (
      camera !== undefined &&
      intent.camera !== liveCamera &&
      first === undefined &&
      usable.framed &&
      usable.moved &&
      subject !== null
    )
      jobs.push({ intent, camera });
  });
  return jobs;
}

/** Refuse a camera the framing solve cannot compile a move from. */
function validateFramingCamera (
  context: IPerformShotGateContext,
  camera: IAutoMovieCamera,
  path: string,
  readsRotation: boolean,
): void {
  if (typeof camera.fovY !== "number" || !(camera.fovY > 0 && camera.fovY < 180))
    context.out.push(
      "range",
      `${path}.fovY`,
      `a camera that frames must have a vertical field of view within (0, 180)°, but "${describeInvalidValue(camera.id)}" has ${describeInvalidValue(camera.fovY)}`,
      camera.fovY,
    );
  if (!isFiniteStageVector3(camera.transform.translation))
    context.out.push(
      "range",
      `${path}.transform.translation`,
      `a camera that frames must be placed at a finite point, but "${camera.id}" is not`,
      camera.transform.translation,
    );
  const rotation: IAutoMovieCamera["transform"]["rotation"] =
    camera.transform.rotation;
  if (
    readsRotation &&
    ![rotation.x, rotation.y, rotation.z, rotation.w].every(Number.isFinite)
  )
    context.out.push(
      "range",
      `${path}.transform.rotation`,
      `a "whip" pans from the camera's staged orientation, so "${camera.id}" must carry a finite rotation`,
      rotation,
    );
}
