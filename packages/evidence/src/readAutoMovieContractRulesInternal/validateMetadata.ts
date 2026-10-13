import type { IAutoMovieContractRuleMetadata } from "../IAutoMovieContractRuleMetadata";
/**
 * Validate one complete, closed structured-rule JSON record and return it.
 *
 * All five fields require declared strings. ID syntax and lifecycle/application enums are exact; timing and source identity must contain non-whitespace text. Unknown keys, absent fields and coercible numeric or array aliases refuse with the caller's Markdown location. This does not judge the authored prose.
 *
 * @evidence contracts/common.md#principled-implementation Object shape is checked before closed-key admission and five field checks; IDs are lower kebab tokens, lifecycle/application values match their finite routing sets and timing/source identity contain text. Checking the original string types keeps returned routing fields consistent with downstream strict enum and ID comparisons.
 * @evidence contracts/common.md#clear-and-simple-design The public contract reader owns Markdown headings and block placement and calls this one metadata boundary; the portable owning unit exercises that same boundary without filesystem scaffolding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or incorrectly typed fields refuse rather than being coerced, filled or inferred from prose; the validated original object is returned without rewriting lifecycle or safe-application policy.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the five mandatory string fields, exact routing checks, caller-addressed refusal and the separation from semantic prose judgment.
 * @evidence contracts/performance.md#efficient-algorithms For K supplied keys and L checked string characters, bounded five-key membership and finite enum checks plus ID/whitespace scans take O(K+L); this boundary traverses no document tree.
 * @evidence contracts/performance.md#reuse-equivalent-work The parsed JSON record is validated and returned directly; distinct rule records require their own checks, while the small fixed lookup arrays are built locally without a persistent identity cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Key lists and trimmed strings are call-local temporaries; only the caller's original metadata object or one addressed Error escapes, and no file, watcher or process is opened.
 */
export function validateMetadata(
  input: unknown,
  location: string,
): IAutoMovieContractRuleMetadata {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    throw new Error(
      `${location}: contract rule metadata must be a JSON object.`,
    );
  const value: Record<string, unknown> = input as Record<string, unknown>;
  const keys: string[] = ["id", "safeApplication", "sourceIdentity", "status", "timing"];
  const unexpected: string[] = Object.keys(value).filter((key: string) : boolean => !keys.includes(key));
  if (unexpected.length !== 0)
    throw new Error(
      `${location}: unsupported contract rule metadata fields: ${unexpected.join(", ")}.`,
    );
  if (typeof value.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.id))
    throw new Error(
      `${location}: contract rule id must be stable lower kebab case.`,
    );
  if (typeof value.status !== "string" || !["active", "hold", "rejected"].includes(value.status))
    throw new Error(`${location}: invalid contract rule status.`);
  if (
    typeof value.safeApplication !== "string" || ![
      "composition-safe",
      "observation-only",
      "population-distribution",
      "post-draft-frequency",
      "revision-only",
    ].includes(value.safeApplication)
  )
    throw new Error(`${location}: invalid safe application.`);
  for (const key of ["timing", "sourceIdentity"])
    if (typeof value[key] !== "string" || value[key].trim() === "")
      throw new Error(`${location}: ${key} must be a non-empty string.`);
  return value as unknown as IAutoMovieContractRuleMetadata;
}
