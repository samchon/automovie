import type {
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
} from "@automovie/interface";
import { AutoMovieRenderDraw } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderDraw.planPicture` decides which shots a drawn picture shows.
 *
 * Scenarios:
 *
 * 1. A subject with no sequence has no layers and no placed entry.
 * 2. Inside a lone live shot, there are no layers and the placed entry is that
 *    shot's.
 * 3. Inside a 0.5 s dissolve there are two layers, and without a way to place the
 *    outgoing shot the plan is refused; with one it is planned.
 */
export function test_render_draw_plan_draw_picture(): void {
  TestValidator.equals("no sequence", AutoMovieRenderDraw.planPicture("hero", {}, 1), {
    layers: null,
    shown: null,
    placed: null,
  });

  const sequence: IAutoMovieSequence = {
    id: "seq",
    name: "seq",
    fps: 24,
    shots: [
      { shot: "shot:a", trim: { start: 0, duration: 1 }, transition: null },
      {
        shot: "shot:b",
        trim: { start: 0, duration: 1.5 },
        transition: { kind: "crossDissolve", duration: 0.5 },
      },
    ],
  };
  const cut: IAutoMoviePlaybackTimeline = {
    entries: [
      { entry: 0, shot: "shot:a", start: 0, played: 1, offset: 0 },
      { entry: 1, shot: "shot:b", start: 0.5, played: 1.5, offset: 0 },
    ],
    runtime: 2,
  };
  const alone = AutoMovieRenderDraw.planPicture("hero", { sequence, cut }, 0.25);
  TestValidator.equals(
    "lone shot",
    [alone.layers, alone.shown, alone.placed?.shot],
    [null, null, "shot:a"],
  );
  TestValidator.error("outgoing cannot be placed", (): void => {
    AutoMovieRenderDraw.planPicture("hero", { sequence, cut }, 0.75);
  });
  const blended = AutoMovieRenderDraw.planPicture(
    "hero",
    { sequence, cut, seekShot: async (): Promise<void> => {} },
    0.75,
  );
  TestValidator.equals("two layers", blended.layers?.length, 2);
  TestValidator.predicate("a shown layer", blended.shown !== null);
}
