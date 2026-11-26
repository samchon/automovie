import { type IAutoMovieDrawFunction, type IAutoMovieDrawGlobal, type IAutoMovieDrawScene, AutoMovieRenderInspectionRequest, AutoMovieRenderDraw } from "@automovie/render";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";

/**
 * The draw page prepares one subject when requested.
 *
 * Scenarios:
 *
 * 1. Registering and then hiding an unused draw page leaves it unprepared.
 * 2. Concurrent describe and draw calls share the same failed preparation.
 * 3. Hiding a page after failed preparation starts no new work.
 */
export async function test_capture_draw_lazy_subject(): Promise<void> {
  let offers: number = 0;
  let hideUnused: (() => void) | undefined;
  const unused: IAutoMovieDrawGlobal = {
    addEventListener: (_type: "pagehide", listener: () => void): void => {
      hideUnused = listener;
    },
  };
  AutoMovieRenderDraw.installAutoMovieDraw(() => {
    offers++;
    return {
      starter: { create: () => new Promise<IAutoMovieDrawScene>(() => {}) },
    };
  }, unused);
  assert.equal(offers, 0);
  hideUnused!();
  assert.equal(offers, 0);

  const failure: Error = new Error("scene preparation failed");
  let preparations: number = 0;
  let hideFailed: (() => void) | undefined;
  const target: IAutoMovieDrawGlobal = {
    addEventListener: (_type: "pagehide", listener: () => void): void => {
      hideFailed = listener;
    },
  };
  AutoMovieRenderDraw.installAutoMovieDraw(
    () => ({
      starter: {
        create: async (): Promise<IAutoMovieDrawScene> => {
          preparations++;
          throw failure;
        },
      },
    }),
    target,
  );
  const draw: IAutoMovieDrawFunction = target.__automovieDraw!;
  const described: ReturnType<IAutoMovieDrawFunction["describe"]> =
    draw.describe();
  const drawn: ReturnType<IAutoMovieDrawFunction["draw"]> = draw.draw({
    seconds: 0,
    view: "film",
    request: AutoMovieRenderInspectionRequest.parseRequest((): undefined => undefined),
    width: 1,
    height: 1,
    frame: [0],
    scale: 1,
  });
  await Promise.all([
    assert.rejects(described, (error: unknown): boolean => error === failure),
    assert.rejects(drawn, (error: unknown): boolean => error === failure),
  ]);
  assert.equal(preparations, 1);

  hideFailed!();
  await setImmediate();
  assert.equal(preparations, 1);
}
