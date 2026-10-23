import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { f1, f2, m1, m2 } from "../human-parameters";

/**
 * Admit Human parameters by alias or by exact equality with a registered typed example.
 *
 * The playground has no runtime validator for {@link IAutoMovieHumanParameters},
 * so it never casts JSON to that type. An alias selects the typed literal in
 * `src/human-parameters` directly. A JSON candidate, such as the body of
 * `/human-images/<alias>.json` handed over by the PNG worker, is admitted only
 * when its `JSON.stringify` bytes equal those of one registered literal, which
 * is exactly how `HumanImageRegistry` serializes it; the typed literal, not the
 * candidate, is then returned. Edited parameters therefore refuse explicitly
 * until a real runtime validator exists.
 *
 * @param selector Either `{ alias }` naming a registered example or `{ candidate }` holding untrusted JSON.
 * @returns The alias and its typed literal; an unknown alias or unmatched candidate throws.
 *
 * @evidence contracts/common.md#principled-implementation Admission is identity with a typed literal: the alias indexes the registry, and a candidate must serialize to exactly a registered literal's JSON.stringify bytes, which is how HumanImageRegistry publishes it; the typed literal is returned.
 * @evidence contracts/common.md#clear-and-simple-design One function serves both the alias and JSON entry points of the page and worker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unchecked cast of JSON to IAutoMovieHumanParameters; edited parameters are refused until a runtime validator exists.
 * @evidence contracts/common.md#meaningful-documentation States the admission rule, why JSON is never cast and what is refused.
 * @evidence contracts/performance.md#efficient-algorithms O(E x B) for E = 4 examples of B serialized bytes (a few kilobytes each).
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the module-shared literal instead of a copy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; temporary strings are dropped on return.
 */
export function admitHumanParameters(
  selector: { alias: string } | { candidate: unknown },
): { alias: string; parameters: IAutoMovieHumanParameters } {
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
  throw new Error(
    "Human parameters match no registered typed example; runtime admission of edited parameters is not implemented",
  );
}
