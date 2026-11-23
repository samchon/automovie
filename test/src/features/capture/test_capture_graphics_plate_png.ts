import type {
  IAutoMovieCaptureDrawing,
  IAutoMovieCapturePlan,
  IAutoMovieCaptureSubject,
  IAutoMovieGuidePassOutput,
  IAutoMovieRasterImage,
} from "@automovie/interface";
import {
  AutoMovieCaptureFolder,
  decodeAutoMovieRasterPng,
  encodeAutoMovieRasterPng,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  planGuidePassOutputs,
  runAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createCaptureMemory } from "./createCaptureMemory";

/**
 * The graphics plate is planned as a pass and written as an RGBA PNG that keeps
 * its straight alpha.
 *
 * Scenarios:
 *
 * 1. Planning the `beauty` and `graphics` passes lists a `graphics` output.
 * 2. A plate raster with one opaque red pixel and one fully transparent pixel,
 *    written with alpha, decodes with PNG colour type 6 and the same four
 *    channels per pixel.
 * 3. A capture of the `beauty` and `graphics` passes whose draw returns that
 *    raster writes the graphics still with colour type 6 and the raster's four
 *    channels, and the beauty still with colour type 2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the plan and the raster the test pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public pass planner, encoder and decoder, and runs a capture against in-memory storage, and reads the IHDR colour type and the decoded pixels.
 * @evidence contracts/development/testing.md#independent-expectations Colour type 6 is PNG's RGBA type (W3C PNG, 2nd edition, section 11.2.2); the expected pixels are the authored ones.
 * @evidence contracts/development/testing.md#distinguishing-cases An RGB plate (type 2) or a dropped alpha fails. A capture still that drops the plate's alpha, or a beauty still written with alpha, fails. The control writer's choice of alpha for the graphics pass is exercised by the render path.
 * @evidence contracts/development/testing.md#execution-ownership In-memory planning, capture storage and PNG bytes; no browser.
 */
export async function test_capture_graphics_plate_png(): Promise<void> {
  const outputs: IAutoMovieGuidePassOutput[] = planGuidePassOutputs({
    frameDir: "frames",
    frameCount: 2,
    passes: ["beauty", "graphics"],
  });
  TestValidator.predicate(
    "the plan lists the graphics pass",
    outputs.some(
      (output: IAutoMovieGuidePassOutput): boolean =>
        output.pass === "graphics",
    ),
  );

  const plate: IAutoMovieRasterImage = {
    width: 2,
    height: 1,
    pixels: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0]),
  };
  const bytes: Uint8Array = await encodeAutoMovieRasterPng(plate, {
    alpha: true,
  });
  TestValidator.equals("PNG colour type 6", bytes[25], 6);
  const decoded: IAutoMovieRasterImage = await decodeAutoMovieRasterPng(bytes);
  TestValidator.equals(
    "straight alpha kept",
    Array.from(decoded.pixels),
    [255, 0, 0, 255, 0, 0, 0, 0],
  );

  // 3. The capture writes the graphics still with its alpha and beauty without.
  const memory: createCaptureMemory.IMemory = createCaptureMemory();
  const subject: IAutoMovieCaptureSubject = {
    name: "plate",
    durationSeconds: 1,
    fps: 10,
    width: 2,
    height: 1,
    views: [],
    drawables: [],
    marks: [],
  };
  const plan: IAutoMovieCapturePlan = planAutoMovieCapture({
    request: parseAutoMovieCapturePlanRequest(
      new URLSearchParams("at=0&passes=beauty,graphics"),
    ),
    subject,
    cuts: [],
  });
  await runAutoMovieCapture({
    plan,
    draw: async (): Promise<IAutoMovieCaptureDrawing> => ({
      picture: { ...plate, pixels: plate.pixels.slice() },
      labels: [],
      backend: "cpu",
    }),
    folder: await AutoMovieCaptureFolder.open({
      storage: memory.storage,
      root: "out",
      round: plan.request.round,
      compare: plan.request.compare,
    }),
    revision: "r",
    match: "cell",
  });
  const still = (pass: string): Uint8Array =>
    [...memory.files].find(([path]: [string, Uint8Array]): boolean =>
      path.endsWith(`-${pass}.png`),
    )![1];
  TestValidator.equals(
    "the graphics still keeps its alpha and the beauty still is RGB",
    [
      still("graphics")[25],
      Array.from((await decodeAutoMovieRasterPng(still("graphics"))).pixels),
      still("beauty")[25],
    ],
    [6, [255, 0, 0, 255, 0, 0, 0, 0], 2],
  );
}
