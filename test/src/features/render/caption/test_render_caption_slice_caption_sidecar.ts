import type { IAutoMovieCaptionSidecar } from "@automovie/interface";
import { sliceCaptionSidecar } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `sliceCaptionSidecar` cuts the captions of a frame window and renumbers them
 * from the window's start.
 *
 * Scenarios:
 *
 * 1. The window [2, 6) of three spans over [0, 4), [4, 8) and [8, 10) keeps the
 *    first two, clipped and shifted to [0, 2) and [2, 4), in a 4-frame sidecar.
 * 2. A window past the end is clamped to the sidecar's frames.
 * 3. A negative start, an empty window and a start at or beyond the frame count
 *    are refused.
 */
export function test_render_caption_slice_caption_sidecar(): void {
  const span = (
    frameStart: number,
    frameEnd: number,
    beat: string,
  ): IAutoMovieCaptionSidecar["entries"][number] => ({
    frameStart,
    frameEnd,
    beat,
    caption: `${beat} caption`,
    slug: null,
  });
  const sidecar: IAutoMovieCaptionSidecar = {
    target: "seq:duel",
    fps: 4,
    frameCount: 10,
    entries: [span(0, 4, "a"), span(4, 8, "b"), span(8, 10, "c")],
  };
  const sliced: IAutoMovieCaptionSidecar = sliceCaptionSidecar(sidecar, 2, 6);
  TestValidator.equals("frames", sliced.frameCount, 4);
  TestValidator.equals(
    "entries",
    sliced.entries.map((entry): [string, number, number] => [
      entry.beat,
      entry.frameStart,
      entry.frameEnd,
    ]),
    [
      ["a", 0, 2],
      ["b", 2, 4],
    ],
  );
  const tail: IAutoMovieCaptionSidecar = sliceCaptionSidecar(sidecar, 6, 20);
  TestValidator.equals("clamped", tail.frameCount, 4);
  TestValidator.equals(
    "tail entries",
    tail.entries.map((entry): [string, number, number] => [
      entry.beat,
      entry.frameStart,
      entry.frameEnd,
    ]),
    [
      ["b", 0, 2],
      ["c", 2, 4],
    ],
  );
  for (const [start, end] of [
    [-1, 4],
    [4, 4],
    [10, 12],
  ] as const)
    TestValidator.error(`${start}..${end}`, (): void => {
      sliceCaptionSidecar(sidecar, start, end);
    });
}