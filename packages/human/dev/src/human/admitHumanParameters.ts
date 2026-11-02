import typia from "typia";

import { f1, f2, m1, m2 } from "../../../../playground/src/human-parameters";
import type { IAutoMovieHumanParameters } from "../../../src/structures/IAutoMovieHumanParameters";

/**
 * Admit registered typed examples or validate edited public parameters.
 *
 * Aliases and byte-identical registered JSON retain the exact typed examples.
 * Other JSON passes the generated finite-number and public-type assertion
 * before a detached copy reaches construction. Vite's typia transform owns this
 * runtime assertion; the companion native checker owns full application lint
 * and type diagnostics. No geometry is generated during admission.
 *
 * @param selector Either `{ alias }` naming a registered example or `{ candidate }` holding untrusted JSON.
 * @returns A registered alias or null for independently validated edited input.
 *
 * @evidence contracts/common.md#principled-implementation Registered examples retain literal identity; edited JSON passes typia's generated public-type and finite-number assertion before a detached copy is returned.
 * @evidence contracts/common.md#clear-and-simple-design One function serves both the alias and JSON entry points of the page and worker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown aliases and invalid public inputs throw; no unchecked JSON cast or shape fallback admits an edit.
 * @evidence contracts/common.md#meaningful-documentation States literal identity, runtime validation, detached edits and the separation of transform and checker ownership.
 * @evidence contracts/performance.md#efficient-algorithms O(E x B) for E = 4 examples of B serialized bytes (a few kilobytes each).
 * @evidence contracts/performance.md#reuse-equivalent-work Registered inputs return the module-shared literal; distinct edits receive independent validated copies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no request state; temporary serialized strings and the returned edited copy belong to the call.
 */
export function admitHumanParameters(
  selector: { alias: string } | { candidate: unknown },
): { alias: string | null; parameters: IAutoMovieHumanParameters } {
  const examples: Record<string, IAutoMovieHumanParameters> = {
    f1,
    f2,
    m1,
    m2,
  };

  if ("alias" in selector) {
    if (!Object.hasOwn(examples, selector.alias))
      throw new Error("Unknown Human alias: " + selector.alias);
    return {
      alias: selector.alias,
      parameters: examples[selector.alias]!,
    };
  }

  // Byte equality with the registry's own serialization is the admission rule.
  const bytes: string = JSON.stringify(selector.candidate);
  for (const [alias, parameters] of Object.entries(examples))
    if (JSON.stringify(parameters) === bytes) return { alias, parameters };
  return {
    alias: null,
    parameters: structuredClone(
      typia.assert<IAutoMovieHumanParameters>(selector.candidate),
    ),
  };
}
