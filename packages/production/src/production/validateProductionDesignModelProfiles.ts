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
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignModelProfiles owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Shared admission plus profile and trait scans determine work; identity sets retain at most the current declared populations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
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
