import { validateAutoMovieMaterialSubstance } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { substance } from "../internal/materialFixtures";
import {
  hasViolation,
  namedFacts,
  violationCount,
} from "../internal/predicates";

const judge: (
  overrides: Parameters<typeof substance>[1],
) => ReturnType<typeof validateAutoMovieMaterialSubstance> = (
  overrides: Parameters<typeof substance>[1],
): ReturnType<typeof validateAutoMovieMaterialSubstance> =>
  validateAutoMovieMaterialSubstance({
    substance: substance("brick-fired", overrides),
  });

/**
 * A substance record is the production's to fill and the engine's to bound.
 *
 * The fixture authors classification, optional measured properties and surface identity. Null means unmeasured; finite physical bounds distinguish missing information from values a later thermal or acoustic calculation cannot consume.
 *
 * Scenarios:
 *
 * 1. A record with every property left unmeasured is clean: `null` is the honest
 *    answer, not a defect.
 * 2. A record with every property measured inside its bound is clean, which is the
 *    twin proving the bounds are not simply rejecting all numbers.
 * 3. A blank id, a blank classification, a blank name, and a blank surface id are
 *    each refused on their own path; a `null` name and a `null` surface are
 *    not, because absent and blank are different.
 * 4. Each numeric bound is refused at the exact value that breaks it: density and
 *    specific heat at zero, thermal conductivity below zero, absorption below
 *    zero and above one, vapour resistance below still air, and a service life
 *    of zero. Closed bounds accept their endpoints; the populated record
 *    supplies positive specific-heat and service-life examples.
 * 5. Infinite density and NaN conductivity, absorption and specific heat are refused; the isolated specific-heat case produces one finding.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real substance validator and observes success or the located type/range violation, catching lost bounds, blank identity admission and incorrect rejection of null measurements.
 * @evidence contracts/testing.md#independent-expectations Expected domains are positive density, specific heat and service life, nonnegative conductivity, absorption within [0, 1] and resistance relative to still air at least one. The hand-authored quantities are conventional test inputs rather than measurements or a material catalogue.
 * @evidence contracts/testing.md#distinguishing-cases Pairs an unmeasured and fully populated record with blank-versus-null fields, zero and adjacent bounds, both absorption endpoints, and nonfinite values. Positive specific heat/service-life examples come from the populated record; this test does not exhaust all malformed runtime shapes or every nonfinite value at every field.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_architecture_material_substance_bounds entry owns every assertion and uses shared portable fixtures and predicates; no host, native build, browser, GPU or dynamic test registration is required.
 */
export function test_architecture_material_substance_bounds(): void {
  TestValidator.equals("an entirely unmeasured substance is clean", judge({}), {
    success: true,
  });

  TestValidator.equals(
    "a fully measured substance inside every bound is clean",
    judge({
      name: "fired brick",
      classification: "masonry",
      density: 1900,
      thermalConductivity: 0.77,
      specificHeat: 840,
      soundAbsorption: 0.03,
      vapourResistance: 10,
      serviceLife: 100,
      surface: "brick-surface",
    }),
    { success: true },
  );

  TestValidator.equals(
    "blank text is refused, absent text is not",
    namedFacts([
      [
        "blankId",
        (): boolean =>
          hasViolation(
            validateAutoMovieMaterialSubstance({
              substance: substance("   "),
            }),
            "type",
            "$input.id",
          ),
      ],
      [
        "blankClassification",
        (): boolean =>
          hasViolation(
            judge({ classification: "" }),
            "type",
            "$input.classification",
          ),
      ],
      [
        "blankName",
        (): boolean =>
          hasViolation(judge({ name: " " }), "type", "$input.name"),
      ],
      [
        "blankSurface",
        (): boolean =>
          hasViolation(judge({ surface: "" }), "type", "$input.surface"),
      ],
      ["nullName", (): boolean => judge({ name: null }).success === true],
      ["nullSurface", (): boolean => judge({ surface: null }).success === true],
    ]),
    {
      blankId: true,
      blankClassification: true,
      blankName: true,
      blankSurface: true,
      nullName: true,
      nullSurface: true,
    },
  );

  TestValidator.equals(
    "each numeric bound is refused exactly where it breaks",
    namedFacts([
      [
        "densityZero",
        (): boolean =>
          hasViolation(judge({ density: 0 }), "range", "$input.density"),
      ],
      [
        "densityJustAbove",
        (): boolean => judge({ density: 1e-9 }).success === true,
      ],
      [
        "conductivityNegative",
        (): boolean =>
          hasViolation(
            judge({ thermalConductivity: -1e-9 }),
            "range",
            "$input.thermalConductivity",
          ),
      ],
      [
        "conductivityZero",
        (): boolean => judge({ thermalConductivity: 0 }).success === true,
      ],
      [
        "specificHeatZero",
        (): boolean =>
          hasViolation(
            judge({ specificHeat: 0 }),
            "range",
            "$input.specificHeat",
          ),
      ],
      [
        "absorptionBelow",
        (): boolean =>
          hasViolation(
            judge({ soundAbsorption: -1e-9 }),
            "range",
            "$input.soundAbsorption",
          ),
      ],
      [
        "absorptionAbove",
        (): boolean =>
          hasViolation(
            judge({ soundAbsorption: 1 + 1e-9 }),
            "range",
            "$input.soundAbsorption",
          ),
      ],
      [
        "absorptionEnds",
        (): boolean =>
          judge({ soundAbsorption: 0 }).success === true &&
          judge({ soundAbsorption: 1 }).success === true,
      ],
      [
        "vapourBelowStillAir",
        (): boolean =>
          hasViolation(
            judge({ vapourResistance: 1 - 1e-9 }),
            "range",
            "$input.vapourResistance",
          ),
      ],
      [
        "vapourStillAir",
        (): boolean => judge({ vapourResistance: 1 }).success === true,
      ],
      [
        "serviceLifeZero",
        (): boolean =>
          hasViolation(
            judge({ serviceLife: 0 }),
            "range",
            "$input.serviceLife",
          ),
      ],
    ]),
    {
      densityZero: true,
      densityJustAbove: true,
      conductivityNegative: true,
      conductivityZero: true,
      specificHeatZero: true,
      absorptionBelow: true,
      absorptionAbove: true,
      absorptionEnds: true,
      vapourBelowStillAir: true,
      vapourStillAir: true,
      serviceLifeZero: true,
    },
  );

  TestValidator.equals(
    "a non-finite property is refused wherever a finite one is required",
    namedFacts([
      [
        "density",
        (): boolean =>
          hasViolation(
            judge({ density: Number.POSITIVE_INFINITY }),
            "range",
            "$input.density",
          ),
      ],
      [
        "conductivity",
        (): boolean =>
          hasViolation(
            judge({ thermalConductivity: Number.NaN }),
            "range",
            "$input.thermalConductivity",
          ),
      ],
      [
        "absorption",
        (): boolean =>
          hasViolation(
            judge({ soundAbsorption: Number.NaN }),
            "range",
            "$input.soundAbsorption",
          ),
      ],
      [
        "onlyOneFires",
        (): boolean =>
          violationCount(judge({ specificHeat: Number.NaN })) === 1 &&
          hasViolation(
            judge({ specificHeat: Number.NaN }),
            "range",
            "$input.specificHeat",
          ),
      ],
    ]),
    {
      density: true,
      conductivity: true,
      absorption: true,
      onlyOneFires: true,
    },
  );
}
