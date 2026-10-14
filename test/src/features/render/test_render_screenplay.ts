import { TREE_SCRIPT } from "../internal/TREE_SCRIPT";
import { renderScreenplay } from "../../../../packages/render/src/screenplay/renderScreenplay";
import { TestValidator } from "@nestia/e2e";
/**
 * The screenplay document: the tree renders depth-first with the documented plain-text convention (slug, direction, indented dialogue with anchors, bracketed captions), and the same script yields the same bytes.
 *
 * Scenarios:
 *
 * 1. The five-kind tree renders in refinement order: intent header, act rule, upper-cased slug + description, group rationale, both beats with their flat names.
 * 2. Dialogue renders as the indented SPEAKER-over-text convention; an anchored line carries `[t=1.5s]`, an unanchored one does not.
 * 3. A present caption renders bracketed; the caption-less beat renders none.
 * 4. Determinism: rendering twice yields byte-identical text.
 *
 * @evidence contracts/testing.md#behavioral-verification Serializes the real five-kind script tree and checks ordered text fragments, dialogue indentation/anchors, caption count and repeat output, detecting lost payload branches or reordered text.
 * @evidence contracts/testing.md#independent-expectations The original authored tree and documented plain-text convention determine literal fragments and their order; repeat serialization is an in-process consistency check rather than a historical text snapshot or cross-host proof.
 * @evidence contracts/testing.md#distinguishing-cases Intent, act, scene, group and two beat payloads, anchored/unanchored dialogue and present/absent captions preserve the original cases; treeless and refusal paths belong to the fallback companion.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_screenplay owns its cases. Portable string serialization; shared canonical input leaves are borrowed and no document writer, production host or renderer is started.
 */
export function test_render_screenplay(): void {
  const text: string = renderScreenplay(TREE_SCRIPT);

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
    renderScreenplay(TREE_SCRIPT),
    text,
  );
}
