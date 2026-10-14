import {
  type IAutoMovieGrammarDiagnostic,
  type IAutoMovieGrammarShotObservation,
  classifyGrammarShotSize,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createFilmGrammarCase } from "../internal/createFilmGrammarCase";
import { namedFacts, throwsError } from "../internal/predicates";

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
 * @evidence contracts/testing.md#behavioral-verification Calls source grammar admission and shot-size classification with malformed observations and boundary values; assertions catch accepted missing/nonfinite components, invalid references or ambiguous identities before screen projection.
 * @evidence contracts/testing.md#independent-expectations Positive finite duration/lens/height domains, open field-of-view limits, named component shapes and unique observed identities are the declared input contract; each malformed case requires a field-specific error. The smallest positive occupancy is beyond the widest framing and the largest finite occupancy beyond the closest, independently of reciprocal arithmetic.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty input, all four framing classes, positive finite occupancy extremes versus rejected zero, matching and behind-lens subjects, zero/nonfinite/missing scalar components, duplicate ids, missing primary/axis subjects and duplicate style intent; projection and actual cut findings belong to the other grammar entries.
 * @evidence contracts/testing.md#execution-ownership This portable synchronous unit entry owns its rejection helper and every mutation case; shared fixture readers call engine source without hosts or dynamically registered scenarios.
 */
export function test_film_grammar_admission(): void {
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
  rejects("blank shot id", (input: IAutoMovieGrammarShotObservation): void => {
    input.id = " ";
  });
  rejects(
    "non-finite duration",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.duration = Number.NaN;
    },
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
    "non-finite camera position",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.camera.end.position.x = Number.NaN;
    },
  );
  rejects(
    "non-finite camera rotation",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.camera.start.rotation.w = Number.NaN;
    },
  );
  // A component the producer left out is refused like a non-finite one,
  // instead of passing because no key names it.
  rejects(
    "missing camera rotation component",
    (input: IAutoMovieGrammarShotObservation): void => {
      delete (input.camera.start.rotation as Partial<IAutoMovieQuaternion>).w;
    },
  );
  rejects(
    "missing subject coordinate",
    (input: IAutoMovieGrammarShotObservation): void => {
      delete (input.subjects[0]!.end as Partial<IAutoMovieVector3>).z;
    },
  );
  rejects(
    "blank subject id",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.id = "";
    },
  );
  rejects(
    "duplicate subject id",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects.push(structuredClone(input.subjects[0]!));
    },
  );
  rejects(
    "non-finite subject start",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.start.x = Number.NaN;
    },
  );
  rejects(
    "non-finite subject end",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.end.z = Number.NaN;
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
    "non-finite subject radius",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.radius = Number.NaN;
    },
  );
  rejects(
    "blank eyeline target",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.eyeline = {
        target: "",
        start: point(1, 0, 0),
        end: point(1, 0, 0),
      };
    },
  );
  rejects(
    "non-finite eyeline start",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.eyeline = {
        target: "target",
        start: point(Number.NaN, 0, 0),
        end: point(1, 0, 0),
      };
    },
  );
  rejects(
    "non-finite eyeline end",
    (input: IAutoMovieGrammarShotObservation): void => {
      input.subjects[0]!.eyeline = {
        target: "target",
        start: point(1, 0, 0),
        end: point(1, Number.NaN, 0),
      };
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
    "blank shot id": ["shot.id", "non-blank"],
    "non-finite duration": [".duration", "finite and positive"],
    "zero duration": [".duration", "finite and positive"],
    "zero camera fov": ["camera.start.fovY", "finite and positive"],
    "camera fov at 180": ["camera.end.fovY", "below 180"],
    "zero camera aspect": ["camera.start.aspect", "finite and positive"],
    "non-finite camera position": ["camera.end.position.x", "finite"],
    "non-finite camera rotation": ["camera.start.rotation.w", "finite"],
    "missing camera rotation component": ["camera.start.rotation.w", "finite"],
    "missing subject coordinate": ["hero.end.z", "finite"],
    "blank subject id": ["subjects.id", "non-blank"],
    "duplicate subject id": ["subject id", "duplicated"],
    "non-finite subject start": ["hero.start.x", "finite"],
    "non-finite subject end": ["hero.end.z", "finite"],
    "zero subject height": ["hero.height", "finite and positive"],
    "negative subject radius": ["hero.radius", "finite and non-negative"],
    "non-finite subject radius": ["hero.radius", "finite and non-negative"],
    "blank eyeline target": ["hero.eyeline.target", "non-blank"],
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
