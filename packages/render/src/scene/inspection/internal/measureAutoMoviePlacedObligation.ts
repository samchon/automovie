import type { IObserveAutoMoviePlacedSceneNativeSupport } from "../IObserveAutoMoviePlacedSceneNativeSupport.js";
import type { IObserveAutoMoviePlacedSceneNativeGrip } from "../IObserveAutoMoviePlacedSceneNativeGrip.js";
import type { IObserveAutoMoviePlacedSceneCheck } from "../IObserveAutoMoviePlacedSceneCheck.js";
import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePlacedContact,
  IAutoMoviePlacedContinuity,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { type Matrix4, type Object3D, Vector3 } from "three";

import { AUTOMOVIE_PLACED_FRAME_TOLERANCE } from "../AUTOMOVIE_PLACED_FRAME_TOLERANCE.js";
import type { IAutoMoviePlacedObligation } from "../IAutoMoviePlacedObligation.js";
import { isAutoMovieAffineMatrix } from "./isAutoMovieAffineMatrix.js";
import { readAutoMovieNativeRigidFrame } from "./readAutoMovieNativeRigidFrame.js";

type IWitness = IAutoMovieInspectionDiagnostics.IWitness;
type IMeasurement = IAutoMovieInspectionDiagnostics.IMeasurement;
type IInput = IObserveAutoMoviePlacedSceneCheck["input"];

/**
 * Measure one placed obligation with Engine's canonical predicates.
 *
 * A raw track reports its prepared clip findings. A native support or grip
 * reads the displayed world matrices of its nodes, which the host settled, and
 * a node outside `scene` or with a non-affine matrix leaves the relation
 * unsupported. A measured relation's witness carries the observed point and
 * each measure with its limit and unit; a continuous step's witness also
 * carries its film interval.
 *
 * @param scene The settled scene that owns the native nodes.
 * @param matrices A request-local index of displayed matrices, shared across
 *   obligations.
 * @param input The obligation's observations and limits.
 * @returns The measured violations and witness, or the coverage reason.
 */
export function measureAutoMoviePlacedObligation(
  scene: Object3D,
  matrices: Map<Object3D, Matrix4 | undefined>,
  input: IInput,
): IAutoMoviePlacedObligation {
  if (input.kind === "track")
    return input.violations === undefined
      ? {
          status: "unsupported",
          reason: "No raw source clip admission was supplied.",
        }
      : checked(input.violations);
  if (input.kind === "scene-support" || input.kind === "scene-grip")
    return measureContact(nativeContact(scene, matrices, input));
  if (input.kind === "support" || input.kind === "grip")
    return measureContact(input);
  return measureContinuity(input);
}

/** A checked outcome without a witness. */
function checked(
  violations: readonly IAutoMovieConstraintViolation[],
): IAutoMoviePlacedObligation {
  return { status: "checked", violations, witness: {} };
}

/**
 * The canonical contact request of a native support or grip, with its sample
 * only when every referenced node has a displayed rigid placement.
 */
function nativeContact(
  scene: Object3D,
  matrices: Map<Object3D, Matrix4 | undefined>,
  input:
    | IObserveAutoMoviePlacedSceneNativeSupport
    | IObserveAutoMoviePlacedSceneNativeGrip,
): IAutoMoviePlacedContact.IProps {
  if (input.kind === "scene-support") {
    const { sample, path, maxGap, maxSlip } = input;
    const request: Extract<
      IAutoMoviePlacedContact.IProps,
      { kind: "support" }
    > = { kind: "support", path, maxGap, maxSlip };
    if (sample === undefined) return request;
    const socket: Matrix4 | undefined = placedMatrix(
      scene,
      matrices,
      sample.socket,
    );
    const frame: IAutoMovieRigidTransform | undefined =
      readAutoMovieNativeRigidFrame(
        placedMatrix(scene, matrices, sample.support),
        AUTOMOVIE_PLACED_FRAME_TOLERANCE,
      );
    return socket === undefined || frame === undefined
      ? request
      : {
          ...request,
          sample: {
            point: new Vector3().setFromMatrixPosition(socket),
            frame,
            anchor: sample.anchor,
          },
        };
  }
  const { sample, path, maxDistance, maxAngle } = input;
  const request: Extract<IAutoMoviePlacedContact.IProps, { kind: "grip" }> = {
    kind: "grip",
    path,
    maxDistance,
    maxAngle,
  };
  if (sample === undefined) return request;
  const hand: IAutoMovieRigidTransform | undefined =
    readAutoMovieNativeRigidFrame(
      placedMatrix(scene, matrices, sample.hand),
      AUTOMOVIE_PLACED_FRAME_TOLERANCE,
    );
  const prop: IAutoMovieRigidTransform | undefined =
    readAutoMovieNativeRigidFrame(
      placedMatrix(scene, matrices, sample.prop),
      AUTOMOVIE_PLACED_FRAME_TOLERANCE,
    );
  return hand === undefined || prop === undefined
    ? request
    : { ...request, sample: { hand, prop, expected: sample.expected } };
}

/**
 * The displayed world matrix of a node beneath `scene`, as the host settled it,
 * or undefined when the node is elsewhere or its matrix is not affine.
 */
function placedMatrix(
  scene: Object3D,
  matrices: Map<Object3D, Matrix4 | undefined>,
  object: Object3D,
): Matrix4 | undefined {
  if (matrices.has(object)) return matrices.get(object);
  let root: Object3D = object;
  while (root !== scene && root.parent !== null) root = root.parent;
  // The host settled every world matrix before observing, so the displayed
  // matrix is read as drawn instead of being recomposed from locals.
  const matrix: Matrix4 | undefined =
    root === scene && isAutoMovieAffineMatrix(object.matrixWorld)
      ? object.matrixWorld
      : undefined;
  matrices.set(object, matrix);
  return matrix;
}

/**
 * Measure a support or grip and witness it with the observed point and each
 * measure against its limit.
 */
function measureContact(
  input: IAutoMoviePlacedContact.IProps,
): IAutoMoviePlacedObligation {
  const result: IAutoMoviePlacedContact.IResult =
    AutoMovieEngineValidation.measurePlacedContact(input);
  if (result.status === "unsupported")
    return {
      status: "unsupported",
      reason:
        "The declared contact point, rigid frame or target was unavailable.",
    };
  if (result.violations.length === 0) return checked(result.violations);
  const point: IAutoMovieVector3 | undefined =
    input.kind === "support"
      ? input.sample?.point
      : input.sample?.prop?.position;
  const witness: IWitness =
    point !== undefined && point !== null
      ? { point: { x: point.x, y: point.y, z: point.z } }
      : {};
  if (result.status === "invalid")
    return { status: "checked", violations: result.violations, witness };
  const measurements: IMeasurement[] =
    result.kind === "support" && input.kind === "support"
      ? [
          { name: "gap", value: result.gap, limit: input.maxGap, unit: "m" },
          { name: "slip", value: result.slip, limit: input.maxSlip, unit: "m" },
        ]
      : result.kind === "grip" && input.kind === "grip"
        ? [
            {
              name: "distance",
              value: result.distance,
              limit: input.maxDistance,
              unit: "m",
            },
            {
              name: "angle",
              value: result.angle,
              limit: input.maxAngle,
              unit: "rad",
            },
          ]
        : [];
  return {
    status: "checked",
    violations: result.violations,
    witness: { ...witness, measurements },
  };
}

/**
 * Measure a transform, step or custody rule, witnessing a failed continuous
 * step with its incoming point, film interval and measured motion.
 */
function measureContinuity(
  input: IAutoMoviePlacedContinuity.IProps,
): IAutoMoviePlacedObligation {
  const result: IAutoMoviePlacedContinuity.IResult =
    AutoMovieEngineValidation.measurePlacedContinuity(input);
  if (result.status === "excluded")
    return {
      status: "excluded",
      reason: "The source declared a cut or intentional discontinuity.",
    };
  if (result.status === "unsupported")
    return {
      status: "unsupported",
      reason:
        "An authoritative source transform, endpoint or holder was unavailable.",
    };
  if (
    result.violations.length === 0 ||
    input.kind !== "step" ||
    result.motion === undefined ||
    input.before === undefined ||
    input.after === undefined
  )
    return checked(result.violations);
  const point: IAutoMovieVector3 = input.after.transform.translation;
  return {
    status: "checked",
    violations: result.violations,
    witness: {
      point: { x: point.x, y: point.y, z: point.z },
      time: { filmSeconds: input.after.seconds },
      interval: { from: input.before.seconds, to: input.after.seconds },
      measurements: [
        {
          name: "distance",
          value: result.motion.distance,
          unit: "m",
          ...(input.maxDistance === undefined
            ? {}
            : { limit: input.maxDistance }),
        },
        {
          name: "angle",
          value: result.motion.angle,
          unit: "rad",
          ...(input.maxAngle === undefined ? {} : { limit: input.maxAngle }),
        },
      ],
    },
  };
}
