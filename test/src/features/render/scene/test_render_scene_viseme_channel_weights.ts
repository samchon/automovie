import { autoMovieVisemeChannelWeights } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";

/** Tolerance of the summed channel weights. */
const WEIGHT_TOLERANCE: number = 1e-12;

/**
 * `autoMovieVisemeChannelWeights` sums viseme weights onto mouth presets and
 * their channels.
 *
 * Scenarios:
 *
 * 1. `{ aa: 0.5, O: 0.5 }` sets the presets `aa` and `oh` to 0.5 and the channel
 *    `jawOpen` to 0.5 * 1 + 0.5 * 0.6 = 0.8.
 * 2. Closed-lip visemes `sil`, `PP` and `FF` set nothing.
 * 3. A weight is clamped to `[0, 1]` before it is summed.
 * 4. Two visemes of one preset add: `TH` and `DD` give `ih` 1.
 */
export function test_render_scene_viseme_channel_weights(): void {
  const mixed: Map<string, number> = autoMovieVisemeChannelWeights({
    aa: 0.5,
    O: 0.5,
  });
  TestValidator.equals("aa preset", mixed.get("aa"), 0.5);
  TestValidator.equals("oh preset", mixed.get("oh"), 0.5);
  TestValidator.predicate(
    "jaw open",
    Math.abs((mixed.get("jawOpen") ?? 0) - 0.8) < WEIGHT_TOLERANCE,
  );
  TestValidator.equals(
    "closed lips",
    autoMovieVisemeChannelWeights({ sil: 1, PP: 1, FF: 1 }).size,
    0,
  );
  TestValidator.equals(
    "clamped high",
    autoMovieVisemeChannelWeights({ aa: 3 }).get("aa"),
    1,
  );
  TestValidator.equals(
    "clamped low",
    autoMovieVisemeChannelWeights({ aa: -1 }).get("aa"),
    0,
  );
  TestValidator.equals(
    "summed",
    autoMovieVisemeChannelWeights({ TH: 0.5, DD: 0.5 }).get("ih"),
    1,
  );
}