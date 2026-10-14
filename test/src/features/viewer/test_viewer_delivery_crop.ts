import { projectToNdc, resolveAutoMovieDeliveryCrop } from "@automovie/engine";
import { IAutoMovieDeliveryCrop } from "@automovie/interface";
import {
  applyAutoMovieDeliveryCrop,
  readAutoMovieDeliveryCrop,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose, throwsError } from "../internal/predicates";

const CAMERA: Parameters<typeof projectToNdc>[0] = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

const projected: (camera: THREE.PerspectiveCamera, point: THREE.Vector3) => THREE.Vector3 = (
  camera: THREE.PerspectiveCamera,
  point: THREE.Vector3,
): THREE.Vector3 => point.clone().project(camera);

/**
 * Three's CPU camera projection and engine coordinates share one normalized crop.
 *
 * Scenarios:
 * 1. Omitted, explicit whole and active whole native views preserve the original projection.
 * 2. A central off-axis crop gives independently derived NDC coordinates, and closed crop edges reach the complete output edges.
 * 3. Inverted viewer regions and a nonfinite portable region refuse through the shared crop resolver.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies and reads actual viewer camera crops, then projects authored points through the native camera and portable engine projection. Whole/omitted windows must retain the native matrix, off-axis coordinates must agree with the authored affine crop, and malformed regions must refuse.
 * @evidence contracts/testing.md#independent-expectations The 90-degree vertical field and aspect two give uncropped NDC (0.125,0.125) for (0.5,0.25,-2); the central 0.5 by 0.8 crop gives (0.25,0.15625). These authored geometric values prevent two product paths from merely agreeing on the same error; the initial Three matrix is an independent native no-op reference.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts omission, explicit whole window, active whole native view, central off-axis crop and closed left/right output edges, plus inverted and nonfinite regions. Raster sizing, pixel delivery and culling population belong to consumer tests; this unit owns projection/crop values.
 * @evidence contracts/testing.md#execution-ownership The named unit invokes portable crop resolution and native camera math directly using Three metadata objects. It starts no renderer, browser or GPU, and all predicate callbacks execute locally without extra registration.
 */
export function test_viewer_delivery_crop(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(90, 2, 1, 10);
  camera.updateProjectionMatrix();
  const original: THREE.Matrix4Tuple = camera.projectionMatrix.toArray();
  applyAutoMovieDeliveryCrop(camera, undefined);
  const omitted: THREE.Matrix4Tuple = camera.projectionMatrix.toArray();
  applyAutoMovieDeliveryCrop(camera, {
    left: 0,
    top: 0,
    right: 1,
    bottom: 1,
  });
  const explicit: THREE.Matrix4Tuple = camera.projectionMatrix.toArray();
  TestValidator.predicate(
    "omitted and explicit whole crops preserve the original matrix",
    omitted.every((value: number, index: number): boolean => nclose(value, original[index]!, 0)) &&
      explicit.every((value: number, index: number): boolean => nclose(value, original[index]!, 0)) &&
      readAutoMovieDeliveryCrop(camera) === undefined,
  );
  camera.setViewOffset(2, 1, 0, 0, 2, 1);
  TestValidator.equals(
    "an active whole Three.js view offset is still the crop no-op",
    readAutoMovieDeliveryCrop(camera),
    undefined,
  );

  const crop: IAutoMovieDeliveryCrop = {
    left: 0.25,
    top: 0.1,
    right: 0.75,
    bottom: 0.9,
  };
  applyAutoMovieDeliveryCrop(camera, crop);
  const observedCrop: IAutoMovieDeliveryCrop | undefined = readAutoMovieDeliveryCrop(camera);
  TestValidator.predicate(
    "the renderer exposes the same crop to downstream culling and LOD",
    observedCrop !== undefined && nclose(observedCrop.left, crop.left) &&
      nclose(observedCrop.top, crop.top) && nclose(observedCrop.right, crop.right) &&
      nclose(observedCrop.bottom, crop.bottom),
  );
  const point: THREE.Vector3 = new THREE.Vector3(0.5, 0.25, -2);
  const actual: THREE.Vector3 = projected(camera, point);
  const expected: ReturnType<typeof projectToNdc> = projectToNdc(
    CAMERA,
    { x: point.x, y: point.y, z: point.z },
    Math.tan(Math.PI / 4),
    2,
    crop,
  );
  TestValidator.predicate(
    "off-axis viewer projection equals engine crop projection",
    nclose(actual.x, 0.25) && nclose(actual.y, 0.15625) &&
      nclose(expected.ndcX, 0.25) && nclose(expected.ndcY, 0.15625),
  );

  applyAutoMovieDeliveryCrop(camera, {
    left: 0.5,
    top: 0,
    right: 1,
    bottom: 1,
  });
  TestValidator.equals(
    "closed crop edges map onto the complete output edge",
    namedFacts([
      [
        "left",
        (): boolean => nclose(projected(camera, new THREE.Vector3(0, 0, -2)).x, -1),
      ],
      [
        "right",
        (): boolean => nclose(projected(camera, new THREE.Vector3(4, 0, -2)).x, 1),
      ],
    ]),
    { left: true, right: true },
  );

  TestValidator.predicate(
    "viewer crop rejects invalid regions through the shared resolver",
    throwsError((): void =>
      applyAutoMovieDeliveryCrop(camera, {
        left: 0.75,
        top: 0,
        right: 0.25,
        bottom: 1,
      }),
    ) &&
      throwsError((): IAutoMovieDeliveryCrop =>
        resolveAutoMovieDeliveryCrop({
          left: 0,
          top: Number.POSITIVE_INFINITY,
          right: 1,
          bottom: 1,
        }),
      ),
  );
}
