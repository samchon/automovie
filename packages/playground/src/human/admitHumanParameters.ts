import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { f1, f2, m1, m2 } from "../human-parameters";
import { HumanParameterAdmission } from "./HumanParameterAdmission";

/**
 * Admit registered aliases or any value satisfying the complete public Human input contract.
 *
 * Validation checks mandatory/optional fields, finite/null measurements, control
 * pins, explicit ranges and closed unions, including appearance, pose and
 * expression. Unknown fields and unsupported values reject with their field path.
 * Optional fields may be omitted or explicitly undefined; their presence and values are preserved.
 * Successful admission transfers an independent deep clone to the caller;
 * subsequent mutation of the submitted object or typed example cannot change it.
 * The clone remains mutable for the existing generator/UI contract.
 *
 * An alias selects its registered example through the same validator. A candidate
 * matching an example by values retains that alias; other valid candidates have
 * alias null. Example matching labels a request and never establishes its schema.
 *
 * @param selector A registered alias or an untrusted JSON parameter candidate.
 * @returns The validated owned snapshot and its optional registered alias.
 *
 * @evidence contracts/common.md#principled-implementation The shared HumanParameterAdmission validates the actual public type tree, documented cross-field constraints and own data fields before a typed snapshot is returned.
 * @evidence contracts/common.md#clear-and-simple-design One boundary serves existing alias, JSON page and image-worker callers; the Human-specific helper owns all structural rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Custom values do not need example equality; no typia macro, unchecked parameter cast, field deletion, geometry default or value correction is used.
 * @evidence contracts/common.md#meaningful-documentation Documents nullable alias, failure paths, complete validation and independent mutable snapshot ownership.
 * @evidence contracts/performance.md#efficient-algorithms Linear validation/cloning and at most four linear alias comparisons in the submitted field population.
 * @evidence contracts/performance.md#reuse-equivalent-work Module-owned type rules are shared; each request receives one owned snapshot, with no model or effect cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned snapshot; temporary traversal state is released on return or throw and no handle or global request cache is acquired.
 */
export function admitHumanParameters(
  selector: { alias: string } | { candidate: unknown },
): { alias: string | null; parameters: IAutoMovieHumanParameters } {
  const examples: Readonly<Record<string, IAutoMovieHumanParameters>> = { f1, f2, m1, m2 };
  if ("alias" in selector) {
    if (!Object.hasOwn(examples, selector.alias))
      throw new Error("Human parameter request: unknown alias " + selector.alias);
    return { alias: selector.alias, parameters: HumanParameterAdmission.read(examples[selector.alias]!) };
  }

  const parameters: IAutoMovieHumanParameters = HumanParameterAdmission.read(selector.candidate);
  for (const [alias, example] of Object.entries(examples))
    if (HumanParameterAdmission.same(parameters, example)) return { alias, parameters };
  return { alias: null, parameters };
}
