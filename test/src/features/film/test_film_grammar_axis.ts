import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieGrammarDiagnostic, type IAutoMovieGrammarReading, type IAutoMovieGrammarShotObservation, type IAutoMovieGrammarSubjectObservation, readFilmGrammar } from "@automovie/engine";




import { createFilmGrammarCase } from "../internal/createFilmGrammarCase";

/**
 * Action-axis continuity uses the actual outgoing/incoming camera boundaries.
 *
 * Scenarios:
 * 1. A hidden opposite-half-plane cut reports; a neutral intermediary does not.
 * 2. An on-screen crossing or a rotating subject axis preserves visible geography.
 * 3. Reversed collection spelling and different axis subjects do not fabricate findings.
 * 4. Recovery names the axis-cross intent, which suppresses that finding and is exercised.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls readFilmGrammar on hand-authored action-axis observations and asserts hidden/visible crossing decisions, deterministic identity ordering and actionable recovery; catches a recovery omitting the supported intentional-crossing path.
 * @evidence contracts/testing.md#independent-expectations Subjects at x=-1 and x=1 define the ground-plane axis, cameras at positive/negative z lie on opposite sides and z=0 is neutral; reversing collection order preserves that same geometry rather than supplying copied expected diagnostics.
 * @evidence contracts/testing.md#distinguishing-cases Covers opposite/same/neutral half-planes, outgoing and incoming visible crossings, rotated axis endpoints, different subject pairs, collection-order invariance and intentional suppression; screen motion, eyelines and malformed fields have separate tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit entry owns every axis case and reaches portable source grammar through the shared fixture reader; no browser, GPU or process is needed.
 */
export function test_film_grammar_axis(): void {
  const {
    point,
    cameraSample,
    camera,
    subject,
    shot,
    reportedGrammar,
    codes,
  }: ReturnType<typeof createFilmGrammarCase> = createFilmGrammarCase();
  const axisSubjects: IAutoMovieGrammarSubjectObservation[] = [
    subject("alpha", point(-1, 0, 0)),
    subject("bravo", point(1, 0, 0)),
  ];
  const positive: IAutoMovieGrammarShotObservation = shot("positive", {
    camera: camera(point(0, 1, 5)),
    subjects: axisSubjects,
    primarySubject: null,
    actionAxis: ["alpha", "bravo"],
  });
  const negative: IAutoMovieGrammarShotObservation = shot("negative", {
    camera: camera(point(0, 1, -5)),
    subjects: [...axisSubjects].reverse(),
    primarySubject: null,
    actionAxis: ["bravo", "alpha"],
  });
  TestValidator.predicate(
    "hidden action-axis crossing is diagnosed",
    codes([positive, negative]).includes("grammar-axis-crossed"),
  );
  const neutral: IAutoMovieGrammarShotObservation = shot("neutral", {
    camera: camera(point(0, 5, 0)),
    subjects: axisSubjects,
    primarySubject: null,
    actionAxis: ["alpha", "bravo"],
  });
  TestValidator.predicate(
    "neutral intermediary removes the axis crossing",
    codes([positive, neutral, negative]).includes("grammar-axis-crossed") ===
      false,
  );
  const rotatingAxis: IAutoMovieGrammarShotObservation = shot("rotating-axis", {
    camera: camera(point(5, 1, 5)),
    subjects: [
      subject("alpha", point(-1, 0, 0), point(0, 0, -1)),
      subject("bravo", point(1, 0, 0), point(0, 0, 1)),
    ],
    primarySubject: null,
    actionAxis: ["alpha", "bravo"],
  });
  const afterRotation: IAutoMovieGrammarShotObservation = shot(
    "after-rotation",
    {
      camera: camera(point(5, 1, 5)),
      subjects: [
        subject("alpha", point(0, 0, -1)),
        subject("bravo", point(0, 0, 1)),
      ],
      primarySubject: null,
      actionAxis: ["alpha", "bravo"],
    },
  );
  TestValidator.predicate(
    "outgoing end axis and incoming start axis define the cut boundary",
    codes([rotatingAxis, afterRotation]).includes("grammar-axis-crossed") ===
      false,
  );
  const visibleCrossing: IAutoMovieGrammarShotObservation = shot(
    "visible-crossing",
    {
      camera: {
        start: cameraSample(point(0, 1, 5)),
        end: cameraSample(point(0, 1, -5)),
      },
      subjects: axisSubjects,
      primarySubject: null,
      actionAxis: ["alpha", "bravo"],
    },
  );
  TestValidator.predicate(
    "camera crossing the action axis inside a shot legalizes the next cut",
    codes([visibleCrossing, positive]).includes("grammar-axis-crossed") ===
      false,
  );
  TestValidator.predicate(
    "same action-axis half-plane stays continuous",
    codes([positive, { ...positive, id: "positive-again" }]).includes(
      "grammar-axis-crossed",
    ) === false,
  );
  const incomingCrossing: IAutoMovieGrammarShotObservation = {
    ...visibleCrossing,
    id: "incoming-visible-crossing",
    camera: {
      start: cameraSample(point(0, 1, -5)),
      end: cameraSample(point(0, 1, 5)),
    },
  };
  TestValidator.predicate(
    "incoming on-screen camera crossing legalizes its boundary",
    codes([positive, incomingCrossing]).includes("grammar-axis-crossed") ===
      false,
  );
  TestValidator.predicate(
    "different action axes do not fabricate a crossing",
    codes([
      {
        ...positive,
        id: "axis-alpha-bravo",
        subjects: [...axisSubjects, subject("charlie", point(0, 0, 1))],
      },
      {
        ...negative,
        id: "axis-alpha-charlie",
        subjects: [...axisSubjects, subject("charlie", point(0, 0, 1))],
        actionAxis: ["alpha", "charlie"],
      },
    ]).includes("grammar-axis-crossed") === false,
  );
  TestValidator.equals(
    "subject and action-axis collection spelling normalize deterministically",
    reportedGrammar({ shots: [positive, negative] }),
    reportedGrammar({
      shots: [
        { ...positive, subjects: [...positive.subjects].reverse() },
        {
          ...negative,
          subjects: [...negative.subjects].reverse(),
          actionAxis: ["alpha", "bravo"],
        },
      ],
    }),
  );

  const crossing: IAutoMovieGrammarReading = readFilmGrammar({
    shots: [positive, negative],
  });
  TestValidator.predicate(
    "crossing recovery exposes its supported style intent",
    crossing.reported.some(
      (diagnostic: IAutoMovieGrammarDiagnostic): boolean =>
        diagnostic.code === "grammar-axis-crossed" &&
        diagnostic.recovery.includes("mark axis-cross"),
    ),
  );
  const marked: IAutoMovieGrammarReading = readFilmGrammar({
    shots: [positive, { ...negative, styleIntent: ["axis-cross"] }],
  });
  TestValidator.predicate(
    "following the recovery suppresses only the intended crossing",
    marked.reported.every(
      (diagnostic: IAutoMovieGrammarDiagnostic): boolean =>
        diagnostic.code !== "grammar-axis-crossed",
    ) && marked.unmatched.length === 0,
  );
}
