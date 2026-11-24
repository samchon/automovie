import { IAutoMovieScript } from "@automovie/interface";
import { renderScreenplay } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { TREE_SCRIPT } from "../../../internal/TREE_SCRIPT";
import { namedFacts, throwsError } from "../../../internal/predicates";
import { screenplayNode } from "../../../internal/screenplayNode";

/**
 * The treeless fallback and the guards: flat scripts stay exportable, ghost
 * references degrade to the raw id, an empty tree renders only the terminator,
 * and a script with no beats refuses to render.
 *
 * Scenarios:
 *
 * 1. A treeless script renders the flat fallback: header from the flat
 *    logline/theme, each beat as name over summary.
 * 2. A beat node naming a ghost flat beat falls back to the raw beat id; commit
 *    validation separately owns its rejection.
 * 3. `tree: []` renders an empty document body with one newline.
 * 4. Zero beats throw: there is no screenplay to render.
 */
export function test_unit_render_screenplay_render_screenplay_fallback(): void {
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
