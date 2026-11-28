import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineValidation,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMovieInspectionTrail as Trail,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieRenderInspectionPath } from "../../scene/AutoMovieRenderInspectionPath";
import { AUTOMOVIE_PLACED_FRAME_TOLERANCE } from "../../scene/inspection/AUTOMOVIE_PLACED_FRAME_TOLERANCE";
import { MAXIMUM_INSPECTION_TRAIL_SAMPLES } from "../../scene/inspection/internal/MAXIMUM_INSPECTION_TRAIL_SAMPLES";
import { isAffineMatrix } from "../../scene/inspection/internal/isAffineMatrix";
import { readNativeRigidFrame } from "../../scene/inspection/internal/readNativeRigidFrame";
import type { sampleInspectionTrails } from "../../scene/inspection/internal/sampleInspectionTrails";
import type { IAutoMovieRenderMotionTrailSource as Source } from "../IAutoMovieRenderMotionTrailSource";

/* Read optional source facts and the selected native node without another pose solve. */
export function readMotionTrailSample(
  subject: { scene: THREE.Scene; camera: THREE.PerspectiveCamera },
  query: Source.ISample,
  origin: THREE.Vector3,
  evidence: Source.IObservation | undefined,
  admitted: WeakMap<Trail.IAuthoredRoute, boolean>,
): sampleInspectionTrails.IRead {
  const route: Trail.IAuthoredRoute | undefined = verifiedRoute(
    evidence?.route,
    admitted,
  );
  const axis: IAutoMovieVector3 | undefined = evidence?.forwardAxis;
  const forward: THREE.Vector3 | undefined =
    axis === undefined
      ? undefined
      : new THREE.Vector3(axis.x, axis.y, axis.z).transformDirection(
          query.object.matrixWorld,
        );
  const phase: number | undefined = evidence?.phase;
  const frame = evidence?.baseline;
  const binding = evidence?.support;
  const compatibleRemount = evidence?.compatibleRemount;
  const support =
    binding === undefined ? undefined : observeSupport(subject.scene, binding);
  return {
    route,
    supportFrame: binding?.support,
    ...(compatibleRemount === undefined || compatibleRemount.role.trim() === ""
      ? {}
      : {
          compatibleRemount,
          ...(binding === undefined || support?.status !== "observed"
            ? {}
            : { supportAnchor: pointOf(binding.anchor) }),
        }),
    sample: {
      time: query.time,
      entry: query.entry,
      ...(frame !== undefined &&
      route !== undefined &&
      Number.isFinite(frame.time) &&
      Number.isFinite(frame.yawDeg) &&
      finitePoint(frame.position) &&
      finitePoint(frame.tangent)
        ? {
            baseline: {
              time: frame.time,
              position: pointOf(frame.position),
              yawDeg: frame.yawDeg,
              tangent: pointOf(frame.tangent),
            },
          }
        : {}),
      ...(phase !== undefined && phase >= 0 && phase < 1 ? { phase } : {}),
      ...(forward !== undefined &&
      finitePoint(forward) &&
      forward.lengthSq() > 0
        ? { forward: pointOf(forward) }
        : {}),
      projection: project(subject.camera, origin),
      ...(support === undefined ? {} : { support }),
    },
  };
}

/* The producer supplies immutable route data. Check each descriptor once. */
function verifiedRoute(
  route: Trail.IAuthoredRoute | undefined,
  admitted: WeakMap<Trail.IAuthoredRoute, boolean>,
): Trail.IAuthoredRoute | undefined {
  if (route === undefined) return undefined;
  let valid: boolean | undefined = admitted.get(route);
  if (valid === undefined) {
    valid =
      route.id.trim() !== "" &&
      route.points.length >= 2 &&
      route.points.length <= MAXIMUM_INSPECTION_TRAIL_SAMPLES &&
      route.points.every(finitePoint) &&
      Number.isFinite(route.requestedSpeed) &&
      route.requestedSpeed > 0 &&
      Number.isFinite(route.effectiveSpeed) &&
      route.effectiveSpeed > 0;
    admitted.set(route, valid);
  }
  return valid ? route : undefined;
}

/* Use the delivery camera placed for this point, including its own clip depth. */
function project(
  camera: THREE.PerspectiveCamera,
  origin: THREE.Vector3,
): Trail.Projection {
  const clip: THREE.Vector4 = new THREE.Vector4(origin.x, origin.y, origin.z, 1)
    .applyMatrix4(camera.matrixWorldInverse)
    .applyMatrix4(camera.projectionMatrix);
  if (!finitePoint(clip) || !Number.isFinite(clip.w) || clip.w === 0)
    return { status: "unprojectable" };
  if (clip.w < 0) return { status: "behind" };
  const ndc: IAutoMovieVector3 = {
    x: clip.x / clip.w,
    y: clip.y / clip.w,
    z: clip.z / clip.w,
  };
  if (!finitePoint(ndc)) return { status: "unprojectable" };
  return {
    status:
      Math.abs(ndc.z) > 1
        ? "depth-clipped"
        : Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1
          ? "outside"
          : "in-frame",
    ndc,
  };
}

/* Read one author-bound socket and its displayed support frame from the same pose. */
function observeSupport(
  scene: THREE.Scene,
  binding: NonNullable<Source.IObservation["support"]>,
): Trail.Support {
  const socket = placedMatrix(scene, binding.socket);
  const frame = readNativeRigidFrame(
    placedMatrix(scene, binding.support),
    AUTOMOVIE_PLACED_FRAME_TOLERANCE,
  );
  if (socket === undefined || frame === undefined)
    return { status: "unavailable" };
  const observed: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
    socket,
  );
  const result = AutoMovieEngineValidation.measurePlacedContact({
    kind: "support",
    path: "motion-trail-support",
    sample: { point: pointOf(observed), frame, anchor: binding.anchor },
    maxGap: 0,
    maxSlip: 0,
  });
  if (result.status !== "checked" || result.kind !== "support")
    return { status: "unavailable" };
  return {
    status: "observed",
    path: AutoMovieRenderInspectionPath.entityPathOf({
      root: scene,
      object: binding.support,
    }),
    local: AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(frame.rotation),
      AutoMovieEngineVector3.subtract(observed, frame.position),
    ),
    gap: result.gap,
    slip: result.slip,
  };
}

function placedMatrix(
  scene: THREE.Scene,
  object: THREE.Object3D,
): THREE.Matrix4 | undefined {
  for (
    let parent: THREE.Object3D | null = object;
    parent !== null;
    parent = parent.parent
  )
    if (parent === scene)
      return isAffineMatrix(object.matrixWorld)
        ? object.matrixWorld
        : undefined;
  return undefined;
}

function finitePoint(point: IAutoMovieVector3): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z)
  );
}

function pointOf(point: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: point.x, y: point.y, z: point.z };
}
