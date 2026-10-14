import { IAutoMovieScript } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { renderScreenplay } from "@automovie/render";
import { TREE_SCRIPT } from "../internal/TREE_SCRIPT";
import { namedFacts, throwsError } from "../internal/predicates";
import { screenplayNode } from "../internal/screenplayNode";

/**
 * The treeless fallback and the guards: flat scripts stay exportable, ghost references degrade to the raw id, an empty tree renders only the terminator, and a script with no beats refuses to render.
 *
 * Scenarios:
 *
 * 1. A treeless script renders the flat fallback: header from the flat logline/theme, each beat as name over summary.
 * 2. A beat node naming a ghost flat beat falls back to the raw beat id; commit validation separately owns its rejection.
 * 3. `tree: []` renders an empty document body with one newline.
 * 4. Zero beats throw: there is no screenplay to render.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises real flat-script fallback, ghost beat naming, empty-tree output and zero-beat refusal, distinguishing omitted tree from an explicit empty tree.
 * @evidence contracts/testing.md#independent-expectations Authored flat logline/theme and beat summaries supply literal fragments; a ghost remains its raw id, an empty tree yields one newline and zero beats violate the serializer contract. Commit validation, not this serializer, owns ghost-reference admission.
 * @evidence contracts/testing.md#distinguishing-cases Null tree, ghost join, explicit empty tree and no beats retain the original positive and refusal twins; five-kind tree output and dialogue formatting belong to the main screenplay unit.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_screenplay_fallback owns its cases. Portable string output from the canonical screenplay input leaves, without writing a document or launching a production.
 */
export function test_render_screenplay_fallback(): void {
  const flat: IAutoMovieScript = { ...TREE_SCRIPT, tree: null };
  const text: string = renderScreenplay(flat);
  TestValidator.equals(
    "flat header from the script fields",
    namedFacts([
      [
        "textIncludesLOGLINE",
        (): boolean =>
          text.includes("LOGLINE: flat logline (ignored when a tree exists)"),
      ],
      ["textIncludesTHEME", (): boolean => text.includes("THEME: flat theme")],
    ]),
    { textIncludesLOGLINE: true, textIncludesTHEME: true },
  );
  TestValidator.equals(
    "flat beats render name over summary",
    namedFacts([
      [
        "textIncludesBEAT",
        (): boolean => text.includes("BEAT, The duel\nThe duel summary"),
      ],
      [
        "textIncludesBEAT2",
        (): boolean =>
          text.includes("BEAT, The aftermath\nThe aftermath summary"),
      ],
    ]),
    { textIncludesBEAT: true, textIncludesBEAT2: true },
  );

  const ghost: IAutoMovieScript = {
    ...TREE_SCRIPT,
    tree: [
      screenplayNode({
        id: "root",
        parent: null,
        kind: "intent",
        payload: { logline: "l", theme: "t" },
      }),
      screenplayNode({
        id: "b1",
        parent: "root",
        kind: "beat",
        payload: { beat: "ghost", direction: "d", dialogue: [], caption: null },
      }),
    ],
  };
  TestValidator.predicate(
    "ghost beat id passes through",
    renderScreenplay(ghost).includes("BEAT, ghost"),
  );

  TestValidator.equals(
    "empty tree renders empty body",
    renderScreenplay({ ...TREE_SCRIPT, tree: [] }),
    "\n",
  );

  TestValidator.predicate(
    "zero beats throw",
    throwsError(
      (): string => renderScreenplay({ ...TREE_SCRIPT, beats: [] }),
      "no beats",
    ),
  );
}
