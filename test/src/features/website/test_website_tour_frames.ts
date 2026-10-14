import { createTourFrame } from "@automovie/website/tour-frame";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import { nclose } from "../internal/predicates";

/**
 * The existing viewer loop draws a static tour only when its view changes.
 * Scenarios:
 * 1. First render and invalidated render draw once, then retain the frame.
 * 2. Independent width/height changes update CSS aspect and framebuffer size at the supplied DPR.
 * 3. Hidden viewports retain pending work until both dimensions are positive.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the tour frame callback with an owned renderer port, observing draw/finish counts, exact scene/camera identity, resize requests, CSS aspect and deferred hidden redraw; redundant static draws, swapped inputs or lost invalidation fails.
 * @evidence contracts/testing.md#independent-expectations Authored CSS/framebuffer sizes and a supplied ratio of two determine the expected resize sequence and 400/250 aspect; draw counts follow explicit invalidation and dimension changes rather than a rendered output snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Covers initial/idle/invalidated frames, independent width and height changes, both zero-dimension cases and restored visibility; renderer failures, DPR changes and completion-observer publication are not asserted by this unit.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_frames entry owns callbacks through the existing product renderer port using plain objects and resident Three scene/camera records; no foreign renderer is replaced and no browser or GPU is started.
 */
export function test_website_tour_frames(): void {
  const canvas: Parameters<typeof createTourFrame>[0]["canvas"] = {
    width: 600,
    height: 400,
    clientWidth: 300,
    clientHeight: 200,
  };
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(),
    scene: THREE.Scene = new THREE.Scene();
  let draws: number = 0,
    finishes: number = 0;
  const sizes: number[][] = [];
  const frame: ReturnType<typeof createTourFrame> = createTourFrame({
    canvas,
    camera,
    scene,
    finish: (): void => { finishes++; },
    renderer: {
      getPixelRatio: (): number => 2,
      setSize: (w: number, h: number): void => {
        sizes.push([w, h]);
        canvas.width = w * 2;
        canvas.height = h * 2;
      },
      render: (s: THREE.Object3D, c: THREE.Camera): void => {
        TestValidator.predicate(
          "actual scene and camera",
          s === scene && c === camera,
        );
        draws++;
      },
    },
  });
  TestValidator.equals("mount callback owns render", frame.frame(), true);
  frame.frame();
  TestValidator.equals("static frame reused", [draws, finishes], [1, 1]);
  frame.invalidate();
  frame.frame();
  TestValidator.equals("camera invalidation", draws, 2);
  canvas.clientWidth = 400;
  frame.frame();
  canvas.clientHeight = 250;
  frame.frame();
  TestValidator.equals("viewport dimensions", sizes, [
    [400, 200],
    [400, 250],
  ]);
  TestValidator.predicate(
    "aspect from CSS dimensions",
    nclose(camera.aspect, 1.6, 1e-12) && Math.abs(camera.aspect - 1.6) < 1e-12,
  );
  frame.invalidate();
  canvas.clientWidth = 0;
  frame.frame();
  canvas.clientWidth = 400;
  canvas.clientHeight = 0;
  frame.frame();
  TestValidator.equals("hidden viewport does not draw", draws, 4);
  canvas.clientHeight = 250;
  frame.frame();
  TestValidator.equals("pending hidden render restored", draws, 5);
}
