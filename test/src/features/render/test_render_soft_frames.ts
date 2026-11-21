import type {
  IAutoMovieCapturePlan,
  IAutoMovieDrawCall,
  IAutoMovieRenderSoftPropFrame,
} from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  bindAutoMovieDrawSceneSoftProps,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  planAutoMovieDrawCall,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * A frame schedule supplies soft props at the same seconds as the film.
 *
 * Scenarios:
 *
 * 1. Ten samples a second over 0.21 s map to frames 0, 2, 5 at 24 Hz.
 * 2. The same samples map to frames 0, 6, 12 at 60 Hz.
 * 3. At each frame, placement happens before the only surface read, and the
 *    mesh uses that surface until the next frame.
 * 4. Off-grid, repeated, and backward draws still use the requested second,
 *    including the exact start and end of the film.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both schedules and the placement and geometry observations at every instant.
 * @evidence contracts/development/testing.md#behavioral-verification Drives actual capture planning and draw-call translation into the draw-scene soft-prop binding, observes the calls to the producer and inspects the resulting mesh.
 * @evidence contracts/development/testing.md#independent-expectations Scheduled samples round to native frame time. Direct seeks read the supplied exact second. A mesh vertex observes the panel height with 1e-8 m allowed for Float32 rounding.
 * @evidence contracts/development/testing.md#distinguishing-cases 24 Hz rounds scheduled samples while 60 Hz retains them. Both expose an extra read, stale geometry, or unintended frame quantization on a direct seek.
 * @evidence contracts/development/testing.md#execution-ownership test_render_soft_frames creates only an in-memory schedule, scene and producer callback, with no browser, capture run or renderer.
 */
export async function test_render_soft_frames(): Promise<void> {
  for (const [fps, expected] of [
    [24, [0, 2 / 24, 5 / 24]],
    [60, [0, 6 / 60, 12 / 60]],
  ] as const) {
    const scene: THREE.Scene = new THREE.Scene();
    const events: { kind: "placed" | "read"; seconds: number }[] = [];
    const heights: number[] = [];
    const draw: IAutoMovieDrawScene = bindAutoMovieDrawSceneSoftProps(
      {
        scene,
        camera: new THREE.PerspectiveCamera(),
        fps,
        durationSeconds: 0.21,
        width: 32,
        height: 18,
        seek: async (seconds: number): Promise<void> => {
          await Promise.resolve();
          events.push({ kind: "placed", seconds });
        },
        dispose: (): void => {
          scene.clear();
        },
      },
      (seconds: number): readonly IAutoMovieRenderSoftPropFrame[] => {
        events.push({ kind: "read", seconds });
        return [panel(seconds)];
      },
    );
    try {
      const plan: IAutoMovieCapturePlan = planAutoMovieCapture({
        request: parseAutoMovieCapturePlanRequest(
          new URLSearchParams("rate=10&views=film"),
        ),
        subject: {
          name: "cloth",
          durationSeconds: draw.durationSeconds,
          fps,
          width: draw.width,
          height: draw.height,
          drawables: [],
          views: [],
          marks: [],
        },
        cuts: [],
      });
      const measure = async (seconds: number): Promise<void> => {
        await draw.seek(seconds);
        const mesh: THREE.Object3D | undefined =
          scene.getObjectByName("soft:panel");
        heights.push(
          mesh instanceof THREE.Mesh
            ? mesh.geometry.getAttribute("position").getY(0)
            : NaN,
        );
      };
      const matches = (seconds: number, index: number): boolean =>
        events[index * 2]?.kind === "placed" &&
        events[index * 2]?.seconds === seconds &&
        events[index * 2 + 1]?.kind === "read" &&
        events[index * 2 + 1]?.seconds === seconds &&
        nclose(heights[index]!, seconds, 1e-8);
      for (const cell of plan.cells) {
        const call: IAutoMovieDrawCall = planAutoMovieDrawCall(cell, plan);
        await measure(call.seconds);
      }
      TestValidator.predicate(
        `${fps} Hz seeks place once, then read once and project that frame`,
        () =>
          events.length === expected.length * 2 &&
          heights.length === expected.length &&
          expected.every(matches),
      );
      const reordered: readonly number[] = [0.21, 0.113, 0, 0.113, 0.21];
      for (const seconds of reordered) await measure(seconds);
      TestValidator.predicate(
        `${fps} Hz backward and repeated seeks preserve exact geometry`,
        (): boolean =>
          events.length === (expected.length + reordered.length) * 2 &&
          heights.length === expected.length + reordered.length &&
          reordered.every((seconds: number, index: number): boolean =>
            matches(seconds, expected.length + index),
          ),
      );
    } finally {
      draw.dispose();
    }
  }
}

/** A square at the given world height, supplied already evaluated by the host. */
function panel(y: number): IAutoMovieRenderSoftPropFrame {
  return {
    subject: "panel",
    status: "solved",
    surface: {
      domain: "panel-lattice",
      step: 0,
      bounds: { min: { x: 0, y, z: 0 }, max: { x: 1, y, z: 1 } },
      mesh: {
        positions: [0, y, 0, 1, y, 0, 0, y, 1, 1, y, 1],
        normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        indices: [0, 2, 1, 1, 2, 3],
        uvs: [0, 0, 1, 0, 0, 1, 1, 1],
        skin: null,
      },
    },
  };
}
