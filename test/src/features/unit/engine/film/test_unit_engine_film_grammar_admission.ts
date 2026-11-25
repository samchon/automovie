import { classifyGrammarShotSize } from "@automovie/engine";
import type {
  IAutoMovieGrammarDiagnostic,
  IAutoMovieGrammarShotObservation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createFilmGrammarCase } from "../../../internal/createFilmGrammarCase";
import { namedFacts, throwsError } from "../../../internal/predicates";

/**
 * Grammar observations reject malformed geometry before projection.
 *
 * Scenarios:
 * 1. Empty edits and explicit positive thresholds are accepted.
 * 2. Every framing-height class and the smallest/largest positive finite
 *    occupancies are reachable; matching size and behind-camera
 *    subjects avoid fabricated size findings.
 * 3. Duplicate shot/subject ids, invalid thresholds and malformed observation
 *    scalar/vector/reference/style fields receive the field's own refusal.
 *
 */
export function test_unit_engine_film_grammar_admission(): void {
  const {
    point,
    camera,
    subject,
    shot,
    reportedGrammar,
    codes,
  }: ReturnType<typeof createFilmGrammarCase> = createFilmGrammarCase();
  function rejects(
    name: string,
    mutate: (input: IAutoMovieGrammarShotObservation) => void,
  ): void {
    TestValidator.predicate(
      name,
      throwsError((): void => {
        const input: IAutoMovieGrammarShotObservation = structuredClone(
          shot(`invalid-${name}`),
        );
        mutate(input);
        reportedGrammar({ shots: [input] });
      }, expectation(name)),
    );
  }
  TestValidator.equals(
    "empty edit has no pacing or grammar diagnostic",
    reportedGrammar({ shots: [] }),
    [],
  );
  TestValidator.equals(
    "smallest positive occupancy remains wide",
    classifyGrammarShotSize(Number.MIN_VALUE),
    "wide",
  );
  TestValidator.equals(
    "largest finite occupancy remains close",
    classifyGrammarShotSize(Number.MAX_VALUE),
    "close",
  );
  TestValidator.equals(
    "occupancy classification follows framing-height grammar",
    classifyGrammarShotSize(1 / 4),
    "wide",
  );
  TestValidator.equals(
    "all framing-height classes are reachable",
    namedFacts([
      [
        "classifyGrammarShotSizeFull",
        (): boolean => classifyGrammarShotSize(1 / 1.15) === "full",
      ],
      [
        "classifyGrammarShotSizeMedium",
        (): boolean => classifyGrammarShotSize(1 / 0.62) === "medium",
      ],
      [
        "classifyGrammarShotSizeClose",
        (): boolean => classifyGrammarShotSize(1 / 0.28) === "close",
      ],
    ]),
    {
      classifyGrammarShotSizeFull: true,
      classifyGrammarShotSizeMedium: true,
      classifyGrammarShotSizeClose: true,
    },
  );
  TestValidator.predicate(
    "matching measured and declared framing stays silent",
    codes([
      {
        ...shot("matching-size"),
        declaredShotSize: "full",
      },
    ]).includes("grammar-shot-size") === false,
  );
  TestValidator.predicate(
    "subject behind the camera has no fabricated shot-size diagnostic",
    codes([
      {
        ...shot("behind-camera"),
        camera: camera(point(0, 0.9, 0), point(0, 0.9, -1)),
        subjects: [subject("hero", point(0, 0, 5))],
        declaredShotSize: "close",
      },
    ]).includes("grammar-shot-size") === false,
  );
  TestValidator.predicate(
    "zero occupancy is invalid",
    throwsError(
      (): "wide" | "full" | "medium" | "close" => classifyGrammarShotSize(0),
      ["frameOccupancy", "finite and positive"],
    ),
  );
  TestValidator.predicate(
    "duplicate shot ids are invalid",
    throwsError(
      (): IAutoMovieGrammarDiagnostic[] =>
        reportedGrammar({ shots: [shot("duplicate"), shot("duplicate")] }),
      ["shot id", "duplicated"],
    ),
  );
  TestValidator.predicate(
    "non-positive cut angle is invalid",
    throwsError(
      (): IAutoMovieGrammarDiagnostic[] =>
        reportedGrammar({
          shots: [shot("valid")],
          minimumCutAngleDegrees: 0,
        }),
      ["minimumCutAngleDegrees", "finite and positive"],
    ),
  );
  TestValidator.predicate(
    "non-positive re-establish distance is invalid",
    throwsError(
      (): IAutoMovieGrammarDiagnostic[] =>
        reportedGrammar({
          shots: [shot("valid-distance")],
          reestablishDistance: 0,
        }),
      ["reestablishDistance", "finite and positive"],
    ),
  );
  TestValidator.predicate(
    "explicit positive thresholds are accepted",
    reportedGrammar({
      shots: [shot("explicit-thresholds")],
      minimumCutAngleDegrees: 45,
      reestablishDistance: 20,
    }).length === 1,
  );
  rejects("zero duration", (input: IAutoMovieGrammarShotObservation): void => {
    input.duration = 0;
  });
  rejects(
    "zero camera fov",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.camera.start.fovY = 0;
    },
  );
  rejects(
    "camera fov at 180",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.camera.end.fovY = 180;
    },
  );
  rejects(
    "zero camera aspect",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.camera.start.aspect = 0;
    },
  );
  rejects(
    "duplicate subject id",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects.push(structuredClone(input.subjects[0]!));
    },
  );
  rejects(
    "zero subject height",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.height = 0;
    },
  );
  rejects(
    "negative subject radius",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.radius = -1;
    },
  );
  rejects(
    "missing primary subject",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.primarySubject = "missing";
    },
  );
  rejects(
    "repeated action-axis subject",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.actionAxis = ["hero", "hero"];
    },
  );
  rejects(
    "missing first action-axis subject",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.actionAxis = ["missing", "hero"];
    },
  );
  rejects(
    "missing second action-axis subject",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.actionAxis = ["hero", "missing"];
    },
  );
  rejects(
    "duplicate style intent",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.styleIntent = ["jump-cut", "jump-cut"];
    },
  );
}

/** Field and domain fragments independently identifying each malformed contract case. */
function expectation(name: string): readonly string[] {
  const fields: Record<string, readonly string[]> = {
    "non-finite duration": [".duration", "finite and positive"],
    "zero duration": [".duration", "finite and positive"],
    "zero camera fov": ["camera.start.fovY", "finite and positive"],
    "camera fov at 180": ["camera.end.fovY", "below 180"],
    "zero camera aspect": ["camera.start.aspect", "finite and positive"],
    "non-finite camera position": ["camera.end.position.x", "finite"],
    "non-finite camera rotation": ["camera.start.rotation.w", "finite"],
    "missing camera rotation component": ["camera.start.rotation.w", "finite"],
    "missing subject coordinate": ["hero.end.z", "finite"],
    "duplicate subject id": ["subject id", "duplicated"],
    "non-finite subject start": ["hero.start.x", "finite"],
    "non-finite subject end": ["hero.end.z", "finite"],
    "zero subject height": ["hero.height", "finite and positive"],
    "negative subject radius": ["hero.radius", "finite and non-negative"],
    "non-finite subject radius": ["hero.radius", "finite and non-negative"],
    "non-finite eyeline start": ["hero.eyeline.start.x", "finite"],
    "non-finite eyeline end": ["hero.eyeline.end.y", "finite"],
    "missing primary subject": ["Primary subject", "absent"],
    "repeated action-axis subject": ["Action axis", "repeats"],
    "missing first action-axis subject": [
      "Action axis",
      "two observed subjects",
    ],
    "missing second action-axis subject": [
      "Action axis",
      "two observed subjects",
    ],
    "duplicate style intent": ["styleIntent", "unique"],
  };
  const value: readonly string[] | undefined = fields[name];
  if (value === undefined)
    throw new Error(`Unspecified grammar refusal: ${name}`);
  return value;
}
