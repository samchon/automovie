import type {
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieCompiledContractRealization,
  IAutoMovieRealizeShotContractProps,
  IAutoMovieResolvedCamera,
  IAutoMovieShotContractSubjectReader,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
} from "@automovie/interface";

import { evaluateAutoMovieCameraDepthPrecision } from "./evaluateAutoMovieCameraDepthPrecision";
import { intersectsPerspectiveFrustumBox } from "./intersectsPerspectiveFrustumBox";
import { projectToNdc } from "./projectToNdc";
import { resolveCameraAt } from "./resolveCameraAt";

/**
 * Grade the live camera at one shot-local second against the contract's
 * required subjects: how many resolve to a placement, how many of their world
 * boxes the frustum holds, and the depth precision the camera's clip planes
 * give over the depths those boxes span. Without a live camera or a raster the
 * sample fails with a not-a-number depth report. A shot whose camera moves
 * records the placement it measured, copied so it never aliases the staged
 * vectors; a shot with no move records none.
 */
export function realizeShotCameraOutcome(
  input: realizeShotCameraOutcome.IInput,
  reader: Pick<IAutoMovieShotContractSubjectReader, "placementAt" | "subjectBox">,
  time: number,
): realizeShotCameraOutcome.IOutcome {
  const required: readonly string[] = input.requiredSubjects;
  const camera: IAutoMovieCamera | undefined = input.cameras.find(
    (candidate: IAutoMovieCamera): boolean => candidate.id === input.camera,
  );
  const frameFormat: IAutoMovieRealizeShotContractProps["frameFormat"] =
    input.frameFormat;
  if (camera === undefined || frameFormat === undefined)
    return {
      time,
      depthPrecision: evaluateAutoMovieCameraDepthPrecision({
        camera: input.camera,
        time,
        near: Number.NaN,
        far: Number.NaN,
        requiredNear: Number.NaN,
        requiredFar: Number.NaN,
        constraint: {
          minimumDepthBits: Number.NaN,
          maximumStepMeters: Number.NaN,
        },
      }),
      requiredSubjects: required.length,
      resolvedSubjects: 0,
      readableSubjects: 0,
      passed: false,
    };
  const resolved: IAutoMovieResolvedCamera = resolveCameraAt(
    camera.transform,
    input.cameraMotion,
    camera.id,
    time,
  );
  const halfY: number = Math.tan((camera.fovY * Math.PI) / 360);
  const aspect: number = frameFormat.width / frameFormat.height;
  let resolvedSubjects: number = 0;
  let readableSubjects: number = 0;
  let requiredNear: number = Number.POSITIVE_INFINITY;
  let requiredFar: number = Number.NEGATIVE_INFINITY;
  for (const subject of required)
    try {
      // A node subject is boxed through its orientation as well as its root,
      // because a yawed element fills a different world box than the same
      // geometry facing down an axis, and the solve framed it the same way.
      const placement: IAutoMovieTransform = reader.placementAt(subject, time);
      ++resolvedSubjects;
      const box: IAutoMovieSubjectBox = reader.subjectBox(
        subject,
        placement,
        time,
      );
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            const depth: number = projectToNdc(
              resolved,
              { x, y, z },
              halfY,
              aspect,
              frameFormat.crop,
            ).depth;
            requiredNear = Math.min(requiredNear, depth);
            requiredFar = Math.max(requiredFar, depth);
          }
      if (
        intersectsPerspectiveFrustumBox({
          camera: resolved,
          min: box.min,
          max: box.max,
          near: camera.near,
          far: camera.far,
          halfY,
          aspect,
          crop: frameFormat.crop,
        })
      )
        ++readableSubjects;
    } catch {
      // Placement or boxing failure leaves this subject unreadable. A boxing
      // failure may occur after its placement incremented resolvedSubjects.
    }
  const depthPrecision: realizeShotCameraOutcome.IOutcome["depthPrecision"] =
    evaluateAutoMovieCameraDepthPrecision({
      camera: camera.id,
      time,
      near: camera.near,
      far: camera.far,
      requiredNear: resolvedSubjects === 0 ? Number.NaN : requiredNear,
      requiredFar: resolvedSubjects === 0 ? Number.NaN : requiredFar,
      constraint: camera.depthPrecision,
    });
  return {
    time,
    ...(input.cameraMotion === null
      ? {}
      : {
          placement: {
            position: { ...resolved.position },
            rotation: { ...resolved.rotation },
          },
        }),
    depthPrecision,
    requiredSubjects: required.length,
    resolvedSubjects,
    readableSubjects,
    passed:
      resolvedSubjects === required.length &&
      readableSubjects === required.length &&
      depthPrecision.passed,
  };
}

/** Input and result contracts for one camera grade on the shot clock. */
export namespace realizeShotCameraOutcome {
  /** What the camera grade reads from the realization's props. */
  export interface IInput {
    /** The contract's required camera subjects. */
    requiredSubjects: readonly string[];

    /** The staged cameras. */
    cameras: readonly IAutoMovieCamera[];

    /** The shot's live camera id. */
    camera: string;

    /** The shot's camera move, or null for a locked-off camera. */
    cameraMotion: IAutoMovieClip | null;

    /** The raster the camera is graded on, or undefined without one. */
    frameFormat: IAutoMovieRealizeShotContractProps["frameFormat"];
  }

  /** One graded camera sample. */
  export type IOutcome =
    IAutoMovieCompiledContractRealization["camera"][number];
}
