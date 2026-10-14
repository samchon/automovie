import { validateAutoMovieMaterialAssembly } from "@automovie/engine";
import type {
  IAutoMovieMaterialLayer,
  IAutoMovieMaterialAssembly,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assembly, layer, substance } from "../internal/materialFixtures";
import { assertMaterialAssemblyFinishDefects } from "../internal/assertMaterialAssemblyFinishDefects";
import {
  hasViolation,
  namedFacts,
  violationCount,
} from "../internal/predicates";

const judge: (one: IAutoMovieMaterialAssembly, host?: { thickness: number; }) => IAutoMovieValidation = (
  one: IAutoMovieMaterialAssembly,
  host?: { thickness: number },
): IAutoMovieValidation =>
  validateAutoMovieMaterialAssembly({ assembly: one, host });

const twoLayer: (overrides?: Partial<IAutoMovieMaterialAssembly>) => IAutoMovieMaterialAssembly = (
  overrides: Partial<IAutoMovieMaterialAssembly> = {},
): IAutoMovieMaterialAssembly =>
  assembly([layer("core", 0.1), layer("skin", 0.01, { finish: true })], {
    faces: { first: "concealed", last: "exposed" },
    ...overrides,
  });

/**
 * Validate layer, finish and host-dimension contradictions beside admitted neighbors.
 *
 * Layer fields, stack-end finishes and host dimensions have distinct corrective actions, so cases observe located violations as well as admission. The finish helper retains the multi-layer and single-layer assertions under this discoverable entry.
 *
 * Scenarios:
 *
 * 1. A clean two-layer stack with one exposed face produces no violation and
 *    anchors the defective neighboring declarations.
 * 2. Envelope fields are refused one at a time: blank id, unknown axis, unknown
 *    sense, non-finite offset, unknown face exposure, and an empty stack, whose
 *    single violation proves the finish rules stay silent with nothing to say.
 * 3. Layer identity is refused: a blank id, a duplicate id, and a blank role.
 * 4. Layer substance conflicts are refused: an unknown substance word, a negative
 *    thickness, a non-finite thickness, a zero-thickness solid, a
 *    zero-thickness cavity, a cavity carrying a substance, a cavity flagged as
 *    a finish, and a solid with no substance. A zero-thickness membrane stays
 *    clean, which is what the "only a membrane may measure nothing" rule
 *    means.
 * 5. An unresolved substance id fires only when a table is supplied; the same
 *    stack without a table and with a complete table both stay clean.
 * 6. Finish defects are told apart: a finish laid over the finish beside it, a
 *    finish buried between layers, an exposed face nothing finishes, and a
 *    finish spent on a concealed face. A stack finished at both exposed ends is
 *    clean.
 * 7. A one-layer stack presents both faces with the same layer, so its finish
 *    answers for whichever of them is exposed instead of being demanded twice
 *    or refused as waste.
 * 8. A wrapping layer behind a layer that stops at the jamb is refused; a run
 *    anchored at either face, at both, and at neither is not.
 * 9. A host thickness that is not a positive finite number is refused before the
 *    sum is compared with it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual assembly validator and observes success, violation kind/path, selected diagnostic causes and isolated finding counts. It detects lost identity, substance, finish, wrap and host-dimension rules while retaining admitted neighbors.
 * @evidence contracts/testing.md#independent-expectations Authored layer order, exposed/concealed faces and finish/wrap flags independently determine the expected corrective location; a membrane alone permits zero thickness, cavity layers carry no material, and supplied substance tables determine reference membership. Hand-authored 0.1 + 0.01 metre layers determine the matching 0.11 metre host rather than validator output.
 * @evidence contracts/testing.md#distinguishing-cases Preserves malformed assembly/layer fields, missing and complete substance tables, doubled/buried/missing/wasted finishes, one-layer face sharing, face-anchored wrap runs, zero/nonfinite/matching hosts and the empty-stack isolation check. The dimension test owns mirrored coordinates, prefix sums and nonmatching positive host thickness; this entry does not enumerate every unknown runtime object shape.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_material_assembly_defects entry owns all cases, including finish assertions delegated to assertMaterialAssemblyFinishDefects with the same real-validator callback. Shared input builders and predicates register no cases and require no native build, process, browser or GPU.
 */
export function test_architecture_material_assembly_defects(): void {
  TestValidator.equals(
    "the baseline stack carries no violation",
    judge(twoLayer()),
    {
      success: true,
    },
  );

  TestValidator.equals(
    "each envelope field is refused on its own path",
    namedFacts([
      [
        "id",
        () : boolean => hasViolation(judge(twoLayer({ id: "  " })), "type", "$input.id"),
      ],
      [
        "axis",
        () : boolean =>
          hasViolation(
            judge(
              twoLayer({ axis: "w" as IAutoMovieMaterialAssembly["axis"] }),
            ),
            "type",
            "$input.axis",
          ),
      ],
      [
        "sense",
        () : boolean =>
          hasViolation(
            judge(
              twoLayer({
                sense: "inward" as IAutoMovieMaterialAssembly["sense"],
              }),
            ),
            "type",
            "$input.sense",
          ),
      ],
      [
        "offset",
        () : boolean =>
          hasViolation(
            judge(twoLayer({ offset: Number.NaN })),
            "range",
            "$input.offset",
          ),
      ],
      [
        "faceFirst",
        () : boolean =>
          hasViolation(
            judge(
              twoLayer({
                faces: {
                  first:
                    "hidden" as IAutoMovieMaterialAssembly["faces"]["first"],
                  last: "exposed",
                },
              }),
            ),
            "type",
            "$input.faces.first",
          ),
      ],
      [
        "faceLast",
        () : boolean =>
          hasViolation(
            judge(
              twoLayer({
                faces: {
                  first: "concealed",
                  last: "shown" as IAutoMovieMaterialAssembly["faces"]["last"],
                },
              }),
            ),
            "type",
            "$input.faces.last",
          ),
      ],
      [
        "empty",
        () : boolean => hasViolation(judge(assembly([])), "range", "$input.layers"),
      ],
      ["emptyIsAlone", () : boolean => violationCount(judge(assembly([]))) === 1],
    ]),
    {
      id: true,
      axis: true,
      sense: true,
      offset: true,
      faceFirst: true,
      faceLast: true,
      empty: true,
      emptyIsAlone: true,
    },
  );

  TestValidator.equals(
    "layer identity is refused on its own path",
    namedFacts([
      [
        "blankId",
        () : boolean =>
          hasViolation(
            judge(
              assembly(
                [layer(" ", 0.1), layer("skin", 0.01, { finish: true })],
                { faces: { first: "concealed", last: "exposed" } },
              ),
            ),
            "type",
            "$input.layers[0].id",
          ),
      ],
      [
        "duplicateId",
        () : boolean =>
          hasViolation(
            judge(
              assembly(
                [
                  layer("core", 0.1),
                  layer("core", 0.01, { finish: true, role: "skin" }),
                ],
                { faces: { first: "concealed", last: "exposed" } },
              ),
            ),
            "type",
            "$input.layers[1].id",
          ),
      ],
      [
        "blankRole",
        () : boolean =>
          hasViolation(
            judge(
              assembly(
                [
                  layer("core", 0.1, { role: "" }),
                  layer("skin", 0.01, { finish: true }),
                ],
                { faces: { first: "concealed", last: "exposed" } },
              ),
            ),
            "type",
            "$input.layers[0].role",
          ),
      ],
    ]),
    { blankId: true, duplicateId: true, blankRole: true },
  );

  const withCore: (core: Partial<IAutoMovieMaterialAssembly["layers"][number]>, thickness?: number) => IAutoMovieMaterialAssembly = (
    core: Partial<IAutoMovieMaterialAssembly["layers"][number]>,
    thickness: number = 0.1,
  ): IAutoMovieMaterialAssembly =>
    assembly(
      [layer("core", thickness, core), layer("skin", 0.01, { finish: true })],
      { faces: { first: "concealed", last: "exposed" } },
    );
  TestValidator.equals(
    "layer substance conflicts are refused, and a zero-thickness membrane is not",
    namedFacts([
      [
        "unknownSubstance",
        () : boolean =>
          hasViolation(
            judge(
              withCore({
                substance:
                  "foam" as IAutoMovieMaterialAssembly["layers"][number]["substance"],
              }),
            ),
            "type",
            "$input.layers[0].substance",
          ),
      ],
      [
        "negativeThickness",
        () : boolean =>
          hasViolation(
            judge(withCore({}, -0.1)),
            "range",
            "$input.layers[0].thickness",
          ),
      ],
      [
        "nonFiniteThickness",
        () : boolean =>
          hasViolation(
            judge(withCore({}, Number.POSITIVE_INFINITY)),
            "range",
            "$input.layers[0].thickness",
          ),
      ],
      [
        "zeroSolid",
        () : boolean =>
          hasViolation(
            judge(withCore({}, 0)),
            "range",
            "$input.layers[0].thickness",
          ),
      ],
      [
        "zeroCavity",
        () : boolean =>
          hasViolation(
            judge(withCore({ substance: "cavity", material: null }, 0)),
            "range",
            "$input.layers[0].thickness",
          ),
      ],
      [
        "cavityWithSubstance",
        () : boolean =>
          hasViolation(
            judge(withCore({ substance: "cavity" })),
            "type",
            "$input.layers[0].material",
          ),
      ],
      [
        "cavityAsFinish",
        () : boolean =>
          hasViolation(
            judge(
              withCore({ substance: "cavity", material: null, finish: true }),
            ),
            "type",
            "$input.layers[0].finish",
          ),
      ],
      [
        "solidWithoutSubstance",
        () : boolean =>
          hasViolation(
            judge(withCore({ material: null })),
            "type",
            "$input.layers[0].material",
          ),
      ],
      [
        "membraneMayMeasureNothing",
        () : boolean => judge(withCore({ substance: "membrane" }, 0)).success === true,
      ],
    ]),
    {
      unknownSubstance: true,
      negativeThickness: true,
      nonFiniteThickness: true,
      zeroSolid: true,
      zeroCavity: true,
      cavityWithSubstance: true,
      cavityAsFinish: true,
      solidWithoutSubstance: true,
      membraneMayMeasureNothing: true,
    },
  );

  TestValidator.equals(
    "an unresolved substance fires only when a table is supplied",
    namedFacts([
      ["withoutTable", () : boolean => judge(twoLayer()).success === true],
      [
        "missingFromTable",
        () : boolean =>
          hasViolation(
            validateAutoMovieMaterialAssembly({
              assembly: twoLayer(),
              substances: [substance("skin-substance")],
            }),
            "type",
            "$input.layers[0].material",
          ),
      ],
      [
        "completeTable",
        () : boolean =>
          validateAutoMovieMaterialAssembly({
            assembly: twoLayer(),
            substances: [
              substance("core-substance"),
              substance("skin-substance"),
            ],
          }).success === true,
      ],
    ]),
    { withoutTable: true, missingFromTable: true, completeTable: true },
  );

  assertMaterialAssemblyFinishDefects(judge);

  const wrapped: (wraps: readonly boolean[]) => IAutoMovieMaterialAssembly = (wraps: readonly boolean[]): IAutoMovieMaterialAssembly =>
    assembly(
      ["outer", "middle", "inner"].map((id: string, index: number) : IAutoMovieMaterialLayer =>
        layer(id, 0.05, { wrapsOpening: wraps[index] }),
      ),
      { faces: { first: "concealed", last: "concealed" } },
    );
  TestValidator.equals(
    "a wrapping run must start at a face",
    namedFacts([
      [
        "buriedWrap",
        () : boolean =>
          hasViolation(
            judge(wrapped([false, true, false])),
            "type",
            "$input.layers[1].wrapsOpening",
          ),
      ],
      [
        "leadingRun",
        () : boolean => judge(wrapped([true, true, false])).success === true,
      ],
      [
        "trailingRun",
        () : boolean => judge(wrapped([false, true, true])).success === true,
      ],
      ["bothEnds", () : boolean => judge(wrapped([true, false, true])).success === true],
      [
        "nothingWraps",
        () : boolean => judge(wrapped([false, false, false])).success === true,
      ],
      [
        "everythingWraps",
        () : boolean => judge(wrapped([true, true, true])).success === true,
      ],
    ]),
    {
      buriedWrap: true,
      leadingRun: true,
      trailingRun: true,
      bothEnds: true,
      nothingWraps: true,
      everythingWraps: true,
    },
  );

  TestValidator.equals(
    "a host thickness must itself be a positive finite number",
    namedFacts([
      [
        "zero",
        (): boolean => {
          const judged: IAutoMovieValidation = judge(twoLayer(), { thickness: 0 });
          return hasViolation(judged, "range", "$input.layers") &&
            judged.success === false && judged.violations.length === 1 &&
            judged.violations[0]!.expected.includes("host thickness must be a finite number > 0");
        },
      ],
      [
        "nonFinite",
        (): boolean => {
          const judged: IAutoMovieValidation = judge(twoLayer(), { thickness: Number.NaN });
          return hasViolation(judged, "range", "$input.layers") &&
            judged.success === false && judged.violations.length === 1 &&
            judged.violations[0]!.expected.includes("host thickness must be a finite number > 0");
        },
      ],
      [
        "matching",
        () : boolean => judge(twoLayer(), { thickness: 0.11 }).success === true,
      ],
    ]),
    { zero: true, nonFinite: true, matching: true },
  );
}
