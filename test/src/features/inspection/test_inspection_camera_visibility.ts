import { classifyAutoMovieCameraInspection } from "@automovie/engine";
import type { IAutoMovieCameraInspection } from "@automovie/interface";
import { observeAutoMovieCameraInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
} from "three";

import { nclose } from "../internal/predicates";

/**
 * A required box is checked against actual delivery projection and depth
 * while sparse opaque witnesses and exact pixel-occlusion policy stay separate.
 *
 * 1. A shifted box survives the wide frame and lies wholly outside a narrower
 *    delivery frame and a left-hand crop. Near- and far-plane exclusions have
 *    distinct outcomes, even on the optical axis.
 * 2. An opaque wall blocks all sampled target rays. Sliding the wall to one
 *    side gives both blocked and clear witnesses. Alpha-tested geometry and
 *    an insufficient triangle budget leave observation unmeasured.
 * 3. An exact 25/100 pixel loss passes an inclusive 25% threshold and fails a
 *    lower threshold. Zero and invalid pixel counts have distinct states.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks
 * changed aspect and crop, a box outside each depth bound, sparse occlusion
 * with static opaque geometry, alpha-test uncertainty and matched pixel counts.
 * @evidence contracts/development/testing.md#independent-expectations At 90
 * degrees and depth five, the wide half-width is ten and the square
 * half-width is five. The crop ends at the optical axis. The opaque wall is
 * nearer than the subject, spans its projection before sliding, and covers
 * only its left side after sliding. A 100-pixel silhouette with 75 remaining
 * has exactly 25% occlusion.
 * @evidence contracts/development/testing.md#distinguishing-cases Inclusive
 * equality is compared with a strict exceedance. A partially hidden box has
 * both ray outcomes and an opaque wall never manufactures pixel counts.
 * @evidence contracts/development/testing.md#execution-ownership Uses Three
 * geometry and math directly in a deterministic unit without a GL context,
 * server, film synthesis or browser.
 * @evidence contracts/development/common.md#meaningful-documentation Names
 * inputs, measured units and all outcomes with independent geometric oracles.
 */
export function test_inspection_camera_visibility(): void {
  const scene: Scene = new Scene();
  const camera: PerspectiveCamera = new PerspectiveCamera(90, 2, 1, 20);
  const geometry: BoxGeometry = new BoxGeometry(1, 1, 1);
  const beauty: MeshBasicMaterial = new MeshBasicMaterial();
  const target: Mesh = new Mesh(geometry, beauty);
  scene.add(target);
  const observe = (
    triangleBudget: number = 0,
  ): IAutoMovieCameraInspection.IResult =>
    observeAutoMovieCameraInspection({ scene, camera, target, triangleBudget });

  target.position.set(7, 0, -5);
  TestValidator.equals("wide delivered framing", observe().framing, "possible");
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  TestValidator.equals(
    "square delivery excludes target",
    observe().framing,
    "outside",
  );
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
    classifyAutoMovieCameraInspection({
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

  geometry.dispose();
  beauty.dispose();
  blockerMaterial.dispose();
}
