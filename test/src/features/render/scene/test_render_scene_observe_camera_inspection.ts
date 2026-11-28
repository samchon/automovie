import { AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMovieCameraInspection } from "@automovie/interface";
import { AutoMovieRenderInspectionCamera } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
} from "three";

import { nclose } from "../../internal/predicates";

/**
 * A required box is checked against actual delivery projection and depth while
 * sparse opaque witnesses and exact pixel-occlusion policy stay separate.
 *
 * 1. A shifted box survives the wide frame and lies wholly outside a narrower
 *    delivery frame and a left-hand crop. In the square frame, unit boxes at
 *    depth 5 m centred at x 3.5, 5 and 6.5 m are `possible`, `crosses-side` and
 *    `outside`. Near- and far-plane exclusions have distinct outcomes, even on
 *    the optical axis.
 * 2. An opaque wall blocks all sampled target rays. Sliding the wall to one side
 *    gives both blocked and clear witnesses. Alpha-tested geometry and an
 *    insufficient triangle budget leave observation unmeasured.
 * 3. An exact 25/100 pixel loss passes an inclusive 25% threshold and fails a
 *    lower threshold. Zero and invalid pixel counts have distinct states.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes distinct framing, ray and native pixel outcomes and the absent renderer boundary.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public camera observer on a posed scene, applies crop and material changes, and checks the classification of supplied exact counts and native measurement refusal without a renderer.
 * @evidence contracts/development/testing.md#independent-expectations A 90-degree square lens projects x over depth. The unit boxes at x 3.5, 5 and 6.5 m consequently lie inside, across and outside its right side. The near rigid wall blocks every sampled ray before sliding. Losing 25 of 100 pixels meets an inclusive 25% threshold, and the Viewer cannot supply native mask pixels.
 */
export function test_render_scene_observe_camera_inspection(): void {
  const scene: Scene = new Scene();
  const camera: PerspectiveCamera = new PerspectiveCamera(90, 2, 1, 20);
  const geometry: BoxGeometry = new BoxGeometry(1, 1, 1);
  const beauty: MeshBasicMaterial = new MeshBasicMaterial();
  const target: Mesh = new Mesh(geometry, beauty);
  scene.add(target);
  const observe = (
    triangleBudget: number = 0,
  ): IAutoMovieCameraInspection.IResult =>
    AutoMovieRenderInspectionCamera.observe({ scene, camera, target, triangleBudget });

  target.position.set(7, 0, -5);
  TestValidator.equals("wide delivered framing", observe().framing, "possible");
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  TestValidator.equals(
    "square delivery excludes target",
    observe().framing,
    "outside",
  );
  TestValidator.equals("interactive preview cannot supply native pixel counts",
    AutoMovieRenderInspectionCamera.measurePlacedPixels({
      scene, camera, width: 80, height: 60, mode: "viewer", time: { filmSeconds: 0 },
    }, target),
    { status: "unsupported", reason: "Native placed pixels require a capture or delivery renderer audit." },
  );
  for (const [x, framing] of [
    [3.5, "possible"],
    [5, "crosses-side"],
    [6.5, "outside"],
  ] as const) {
    target.position.set(x, 0, -5);
    TestValidator.equals(
      `square frame grades a box centred at x ${x} m`,
      observe().framing,
      framing,
    );
  }
  target.position.set(7, 0, -5);
  camera.setViewOffset(200, 100, 0, 0, 100, 100);
  TestValidator.equals(
    "left crop excludes target",
    observe().framing,
    "outside",
  );
  camera.clearViewOffset();

  target.position.set(0, 0, -0.25);
  TestValidator.equals(
    "whole target before near plane",
    observe().framing,
    "before-near",
  );
  target.position.z = -22;
  TestValidator.equals(
    "whole target past far plane",
    observe().framing,
    "past-far",
  );
  target.position.z = -1;
  TestValidator.equals(
    "near-plane overlap remains possible",
    observe().framing,
    "possible",
  );

  target.position.z = -5;
  const blockerMaterial: MeshBasicMaterial = new MeshBasicMaterial();
  const wall: Mesh = new Mesh(geometry, blockerMaterial);
  wall.position.set(0, 0, -3);
  wall.scale.set(2, 2, 0.1);
  scene.add(wall);
  const blocked: IAutoMovieCameraInspection.Occlusion = observe(24).occlusion;
  TestValidator.predicate(
    "opaque wall gives bounded blocked witnesses",
    blocked.status === "witnesses" &&
      blocked.samples.blocked > 0 &&
      blocked.samples.clear === 0 &&
      blocked.samples.blocker !== undefined &&
      nclose(blocked.samples.blocker.z, -2.95),
  );
  TestValidator.equals(
    "budget below total triangles",
    observe(23).occlusion.status,
    "unmeasured",
  );
  wall.position.x = -1.05;
  const partial: IAutoMovieCameraInspection.Occlusion = observe(24).occlusion;
  TestValidator.predicate(
    "part of the action remains visible",
    partial.status === "witnesses" &&
      partial.samples.blocked > 0 &&
      partial.samples.clear > 0,
  );
  blockerMaterial.alphaTest = 0.5;
  TestValidator.equals(
    "alpha-tested blocker leaves sparse evidence unknown",
    observe(24).occlusion.status,
    "unmeasured",
  );

  const exact = (
    isolated: number,
    visible: number,
    maxOcclusionRatio: number,
  ): IAutoMovieCameraInspection.Occlusion =>
    AutoMovieEngineValidation.classifyAutoMovieCameraInspection({
      framing: "possible",
      maxOcclusionRatio,
      pixels: { isolated, visible },
    }).occlusion;
  TestValidator.equals(
    "inclusive authored pixel limit",
    exact(100, 75, 0.25).status,
    "within-limit",
  );
  const exceeded: IAutoMovieCameraInspection.Occlusion = exact(100, 75, 0.2);
  TestValidator.predicate(
    "pixel ratio above limit",
    exceeded.status === "above-limit" && nclose(exceeded.ratio, 0.25),
  );
  TestValidator.equals(
    "no isolated target pixels",
    exact(0, 0, 0).status,
    "no-target-pixels",
  );
  TestValidator.equals(
    "non-matching count cannot measure",
    exact(20, 21, 0).status,
    "unmeasured",
  );
  for (const x of [NaN, Infinity]) {
    const invalid = AutoMovieRenderInspectionCamera.observe({
      scene, camera, target, triangleBudget: 100,
      targetBounds: { min: { x, y: -0.5, z: -5.5 }, max: { x, y: 0.5, z: -4.5 } },
    });
    TestValidator.equals("nonfinite certified bounds prove no framing or rays", invalid, {
      framing: "unavailable", occlusion: { status: "unmeasured" },
    });
  }
  camera.projectionMatrix.elements[0] = NaN;
  TestValidator.equals("nonfinite projection proves no framing", observe().framing, "unavailable");
  camera.projectionMatrix.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  TestValidator.equals("degenerate projection proves no framing", observe().framing, "unavailable");

  geometry.dispose();
  beauty.dispose();
  blockerMaterial.dispose();
}
