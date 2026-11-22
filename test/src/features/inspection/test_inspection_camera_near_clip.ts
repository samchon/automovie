import {
  AutoMovieSkinnedMesh,
  boundAutoMovieCameraSubject,
  listAutoMovieCameraSubjectMeshes,
  measureAutoMovieCameraNearClip,
  observeAutoMovieCameraInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * A required subject cut by the delivery near plane is measured on its drawn,
 * posed surface, and an animated actor is framed by its current pose.
 *
 * Scenarios:
 *
 * 1. A unit box whose front face sits 0.25 m in front of the near plane is
 *    clipped by 0.25 m at that face, and its cut lies on the near plane on
 *    the same camera ray as the deepest point. Moved back until the face touches the
 *    near plane, it is clear. Moved sideways out of the frame at the same
 *    depth, it is clear with no triangle examined.
 * 2. Its twelve triangles fit a budget of twelve and not of eleven.
 * 3. A transparent surface is clipped but not opaque. With per-face materials,
 *    hidden groups draw nothing, the back face alone stays clear and one side
 *    face reaching past the near plane is clipped.
 * 4. A skinned box at rest stays clear; its bone moved 1.75 m toward the camera
 *    makes its posed front face intrude by 0.25 m. Its posed bounds follow the
 *    bone, and moving the bone out of the frame grades the actor `outside`
 *    where an unsupported drawable leaves framing `unavailable`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the near-clip measurement, subject mesh admission, posed bounds and delivery framing on real Three meshes; catches a cut surface reported clear, a touching or off-frame surface reported clipped, a budget overrun reported measured, hidden groups counted as drawn and a skin judged at rest.
 * @evidence contracts/development/testing.md#independent-expectations A 90-degree square camera with near plane 1 m has half-width equal to depth. A unit box centred 1.25 m away has its front face 0.75 m away, 0.25 m in front of the near plane; centred 1.5 m away it touches. Centred 3 m to the side its nearest edge at x 2.5 m lies beyond the half-width 1.75 m of its farthest depth. A box has 12 triangles. The skin box adds its float32 padding of 2^-18 of the largest coordinate, below 1e-4 m here.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a crossing with touching and off-frame boxes, an exact budget with one fewer, opaque with transparent, visible with hidden groups and rest with posed skins, and supported with unsupported drawables.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over in-memory Three objects without a GL context, browser or film; the placed-camera seam and aspect change belong to test_inspection_camera_delivery_aspect.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario, its geometry and its expected outcome.
 */
export function test_inspection_camera_near_clip(): void {
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    90,
    1,
    1,
    20,
  );
  scene.add(camera);
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const opaque: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const box: THREE.Mesh = new THREE.Mesh(geometry, opaque);
  scene.add(box);
  const measure: (
    target: THREE.Object3D,
    triangleBudget?: number,
  ) => measureAutoMovieCameraNearClip.IResult = (
    target: THREE.Object3D,
    triangleBudget: number = 1_000,
  ): measureAutoMovieCameraNearClip.IResult => {
    scene.updateMatrixWorld(true);
    camera.updateWorldMatrix(true, false);
    return measureAutoMovieCameraNearClip({
      camera,
      meshes: listAutoMovieCameraSubjectMeshes(target, camera) ?? [],
      triangleBudget,
    });
  };

  // 1. Crossing, touching and off-frame boxes.
  box.position.set(0, 0, -1.25);
  const crossing: measureAutoMovieCameraNearClip.IResult = measure(box);
  TestValidator.predicate(
    "front face 0.25 m before the near plane is clipped",
    crossing.status === "clipped" &&
      crossing.opaque &&
      crossing.triangles === 12 &&
      nclose(crossing.depth, 0.25) &&
      nclose(crossing.point.z, -0.75) &&
      nclose(crossing.cut.z, -1) &&
      nclose(crossing.cut.x / -crossing.cut.z, crossing.point.x / 0.75) &&
      nclose(crossing.cut.y / -crossing.cut.z, crossing.point.y / 0.75),
  );
  box.position.set(0, 0, -1.5);
  TestValidator.equals("touching face is clear", measure(box).status, "clear");
  box.position.set(3, 0, -1.25);
  TestValidator.equals("off-frame crossing is clear", measure(box), {
    status: "clear",
    triangles: 0,
  });

  // 2. Exact and exceeded triangle budgets.
  box.position.set(0, 0, -1.25);
  TestValidator.equals(
    "budget of eleven stops the box as over budget",
    measure(box, 11).status,
    "over-budget",
  );
  TestValidator.equals(
    "budget of twelve measures the box",
    measure(box, 12).status,
    "clipped",
  );

  // 3. Transparent and per-face materials.
  const glass: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.5,
  });
  box.material = glass;
  const clear: measureAutoMovieCameraNearClip.IResult = measure(box);
  TestValidator.predicate(
    "transparent surface is clipped but not opaque",
    clear.status === "clipped" && !clear.opaque,
  );
  const faces: THREE.MeshStandardMaterial[] = Array.from(
    { length: 6 },
    () => new THREE.MeshStandardMaterial({ visible: false }),
  );
  box.material = faces;
  TestValidator.equals("hidden groups draw nothing", measure(box), {
    status: "clear",
    triangles: 0,
  });

  // BoxGeometry orders its groups +x, -x, +y, -y, +z, -z.
  faces[5]!.visible = true;
  TestValidator.equals("back face alone stays clear", measure(box), {
    status: "clear",
    triangles: 2,
  });
  faces[0]!.visible = true;
  const side: measureAutoMovieCameraNearClip.IResult = measure(box);
  TestValidator.predicate(
    "side face reaching past the near plane is clipped",
    side.status === "clipped" &&
      side.opaque &&
      side.triangles === 4 &&
      nclose(side.depth, 0.25),
  );
  box.removeFromParent();

  // 4. A skinned actor judged at its current pose.
  const skinGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  skinGeometry.translate(0, 0, -3);
  const count: number = skinGeometry.getAttribute("position").count;
  skinGeometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(new Array(count * 4).fill(0), 4),
  );
  skinGeometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(
      Array.from({ length: count * 4 }, (_: unknown, i: number): number =>
        i % 4 === 0 ? 1 : 0,
      ),
      4,
    ),
  );
  const actor: AutoMovieSkinnedMesh = new AutoMovieSkinnedMesh(
    skinGeometry,
    opaque,
  );
  const bone: THREE.Bone = new THREE.Bone();
  actor.add(bone);
  scene.add(actor);
  scene.updateMatrixWorld(true);
  actor.bind(new THREE.Skeleton([bone]));
  TestValidator.equals("skin at rest is clear", measure(actor).status, "clear");

  bone.position.z = 1.75;
  actor.invalidatePose();
  const posed: measureAutoMovieCameraNearClip.IResult = measure(actor);
  TestValidator.predicate(
    "posed skin intrudes by 0.25 m",
    posed.status === "clipped" &&
      posed.opaque &&
      nclose(posed.depth, 0.25) &&
      nclose(posed.point.z, -0.75),
  );
  const bounds: THREE.Box3 | undefined = boundAutoMovieCameraSubject(
    listAutoMovieCameraSubjectMeshes(actor, camera) ?? [],
  );
  TestValidator.predicate(
    "posed bounds follow the bone",
    bounds !== undefined &&
      nclose(bounds.max.z, -0.75, 1e-4) &&
      nclose(bounds.min.z, -1.75, 1e-4),
  );

  bone.position.set(10, 0, 0);
  actor.invalidatePose();
  scene.updateMatrixWorld(true);
  TestValidator.equals(
    "actor moved out of frame is graded outside",
    observeAutoMovieCameraInspection({ scene, camera, target: actor }).framing,
    "outside",
  );
  const line: THREE.Line = new THREE.Line(new THREE.BufferGeometry(), opaque);
  actor.add(line);
  TestValidator.equals(
    "unsupported drawable leaves framing unavailable",
    observeAutoMovieCameraInspection({ scene, camera, target: actor }).framing,
    "unavailable",
  );

  geometry.dispose();
  skinGeometry.dispose();
  opaque.dispose();
  glass.dispose();
  for (const face of faces) face.dispose();
}
