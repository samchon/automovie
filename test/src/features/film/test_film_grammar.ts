import type { IAutoMovieGrammarShotObservation } from "../../../../packages/engine/src/film/IAutoMovieGrammarShotObservation";
import type { IAutoMovieGrammarDiagnostic } from "../../../../packages/engine/src/film/IAutoMovieGrammarDiagnostic";
import type { IAutoMovieReviewNote } from "@automovie/interface";
import { grammarDiagnosticsToReviewNotes } from "../../../../packages/engine/src/film/grammarDiagnosticsToReviewNotes";
import { TestValidator } from "@nestia/e2e";
import { createFilmGrammarCase } from "../internal/createFilmGrammarCase";
import { namedFacts } from "../internal/predicates";

/**
 * Camera geometry and authored style intent jointly determine film findings.
 *
 * Scenarios:
 * 1. Screen reversals and shallow same-size cuts report independently; jump-cut
 *    intent suppresses only its mapped warning, and moving-camera reads agree.
 * 2. Reverse, continuing, vertical and off-lens eyelines distinguish broken
 *    screen relations from neutral or continuous views.
 * 3. Measured size, displacement and entering subjects require their own
 *    framing/re-establishing feedback without duplicate findings.
 * 4. Pacing intent and review-note conversion preserve the analyzer's guidance.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs readFilmGrammar through shared source readers and grammarDiagnosticsToReviewNotes directly; assertions catch missed screen/eyeline/size/re-establishing findings, overbroad style suppression and lost diagnostic identity or recovery text.
 * @evidence contracts/testing.md#independent-expectations Hand-authored subject paths and camera half-planes define the expected screen relations and crossing decisions; stated framing/threshold contracts define findings. Fixture camera rotations use the product lookRotation helper, so its own arithmetic is separately covered rather than treated as an independent renderer oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers positive and negative screen motion, moving cameras, reverse/continuing/vertical/off-lens gaze, matching/mismatching sizes, displaced/new subjects and selective style suppression; axis continuity and malformed observations have separate discoverable tests.
 * @evidence contracts/testing.md#execution-ownership This portable synchronous unit entry owns its cases and calls source grammar functions through createFilmGrammarCase readers; the factory registers no hidden scenarios and starts no renderer or process.
 */
export function test_film_grammar(): void {
  const { point, cameraSample, camera, subject, shot, reportedGrammar, codes }: ReturnType<typeof createFilmGrammarCase> = createFilmGrammarCase();
  const movingRight: IAutoMovieGrammarShotObservation = shot("moving-right", {
    subjects: [subject("hero", point(-0.5, 0, 0), point(0.5, 0, 0))],
  });
  const movingLeft: IAutoMovieGrammarShotObservation = shot("moving-left", {
    camera: camera(point(0.2, 0.9, 3)),
    subjects: [subject("hero", point(0.5, 0, 0), point(-0.5, 0, 0))],
  });
  const unsuppressed: string[] = codes([movingRight, movingLeft]);
  TestValidator.equals(
    "same-size shallow cut and screen reversal both report",
    namedFacts([
      ["jumpCutReported", () : boolean => unsuppressed.includes("grammar-jump-cut")],
      [
        "screenDirectionReported",
        () : boolean => unsuppressed.includes("grammar-screen-direction"),
      ],
    ]),
    { jumpCutReported: true, screenDirectionReported: true },
  );
  const suppressed: string[] = codes([
    movingRight,
    { ...movingLeft, styleIntent: ["jump-cut"] },
  ]);
  TestValidator.equals(
    "jump-cut style intent suppresses only its exact warning",
    namedFacts([
      [
        "jumpCutSuppressed",
        () : boolean => suppressed.includes("grammar-jump-cut") === false,
      ],
      [
        "screenDirectionKept",
        () : boolean => suppressed.includes("grammar-screen-direction"),
      ],
    ]),
    { jumpCutSuppressed: true, screenDirectionKept: true },
  );
  const followedRight: IAutoMovieGrammarShotObservation = shot("followed-right", {
    camera: {
      start: cameraSample(point(0, 0.9, 3)),
      end: cameraSample(point(1, 0.9, 3), point(1, 0.9, 0)),
    },
    subjects: [subject("hero", point(0, 0, 0), point(1, 0, 0))],
  });
  TestValidator.predicate(
    "following camera keeps matching world motion screen-neutral",
    codes([movingRight, followedRight]).includes("grammar-screen-direction") ===
      false,
  );
  const truckLeft: IAutoMovieGrammarShotObservation = shot("truck-left", {
    camera: {
      start: cameraSample(point(-1, 0.9, 3), point(-1, 0.9, 0)),
      end: cameraSample(point(1, 0.9, 3), point(1, 0.9, 0)),
    },
    subjects: [subject("hero", point(0, 0, 0))],
  });
  TestValidator.predicate(
    "moving camera contributes to screen-direction measurement",
    codes([movingRight, truckLeft]).includes("grammar-screen-direction"),
  );
  const elevated: IAutoMovieGrammarShotObservation = shot("elevated", {
    camera: camera(point(0, 7.971, 7.071)),
  });
  const levelWide: IAutoMovieGrammarShotObservation = shot("level-wide", {
    camera: camera(point(0, 0.9, 10)),
  });
  TestValidator.predicate(
    "three-dimensional camera angle accepts an elevation change above 30 degrees",
    codes([levelWide, elevated]).includes("grammar-jump-cut") === false,
  );
  const relocatedSameBearing: IAutoMovieGrammarShotObservation = shot("relocated-same-bearing", {
    camera: camera(point(20, 0.9, 3), point(20, 0.9, 0)),
    subjects: [subject("hero", point(20, 0, 0))],
  });
  TestValidator.predicate(
    "cut angle uses each camera's respective subject boundary position",
    codes([shot("before-relocation"), relocatedSameBearing]).includes(
      "grammar-jump-cut",
    ),
  );

  const looking: IAutoMovieGrammarShotObservation = shot("looking", {
    camera: camera(point(0, 0.9, 5)),
    subjects: [
      subject("hero", point(0, 0, 0), point(0, 0, 0), {
        target: "target",
        point: point(1, 0, 0),
      }),
    ],
  });
  const reverseEyeline: IAutoMovieGrammarShotObservation = shot("reverse-eyeline", {
    camera: camera(point(0, 0.9, -5)),
    subjects: [
      subject("hero", point(0, 0, 0)),
      subject("target", point(1, 0, 0), point(1, 0, 0), {
        target: "hero",
        point: point(0, 0, 0),
      }),
    ],
    primarySubject: "target",
  });
  TestValidator.predicate(
    "primary switch with a non-opposite reverse relation diagnoses eyeline",
    codes([looking, reverseEyeline]).includes("grammar-eyeline"),
  );
  TestValidator.predicate(
    "eyeline-break suppresses only the eyeline warning",
    codes([
      looking,
      { ...reverseEyeline, styleIntent: ["eyeline-break"] },
    ]).includes("grammar-eyeline") === false,
  );
  const verticalLook: IAutoMovieGrammarShotObservation = shot("vertical-look", {
    subjects: [
      subject("hero", point(0, 0, 0), point(0, 0, 0), {
        target: "target",
        point: point(0, 1, 0),
      }),
    ],
  });
  const brokenVerticalLook: IAutoMovieGrammarShotObservation = shot("broken-vertical-look", {
    subjects: [
      subject("hero", point(0, 0, 0), point(0, 0, 0), {
        target: "target",
        point: point(1, -1, 0),
      }),
    ],
  });
  TestValidator.predicate(
    "continuing eyeline compares horizontal and vertical screen components",
    reportedGrammar({
      shots: [verticalLook, brokenVerticalLook],
    }).some(
      (diagnostic: IAutoMovieGrammarDiagnostic) : boolean =>
        diagnostic.code === "grammar-eyeline" &&
        diagnostic.fact.includes("screen-center/above") &&
        diagnostic.fact.includes("screen-right/below"),
    ),
  );
  TestValidator.predicate(
    "unrelated gaze targets are not compared as one eyeline",
    codes([
      verticalLook,
      {
        ...brokenVerticalLook,
        id: "unrelated-look",
        subjects: [
          subject("hero", point(0, 0, 0), point(0, 0, 0), {
            target: "other",
            point: point(1, -1, 0),
          }),
        ],
      },
    ]).includes("grammar-eyeline") === false,
  );
  TestValidator.predicate(
    "gaze point behind the lens does not fabricate an eyeline side",
    codes([
      verticalLook,
      {
        ...brokenVerticalLook,
        id: "behind-look",
        subjects: [
          subject("hero", point(0, 0, 0), point(0, 0, 0), {
            target: "target",
            point: point(0, 0, 10),
          }),
        ],
      },
    ]).includes("grammar-eyeline") === false,
  );
  TestValidator.predicate(
    "primary switch with the opposite reverse relation preserves eyeline",
    codes([
      looking,
      {
        ...reverseEyeline,
        id: "matched-eyeline",
        camera: camera(point(0, 0.9, 5)),
      },
    ]).includes("grammar-eyeline") === false,
  );

  const wrongSize: IAutoMovieGrammarShotObservation = shot("wrong-size", {
    camera: camera(point(0, 0.9, 5)),
    declaredShotSize: "close",
  });
  TestValidator.predicate(
    "measured subject scale diagnoses declared shot size",
    codes([wrongSize]).includes("grammar-shot-size"),
  );
  const displaced: IAutoMovieGrammarShotObservation = shot("displaced", {
    camera: camera(point(20, 0.9, 3), point(20, 0.9, 0)),
    subjects: [subject("hero", point(20, 0, 0))],
  });
  TestValidator.predicate(
    "large displacement in a tight cut requires re-establishment",
    codes([shot("origin"), displaced]).includes("grammar-reestablish"),
  );
  TestValidator.predicate(
    "tight-reestablish suppresses only its matching warning",
    codes([
      shot("origin-style"),
      {
        ...displaced,
        id: "displaced-style",
        styleIntent: ["tight-reestablish"],
      },
    ]).includes("grammar-reestablish") === false,
  );
  const entrant: IAutoMovieGrammarShotObservation = shot("entrant", {
    subjects: [
      subject("hero", point(0, 0, 0)),
      subject("newcomer", point(1, 0, 0)),
    ],
  });
  TestValidator.predicate(
    "new subject entering a tight shot requires re-establishment",
    codes([shot("before-entrant"), entrant]).includes("grammar-reestablish"),
  );
  TestValidator.equals(
    "a displacement plus entrant produces one re-establish diagnostic",
    reportedGrammar({
      shots: [
        shot("before-both"),
        {
          ...displaced,
          id: "displaced-with-entrant",
          subjects: [
            ...displaced.subjects,
            subject("newcomer", point(21, 0, 0)),
          ],
        },
      ],
    }).filter((diagnostic: IAutoMovieGrammarDiagnostic) : boolean => diagnostic.code === "grammar-reestablish").length,
    1,
  );
  TestValidator.predicate(
    "rhythmic-pacing on any participating shot suppresses sequence pacing",
    codes([
      { ...shot("rhythmic"), styleIntent: ["rhythmic-pacing"] },
      shot("rhythmic-tail"),
    ]).includes("grammar-pacing") === false,
  );

  const diagnostics: IAutoMovieGrammarDiagnostic[] = reportedGrammar({
    shots: [wrongSize, { ...displaced, duration: 3 }],
  });
  TestValidator.equals(
    "every diagnostic carries fact impact and recovery",
    namedFacts([
      [
        "pacingReported",
        () : boolean =>
          diagnostics.some(
            (diagnostic: IAutoMovieGrammarDiagnostic) : boolean => diagnostic.code === "grammar-pacing",
          ),
      ],
      [
        "allCarryGuidance",
        () : boolean =>
          diagnostics.every(
            (diagnostic: IAutoMovieGrammarDiagnostic) : boolean =>
              diagnostic.fact.length !== 0 &&
              diagnostic.impact.length !== 0 &&
              diagnostic.recovery.length !== 0,
          ),
      ],
    ]),
    { pacingReported: true, allCarryGuidance: true },
  );
  const notes: IAutoMovieReviewNote[] = grammarDiagnosticsToReviewNotes({
    beat: "beat-grammar",
    diagnostics,
  });
  TestValidator.predicate(
    "review socket preserves diagnostic identity and recovery",
    notes.every(
      (note: IAutoMovieReviewNote, index: number) : boolean =>
        note.tier === "visual" &&
        note.beat === "beat-grammar" &&
        note.issue.startsWith(`${diagnostics[index]!.code}: `) &&
        note.suggestion === diagnostics[index]!.recovery,
    ),
  );

}
