import { createTourFrame } from "@automovie/website/tour-frame";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The existing viewer loop draws a static tour only when its view changes.
 * Scenarios:
 * 1. First render and invalidated render draw once, then retain the frame.
 * 2. Width/height changes update CSS size, aspect and DPR independently.
 * 3. Hidden viewports retain pending work until both dimensions are positive.
 */
export const test_website_tour_frames = (): void => {
  const canvas = {
    width: 600,
    height: 400,
    clientWidth: 300,
    clientHeight: 200,
  };
  const camera = new THREE.PerspectiveCamera(),
    scene = new THREE.Scene();
  let draws = 0,
    finishes = 0;
  const sizes: number[][] = [];
  const frame = createTourFrame({
    canvas,
    camera,
    scene,
    finish: () => finishes++,
    renderer: {
      getPixelRatio: () => 2,
      setSize: (w, h) => {
        sizes.push([w, h]);
        canvas.width = w * 2;
        canvas.height = h * 2;
      },
      render: (s, c) => {
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
    Math.abs(camera.aspect - 1.6) < 1e-12,
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
};
