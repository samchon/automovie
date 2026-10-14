import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";

import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInteger } from "./validateProductionDesignInteger";
import { validateProductionDesignPositive } from "./validateProductionDesignPositive";
import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { IAutoMovieDiagnostic, IAutoMovieProfile, IAutoMovieValidation } from "@automovie/interface";
import { validateProfileCapabilities } from "@automovie/engine";

/**
 * Translate shared profile capability refusals first, then check profile identities and mountable or destructible trait quantities.
 *
 * @evidence contracts/common.md#principled-implementation Invalid shared admission returns before local trait traversal; profile scalars are declarations rather than a physical simulation. Range violations use their structured kind, while duplicate categorization retains the shared refusal's unique wording as a protocol dependency.
 * @evidence contracts/common.md#clear-and-simple-design The engine capability owner admits common trait semantics; this production adapter translates its findings and owns design attribution before the retained local profile/trait pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States shared-refusal early return, code translation and subsequent trait checks; profiles remain borrowed and findings append with the model target/file, without mounting or simulating a capability.
 * @evidence contracts/performance.md#efficient-algorithms Shared admission plus profile and trait scans determine work; identity sets retain at most the current declared populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared capability result controls the early return or local pass; profile/trait Sets then share membership only within their addressed population, without caching mutable profile validity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shared violation records, profile/trait Sets and correction strings are input-sized temporaries; translated/appended findings remain in the caller's array without a local cap, handle or task.
 */
export const validateProductionDesignModelProfiles: (diagnostics: IAutoMovieDiagnostic[], profiles: readonly IAutoMovieProfile[], target: string, file: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  profiles: readonly IAutoMovieProfile[],
  target: string,
  file: string,
): void => {
  const validation: IAutoMovieValidation = validateProfileCapabilities({ profiles });
  if (validation.success === false) {
    for (const violation of validation.violations)
      validateProductionDesignInvalid(
        diagnostics,
        violation.kind === "range"
          ? "design-range-invalid"
          : violation.expected.includes("unique")
            ? "design-capability-duplicate"
            : "design-text-empty",
        target,
        file,
        `${violation.path}: ${violation.expected}. Correct the typed profile data before writing the model recipe record.`,
      );
    return;
  }
  const profileIds: Set<string> = new Set<string>();
  for (const profile of profiles) {
    validateProductionDesignUnique(diagnostics, profileIds, profile.id, target, file, "profiles");
    validateProductionDesignText(diagnostics, profile.name, target, file, "profiles.name");
    const traitKinds: Set<string> = new Set<string>();
    for (const trait of profile.traits ?? []) {
      if (traitKinds.has(trait.kind))
        validateProductionDesignInvalid(
          diagnostics,
          "design-capability-duplicate",
          target,
          file,
          `Profile "${profile.id}" repeats ${trait.kind}. Keep one typed trait of each kind.`,
        );
      traitKinds.add(trait.kind);
      if (trait.kind === "mountable") {
        validateProductionDesignInteger(
          diagnostics,
          trait.seats,
          1,
          1_024,
          target,
          file,
          `profiles.${profile.id}.mountable.seats`,
        );
        validateProductionDesignPositive(
          diagnostics,
          trait.payloadMass,
          target,
          file,
          `profiles.${profile.id}.mountable.payloadMass`,
        );
        continue;
      }
      validateProductionDesignPositive(
        diagnostics,
        trait.durability,
        target,
        file,
        `profiles.${profile.id}.destructible.durability`,
      );
      validateProductionDesignPositive(
        diagnostics,
        trait.impactBody.mass,
        target,
        file,
        `profiles.${profile.id}.destructible.impactBody.mass`,
      );
      validateProductionDesignBounded(
        diagnostics,
        trait.impactBody.restitution,
        0,
        1,
        target,
        file,
        `profiles.${profile.id}.destructible.impactBody.restitution`,
      );
      validateProductionDesignPositive(
        diagnostics,
        trait.impactBody.hardness,
        target,
        file,
        `profiles.${profile.id}.destructible.impactBody.hardness`,
      );
      validateProductionDesignPositive(
        diagnostics,
        trait.impactBody.penetrability,
        target,
        file,
        `profiles.${profile.id}.destructible.impactBody.penetrability`,
      );
    }
  }
};
