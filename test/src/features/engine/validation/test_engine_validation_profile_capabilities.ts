import { validateModel, validateProfileCapabilities } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieProfile,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../internal/createModel";
import { namedFacts } from "../../internal/namedFacts";

const profile: () => IAutoMovieProfile = (): IAutoMovieProfile => ({
  id: "carriage",
  name: "Carriage",
  drivers: [],
  limits: [],
  traits: [
    { kind: "mountable", seats: 1, payloadMass: 100 },
    {
      kind: "destructible",
      durability: 10,
      impactBody: {
        mass: 80,
        restitution: 0.1,
        hardness: 1,
        penetrability: 1,
      },
    },
  ],
});

const violations: (
  value: IAutoMovieValidation,
) => IAutoMovieConstraintViolation[] = (
  value: IAutoMovieValidation,
): NonNullable<
  Extract<IAutoMovieValidation, { success: false }>["violations"]
> => (value.success ? [] : value.violations);

const failsAt: (
  profiles: readonly IAutoMovieProfile[],
  fragment: string,
) => boolean = (
  profiles: readonly IAutoMovieProfile[],
  fragment: string,
): boolean =>
  violations(validateProfileCapabilities({ profiles })).some(
    (violation: IAutoMovieConstraintViolation): boolean =>
      violation.path.includes(fragment),
  );

/**
 * Typed capability data is one engine contract for direct and production
 * consumers.
 *
 * Scenarios:
 *
 * 1. A complete mountable/destructible profile passes both the focused validator
 *    and validateModel.
 * 2. Profile names are non-blank, identities are unique, and trait kinds are
 *    unique.
 * 3. Each mountable and destructible scalar family is independently rejected at
 *    its exact path.
 * 4. Impact hardness and penetrability above one are rejected. Profile admission
 *    uses (0,1], a stricter lower bound than resolveImpact's [0,1] physical
 *    coefficient domain.
 */
export function test_engine_validation_profile_capabilities(): void {
  const valid: IAutoMovieProfile = profile();
  TestValidator.equals(
    "complete capability profile passes focused and model validation",
    namedFacts([
      [
        "validateProfileCapabilitiesProfilesValid",
        (): boolean =>
          validateProfileCapabilities({ profiles: [valid] }).success,
      ],
      [
        "validateModelModelCreateModel",
        (): boolean =>
          validateModel({ model: { ...createModel(), profiles: [valid] } })
            .success,
      ],
    ]),
    {
      validateProfileCapabilitiesProfilesValid: true,
      validateModelModelCreateModel: true,
    },
  );

  TestValidator.equals(
    "profile name is non-blank and identity unique",
    namedFacts([
      [
        "failsAtProfileId",
        (): boolean => failsAt([{ ...profile(), name: "" }], ".name"),
      ],
      [
        "failsAtProfileProfile",
        (): boolean => failsAt([profile(), profile()], "profiles[1].id"),
      ],
    ]),
    { failsAtProfileId: true, failsAtProfileProfile: true },
  );
  TestValidator.predicate(
    "trait kinds are unique",
    failsAt(
      [
        {
          ...profile(),
          traits: [
            { kind: "mountable", seats: 1, payloadMass: 1 },
            { kind: "mountable", seats: 1, payloadMass: 1 },
          ],
        },
      ],
      "traits[1].kind",
    ),
  );
  TestValidator.equals(
    "mountable seats and payload are independently bounded",
    namedFacts([
      [
        "failsAtProfileTraits",
        (): boolean =>
          failsAt(
            [
              {
                ...profile(),
                traits: [{ kind: "mountable", seats: 0, payloadMass: 1 }],
              },
            ],
            ".seats",
          ),
      ],
      [
        "failsAtProfileTraits2",
        (): boolean =>
          failsAt(
            [
              {
                ...profile(),
                traits: [{ kind: "mountable", seats: 1, payloadMass: 0 }],
              },
            ],
            ".payloadMass",
          ),
      ],
    ]),
    { failsAtProfileTraits: true, failsAtProfileTraits2: true },
  );
  TestValidator.predicate(
    "destructible durability and every impact scalar are bounded",
    [
      "durability",
      "impactBody.mass",
      "impactBody.restitution",
      "impactBody.hardness",
      "impactBody.penetrability",
    ].every((fragment: string, index: number): boolean => {
      const invalid: IAutoMovieProfile = structuredClone(profile());
      const trait: NonNullable<IAutoMovieProfile["traits"]>[number] =
        invalid.traits![1]!;
      if (trait.kind !== "destructible") return false;
      if (index === 0) trait.durability = 0;
      else if (index === 1) trait.impactBody.mass = 0;
      else if (index === 2) trait.impactBody.restitution = 2;
      else if (index === 3) trait.impactBody.hardness = 0;
      else trait.impactBody.penetrability = 0;
      return failsAt([invalid], fragment);
    }),
  );
  TestValidator.predicate(
    "impact hardness and penetrability stay within one",
    ["impactBody.hardness", "impactBody.penetrability"].every(
      (fragment: string, index: number): boolean => {
        const invalid: IAutoMovieProfile = structuredClone(profile());
        const trait: NonNullable<IAutoMovieProfile["traits"]>[number] =
          invalid.traits![1]!;
        if (trait.kind !== "destructible") return false;
        if (index === 0) trait.impactBody.hardness = 1.5;
        else trait.impactBody.penetrability = 1.5;
        return failsAt([invalid], fragment);
      },
    ),
  );
}
