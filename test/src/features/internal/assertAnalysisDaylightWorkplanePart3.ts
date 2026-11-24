import type {
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisWorkplane,
  IAutoMovieDaylightRequest,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "./predicates";

/** Execute the next ordered assertions of test_analysis_daylight_workplane.
 *
 * Scenarios:
 * 1. repeated studies keep their digest and the examined shade, instant and sample-count changes alter it.
 * 2. every malformed study is refused at its own message.
 *
 * Repeated daylight studies retain settings/digest, while the examined shade, instant and diffuse-sample changes alter the digest. Malformed request fields must throw their declared message fragments before returning a run.
 * Equality/inequality between specified repeat/change pairs is the deterministic provenance contract; it does not prove injectivity for all inputs or external geometry contents. Nonblank sky models, known instants, nonzero geometry, independent in-plane axes, sample bounds and target uniqueness supply the refusal expectations.
 * Stable replay contrasts with three specified settings changes. Blank models, unknown instant, zero extent/axis, fractional/excess counts, parallel axes, duplicate lights/targets and malformed shade planes are refused. Earlier parts own illuminance arithmetic, not this metadata/refusal part.
 */
export function assertAnalysisDaylightWorkplanePart3(
  upward: IAutoMovieAnalysisWorkplane,
  study: (
    overrides?: Partial<IAutoMovieDaylightRequest>,
  ) => IAutoMovieAnalysisRun,
  noon: IAutoMovieAnalysisRun,
  afternoon: IAutoMovieAnalysisRun,
  shaded: IAutoMovieAnalysisRun,
): void {
  TestValidator.equals(
    "identical studies digest identically and any change digests differently",
    {
      stable: study().digest === noon.digest,
      shaded: shaded.digest !== noon.digest,
      instant: afternoon.digest !== noon.digest,
      samples: study({ diffuseSamples: 128 }).digest !== noon.digest,
      settingsStable: study().settings === noon.settings,
    },
    {
      stable: true,
      shaded: true,
      instant: true,
      samples: true,
      settingsStable: true,
    },
  );

  TestValidator.equals(
    "every malformed study is refused at its own message",
    namedFacts([
      [
        "blank sky model",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => study({ sky: "" }),
            "non-blank sky model",
          ),
      ],
      [
        "unknown instant",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => study({ instant: "dawn" }),
            "which the environment context does not declare",
          ),
      ],
      [
        "non-positive extent",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({ workplane: { ...upward, sizeU: 0 } }),
            "workplane sizeU must be a finite number above zero",
          ),
      ],
      [
        "fractional cell count",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({ workplane: { ...upward, countV: 1.5 } }),
            "workplane countV must be a whole number",
          ),
      ],
      [
        "a grid past the sample bound",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({ workplane: { ...upward, countU: 65, countV: 64 } }),
            "exceeds the 4096-sample bound",
          ),
      ],
      [
        "zero axis",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                workplane: { ...upward, axisU: { x: 0, y: 0, z: 0 } },
              }),
            "workplane axisU must be a finite non-zero in-plane direction",
          ),
      ],
      [
        "parallel axes",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                workplane: { ...upward, axisV: { x: 2, y: 0, z: 0 } },
              }),
            "two non-parallel in-plane axes",
          ),
      ],
      [
        "zero sky samples",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => study({ diffuseSamples: 0 }),
            "positive whole sky sample count",
          ),
      ],
      [
        "duplicated luminaire",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                luminaires: [
                  { id: "a", position: { x: 0, y: 1, z: 0 }, intensity: 1 },
                  { id: "a", position: { x: 0, y: 2, z: 0 }, intensity: 1 },
                ],
              }),
            'luminaire id "a" is declared twice',
          ),
      ],
      [
        "negative intensity",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                luminaires: [
                  { id: "a", position: { x: 0, y: 1, z: 0 }, intensity: -1 },
                ],
              }),
            "intensity must be a finite number at or above zero",
          ),
      ],
      [
        "malformed shade",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                shades: [
                  {
                    id: "flat",
                    planes: [{ normal: { x: 0, y: 1, z: 0 }, offset: 1 }],
                  },
                ],
              }),
            "at least 4 half-spaces",
          ),
      ],
      [
        "duplicated target",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                targets: [
                  {
                    key: "workplane.total.illuminance",
                    unit: "lx",
                    value: 1,
                    comparison: "at-least",
                  },
                  {
                    key: "workplane.total.illuminance",
                    unit: "lx",
                    value: 2,
                    comparison: "at-least",
                  },
                ],
              }),
            "declared more than once",
          ),
      ],
    ]),
    {
      "blank sky model": true,
      "unknown instant": true,
      "non-positive extent": true,
      "fractional cell count": true,
      "a grid past the sample bound": true,
      "zero axis": true,
      "parallel axes": true,
      "zero sky samples": true,
      "duplicated luminaire": true,
      "negative intensity": true,
      "malformed shade": true,
      "duplicated target": true,
    },
  );
}
