import {
  AutoMovieGrammarStyleIntent,
  IAutoMovieCameraIntent,
  IAutoMovieDiagnostic,
} from "@automovie/interface";
import { filmGrammarDiagnostics } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { createFilmGrammarFixtures } from "../internal/createFilmGrammarFixtures";
import { namedFacts } from "../internal/predicates";

const { FPS, ASPECT, point, boxModel, emptyModel, walk, compiledShot, shotContract, segmentOf, readEdit, codes, PAIR }: ReturnType<typeof createFilmGrammarFixtures> = createFilmGrammarFixtures();

/**
 * The film compile reads the assembled edit and files what it finds.
 *
 * The analyzer measured all of this before and nobody asked it, so a declared
 * `styleIntent` suppressed nothing and an undeclared break was never named.
 * These cases pin the wire-up at the point the builder calls it: observations
 * built from compiled shot output at the edited boundaries, findings routed as
 * ordinary warnings, and a declaration reported when it excepts nothing.
 *
 * Scenarios:
 *
 * 1. Cutting across the line of action is reported, naming both shots, and
 *    declaring the matching exception silences exactly that finding.
 * 2. An exception declared over an edit that never breaks the rule is itself
 *    reported, while an edit with neither break nor declaration says nothing.
 * 3. Boundaries are read from the compiled performance: the same two cameras stop
 *    crossing once the subject walks past its partner on screen.
 * 4. A framing claim covering the whole placement is measured against the compiled
 *    camera; a placement spanning two claims is measured against neither.
 * 5. Placements with no contract, no compiled output or no staged camera are skipped; unstaged subjects are omitted, while staged model-less or unmeasurable subjects use the supported extent fallback.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads edited compiled shots and asserts axis warning/source attribution, exact style suppression and unmatched declarations, performed-root boundary changes, framing-claim containment and missing-record/camera or fallback-subject behavior.
 * @evidence contracts/testing.md#independent-expectations Authored camera sides and subject positions define crossing versus preserved geography; declared style policy and source contracts define warning identity/path. Framing and root-motion interpretation share engine helpers, so these integration assertions do not independently prove every geometry formula or rendered film grammar.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all five scenarios: crossing/suppression, unexercised declaration/clean edit, walking subject boundary, one versus spanning framing claims and unobservable placement/fallback subjects. Detailed cut rules, malformed observations and subject-box geometry belong to neighboring engine/production units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns every assertion and calls production diagnostics using the original fixture constructors moved to one canonical helper; no new scene value, geometry asset, renderer, native host or dynamically registered case is introduced.
 */
export function test_production_film_grammar_diagnostics(): void {
  const crossing: (styleIntent?: AutoMovieGrammarStyleIntent[]) => IAutoMovieDiagnostic[] = (
    styleIntent?: AutoMovieGrammarStyleIntent[],
  ): IAutoMovieDiagnostic[] =>
    readEdit([
      {
        contract: shotContract({
          id: "first",
          requiredSubjects: ["alpha", "bravo"],
        }),
        compiled: compiledShot({
          id: "first",
          camera: point(0, 1, 5),
          subjects: PAIR,
        }),
      },
      {
        contract: shotContract({
          id: "second",
          requiredSubjects: ["alpha", "bravo"],
          styleIntent,
        }),
        compiled: compiledShot({
          id: "second",
          camera: point(0, 1, -5),
          subjects: PAIR,
        }),
      },
    ]);
  const undeclared: IAutoMovieDiagnostic[] = crossing();
  TestValidator.equals(
    "an undeclared axis crossing is reported naming both shots",
    namedFacts([
      ["one finding", (): boolean => undeclared.length === 1],
      ["axis family", (): boolean => undeclared[0]!.code === "grammar-axis-crossed"],
      [
        "advises rather than refuses",
        (): boolean => undeclared[0]!.category === "warning",
      ],
      ["compile phase", (): boolean => undeclared[0]!.phase === "compile"],
      [
        "filed on the incoming shot",
        (): boolean => undeclared[0]!.target === "shot:second",
      ],
      [
        "owned by its source",
        (): boolean => undeclared[0]!.path === "src/shots/second.ts",
      ],
      [
        "names the outgoing shot",
        (): boolean => undeclared[0]!.message.includes(`"first"`),
      ],
      [
        "names the incoming shot",
        (): boolean => undeclared[0]!.message.includes(`"second"`),
      ],
    ]),
    {
      "one finding": true,
      "axis family": true,
      "advises rather than refuses": true,
      "compile phase": true,
      "filed on the incoming shot": true,
      "owned by its source": true,
      "names the outgoing shot": true,
      "names the incoming shot": true,
    },
  );
  TestValidator.equals(
    "the matching declared exception suppresses that crossing",
    crossing(["axis-cross"]),
    [],
  );

  const level: (styleIntent?: AutoMovieGrammarStyleIntent[]) => IAutoMovieDiagnostic[] = (
    styleIntent?: AutoMovieGrammarStyleIntent[],
  ): IAutoMovieDiagnostic[] =>
    readEdit([
      {
        contract: shotContract({
          id: "first",
          requiredSubjects: ["alpha", "bravo"],
        }),
        compiled: compiledShot({
          id: "first",
          camera: point(0, 1, 5),
          subjects: PAIR,
        }),
      },
      {
        contract: shotContract({
          id: "second",
          requiredSubjects: ["alpha", "bravo"],
          styleIntent,
        }),
        compiled: compiledShot({
          id: "second",
          camera: point(5, 1, 3),
          subjects: PAIR,
        }),
      },
    ]);
  TestValidator.equals(
    "an edit with neither break nor declaration is unchanged",
    level(),
    [],
  );
  const unexercised: IAutoMovieDiagnostic[] = level(["axis-cross"]);
  TestValidator.equals(
    "an exception that excepts nothing is reported against its shot",
    namedFacts([
      ["one finding", (): boolean => unexercised.length === 1],
      [
        "unmatched family",
        (): boolean => unexercised[0]!.code === "grammar-style-intent-unmatched",
      ],
      [
        "filed on the declaring shot",
        (): boolean => unexercised[0]!.target === "shot:second",
      ],
      [
        "names the declaration",
        (): boolean => unexercised[0]!.message.includes(`"axis-cross"`),
      ],
      [
        "names the finding it would have excepted",
        (): boolean => unexercised[0]!.message.includes("grammar-axis-crossed"),
      ],
    ]),
    {
      "one finding": true,
      "unmatched family": true,
      "filed on the declaring shot": true,
      "names the declaration": true,
      "names the finding it would have excepted": true,
    },
  );

  TestValidator.equals(
    "a subject walking past its partner crosses the line on screen",
    readEdit([
      {
        contract: shotContract({
          id: "first",
          requiredSubjects: ["alpha", "bravo"],
        }),
        compiled: compiledShot({
          id: "first",
          camera: point(0, 1, 5),
          subjects: [{ ...PAIR[0]!, motion: "motion-1" }, PAIR[1]!],
          motions: [walk()],
        }),
      },
      {
        contract: shotContract({
          id: "second",
          requiredSubjects: ["alpha", "bravo"],
        }),
        compiled: compiledShot({
          id: "second",
          camera: point(0, 1, -5),
          subjects: PAIR,
        }),
      },
    ]),
    [],
  );

  const framed: (cameraIntent: IAutoMovieCameraIntent[]) => IAutoMovieDiagnostic[] = (
    cameraIntent: IAutoMovieCameraIntent[],
  ): IAutoMovieDiagnostic[] =>
    readEdit([
      {
        contract: shotContract({ id: "only", requiredSubjects: ["alpha"] }),
        compiled: compiledShot({
          id: "only",
          camera: point(0, 1, 5),
          subjects: [PAIR[0]!],
          cameraIntent,
        }),
      },
    ]);
  const intent: (start: number, framing: IAutoMovieCameraIntent["framing"]) => IAutoMovieCameraIntent = (
    start: number,
    framing: IAutoMovieCameraIntent["framing"],
  ): IAutoMovieCameraIntent => ({
    start,
    framing,
    move: "static",
    focus: null,
    focalLength: null,
  });
  TestValidator.equals(
    "a framing claim the compiled camera does not deliver is reported",
    codes(framed([intent(0, "close")])),
    ["grammar-shot-size"],
  );
  TestValidator.equals(
    "a placement spanning two framing claims measures against neither",
    framed([intent(2, "close"), intent(0, "wide")]),
    [],
  );

  TestValidator.equals(
    "a placement nothing can be observed from is skipped",
    filmGrammarDiagnostics({
      segments: [
        segmentOf("unregistered", 0),
        segmentOf("uncompiled", 1),
        segmentOf("blind", 2),
      ],
      fps: FPS,
      aspect: ASPECT,
      contracts: new Map([
        [
          "uncompiled",
          shotContract({ id: "uncompiled", requiredSubjects: ["alpha"] }),
        ],
        ["blind", shotContract({ id: "blind", requiredSubjects: ["alpha"] })],
      ]),
      compiled: new Map([
        [
          "blind",
          compiledShot({
            id: "blind",
            camera: point(0, 1, 5),
            subjects: [PAIR[0]!],
            liveCamera: "struck",
          }),
        ],
      ]),
    }),
    [],
  );

  TestValidator.equals(
    "unstaged subjects are omitted and staged missing extents use fallback",
    readEdit([
      {
        contract: shotContract({
          id: "only",
          requiredSubjects: ["alpha", "bravo", "thin", "hollow", "absent"],
        }),
        compiled: compiledShot({
          id: "only",
          camera: point(0, 1, 5),
          subjects: [
            PAIR[0]!,
            { ...PAIR[1]!, model: "unbuilt" },
            { id: "thin", position: point(-3, 0, 0), model: "thin" },
            { id: "hollow", position: point(3, 0, 0), model: "hollow" },
          ],
          models: [
            boxModel("figure", 1.8),
            boxModel("thin", 0.05),
            emptyModel("hollow"),
          ],
        }),
      },
    ]),
    [],
  );
}
