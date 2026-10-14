import {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
  IAutoMovieFog,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieStagedSet } from "@automovie/engine";
import { stageScene } from "@automovie/engine";
import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const FOG: IAutoMovieFog = {
  density: 0.015,
  color: { r: 0.7, g: 0.74, b: 0.8, a: null, hex: null },
};

/**
 * Stage the standard set with fog replaced by the caller's record.
 *
 * The owning test supplies authored fog records and asserts preserved identity,
 * density boundaries and color admission; omitted fog is staged directly there.
 */
function stagedWith(fog: unknown): IAutoMovieStagedSet {
  return stageScene(
    makeScriptWrite(),
    makeStagingWrite({ fog: fog as IAutoMovieFog }),
  );
}

/**
 * Return whether submitted fog has the requested located refusal.
 *
 * The owning test supplies schema-based kind/path expectations and asserts the
 * returned boolean. hasViolation checks path inclusion rather than the full report.
 */
function refusedAt(
  fog: unknown,
  kind: AutoMovieViolationKind,
  path: string,
): boolean {
  const staged: IAutoMovieStagedSet = stagedWith(fog);
  return staged.success === false && hasViolation(staged, kind, path);
}

/**
 * Stage authored fog through the staging ingress and observe its scene record.
 * This entry does not run the production scene-artifact validator.
 *
 * Fog is a scene property, so `stage`, the rung that composes scenes, has to be
 * able to state one; otherwise the field is declarable in the schema and
 * unreachable from the only authoring path that builds a scene. Two facts carry
 * it and both are checked, because both fail silently rather than loudly: a
 * negative density contradicts the nonnegative authored atmosphere contract,
 * nonfinite density cannot supply meaningful transmittance arithmetic, and
 * color components must satisfy the shared normalized color contract. These
 * scalar assertions do not establish rendered pixels.
 *
 * Scenarios:
 *
 * 1. A declared fog is lowered verbatim onto the composed scene.
 * 2. An omitted fog composes a scene without a `fog` key or `fog: null`;
 *    the assertion observes record shape, without computing serialized
 *    bytes or a production content digest.
 * 3. Each gate fires at the submitted field: a fog that is not an object, a
 *    negative density, a non-finite density, a density that is not a number, a
 *    color that is not an object, and a color component outside `[0, 1]`.
 * 4. Zero and density 5 are both admitted; their rendered appearance is not
 *    observed by these scalar staging cases.
 * 5. Fog applies the canonical color gate: malformed alpha and contradictory
 *    labels fail, while a matching uppercase endpoint label stages.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs stageScene with authored fog and checks preserved atmosphere, omission, density boundaries and canonical color refusals; detects fog bypassing alpha or label checks that material and background ingress require.
 * @evidence contracts/testing.md#independent-expectations Nonnegative finite density and normalized linear channels define the scalar oracle; white has the exact sRGB endpoint FFFFFF while black's matching label is 000000, independent of the product encoder.
 * @evidence contracts/testing.md#distinguishing-cases Covers omitted/present fog, malformed objects, negative/nonfinite/nonnumeric density, malformed and excess color components, zero/large valid density, alpha failure and valid/mismatched labels; fog transmittance arithmetic has its own render test.
 * @evidence contracts/testing.md#execution-ownership The portable synchronous unit entry owns every stage/fog case and imports stageScene source directly; it uses no browser, GPU, process or native artifact.
 */
export function test_film_stage_scene_fog(): void {
  // 1. lowered verbatim.
  const staged: IAutoMovieStagedSet = stagedWith(FOG);
  TestValidator.equals("staging with a fog succeeds", staged.success, true);
  if (staged.success !== true) return;
  TestValidator.predicate(
    "the atmosphere is carried onto the scene",
    staged.scene.fog === FOG,
  );

  // 2. omitted is omitted, down to the key.
  const bare: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  TestValidator.equals(
    "an omitted fog composes no fog key at all",
    namedFacts([
      ["staged", (): boolean => bare.success === true],
      [
        "keyAbsent",
        (): boolean => bare.success === true && !("fog" in bare.scene),
      ],
    ]),
    { staged: true, keyAbsent: true },
  );

  // 3. every gate reports under the submitted field.
  TestValidator.equals(
    "each malformed atmosphere is refused where it was written",
    namedFacts([
      ["notAnObject", (): boolean => refusedAt(null, "type", "$input.fog")],
      [
        "negativeDensity",
        (): boolean =>
          refusedAt({ ...FOG, density: -0.01 }, "range", "$input.fog.density"),
      ],
      [
        "nonFiniteDensity",
        (): boolean =>
          refusedAt(
            { ...FOG, density: Number.POSITIVE_INFINITY },
            "range",
            "$input.fog.density",
          ),
      ],
      [
        "densityNotANumber",
        (): boolean =>
          refusedAt(
            { ...FOG, density: "thick" },
            "range",
            "$input.fog.density",
          ),
      ],
      [
        "colorNotAnObject",
        (): boolean =>
          refusedAt({ ...FOG, color: null }, "type", "$input.fog.color"),
      ],
      [
        "componentOutOfRange",
        (): boolean =>
          refusedAt(
            { ...FOG, color: { ...FOG.color, g: 1.4 } },
            "range",
            "$input.fog.color.g",
          ),
      ],
    ]),
    {
      notAnObject: true,
      negativeDensity: true,
      nonFiniteDensity: true,
      densityNotANumber: true,
      colorNotAnObject: true,
      componentOutOfRange: true,
    },
  );

  // 4. Both selected nonnegative density boundaries are admitted.
  TestValidator.equals(
    "zero and density five both stage clean",
    namedFacts([
      [
        "vacuum",
        (): boolean => stagedWith({ ...FOG, density: 0 }).success === true,
      ],
      [
        "cloud",
        (): boolean => stagedWith({ ...FOG, density: 5 }).success === true,
      ],
    ]),
    { vacuum: true, cloud: true },
  );
  TestValidator.predicate(
    "fog alpha remains a normalized color channel",
    refusedAt(
      { ...FOG, color: { ...FOG.color, a: Number.NaN } },
      "range",
      "$input.fog.color.a",
    ),
  );
  TestValidator.equals(
    "a matching uppercase fog swatch stages",
    stagedWith({ ...FOG, color: { r: 1, g: 1, b: 1, a: null, hex: "#FFFFFF" } })
      .success,
    true,
  );
  const mismatch: IAutoMovieStagedSet = stagedWith({
    ...FOG,
    color: { r: 0, g: 0, b: 0, a: null, hex: "#FFFFFF" },
  });
  TestValidator.predicate(
    "fog cannot label black as white",
    mismatch.success === false &&
      mismatch.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.fog.color.hex" &&
          item.expected.includes("encoded as #000000"),
      ),
  );
}
