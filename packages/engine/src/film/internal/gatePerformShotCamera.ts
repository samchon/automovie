import {
  IAutoMovieBlockingCoverage,
  IAutoMovieCamera,
  type IAutoMovieEnginePerformShotGateContext,
  type IAutoMovieGatePerformShotCamera,
  type IAutoMoviePerformShotCoverageJob,
  type IAutoMoviePerformShotFrameJob,
  IAutoMovieVector3,
} from "@automovie/interface";

import { describeInvalidValue } from "../../validation/describeInvalidValue";
import { resolvePerformShotTarget } from "../resolvePerformShotTarget";
import { validatePerformShotFraming } from "./validatePerformShotFraming";

/**
 * Settle the shot's cameras once the live one is elected: fall back to a camera
 * when no `frame` action elected one, gate the blocking's coverage angles, and
 * gate every camera a move is compiled from.
 *
 * 1. Without an elected camera, the scene's first camera is live and locked off; a
 *    scene with no camera cannot be framed.
 * 2. Each coverage intent must name a staged camera that is neither the live
 *    camera nor one an earlier intent named, state a usable framing and move,
 *    and favour a subject that resolves; a coverage camera never becomes a
 *    second live camera.
 * 3. The live camera, when a `frame` action moves it, and every coverage camera
 *    must have a vertical field of view in `(0, 180)` degrees and a finite
 *    position, because the framing solve divides by `tan(fovY / 2)`; a camera
 *    whose move is a `whip` must also carry a finite rotation, since a whip
 *    pans from it. An unused degenerate camera fails nothing.
 *
 * @param context The shot's staged tables and collector.
 * @param props.liveCamera The camera the frame actions elected, or null.
 * @param props.frames The frame jobs of the live camera.
 * @param props.coverage The blocking's coverage intents, or none.
 * @returns The live camera id, null only when the scene has no camera, and the
 *   coverage jobs that passed.
 */
export function gatePerformShotCamera(
  context: IAutoMovieEnginePerformShotGateContext,
  props: IAutoMovieGatePerformShotCamera.IProps,
): IAutoMovieGatePerformShotCamera.IResult {
  const frames: readonly IAutoMoviePerformShotFrameJob[] = props.frames;
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
    else liveCamera = first.id;
  }
  const coverageJobs: IAutoMoviePerformShotCoverageJob[] = gateCoverage(
    context,
    liveCamera,
    props.coverage,
  );
  const coverageCameras: Map<
    IAutoMovieCamera,
    IAutoMoviePerformShotCoverageJob
  > = new Map(
    coverageJobs.map(
      (
        job: IAutoMoviePerformShotCoverageJob,
      ): [IAutoMovieCamera, IAutoMoviePerformShotCoverageJob] => [
        job.camera,
        job,
      ],
    ),
  );
  context.staged.scene.cameras.forEach(
    (camera: IAutoMovieCamera, index: number): void => {
      const job: IAutoMoviePerformShotCoverageJob | undefined =
        coverageCameras.get(camera);
      const hero: boolean = frames.length > 0 && camera.id === liveCamera;
      if (job === undefined && !hero) return;
      validateFramingCamera(context, camera, `$staged.scene.cameras[${index}]`);
    },
  );
  return { liveCamera, coverageJobs };
}

/** Gate the blocking's coverage intents against the elected live camera. */
function gateCoverage(
  context: IAutoMovieEnginePerformShotGateContext,
  liveCamera: string | null,
  coverage: readonly IAutoMovieBlockingCoverage[],
): IAutoMoviePerformShotCoverageJob[] {
  const jobs: IAutoMoviePerformShotCoverageJob[] = [];
  const covered: Map<string, number> = new Map();
  coverage.forEach(
    (intent: IAutoMovieBlockingCoverage, index: number): void => {
      const path: string = `$blocking.coverage[${index}]`;
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
        validatePerformShotFraming(
          context.out,
          path,
          intent.framing,
          intent.move,
        );
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
    },
  );
  return jobs;
}

/** Refuse a camera the framing solve cannot compile a move from. */
function validateFramingCamera(
  context: IAutoMovieEnginePerformShotGateContext,
  camera: IAutoMovieCamera,
  path: string,
): void {
  if (!(camera.fovY > 0 && camera.fovY < 180))
    context.out.push(
      "range",
      `${path}.fovY`,
      `a camera that frames must have a vertical field of view within (0, 180)°, but "${describeInvalidValue(camera.id)}" has ${describeInvalidValue(camera.fovY)}`,
      camera.fovY,
    );
}
