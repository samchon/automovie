import { validateAutoMovieMaterialSubstance } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { substance } from "../internal/materialFixtures";
import {
  hasViolation,
  namedFacts,
  violationCount,
} from "../internal/predicates";

const judge = (
  overrides: Parameters<typeof substance>[1],
): ReturnType<typeof validateAutoMovieMaterialSubstance> =>
  validateAutoMovieMaterialSubstance({
    substance: substance("brick-fired", overrides),
  });

/**
 *
 * A substance record is the production's to fill and the engine's to bound.
 *
 * Nothing here ships a material: `classification`, every property, and the
 * surface a substance is shown with are all authored. What the engine owns is
 * the refusal, because an unmeasured property and an impossible one are
 * different facts and only the first may be `null`. A negative density or an
 * absorption above one would otherwise be consumed by a later acoustic or
 * thermal study as if it had been measured.
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
 *    of zero. Every one is paired with the boundary value that must pass.
 * 5. A non-finite property is refused wherever a finite one is required.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `validateAutoMovieMaterialSubstance` and asserts success, violation kind and path, and violation count; it catches an unmeasured null property treated as a defect, blank text accepted or a null name or surface refused, a numeric bound applied at the wrong value or with the wrong strictness, a non-finite property accepted, and one bad property reported more than once.
 * @evidence contracts/testing.md#independent-expectations Bounds follow the physical meaning stated in the doc comment rather than the validator's tables: density, specific heat and service life must be positive, conductivity non-negative, absorption a fraction in [0, 1], and vapour resistance at least still air's factor of 1; each refusal sits 1e-9 past its bound and each twin sits on or just inside it, and the fully measured record uses plausible fired-brick values only as clean input, not as reference data.
 * @evidence contracts/testing.md#distinguishing-cases Positive all-null and fully measured records; blank id, classification, name and surface against null name and surface; zero density against 1e-9, -1e-9 conductivity against zero, zero specific heat, absorption below 0 and above 1 against both ends, vapour resistance below 1 against exactly 1, zero service life; infinite or NaN density, conductivity and absorption, and a NaN specific heat raising exactly one violation; how substances are cited by layered assemblies is owned by test_architecture_material_assembly_defects and test_architecture_material_assembly_dimension.
 */
export const test_architecture_material_substance_bounds = (): void => {
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
        () =>
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
        () =>
          hasViolation(
            judge({ classification: "" }),
            "type",
            "$input.classification",
          ),
      ],
      [
        "blankName",
        () => hasViolation(judge({ name: " " }), "type", "$input.name"),
      ],
      [
        "blankSurface",
        () => hasViolation(judge({ surface: "" }), "type", "$input.surface"),
      ],
      ["nullName", () => judge({ name: null }).success === true],
      ["nullSurface", () => judge({ surface: null }).success === true],
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
        () => hasViolation(judge({ density: 0 }), "range", "$input.density"),
      ],
      ["densityJustAbove", () => judge({ density: 1e-9 }).success === true],
      [
        "conductivityNegative",
        () =>
          hasViolation(
            judge({ thermalConductivity: -1e-9 }),
            "range",
            "$input.thermalConductivity",
          ),
      ],
      [
        "conductivityZero",
        () => judge({ thermalConductivity: 0 }).success === true,
      ],
      [
        "specificHeatZero",
        () =>
          hasViolation(
            judge({ specificHeat: 0 }),
            "range",
            "$input.specificHeat",
          ),
      ],
      [
        "absorptionBelow",
        () =>
          hasViolation(
            judge({ soundAbsorption: -1e-9 }),
            "range",
            "$input.soundAbsorption",
          ),
      ],
      [
        "absorptionAbove",
        () =>
          hasViolation(
            judge({ soundAbsorption: 1 + 1e-9 }),
            "range",
            "$input.soundAbsorption",
          ),
      ],
      [
        "absorptionEnds",
        () =>
          judge({ soundAbsorption: 0 }).success === true &&
          judge({ soundAbsorption: 1 }).success === true,
      ],
      [
        "vapourBelowStillAir",
        () =>
          hasViolation(
            judge({ vapourResistance: 1 - 1e-9 }),
            "range",
            "$input.vapourResistance",
          ),
      ],
      ["vapourStillAir", () => judge({ vapourResistance: 1 }).success === true],
      [
        "serviceLifeZero",
        () =>
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
        () =>
          hasViolation(
            judge({ density: Number.POSITIVE_INFINITY }),
            "range",
            "$input.density",
          ),
      ],
      [
        "conductivity",
        () =>
          hasViolation(
            judge({ thermalConductivity: Number.NaN }),
            "range",
            "$input.thermalConductivity",
          ),
      ],
      [
        "absorption",
        () =>
          hasViolation(
            judge({ soundAbsorption: Number.NaN }),
            "range",
            "$input.soundAbsorption",
          ),
      ],
      [
        "onlyOneFires",
        () => violationCount(judge({ specificHeat: Number.NaN })) === 1,
      ],
    ]),
    {
      density: true,
      conductivity: true,
      absorption: true,
      onlyOneFires: true,
    },
  );
};
