import { AutoMovieRenderScreenplay } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { TREE_SCRIPT } from "../../internal/TREE_SCRIPT";

/**
 * The screenplay document: the tree renders depth-first with the documented
 * plain-text convention (slug, direction, indented dialogue with anchors,
 * bracketed captions), and the same script yields the same bytes.
 *
 * Scenarios:
 *
 * 1. The five-kind tree renders in refinement order: intent header, act rule,
 *    upper-cased slug + description, group rationale, both beats with their
 *    flat names.
 * 2. Dialogue renders as the indented SPEAKER-over-text convention; an anchored
 *    line carries `[t=1.5s]`, an unanchored one does not.
 * 3. A present caption renders bracketed; the caption-less beat renders none.
 * 4. Determinism: rendering twice yields byte-identical text.
 */
export function test_render_screenplay_render_screenplay(): void {
  const text: string = AutoMovieRenderScreenplay.render(TREE_SCRIPT);

  const order: string[] = [
    "LOGLINE: A knight faces his rival.",
    "THEME: honor",
    "ACT, the rivalry breaks",
    "EXT. CASTLE COURTYARD - DAWN",
    "Mist over the flagstones.",
    "[the exchange]",
    "BEAT, The duel",
    "A lunges; B parries.",
    "                KNIGHTA",
    "        [t=1.5s] Yield!",
    "                KNIGHTB",
    "        Never.",
    "[Shot: two knights clash at dawn]",
    "BEAT, The aftermath",
    "Dust settles.",
  ];
  let cursor: number = -1;
  for (const fragment of order) {
    const at: number = text.indexOf(fragment);
    TestValidator.predicate(`renders "${fragment}" in order`, at > cursor);
    cursor = at;
  }
  TestValidator.equals(
    "caption-less beat renders no bracket",
    text.includes("[Shot: two knights clash at dawn]") &&
      text.split("[Shot:").length,
    2,
  );
  TestValidator.equals(
    "deterministic bytes",
    AutoMovieRenderScreenplay.render(TREE_SCRIPT),
    text,
  );
}
