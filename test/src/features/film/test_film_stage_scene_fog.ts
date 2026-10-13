import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { AutoMovieViolationKind, IAutoMovieConstraintViolation, IAutoMovieFog } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const FOG: IAutoMovieFog = {
  density: 0.015,
  color: { r: 0.7, g: 0.74, b: 0.8, a: null, hex: null },
};

/** Stage the standard set with `fog` replaced by whatever a case submits. */
function stagedWith (fog: unknown): IAutoMovieStagedSet { return stageScene(
    makeScriptWrite(),
    makeStagingWrite({ fog: fog as IAutoMovieFog }),
  ); }

/** True when submitting `fog` is refused with a violation at `path`. */
function refusedAt (
  fog: unknown,
  kind: AutoMovieViolationKind,
  path: string,
): boolean {
  const staged: IAutoMovieStagedSet = stagedWith(fog);
  return staged.success === false && hasViolation(staged, kind, path);
}

/**
 * Staging may author the set's atmosphere, and the gate that accepts it is the
 * one the scene artifact applies downstream.
 *
 * Fog is a scene property, so `stage`, the rung that composes scenes, has to be
 * able to state one; otherwise the field is declarable in the schema and
 * unreachable from the only authoring path that builds a scene. Two facts carry
 * it and both are checked, because both fail silently rather than loudly: a
 * negative or non-finite `density` feeds `exp(-(density*d)^2)` a number the
 * shader paints as a dead frame, and an out-of-range color puts a horizon on
 * screen that no light in the scene could make.
 *
 * Scenarios:
 *
 * 1. A declared fog is lowered verbatim onto the composed scene.
 * 2. An omitted fog composes a scene with NO `fog` key, not `fog: null`: an
 *    atmosphere is something most sets do not have, and writing null onto every
 *    staged scene ever composed would change the bytes, and the content digest,
 *    of every production that never mentioned it.
 * 3. Each gate fires at the submitted field: a fog that is not an object, a
 *    negative density, a non-finite density, a density that is not a number, a
 *    color that is not an object, and a color component outside `[0, 1]`.
 * 4. The negative twin: a zero density is a vacuum and an enormous one is a wall
 *    of cloud. Both are looks, and neither is refused.
 * 5. Fog applies the canonical color gate: malformed alpha and contradictory
 *    labels fail, while a matching uppercase endpoint label stages.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs stageScene with authored fog and checks preserved atmosphere, omission, density boundaries and canonical color refusals; detects fog bypassing alpha or label checks that material and background ingress require.
 * @evidence contracts/testing.md#independent-expectations Nonnegative finite density and normalized linear channels define the scalar oracle; white has the exact sRGB endpoint FFFFFF while black's matching label is 000000, independent of the product encoder.
 * @evidence contracts/testing.md#distinguishing-cases Covers omitted/present fog, malformed objects, negative/nonfinite/nonnumeric density, malformed and excess color components, zero/large valid density, alpha failure and valid/mismatched labels; fog transmittance arithmetic has its own render test.
 * @evidence contracts/testing.md#execution-ownership The portable synchronous unit entry owns every stage/fog case and imports stageScene source directly; it uses no browser, GPU, process or native artifact.
 */
export function test_film_stage_scene_fog (): void {
  // 1. lowered verbatim.
  const staged: IAutoMovieStagedSet = stagedWith(FOG);
  TestValidator.equals("staging with a fog succeeds", staged.success, true);
  if (staged.success !== true) return;
  TestValidator.predicate(
    "the atmosphere is carried onto the scene",
    staged.scene.fog === FOG,
  );

  // 2. omitted is omitted, down to the key.
  const bare: IAutoMovieStagedSet = stageScene(makeScriptWrite(), makeStagingWrite());
  TestValidator.equals(
    "an omitted fog composes no fog key at all",
    namedFacts([
      ["staged", () : boolean => bare.success === true],
      ["keyAbsent", () : boolean => bare.success === true && !("fog" in bare.scene)],
    ]),
    { staged: true, keyAbsent: true },
  );

  // 3. every gate reports under the submitted field.
  TestValidator.equals(
    "each malformed atmosphere is refused where it was written",
    namedFacts([
      ["notAnObject", () : boolean => refusedAt(null, "type", "$input.fog")],
      [
        "negativeDensity",
        () : boolean =>
          refusedAt({ ...FOG, density: -0.01 }, "range", "$input.fog.density"),
      ],
      [
        "nonFiniteDensity",
        () : boolean =>
          refusedAt(
            { ...FOG, density: Number.POSITIVE_INFINITY },
            "range",
            "$input.fog.density",
          ),
      ],
      [
        "densityNotANumber",
        () : boolean =>
          refusedAt(
            { ...FOG, density: "thick" },
            "range",
            "$input.fog.density",
          ),
      ],
      [
        "colorNotAnObject",
        () : boolean => refusedAt({ ...FOG, color: null }, "type", "$input.fog.color"),
      ],
      [
        "componentOutOfRange",
        () : boolean =>
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

  // 4. the negative twin: extremes that are looks, not mistakes.
  TestValidator.equals(
    "a vacuum and a wall of cloud both stage clean",
    namedFacts([
      ["vacuum", () : boolean => stagedWith({ ...FOG, density: 0 }).success === true],
      ["cloud", () : boolean => stagedWith({ ...FOG, density: 5 }).success === true],
    ]),
    { vacuum: true, cloud: true },
  );
  TestValidator.predicate("fog alpha remains a normalized color channel", refusedAt({ ...FOG, color: { ...FOG.color, a: Number.NaN } }, "range", "$input.fog.color.a"));
  TestValidator.equals("a matching uppercase fog swatch stages", stagedWith({ ...FOG, color: { r: 1, g: 1, b: 1, a: null, hex: "#FFFFFF" } }).success, true);
  const mismatch: IAutoMovieStagedSet = stagedWith({ ...FOG, color: { r: 0, g: 0, b: 0, a: null, hex: "#FFFFFF" } });
  TestValidator.predicate("fog cannot label black as white", mismatch.success === false && mismatch.violations.some((item: IAutoMovieConstraintViolation): boolean => item.path === "$input.fog.color.hex" && item.expected.includes("encoded as #000000")));
}
