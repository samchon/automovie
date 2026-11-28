import { type IAutoMovieRenderDrawFunction, type IAutoMovieRenderDrawGlobal, type IAutoMovieRenderDrawScene, AutoMovieRenderInspectionRequest, AutoMovieRenderDraw } from "@automovie/render";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation The draw page fixture separates an unused install, concurrent first demand and page hiding after preparation failure. The failure is compared by identity.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public draw installer with typed in-memory page globals and supplied starters. It invokes describe and draw concurrently, awaits both rejections and fires the captured page-hide callbacks.
 * @evidence contracts/development/testing.md#independent-expectations An unused install keeps the starter offer count at zero. Both concurrent reads reject with the same authored Error and together prepare once. After hiding and one event-loop turn the counter is still one.
 */
export async function test_capture_draw_lazy_subject(): Promise<void> {
  let offers: number = 0;
  let hideUnused: (() => void) | undefined;
  const unused: IAutoMovieRenderDrawGlobal = {
    addEventListener: (_type: "pagehide", listener: () => void): void => {
      hideUnused = listener;
    },
  };
  AutoMovieRenderDraw.installAutoMovieDraw(() => {
    offers++;
    return {
      starter: { create: () => new Promise<IAutoMovieRenderDrawScene>(() => {}) },
    };
  }, unused);
  assert.equal(offers, 0);
  hideUnused!();
  assert.equal(offers, 0);

  const failure: Error = new Error("scene preparation failed");
  let preparations: number = 0;
  let hideFailed: (() => void) | undefined;
  const target: IAutoMovieRenderDrawGlobal = {
    addEventListener: (_type: "pagehide", listener: () => void): void => {
      hideFailed = listener;
    },
  };
  AutoMovieRenderDraw.installAutoMovieDraw(
    () => ({
      starter: {
        create: async (): Promise<IAutoMovieRenderDrawScene> => {
          preparations++;
          throw failure;
        },
      },
    }),
    target,
  );
  const draw: IAutoMovieRenderDrawFunction = target.__automovieDraw!;
  const described: ReturnType<IAutoMovieRenderDrawFunction["describe"]> =
    draw.describe();
  const drawn: ReturnType<IAutoMovieRenderDrawFunction["draw"]> = draw.draw({
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
