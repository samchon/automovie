import { ViolationCollector } from "@automovie/engine";
import { validateBlockingAnchors } from "@automovie/engine/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Anchors describe a sequence in authored order inside the beat's closed range.
 *
 * Scenarios:
 *
 * 1. Start, simultaneous cues, and the closing instant are admitted.
 * 2. A late cue and a subsequent negative cue report their range, and the latter
 *    also reports moving backward in authored order.
 */
export function test_engine_film_validate_blocking_anchors(): void {
  const out: ViolationCollector = new ViolationCollector();
  validateBlockingAnchors(
    out,
    "anchors",
    [
      { t: 0, cue: "open" },
      { t: 1, cue: "lift" },
      { t: 1, cue: "turn" },
      { t: 2, cue: "close" },
    ],
    2,
  );
  TestValidator.equals(
    "closed time range with equal adjacent times",
    out.items,
    [],
  );
  validateBlockingAnchors(
    out,
    "anchors",
    [
      { t: 0, cue: "open" },
      { t: 3, cue: "late" },
      { t: -1, cue: "early" },
    ],
    2,
  );
  TestValidator.equals(
    "range findings keep anchor order",
    out.items.map(({ kind, path }) => [kind, path]),
    [
      ["range", "anchors[1].t"],
      ["range", "anchors[2].t"],
      ["range", "anchors[2].t"],
    ],
  );
  TestValidator.predicate(
    "backward time cites the listed predecessor",
    out.items[2]?.expected.includes("predecessor (t=3)") === true,
  );
}
